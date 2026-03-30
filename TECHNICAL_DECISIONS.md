# Qadam — Technical Decisions v1.1
## Архитектурные решения перед написанием Anchor program

> Этот документ содержит ключевые архитектурные решения.
> Читать ПЕРЕД написанием смарт-контракта.
> *30 марта 2026 — обновлено после audit review*

---

## Сводная таблица решений

| # | Вопрос | Решение |
|---|--------|---------|
| 1 | AI idempotency | State machine в PG (6 состояний) + Oban unique jobs + fresh blockhash |
| 2 | Token minting race | Всё в одной Anchor инструкции — атомарно. Lazy mint через claim |
| 3 | Evidence hash | SHA-256 от СОДЕРЖИМОГО (client-side). IPFS для файлов с v1 |
| 4 | Refund + токены | Lazy minting — при refund unminted токены просто не создаются |
| 5 | Whale / Sybil attack | Голосование через BackerPosition + cap 20% per position |
| 6 | Security deposit | Прогрессивный возврат при каждом approved milestone |
| 7 | Float arithmetic | **ЗАПРЕЩЕНО в Solana.** Только checked integer math |
| 8 | Fee calculation | Fee вычитается ИЗ суммы milestone, не дополнительно |
| 9 | Vault definition | PDA system account: seeds = ["vault", campaign_pubkey] |
| 10 | Account lifecycle | `#[account(close = destination)]` после завершения/refund |

---

## 1. AI Verification — Race Condition и Idempotency

### Проблема
Claude вернул APPROVED → Elixir упал → транзакция не отправлена.
Или: транзакция не прошла из-за congestion. Creator видит APPROVED в UI, SOL не пришёл.

### Решение: State Machine + Oban Unique Jobs

**PostgreSQL state machine для каждого milestone:**

```
Submitted → AIProcessing → AIDecided → TxBroadcasting → TxConfirming → Released
                                ↓
                          UnderHumanReview (если PARTIAL)
                                ↓
                          HumanDecided → TxBroadcasting → ...
```

**Правила:**
- Каждый переход state логируется в `milestone_state_transitions` таблице
- Oban job уникален по `(milestone_id, job_type)` — дублей нет
- При любом рестарте Elixir: читаем все milestones со state `AIDecided` или `TxBroadcasting` → продолжаем

**Ключевое правило blockhash:**
```elixir
# НЕПРАВИЛЬНО — кэшированный blockhash может протухнуть
def sign_release(milestone_id, cached_blockhash) do ...

# ПРАВИЛЬНО — всегда свежий blockhash прямо перед signing
def sign_and_broadcast_release(milestone_id) do
  # 1. Сохранить decision в PostgreSQL (это идемпотентно)
  update_milestone_state!(milestone_id, :tx_broadcasting)

  # 2. Fetch СВЕЖИЙ blockhash прямо сейчас
  {:ok, %{blockhash: fresh_blockhash}} = SolanaRPC.get_latest_blockhash()

  # 3. Подписать и отправить
  tx = build_release_tx(milestone_id, fresh_blockhash)
  signed_tx = sign_with_ai_wallet(tx)

  case SolanaRPC.send_transaction(signed_tx) do
    {:ok, signature} ->
      update_milestone_state!(milestone_id, :tx_confirming, %{tx_sig: signature})
      schedule_confirmation_check(milestone_id, signature)

    {:error, reason} ->
      # Oban retry с exponential backoff — fresh blockhash при следующей попытке
      Logger.error("TX failed: #{reason}")
      update_milestone_state!(milestone_id, :ai_decided) # откат для retry
      {:error, :retry}
  end
end
```

**Confirmation check:**
```elixir
# После broadcast: проверяем каждые 2 секунды до finality
def check_confirmation(milestone_id, signature) do
  case SolanaRPC.get_transaction(signature) do
    {:ok, %{confirmations: n}} when n >= 32 ->
      update_milestone_state!(milestone_id, :released)
      notify_creator_and_backers(milestone_id)

    {:ok, _} ->
      # Ещё не finalized, повторить через 2 сек
      schedule_confirmation_check(milestone_id, signature, delay: 2_000)

    {:error, :not_found} ->
      # Транзакция пропала — retry broadcast
      update_milestone_state!(milestone_id, :ai_decided)
      schedule_broadcast_retry(milestone_id)
  end
end
```


---

## 2. Token Minting при Backing — Atomicity

### Проблема
Два бэкера в одном Solana slot — кто получает Tier 1?

### Ответ: Это безопасно. Solana транзакции атомарны.

В Solana: лидер процессирует транзакции последовательно внутри слота.
Первая транзакция атомарно обновляет `backer_count` в Campaign аккаунте.
Вторая транзакция видит уже обновлённый count.

**Нет race condition**, потому что:
- Вся логика `back_campaign` — одна атомарная инструкция
- Campaign аккаунт мьютируется в одном месте
- Solana не имеет shared mutable state между параллельными транзакциями для одного аккаунта

**Anchor instruction — всё в одной атомарной операции:**
```rust
pub fn back_campaign(ctx: Context<BackCampaign>, amount_lamports: u64) -> Result<()> {
    let campaign = &mut ctx.accounts.campaign;

    require!(
        campaign.status == CampaignStatus::Active,
        ErrorCode::CampaignNotActive
    );
    require!(
        amount_lamports >= MIN_BACKING_LAMPORTS,
        ErrorCode::BelowMinimum
    );

    // 1. Определить tier (атомарно — другая транзакция не может вмешаться)
    let tier = match campaign.backer_count {
        0..=49   => 1u8,  // 1.0x allocation
        50..=249 => 2u8,  // 0.67x allocation
        _        => 3u8,  // 0.50x allocation
    };

    // 2. Рассчитать tokens allocated (НЕ mint — только записать rights)
    //    ВАЖНО: только integer math, никаких float
    let base_tokens = amount_lamports
        .checked_mul(campaign.tokens_per_lamport).unwrap();
    let tokens_allocated = match tier {
        1 => base_tokens,                                         // 1.0x
        2 => base_tokens.checked_mul(67).unwrap()
                .checked_div(100).unwrap(),                       // 0.67x
        _ => base_tokens.checked_div(2).unwrap(),                 // 0.50x
    };

    // 3. Принять SOL в escrow (CPI transfer to campaign vault PDA)
    let cpi_context = CpiContext::new(
        ctx.accounts.system_program.to_account_info(),
        anchor_lang::system_program::Transfer {
            from: ctx.accounts.backer.to_account_info(),
            to: ctx.accounts.campaign_vault.to_account_info(),
        },
    );
    anchor_lang::system_program::transfer(cpi_context, amount_lamports)?;

    // 4. Обновить Campaign state
    campaign.raised_lamports = campaign.raised_lamports
        .checked_add(amount_lamports).unwrap();
    campaign.backer_count = campaign.backer_count
        .checked_add(1).unwrap();

    // 5. Создать BackerPosition (запись прав, НЕ mint токенов)
    let position = &mut ctx.accounts.backer_position;
    position.campaign = campaign.key();
    position.backer = ctx.accounts.backer.key();
    position.lamports_backed = amount_lamports;
    position.tier = tier;
    position.tokens_allocated = tokens_allocated;
    position.tokens_claimed = 0;
    position.milestones_claimed_through = 0;
    position.refund_claimed = false;
    position.backed_at = Clock::get()?.unix_timestamp;
    position.bump = ctx.bumps.backer_position;

    Ok(())
}
```

**Важно:** токены не минтятся при backing — только создаётся запись прав (BackerPosition).
Токены клеймятся позже через отдельную `claim_tokens` инструкцию.

**Повторный backing:** Один кошелёк = один BackerPosition (PDA по seeds).
Если бэкер хочет добавить ещё SOL — вызывает `increase_backing` (обновляет существующий position).


---

## 3. Evidence Hash — Content-Addressable Storage

### Проблема
Hash от S3 URL бессмысленен — URL может отдавать разный контент.
"Immutable proof" = маркетинг без content hash.

### Решение: SHA-256 от содержимого (client-side)

**Вместо hash(url) → hash(content)**

```typescript
// frontend/lib/evidence.ts

export async function calculateEvidenceHash(evidence: EvidenceInput): Promise<Uint8Array> {
  // Для файлов: хешируем каждый файл отдельно
  const fileHashes = await Promise.all(
    evidence.files.map(async (file) => {
      const buffer = await file.arrayBuffer();
      const hash = await crypto.subtle.digest('SHA-256', buffer);
      return Buffer.from(new Uint8Array(hash)).toString('hex');
    })
  );

  // Создаём детерминированный content object
  const contentObject = {
    text: evidence.text.trim(),
    links: [...evidence.links].sort(), // сортируем для детерминизма
    file_hashes: fileHashes.sort(),    // порядок файлов не важен
    milestone_index: evidence.milestoneIndex,
    campaign_id: evidence.campaignId,
  };

  // Хешируем всё вместе
  const content = JSON.stringify(contentObject);
  const buffer = new TextEncoder().encode(content);
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  return new Uint8Array(hashBuffer);
}

// Workflow:
// 1. Пользователь заполняет форму
// 2. Считаем content hash client-side
// 3. Записываем hash в Solana (submit_milestone instruction)
// 4. ПОТОМ загружаем файлы в IPFS (Pinata) и отправляем текст в Phoenix API
// 5. Phoenix хранит evidence в PostgreSQL + IPFS CIDs, даёт Claude для анализа
```

**Backend верификация hash (ОБЯЗАТЕЛЬНО):**
```elixir
# Phoenix API при получении evidence:
def verify_evidence_hash(evidence_params, on_chain_hash) do
  # Пересчитываем hash серверно — должен совпасть с on-chain
  computed_hash = compute_sha256(evidence_params)
  if computed_hash != on_chain_hash do
    {:error, :hash_mismatch}  # Creator подменил контент!
  else
    {:ok, :verified}
  end
end
```

**Что записывается on-chain:**
```rust
// В MilestoneAccount
pub evidence_content_hash: [u8; 32], // SHA-256 от СОДЕРЖИМОГО
```

**Для файлов v1 — Pinata (IPFS) при upload:**
```
Файлы загружаем в IPFS через Pinata
CID = content-addressable identifier (встроенный hash)
CID записывается в PostgreSQL
На on-chain пишем: hash(text + links + CIDs)
CID сам по себе = proof of content
```

**Важно:** IPFS в v1, не в v2. Это требование к целостности данных, не опция.

---

## 4. Refund Mechanics — Токены при Частичном Провале

### Проблема
Milestone 1 APPROVED (33% SOL ушло), Milestone 2 FAILED → refund.
Бэкер получил 100% токенов при backing — что с ними?

### Решение: Lazy Minting (Progressive Claim)

**Архитектурное решение: токены НЕ минтятся при backing.**
Вместо этого: BackerPosition хранит allocation rights.
Бэкер клеймит токены после каждого approved milestone.

```
Backing:
  BackerPosition.tokens_allocated = X (записаны права)
  Tokens minted = 0

Milestone 1 APPROVED (33% от total):
  Любой бэкер может вызвать claim_tokens()
  → mint (0.33 * tokens_allocated) → на кошелёк бэкера
  BackerPosition.tokens_claimed += minted_amount
  BackerPosition.milestones_claimed_through = 1

Milestone 2 FAILED → Refund:
  Remaining SOL (67%) возвращается бэкерам пропорционально
  Unminted tokens (0.67 * tokens_allocated) просто никогда не создаются
  Нет burn. Нет сложной математики.
  Бэкер оставляет токены от M1 (33% allocation) как proof of participation
```

**Anchor instructions:**

```rust
// Бэкер клеймит токены после approved milestones
pub fn claim_tokens(ctx: Context<ClaimTokens>) -> Result<()> {
    let campaign = &ctx.accounts.campaign;
    let position = &mut ctx.accounts.backer_position;

    // Сколько milestones approved с момента последнего claim
    let approved = campaign.milestones_approved;
    let claimed_through = position.milestones_claimed_through;

    require!(approved > claimed_through, ErrorCode::NothingToClaim);

    // Считаем claimable tokens
    // Каждый milestone = (milestone_amount / total_goal) доля от allocation
    // ВАЖНО: integer math only
    let mut claimable: u64 = 0;
    for i in claimed_through..approved {
        let milestone_amount = ctx.accounts.milestones[i as usize].amount_lamports;
        // claimable += tokens_allocated * milestone_amount / total_goal
        let portion = position.tokens_allocated
            .checked_mul(milestone_amount).unwrap()
            .checked_div(campaign.total_goal_lamports).unwrap();
        claimable = claimable.checked_add(portion).unwrap();
    }

    require!(claimable > 0, ErrorCode::NothingToClaim);

    // Mint tokens to backer (PDA mint authority)
    let seeds = &[b"campaign", campaign.creator.as_ref(), &[campaign.bump]];
    let signer_seeds = &[&seeds[..]];
    let cpi_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        token::MintTo {
            mint: ctx.accounts.token_mint.to_account_info(),
            to: ctx.accounts.backer_token_account.to_account_info(),
            authority: ctx.accounts.campaign.to_account_info(), // PDA is mint authority
        },
        signer_seeds,
    );
    token::mint_to(cpi_ctx, claimable)?;

    position.tokens_claimed = position.tokens_claimed
        .checked_add(claimable).unwrap();
    position.milestones_claimed_through = approved;

    Ok(())
}

// Refund — возврат remaining SOL
pub fn claim_refund(ctx: Context<ClaimRefund>) -> Result<()> {
    let campaign = &ctx.accounts.campaign;
    let position = &mut ctx.accounts.backer_position;

    require!(
        campaign.status == CampaignStatus::Refunded,
        ErrorCode::NotRefunded
    );
    require!(!position.refund_claimed, ErrorCode::AlreadyRefunded);

    // ПРАВИЛЬНО: integer math (multiply first, divide after)
    // refund = backer_backed * vault_remaining / total_raised
    let refund_amount = position.lamports_backed
        .checked_mul(campaign.vault_balance).unwrap()
        .checked_div(campaign.raised_lamports).unwrap();

    // CPI transfer SOL from vault PDA to backer
    let seeds = &[b"vault", campaign.key().as_ref(), &[ctx.accounts.campaign_vault.bump]];
    let signer_seeds = &[&seeds[..]];
    let cpi_ctx = CpiContext::new_with_signer(
        ctx.accounts.system_program.to_account_info(),
        anchor_lang::system_program::Transfer {
            from: ctx.accounts.campaign_vault.to_account_info(),
            to: ctx.accounts.backer.to_account_info(),
        },
        signer_seeds,
    );
    anchor_lang::system_program::transfer(cpi_ctx, refund_amount)?;

    position.refund_claimed = true;
    // Unclaimed tokens (tokens_allocated - tokens_claimed) просто никогда не создаются

    Ok(())
}
```


---

## 5. Governance Voting — Whale и Sybil Protection

### Проблема v1.0
Кит с 40% токенов единолично решает судьбу проекта.

### Проблема с quadratic voting (sqrt)
Quadratic voting **без верификации личности** = поощрение Sybil атаки:
```
Кит: 1000 токенов, 1 кошелёк  → sqrt(1000) = 31.6 power
Кит: 1000 токенов, 10 кошельков → 10 × sqrt(100) = 100 power  (3x больше!)
```
Создать 100 кошельков на Solana бесплатно → quadratic voting broken.

### Решение: BackerPosition-based voting + cap per position

**Ключевой инсайт:** голосование через BackerPosition, а не через token account.
BackerPosition создаётся при backing и привязана к кошельку. Нельзя разбить post-factum.

```rust
pub fn vote_on_extension(
    ctx: Context<VoteOnExtension>,
    approve: bool,
) -> Result<()> {
    let position = &ctx.accounts.backer_position;
    let campaign = &ctx.accounts.campaign;

    require!(position.lamports_backed > 0, ErrorCode::NotABacker);

    // Voting power = tokens_allocated (из BackerPosition, не из token account!)
    // Это невозможно разбить на несколько кошельков
    let raw_power = position.tokens_allocated;

    // Cap: один position не может иметь больше 20% от total voting power
    let max_power = campaign.total_tokens_allocated
        .checked_div(5).unwrap(); // 20% = 1/5
    let voting_power = raw_power.min(max_power);

    let vote = &mut ctx.accounts.extension_vote;
    require!(!vote.has_voted, ErrorCode::AlreadyVoted);

    vote.voter = ctx.accounts.voter.key();
    vote.voting_power = voting_power;
    vote.vote_approve = approve;
    vote.voted_at = Clock::get()?.unix_timestamp;
    vote.has_voted = true;

    // Обновляем агрегированный результат
    let state = &mut ctx.accounts.voting_state;
    if approve {
        state.total_approve_power = state.total_approve_power
            .checked_add(voting_power).unwrap();
    } else {
        state.total_reject_power = state.total_reject_power
            .checked_add(voting_power).unwrap();
    }

    Ok(())
}
```

**Почему это работает:**
- BackerPosition PDA = ["backer", campaign, wallet] — один на кошелёк
- Нельзя разбить 1 позицию на 10 после backing
- Cap 20% — ни один бэкер не диктует результат
- Не нужен sqrt, не нужна identity verification

**Quorum правила:**
```
Quorum: 20% от total_tokens_allocated (все allocated токены, не только minted)
Если quorum не набран → DEFAULT: EXTEND (benefit of doubt)
Если набран и большинство APPROVE → продлеваем
Если набран и большинство REJECT → refund
Voting period: 7 дней
После окончания: execute_extension_result() callable by anyone
```


---

## 6. Security Deposit — Progressive Return

### Проблема
0.5% от цели заморожено на весь срок кампании.

### Решение: Прогрессивный возврат при каждом approved milestone

```
Campaign goal: 100 SOL
Security deposit: 0.5 SOL (0.5%)
3 milestones (по 33 SOL каждый)

Milestone 1 APPROVED:
  → Return 0.167 SOL deposit (33% от 0.5)
  → Creator получает (33 - 2.5% fee) + 0.167 SOL deposit

Milestone 2 APPROVED:
  → Return 0.167 SOL deposit

Milestone 3 APPROVED:
  → Return final 0.167 SOL deposit
  → Campaign COMPLETED
```

**При провале (refund):**
Оставшийся deposit → Qadam treasury (anti-scam deterrent + доход платформы).


---

## 7. Integer Math — КРИТИЧЕСКОЕ ПРАВИЛО

### Правило: НИ ОДНОГО float в Solana program

Solana validators могут дать разные float результаты → недетерминизм → программа невалидна.

**ЗАПРЕЩЕНО:**
```rust
// НЕЛЬЗЯ
let share = amount as f64 / total as f64;
let result = (share * balance as f64) as u64;
```

**ОБЯЗАТЕЛЬНО:**
```rust
// ПРАВИЛЬНО: multiply first, divide after
let result = amount
    .checked_mul(balance).unwrap()
    .checked_div(total).unwrap();

// Для basis points (2.5% = 250 bps):
let fee = amount
    .checked_mul(QADAM_FEE_BPS as u64).unwrap()
    .checked_div(10_000).unwrap();
```

**Защита от overflow:** `checked_mul` вернёт None если u64 overflow.
Для больших сумм (>1M SOL × 10_000 bps) использовать u128 промежуточно:
```rust
let fee = (amount as u128)
    .checked_mul(QADAM_FEE_BPS as u128).unwrap()
    .checked_div(10_000).unwrap() as u64;
```


---

## 8. Fee Calculation — Правильный порядок

### Проблема v1.0
Fee вычитался из vault ОТДЕЛЬНО от milestone payment → double-spending.

### Решение: Fee вычитается ИЗ суммы milestone

```rust
pub fn release_milestone(ctx: Context<ReleaseMilestone>, milestone_index: u8) -> Result<()> {
    // Проверки: только AI_AGENT_WALLET или ADMIN_WALLET может вызвать
    let signer = ctx.accounts.authority.key();
    require!(
        signer == ctx.accounts.config.ai_agent_wallet
        || signer == ctx.accounts.config.admin_wallet,
        ErrorCode::Unauthorized
    );

    let campaign = &mut ctx.accounts.campaign;
    let milestone = &mut ctx.accounts.milestone;

    require!(
        milestone.status == MilestoneStatus::Submitted
        || milestone.status == MilestoneStatus::UnderHumanReview,
        ErrorCode::InvalidMilestoneStatus
    );

    // 1. Рассчитать fee (из суммы milestone, не дополнительно!)
    let qadam_fee = (milestone.amount_lamports as u128)
        .checked_mul(QADAM_FEE_BPS as u128).unwrap()
        .checked_div(10_000).unwrap() as u64;
    let creator_amount = milestone.amount_lamports
        .checked_sub(qadam_fee).unwrap();

    // 2. Рассчитать deposit return (пропорционально)
    let deposit_return = (campaign.security_deposit_lamports as u128)
        .checked_mul(milestone.amount_lamports as u128).unwrap()
        .checked_div(campaign.total_goal_lamports as u128).unwrap() as u64;

    // 3. Transfer to creator: (milestone_amount - fee) + deposit_return
    let vault_seeds = &[b"vault", campaign.key().as_ref(), &[ctx.accounts.campaign_vault.bump]];
    let signer_seeds = &[&vault_seeds[..]];

    // Creator получает: сумму минус комиссию + часть депозита
    let total_to_creator = creator_amount.checked_add(deposit_return).unwrap();
    anchor_lang::system_program::transfer(
        CpiContext::new_with_signer(
            ctx.accounts.system_program.to_account_info(),
            anchor_lang::system_program::Transfer {
                from: ctx.accounts.campaign_vault.to_account_info(),
                to: ctx.accounts.creator.to_account_info(),
            },
            signer_seeds,
        ),
        total_to_creator,
    )?;

    // 4. Transfer fee to Qadam treasury
    anchor_lang::system_program::transfer(
        CpiContext::new_with_signer(
            ctx.accounts.system_program.to_account_info(),
            anchor_lang::system_program::Transfer {
                from: ctx.accounts.campaign_vault.to_account_info(),
                to: ctx.accounts.qadam_treasury.to_account_info(),
            },
            signer_seeds,
        ),
        qadam_fee,
    )?;

    // 5. Update state
    campaign.security_deposit_remaining = campaign.security_deposit_remaining
        .checked_sub(deposit_return).unwrap();
    campaign.vault_balance = campaign.vault_balance
        .checked_sub(total_to_creator).unwrap()
        .checked_sub(qadam_fee).unwrap();
    milestone.status = MilestoneStatus::Approved;
    milestone.ai_decision = AiDecision::Approved;
    milestone.decided_at = Clock::get()?.unix_timestamp;
    campaign.milestones_approved = campaign.milestones_approved
        .checked_add(1).unwrap();

    // 6. Check if campaign complete
    if campaign.milestones_approved == campaign.milestones_count {
        campaign.status = CampaignStatus::Completed;
    }

    Ok(())
}
```

**Математика на примере:**
```
Milestone: 100 SOL
Fee 2.5%:  2.5 SOL
Creator:   97.5 SOL + deposit_return
Qadam:     2.5 SOL
Vault:     -(100 SOL + deposit_return)
Баланс:   сходится ✅
```


---

## 9. Campaign Vault — PDA Definition

### Vault = System Account PDA (native SOL)

```rust
// Seeds: ["vault", campaign_pubkey]
// Это НЕ token account, а обычный system account owned by program

#[derive(Accounts)]
pub struct BackCampaign<'info> {
    #[account(mut)]
    pub backer: Signer<'info>,

    #[account(
        mut,
        seeds = [b"campaign", campaign.creator.as_ref(), &campaign.nonce.to_le_bytes()],
        bump = campaign.bump,
    )]
    pub campaign: Account<'info, Campaign>,

    /// Vault PDA — хранит SOL бэкеров
    #[account(
        mut,
        seeds = [b"vault", campaign.key().as_ref()],
        bump,
    )]
    pub campaign_vault: SystemAccount<'info>,

    /// BackerPosition — создаётся при первом backing
    #[account(
        init,
        payer = backer,
        space = 8 + BackerPosition::INIT_SPACE,
        seeds = [b"backer", campaign.key().as_ref(), backer.key().as_ref()],
        bump,
    )]
    pub backer_position: Account<'info, BackerPosition>,

    pub system_program: Program<'info, System>,
}
```

**Почему system account, а не token account:**
- Мы работаем с native SOL, не с SPL tokens
- System account PDA проще и дешевле
- Transfer через system_program CPI с PDA signer
- Не нужен wrapped SOL и дополнительные token accounts


---

## 10. Account Lifecycle — Close и Reclaim Rent

### Проблема
Без close instructions, SOL навсегда залочен в мёртвых аккаунтах.
Каждый BackerPosition ≈ 0.002 SOL rent. 1000 бэкеров = 2 SOL потеряно.

### Решение: close constraints после завершения

```rust
// После campaign completed + all tokens claimed:
pub fn close_backer_position(ctx: Context<CloseBackerPosition>) -> Result<()> {
    let position = &ctx.accounts.backer_position;
    let campaign = &ctx.accounts.campaign;

    // Можно закрыть только если:
    // 1. Campaign completed/refunded
    // 2. Все токены claimed (или refund claimed)
    require!(
        campaign.status == CampaignStatus::Completed
        || campaign.status == CampaignStatus::Refunded,
        ErrorCode::CampaignStillActive
    );

    if campaign.status == CampaignStatus::Completed {
        require!(
            position.milestones_claimed_through == campaign.milestones_count,
            ErrorCode::TokensNotClaimed
        );
    } else {
        require!(position.refund_claimed, ErrorCode::RefundNotClaimed);
    }

    // Anchor's close constraint handles the rest
    Ok(())
}

#[derive(Accounts)]
pub struct CloseBackerPosition<'info> {
    #[account(mut)]
    pub backer: Signer<'info>,

    pub campaign: Account<'info, Campaign>,

    #[account(
        mut,
        close = backer,  // Rent lamports → backer
        seeds = [b"backer", campaign.key().as_ref(), backer.key().as_ref()],
        bump = backer_position.bump,
        has_one = backer,
    )]
    pub backer_position: Account<'info, BackerPosition>,
}

// Аналогично для milestone accounts и vote accounts
// после завершения кампании
```


---

## 11. Token Mint Authority

### Кто может минтить токены проекта?

**Campaign PDA = mint authority.** Только программа может минтить через CPI.

```rust
// При create_campaign:
// 1. Создаём SPL Token Mint
// 2. Mint authority = Campaign PDA (не creator, не AI agent)
// Это гарантирует: токены минтятся ТОЛЬКО через claim_tokens instruction
```

Никто — ни creator, ни admin, ни AI agent — не может минтить токены
вне программной логики. Это критически важно для доверия бэкеров.


---

## 12. Emergency Pause

### Проблема
Если найдена уязвимость, нет способа остановить программу.

### Решение: Admin pause

```rust
// Global config account (singleton PDA)
pub struct QadamConfig {
    pub admin_wallet: Pubkey,
    pub ai_agent_wallet: Pubkey,
    pub qadam_treasury: Pubkey,
    pub paused: bool,              // Emergency pause
    pub bump: u8,
}

// В каждой instruction которая двигает деньги:
require!(!ctx.accounts.config.paused, ErrorCode::ProgramPaused);

// Admin может:
pub fn set_paused(ctx: Context<AdminOnly>, paused: bool) -> Result<()> {
    ctx.accounts.config.paused = paused;
    Ok(())
}
```


---

## 13. Финальная Схема Аккаунтов

```rust
// ═══════════════════════════════════════════════════════
// QADAM CONFIG — глобальный singleton
// Seed: ["config"]
// ═══════════════════════════════════════════════════════
#[account]
#[derive(InitSpace)]
pub struct QadamConfig {
    pub admin_wallet: Pubkey,           // 32
    pub ai_agent_wallet: Pubkey,        // 32
    pub qadam_treasury: Pubkey,         // 32
    pub paused: bool,                   // 1
    pub bump: u8,                       // 1
}

// ═══════════════════════════════════════════════════════
// CAMPAIGN — главный аккаунт
// Seed: ["campaign", creator_pubkey, nonce (u64 LE bytes)]
// ═══════════════════════════════════════════════════════
#[account]
#[derive(InitSpace)]
pub struct Campaign {
    pub creator: Pubkey,                // 32
    #[max_len(100)]
    pub title: String,                  // 4 + 100
    pub nonce: u64,                     // 8  (для уникальности PDA)
    pub total_goal_lamports: u64,       // 8
    pub raised_lamports: u64,           // 8
    pub vault_balance: u64,             // 8  (трекаем отдельно для точности)
    pub backer_count: u32,              // 4
    pub token_mint: Pubkey,             // 32
    pub tokens_per_lamport: u64,        // 8  (base rate для tier 1)
    pub total_tokens_allocated: u64,    // 8  (сумма всех allocated для quorum calc)
    pub milestones_count: u8,           // 1
    pub milestones_approved: u8,        // 1
    pub status: CampaignStatus,         // 1
    pub security_deposit_lamports: u64, // 8
    pub security_deposit_remaining: u64,// 8
    pub created_at: i64,                // 8
    pub bump: u8,                       // 1
}
// CampaignStatus: Draft | Active | Completed | Refunded | Paused

// ═══════════════════════════════════════════════════════
// CAMPAIGN VAULT — хранилище SOL
// Seed: ["vault", campaign_pubkey]
// Тип: SystemAccount (native SOL, не token account)
// ═══════════════════════════════════════════════════════
// Не struct — просто PDA system account

// ═══════════════════════════════════════════════════════
// MILESTONE — аккаунт на каждый milestone
// Seed: ["milestone", campaign_pubkey, milestone_index (u8)]
// ═══════════════════════════════════════════════════════
#[account]
#[derive(InitSpace)]
pub struct MilestoneAccount {
    pub campaign: Pubkey,               // 32
    pub index: u8,                      // 1
    pub amount_lamports: u64,           // 8
    pub deadline: i64,                  // 8
    pub grace_deadline: i64,            // 8  (deadline + 7 days)
    pub extension_deadline: i64,        // 8  (если extension approved)
    pub status: MilestoneStatus,        // 1
    pub evidence_content_hash: [u8; 32],// 32  SHA-256 от контента
    pub ai_decision: AiDecision,        // 1  (None|Approved|Rejected|Partial)
    pub ai_decision_hash: [u8; 32],     // 32  SHA-256 от Claude response
    pub submitted_at: i64,              // 8
    pub decided_at: i64,                // 8
    pub bump: u8,                       // 1
}
// MilestoneStatus: Pending | GracePeriod | Submitted | AIProcessing |
//                  UnderHumanReview | Approved | Rejected |
//                  ExtensionRequested | VotingActive | Extended | Failed

// ═══════════════════════════════════════════════════════
// BACKER POSITION — права бэкера (lazy mint)
// Seed: ["backer", campaign_pubkey, backer_pubkey]
// ═══════════════════════════════════════════════════════
#[account]
#[derive(InitSpace)]
pub struct BackerPosition {
    pub campaign: Pubkey,               // 32
    pub backer: Pubkey,                 // 32
    pub lamports_backed: u64,           // 8
    pub tier: u8,                       // 1
    pub tokens_allocated: u64,          // 8  (права, не реальные токены)
    pub tokens_claimed: u64,            // 8  (сколько уже claimed)
    pub milestones_claimed_through: u8, // 1
    pub refund_claimed: bool,           // 1
    pub backed_at: i64,                 // 8
    pub bump: u8,                       // 1
}

// ═══════════════════════════════════════════════════════
// EXTENSION VOTING STATE — агрегат голосования
// Seed: ["voting", milestone_pubkey]
// ═══════════════════════════════════════════════════════
#[account]
#[derive(InitSpace)]
pub struct ExtensionVotingState {
    pub milestone: Pubkey,              // 32
    pub total_approve_power: u64,       // 8
    pub total_reject_power: u64,        // 8
    pub voting_deadline: i64,           // 8
    pub executed: bool,                 // 1
    pub bump: u8,                       // 1
}

// ═══════════════════════════════════════════════════════
// EXTENSION VOTE — один голос
// Seed: ["vote", milestone_pubkey, voter_pubkey]
// ═══════════════════════════════════════════════════════
#[account]
#[derive(InitSpace)]
pub struct ExtensionVote {
    pub milestone: Pubkey,              // 32
    pub voter: Pubkey,                  // 32
    pub voting_power: u64,              // 8
    pub vote_approve: bool,             // 1
    pub has_voted: bool,                // 1
    pub voted_at: i64,                  // 8
    pub bump: u8,                       // 1
}
```


---

## 14. Полный список Anchor Instructions

```rust
// ══════════════════════════════════════════
// SETUP
// ══════════════════════════════════════════

initialize_config(
    admin_wallet: Pubkey,
    ai_agent_wallet: Pubkey,
    qadam_treasury: Pubkey,
) -> Result<()>
// Создаёт QadamConfig singleton. Один раз при деплое.

set_paused(paused: bool) -> Result<()>
// Только admin. Emergency pause.

// ══════════════════════════════════════════
// CAMPAIGN LIFECYCLE
// ══════════════════════════════════════════

create_campaign(
    title: String,
    nonce: u64,                          // для уникальности PDA
    milestones: Vec<MilestoneInput>,     // [{amount_lamports, deadline}]
    tokens_per_lamport: u64,             // base rate для tier 1
) -> Result<()>
// Создаёт Campaign PDA + Vault PDA + MilestoneAccount PDAs
// Creator вносит security_deposit (0.5% от goal) в vault
// Деплоит SPL Token Mint (authority = Campaign PDA)

back_campaign(amount_lamports: u64) -> Result<()>
// Принимает SOL в vault PDA
// Определяет tier по backer_count
// Создаёт BackerPosition (lazy mint)
// Обновляет campaign counters

increase_backing(additional_lamports: u64) -> Result<()>
// Добавляет SOL в существующую позицию
// Tier не меняется (определяется при первом backing)
// Пересчитывает tokens_allocated

// ══════════════════════════════════════════
// MILESTONE FLOW
// ══════════════════════════════════════════

submit_milestone(
    milestone_index: u8,
    evidence_content_hash: [u8; 32],     // SHA-256 от контента
) -> Result<()>
// Только creator. Записывает hash on-chain.
// Обновляет MilestoneStatus → Submitted
// Emits event → Elixir AI Agent

release_milestone(
    milestone_index: u8,
    ai_decision_hash: [u8; 32],
) -> Result<()>
// Только AI_AGENT_WALLET или ADMIN_WALLET
// Fee вычитается ИЗ milestone amount
// Creator получает (amount - fee) + deposit_return
// Qadam treasury получает fee

mark_under_human_review(milestone_index: u8) -> Result<()>
// Только AI_AGENT_WALLET. При PARTIAL решении.

admin_override_decision(
    milestone_index: u8,
    approved: bool,
) -> Result<()>
// Только ADMIN_WALLET. Human review decision.

claim_tokens() -> Result<()>
// Любой бэкер. Минтит SPL tokens за approved milestones.
// Campaign PDA подписывает mint CPI.

// ══════════════════════════════════════════
// FAILURE / GOVERNANCE FLOW
// ══════════════════════════════════════════

request_extension(
    milestone_index: u8,
    reason_hash: [u8; 32],
    new_deadline: i64,
) -> Result<()>
// Только creator. Создаёт ExtensionVotingState.

vote_on_extension(
    milestone_index: u8,
    approve: bool,
) -> Result<()>
// Только backers (через BackerPosition).
// voting_power = tokens_allocated (capped at 20% total)
// Создаёт ExtensionVote PDA (prevents double voting)

execute_extension_result(milestone_index: u8) -> Result<()>
// Anyone после voting_deadline.
// Quorum 20% total_tokens_allocated.
// No quorum → EXTEND. Approve majority → EXTEND. Reject majority → REFUND.

claim_refund() -> Result<()>
// Бэкер получает proportional refund.
// Одноразово (refund_claimed = true).

// ══════════════════════════════════════════
// CLEANUP
// ══════════════════════════════════════════

close_backer_position() -> Result<()>
// После campaign end. Rent → backer.

close_campaign() -> Result<()>
// После all positions closed. Rent → creator.
```


---

## 15. Ключевые Константы

```rust
pub const QADAM_FEE_BPS: u16 = 250;           // 2.5%
pub const SECURITY_DEPOSIT_BPS: u16 = 50;     // 0.5%
pub const MAX_MILESTONES: u8 = 5;
pub const TIER_1_MAX_BACKERS: u32 = 50;
pub const TIER_2_MAX_BACKERS: u32 = 250;      // 50 + 200
pub const TIER_2_RATIO_BPS: u16 = 6_700;      // 67%
pub const TIER_3_RATIO_BPS: u16 = 5_000;      // 50%
pub const GRACE_PERIOD_SECONDS: i64 = 7 * 24 * 60 * 60;   // 7 дней
pub const VOTING_PERIOD_SECONDS: i64 = 7 * 24 * 60 * 60;  // 7 дней
pub const MAX_EXTENSION_SECONDS: i64 = 30 * 24 * 60 * 60; // 30 дней
pub const QUORUM_BPS: u16 = 2_000;            // 20% от total_tokens_allocated
pub const VOTE_CAP_BPS: u16 = 2_000;          // max 20% voting power per position
pub const MIN_BACKING_LAMPORTS: u64 = 100_000_000;   // 0.1 SOL
pub const APPEAL_COST_LAMPORTS: u64 = 10_000_000;    // 0.01 SOL
pub const MAX_TITLE_LEN: usize = 100;
```

---

## 16. Checklist перед написанием Anchor Program

- [x] Все технические вопросы решены (этот документ)
- [x] Float arithmetic заменён на integer math (Секция 7)
- [x] Fee double-spend исправлен (Секция 8)
- [x] Sybil-resistant voting (BackerPosition + cap) (Секция 5)
- [x] Vault PDA определён (Секция 9)
- [x] Account close для reclaim rent (Секция 10)
- [x] Token mint authority = Campaign PDA (Секция 11)
- [x] Emergency pause (Секция 12)
- [x] QadamConfig singleton (Секция 13)
- [x] Backend evidence hash verification (Секция 3)
- [x] Все Anchor accounts определены с InitSpace (Секция 13)
- [x] Все Instructions определены (Секция 14)

**Порядок разработки для хакатона (7 дней):**
```
День 1: Anchor boilerplate + QadamConfig + create_campaign + back_campaign
День 2: submit_milestone + release_milestone + claim_tokens (core flow)
День 3: Elixir AI Agent (Claude API + state machine + sign transaction)
День 4: Next.js frontend (Landing + Campaign page + Phantom wallet)
День 5: Creator Dashboard + Submit Evidence form + evidence hash
День 6: Интеграционное тестирование полного flow на Devnet
День 7: UI polish + edge cases + Demo recording
```

---

*Qadam Technical Decisions v1.1 | 30 марта 2026*
*Audit: 3 critical bugs fixed, 4 missing components added*
