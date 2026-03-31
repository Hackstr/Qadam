# Qadam — Test Scenarios (Manual QA)

> Для локального тестирования запущенного проекта.
> Anchor localnet + Elixir backend + Next.js frontend.

---

## Как запустить локально

```bash
# Terminal 1 — Anchor localnet
cd qadam && anchor test

# Terminal 2 — Elixir backend
cd qadam_backend && mix phx.server

# Terminal 3 — Next.js frontend
cd qadam_frontend && npm run dev
```

---

## СЦЕНАРИЙ 1 — Happy Path (основной флоу)

### 1.1 Создание кампании

**Шаги:**
1. Открыть `localhost:3000`
2. Подключить Phantom wallet (devnet/localnet)
3. Нажать "Create Campaign"
4. Заполнить: название, описание, цель 3 SOL
5. Добавить 3 milestone: по 1 SOL каждый, дедлайн через 7+ дней
6. Нажать "Deploy Campaign" → подтвердить транзакцию в Phantom

**Ожидаемый результат:**
- Транзакция подтверждена в Phantom
- Redirect на страницу кампании
- Статус кампании: **Active**
- Виден прогресс: 0/3 SOL
- Milestone timeline показывает 3 шага, все Pending
- Создатель видит security deposit (0.5% = 0.015 SOL) списан с кошелька

---

### 1.2 Backing (Tier 1)

**Шаги:**
1. Открыть страницу кампании **в другом браузере/инкогнито** (другой кошелёк = backer)
2. Подключить другой кошелёк
3. Видеть: "🟢 Tier 1 — 1.0x (осталось 50 мест)"
4. Ввести сумму 1 SOL → нажать "Back This Project" → подтвердить в Phantom

**Ожидаемый результат:**
- SOL списан с кошелька backer'а
- Прогресс кампании: 1/3 SOL (33%)
- Backer count: 1
- В portfolio backer'а появилась запись: "1 SOL backed, Tier 1"
- Tokens allocated показаны (не minted ещё)

---

### 1.3 Submit Milestone

**Шаги:**
1. Вернуться в кошелёк создателя
2. Открыть Creator Dashboard → кампания → Milestone 1
3. Нажать "Submit Evidence"
4. Заполнить:
   - Описание: "Прототип готов, вот демо"
   - Ссылка: `https://example.com/demo`
5. Нажать "Submit" → подтвердить транзакцию

**Ожидаемый результат:**
- Evidence hash записан on-chain (видно в Solana Explorer)
- Milestone статус: **Submitted**
- UI показывает "⏳ Awaiting AI Verification"

---

### 1.4 AI Verification → Release

**Шаги:**
1. Подождать 10-30 секунд (Elixir AI agent должен поймать событие)
2. Обновить страницу

**Ожидаемый результат — если APPROVED:**
- Milestone 1 статус: **✅ Approved**
- Создатель получил ~0.975 SOL (1 SOL - 2.5% fee + часть deposit)
- Qadam treasury получила 0.025 SOL
- Campaign: milestones_approved = 1

**Проверить в логах бэкенда:**
```
[AI] Claude decision: APPROVED
[TX] Broadcasting release_milestone transaction...
[TX] Confirmed: <signature>
```

---

### 1.5 Claim Tokens

**Шаги:**
1. Backer открывает Portfolio
2. Видит: "Milestone 1 approved — tokens available to claim"
3. Нажимает "Claim Tokens" → подтвердить транзакцию

**Ожидаемый результат:**
- SPL токены появились в кошельке backer'а
- Portfolio показывает: tokens_claimed > 0, milestones_claimed_through = 1

---

### 1.6 Полное завершение кампании

**Шаги:**
1. Повторить submit + AI verify для Milestone 2 и Milestone 3
2. После 3-го approved:

**Ожидаемый результат:**
- Campaign статус: **Completed**
- Все SOL у создателя
- Backer claimает оставшиеся токены (milestones 2 и 3)

---

### 1.7 Закрытие и возврат rent

**Шаги:**
1. Backer нажимает "Close Position" (reclaim rent)
2. Создатель нажимает "Close Campaign" (reclaim rent)

**Ожидаемый результат:**
- BackerPosition аккаунт удалён (rent вернулся backer'у)
- Campaign аккаунт удалён (rent вернулся создателю)
- В Solana Explorer: аккаунты больше не существуют

---

## СЦЕНАРИЙ 2 — Human Review Flow (PARTIAL решение)

**Предусловие:** Milestone сабмитнут, но Claude вернул PARTIAL.

**Как воспроизвести (dev mode):**
- В `.env` бэкенда поставить `FORCE_PARTIAL=true` для тест-среды
- Или: отправить evidence без ссылки (только текст) — Claude с большей вероятностью вернёт PARTIAL

**Шаги:**
1. Submit milestone с неполными доказательствами (только текст, нет ссылок)
2. Подождать AI verification

**Ожидаемый результат:**
- Milestone статус: **UnderHumanReview**
- Создатель получил уведомление: "Milestone requires human review"
- В `/admin/review-queue` появилась запись

**Шаги — Admin approve:**
1. Открыть `localhost:3000/admin` (admin кошелёк)
2. Видеть milestone в очереди с AI explanation
3. Нажать "Approve" → подтвердить транзакцию

**Ожидаемый результат:**
- Milestone статус: **Approved**
- SOL переведён создателю (та же математика что и при AI release)
- Audit log зафиксировал: human decision, admin wallet, timestamp

---

## СЦЕНАРИЙ 3 — Cancel Campaign (нет бэкеров)

**Шаги:**
1. Создать кампанию (добавить milestones → Active статус)
2. НЕ делать backing
3. В Creator Dashboard → "Cancel Campaign" → подтвердить

**Ожидаемый результат:**
- Security deposit (0.5%) возвращён создателю
- ⚠️ **ИЗВЕСТНЫЙ БАГ:** Campaign status = `Completed` (должен быть `Cancelled`)
- Vault balance = 0
- Создатель может вызвать close_campaign → reclaim rent

---

## СЦЕНАРИЙ 4 — Governance: Extension Request + Vote

**Предусловие:** Кампания активна, есть бэкеры, milestone просрочен (дедлайн прошёл).

**Для теста:** создать milestone с дедлайном в прошлом (или подождать реального дедлайна).

**Шаги — Extension Request:**
1. Создатель открывает Dashboard → просроченный milestone
2. Нажимает "Request Extension"
3. Вводит причину + новую дату (+20 дней)
4. Подтверждает транзакцию

**Ожидаемый результат:**
- Milestone статус: **ExtensionRequested → VotingActive**
- Voting period открыт (7 дней)
- Бэкеры видят voting banner на странице кампании

**Шаги — Vote:**
1. Backer 1 открывает кампанию → видит "Vote on Extension"
2. Нажимает "Approve Extension" → подтверждает транзакцию

**Ожидаемый результат:**
- Vote записан on-chain
- Voting state: total_approve_power увеличился
- Если backer 1 = единственный → 100% approve (больше 20% quorum)

**Шаги — Execute Result:**
1. После voting period (или в тесте: admin вызывает execute_extension_result)
2. Нажать "Execute Voting Result" (callable by anyone)

**Ожидаемый результат (если approve большинство):**
- Milestone статус: **Extended**
- Новый дедлайн установлен
- Создатель может теперь submit evidence в расширенный период

**Ожидаемый результат (если reject большинство):**
- Campaign статус: **Refunded**
- Бэкеры могут claim_refund

---

## СЦЕНАРИЙ 5 — Refund Flow

**Предусловие:** Campaign в статусе Refunded (после failed governance vote).

**Шаги:**
1. Backer открывает Portfolio → видит "Campaign Refunded"
2. Нажимает "Claim Refund" → подтверждает транзакцию

**Ожидаемый результат:**
- SOL вернулся backer'у пропорционально вкладу
  - Если backer вложил 1 SOL из 3 SOL (33%) → получает 33% remaining vault
  - Если milestone 1 был approved до refund → vault уже уменьшен
- `refund_claimed = true` (нельзя claim второй раз)
- Токены от approved milestones остаются у backer'а (earned tokens)

**Проверить double-claim protection:**
1. Нажать "Claim Refund" второй раз
2. **Ожидается:** транзакция rejected с ошибкой `AlreadyRefunded`

---

## СЦЕНАРИЙ 6 — Pause / Unpause

**Шаги:**
1. Admin подключает кошелёк
2. Нажимает "Pause Platform" (в /admin)
3. Другой пользователь пытается создать кампанию

**Ожидаемый результат:**
- Транзакция rejected: `ProgramPaused`
- UI показывает: "Platform temporarily paused"

4. Admin нажимает "Unpause"
5. Создание кампании снова работает

---

## СЦЕНАРИЙ 7 — Multi-Tier Backing

**Цель:** Проверить что тиры назначаются правильно.

**Шаги:**
1. Создать кампанию
2. Подключить 51 разных кошельков (или повторить с одним — увидим счётчик)
3. Первые 50 backers: должны получить Tier 1
4. Backer #51: должен получить Tier 2

**Проверить:**
- UI показывает правильный tier badge при backing
- BackerPosition.tier = 1 для первых 50
- BackerPosition.tier = 2 для #51+
- tokens_allocated для Tier 2 = 0.67x от Tier 1 при той же сумме

**Быстрый тест (без 50 wallets):**
- Проверить константы: TIER_1_MAX_BACKERS = 50
- Вручную изменить backer_count в тесте и проверить tier расчёт

---

## СЦЕНАРИЙ 8 — Negative Cases (что НЕ должно работать)

### 8.1 Не-AI агент пытается release milestone
**Шаги:** Случайный кошелёк пытается вызвать `release_milestone`
**Ожидается:** `UnauthorizedSigner`

### 8.2 Не-создатель пытается submit milestone
**Шаги:** Backer кошелёк пытается вызвать `submit_milestone`
**Ожидается:** `NotCreator`

### 8.3 Двойной backing (тот же кошелёк)
**Шаги:** Backer пытается back_campaign второй раз
**Ожидается:** Anchor ошибка (BackerPosition PDA уже существует) — использовать `increase_backing` вместо этого

### 8.4 Submit milestone не по порядку
**Шаги:** Создатель пытается сабмитнуть Milestone 2 не выполнив Milestone 1
**Ожидается:** `MilestoneOutOfOrder`

### 8.5 Claim refund при non-Refunded кампании
**Шаги:** Backer пытается claim_refund при Active кампании
**Ожидается:** `NotRefunded`

### 8.6 Cancel кампании с бэкерами
**Шаги:** Создатель пытается cancel_campaign после того как кто-то вложил SOL
**Ожидается:** `CampaignHasBackers`

### 8.7 Submit evidence после дедлайна (без grace period)
**Шаги:** Milestone с уже истёкшим grace period (14+ дней прошло)
**Ожидается:** `PastGraceDeadline`

---

## СЦЕНАРИЙ 9 — Increase Backing

**Шаги:**
1. Backer 1 делает initial backing (1 SOL)
2. Backer 1 хочет добавить ещё (0.5 SOL) через "Increase Backing"
3. Подтверждает транзакцию

**Ожидаемый результат:**
- lamports_backed увеличился (1 → 1.5 SOL)
- tokens_allocated пересчитан (пропорционально добавленной сумме)
- tier НЕ изменился (tier фиксируется при первом backing)
- backer_count НЕ увеличился (тот же backer)

---

## СЦЕНАРИЙ 10 — Evidence Hash Integrity

**Цель:** Проверить что hash контента записывается on-chain правильно.

**Шаги:**
1. Submit milestone с текстом "Test evidence"
2. Открыть Solana Explorer → найти транзакцию submit_milestone
3. Посмотреть поле `evidence_content_hash` в account data
4. Вычислить SHA-256 от того же контента локально:
   ```bash
   echo -n '{"text":"Test evidence","links":[],"file_hashes":[]}' | sha256sum
   ```
5. Сравнить хеши

**Ожидаемый результат:** Хеши совпадают

---

## Чеклист перед хакатоном

| Сценарий | Статус |
|----------|--------|
| 1.1 Создание кампании | ⬜ |
| 1.2 Backing Tier 1 | ⬜ |
| 1.3 Submit Milestone | ⬜ |
| 1.4 AI Release | ⬜ |
| 1.5 Claim Tokens | ⬜ |
| 1.6 Полное завершение | ⬜ |
| 1.7 Close + rent reclaim | ⬜ |
| 2. Human Review | ⬜ |
| 3. Cancel (no backers) | ⬜ |
| 4. Governance Vote | ⬜ |
| 5. Refund Flow | ⬜ |
| 6. Pause/Unpause | ⬜ |
| 7. Multi-tier Backing | ⬜ |
| 8.1–8.7 Negative Cases | ⬜ |
| 9. Increase Backing | ⬜ |
| 10. Hash Integrity | ⬜ |

---

## Где смотреть логи

**Anchor program logs:**
```
qadam/.anchor/program-logs/4bummNm...qadam.log
```

**Elixir backend logs:**
```bash
cd qadam_backend && mix phx.server
# Смотреть в консоли:
# [AI] Claude decision: APPROVED/REJECTED/PARTIAL
# [TX] Broadcasting...
# [TX] Confirmed: <signature>
```

**Solana Explorer (localnet):**
```
https://explorer.solana.com/?cluster=custom&customUrl=http://localhost:8899
```

---

*TEST_SCENARIOS.md | Qadam QA | 30 марта 2026*
