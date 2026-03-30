# Qadam PRD — v1.1 Patch
## Ответы на Review + Улучшения

> Основан на внешнем review. Читать вместе с PRD-Qadam-Full-Product-2026-03-30.md
> *30 марта 2026*

---

## Принятые замечания и решения

### 1. ❌ AI как единственный арбитр → ✅ Human fallback в v1

**Проблема:** Appeal mechanism только в v3 — слишком поздно. Claude может ошибиться.

**Решение — добавить Human Review Queue в Phase 1:**

```
Новая логика AI Verification:

APPROVED (score >70%)  → Автоматический release_milestone()
PARTIAL (score 40-70%) → Human Review Queue (48ч)
REJECTED (score <40%)  → REJECTED + creator feedback + право на appeal

Human Review Queue:
- Reviewer (Qadam team) видит: milestone description + evidence + AI explanation
- Принимает решение за 48 часов
- Phase 1 (10 кампаний): Qadam team вручную
- Phase 2: Curated reviewer pool (верифицированные эксперты, $20/decision)
- Phase 3: DAO-based review (токен-держатели QADAM)

Appeal механизм (Phase 1, не v3):
- При REJECTED: creator может запросить human review (1 раз на milestone)
- Стоимость appeal: 0.01 SOL (anti-spam) — возвращается если решение изменено
- SLA: 48 часов
```

**Обновление в Anchor Program:**
```rust
// Новая инструкция
request_human_review(campaign_id, milestone_index)
// Только при статусе REJECTED или PARTIAL
// Переводит milestone в статус: UnderReview

admin_override_decision(campaign_id, milestone_index, approved: bool)
// Только admin wallet (Qadam team)
```


---

### 2. ❌ Cold start неочевиден → ✅ Детальный план месяц-за-месяцем

**Проблема:** Путь от 10 до 500 кампаний не расписан. GTM слишком общий.

**Решение — Bootstrap Playbook:**

**Ключевой инструмент которого не было в v1.0:**
> Первые 20 создателей получают **0% комиссию навсегда** (forever free tier).
> Это создаёт сильный incentive для ранних creators и их stories.

```
Month 1 (Апрель 2026) — Target: 3 кампании
Тактика:
- Decentrathon нетворк: питч победы + personal ask к 5 разработчикам
- Личные связи Кхакима (esports / local startup community)
- 0% комиссия + white glove onboarding
- Каждая кампания = case study контент

Month 2-3 (Май-Июнь 2026) — Target: 10 кампаний cumulative
Тактика:
- Solana KZ/RU Discord: еженедельные AMA
- CIS Web3 Telegram channels (10+ активных каналов)
- Qadam оплачивает gas fees для первых кампаний
- Twitter/X thread: "Как мы сделали первые $50K через milestone crowdfunding"
- Документирование каждого успеха → social proof

Month 4-6 (Июль-Сентябрь 2026) — Target: 50 кампаний cumulative
Тактика:
- Product Hunt launch (вторник, 1 июля 2026)
- IndieHackers.com: founder story + community post
- Партнёрство с 3 Solana ecosystem проектами (cross-promotion)
- Ambassador program запуск: успешные creators получают rev share за referrals
- Referral: creator приводит creator → $100 USDC бонус + 0.5% доп. revenue share

Month 7-9 (Октябрь-Декабрь 2026) — Target: 150 кампаний cumulative
Тактика:
- PR outreach: Decrypt, The Block, Cointelegraph
- B2B pilot: 2 accelerators (AIFC Astana, 1 international)
- Creator grants program: $500 USDC для топ кандидатов (10 грантов)
- Hackathon sponsorship: быть partner на 3 web3 хакатонах

Month 10-12 (Январь-Март 2027) — Target: 300+ кампаний cumulative
Тактика:
- B2B scale: 5+ accelerator clients
- Mobile PWA launch → новый acquisition channel
- QADAM ambassador network: 20+ активных ambassadors
- Referral flywheel: каждая успешная кампания приводит avg 2.3 новых creators
```

**Leading indicators для отслеживания:**
- Week-over-week creator signups
- Campaign creation rate (signups → campaigns)
- Backer-to-campaign ratio
- Creator NPS (would you recommend?)


---

### 3. ❌ Команда = 1 человек, сжатые сроки → ✅ Честный план

**Проблема:** Solo founder + Backend и Smart Contract на найм за Q2 2026 — нереалистично.

**Честная оценка:**

```
Хакатон (апрель 2026): Solo — OK
- Cursor + Claude пишет 70% кода
- Anchor program: ~200 строк Rust (неделя с AI)
- Elixir AI Agent: ~150 строк (3 дня)
- Next.js Frontend: Кхаким знает хорошо (4 дня)
- РЕАЛИСТИЧНО за 7 дней ✅

Phase 1 — MVP (май-июль 2026): Solo + 1 part-time
- Smart Contract (Rust/Anchor): нанять part-time через Solana Developer Discord
  Budget: $2,000-3,000/мес, 20ч/неделю
  Timeline: найм к 15 мая
- Elixir Backend: Кхаким пишет сам с Cursor (он знает Phoenix концепты)
- Frontend: Кхаким
- РЕАЛИСТИЧНО: 2 месяца до soft launch ✅

Phase 2 (август-октябрь 2026): Solo + 1 full-time
- Если revenue позволяет: нанять Elixir developer full-time ($3-4K/мес)
- Community Manager: part-time ($500-1K/мес)

Smart Contract Audit — критический риск:
- Начать переговоры с Ottersec/Neodyme: АПРЕЛЬ 2026 (параллельно с dev)
- Devnet период: аудит идёт параллельно (6-8 недель)
- Mainnet только после audit sign-off
- Budget зарезервирован: $30K (ключевая статья)
```

**Hiring playbook:**
- Smart Contract Dev: Solana Developer Discord #jobs, Twitter/X #SolanaJobs
- Elixir Dev: Elixir Forum, remote-friendly (global pool)
- Screening: test task = "добавь одну инструкцию в наш Anchor program"

---

### 4. ❌ Юридика после запуска → ✅ Legal Gate ДО Mainnet

**Проблема:** Tier system ("лучшая цена для первых") выглядит как инвестиционное предложение.

**Решение:**

**Legal Gate — обязательный checkpoint перед Mainnet:**
```
Что нужно сделать ДО Mainnet launch:
□ Legal opinion: utility token классификация (письменное заключение)
□ Terms of Service review (убрать любой investment language)
□ Privacy Policy (GDPR-compliant)
□ Wyoming DAO LLC formation (или аналог)
□ KYC/AML policy документирование

Timeline: начало MAY 2026, завершение JUNE 2026
Budget: $8,000-12,000
Юрист: специализация Web3/crypto (Paradigm Legal, Debevoise, или boutique web3 firm)
```

**Переформулировка Tier System (убрать FOMO/investment language):**

❌ Было: "Первые 50 бэкеров → токены по лучшей цене (FOMO!)"

✅ Стало:
```
Early Supporter Allocation:
- First 50 backers: 1.0x token allocation ratio
- Next 200 backers: 0.67x token allocation ratio
- All others: 0.5x token allocation ratio

Disclosure (обязательно на UI): "Tokens are utility tokens providing
product access and governance rights. They are not investments,
do not represent equity, and carry no guarantee of financial return."
```

**Что не делать до получения legal opinion:**
- Не использовать слова: "invest", "return", "profit", "price will increase"
- Не обещать financial upside
- Не создавать secondary market до legal clearance


---

### 5. ❌ Нет плана runway → ✅ Financial Plan

**Проблема:** Revenue начинает течь с Q2, расходы с Day 1. Нужен runway на 6+ месяцев.

**Financial Runway Plan:**

```
Pre-revenue период: Апрель–Июнь 2026 (3 месяца)
Расходы: ~$15,000 (infra + part-time dev + legal start)

Источники runway:
1. Decentrathon hackathon prize: $5,000–$25,000 (target: выиграть)
2. Personal savings / friends & family: $10,000–$20,000
3. Solana Foundation Grant: $10,000–$50,000 (apply April 2026)
   → solana.org/grants — ecosystem grants для build на Solana
   → идеальный fit: AI + Solana, RU/KZ market
4. Angel round (опционально): $50,000–$100,000 SAFE (если нужно)
   → trigger: если после 3 месяцев runway < 3 месяцев

Target runway: $35,000–$45,000 (6 месяцев до breakeven)
```

**Revenue ramp (консервативный сценарий — 50% от base):**
```
Q2 2026: $15K revenue (25 campaigns vs 50 base)
Q3 2026: $50K revenue (75 campaigns vs 150 base)
Q4 2026: $120K revenue (150 campaigns vs 300 base)
Year 1 total: ~$200K (vs $396K base)
Breakeven: November 2026 (месяц 8)
```

**Break-even analysis:**
```
Monthly burn (Month 6+):
  Infrastructure:     $500
  Claude API:         $500
  Part-time dev:    $2,500
  Legal (ongoing):    $500
  Marketing:        $1,000
  Total:            $5,000/мес

Break-even revenue: $5,000/мес = ~33 milestone releases/мес
  (при avg $5K/milestone × 2.5% = $125 per release)
Achievable by Month 8 (November 2026) ✅
```

**Key action: Apply for Solana Foundation Grant в первую неделю после хакатона.**

---

### 6. ❌ Верификация ссылок уязвима → ✅ Evidence Ownership Verification

**Проблема:** Создатель может дать ссылку на чужой deploy или fake demo. AI не всегда распознает.

**Решение — многоуровневая верификация:**

**Phase 1 (хакатон/MVP) — AI-level check:**
```
Обновление AI prompt:
"Additionally, assess whether the submitted links appear to belong
to the same project/creator as described in the campaign.
Red flags: generic domains, other brands' dashboards,
stock demos, links that don't match campaign description."

AI добавляет в ответ: OWNERSHIP: LIKELY_VALID / SUSPICIOUS / UNVERIFIABLE
SUSPICIOUS → автоматически в Human Review Queue
```

**Phase 2 — Technical ownership verification:**
```
GitHub OAuth:
- Creator авторизуется через GitHub OAuth при submission
- Мы видим: username, repos list, org membership
- AI может сверить: repo в submission = repo creator'а ✅

Domain ownership (DNS TXT record):
- Creator добавляет в DNS: qadam-verify=campaign-{id}
- Мы проверяем программно перед AI evaluation

App Store:
- Creator вставляет в описание приложения: "Qadam Campaign: {campaign-id}"
- Скриншот как доказательство + manual spot check
```

**Phase 3 — On-chain identity:**
```
Интеграция с Civic Pass или World ID (Proof of Personhood)
Creator wallet = verified unique human
Значительно снижает incentive для fraud
```


---

## Обновлённая таблица рисков (заменяет секцию 14 в основном PRD)

| Риск | Вероятность | Impact | Митигация v1.1 |
|------|-------------|--------|----------------|
| AI неверное решение | Средняя | Высокий | Human Review Queue в Phase 1; Appeal mechanism от Day 1; Spot-check 20% решений еженедельно |
| Fraud / fake evidence | Средняя | Высокий | AI ownership check (v1); GitHub OAuth (v2); Civic Pass (v3); Creator security deposit |
| Smart contract exploit | Низкая | Критический | Audit (Ottersec) старт апрель 2026; Bug bounty; Staged rollout; $30K зарезервировано |
| AI wallet compromise | Низкая | Критический | Отдельный keypair; Minimal permissions; Instant revoke in Phoenix admin |
| Регуляторное давление (tokens) | Средняя | Высокий | Legal opinion ДО Mainnet; Utility-only language; DAO LLC формирование к июню 2026 |
| Cold start | Высокая | Средний | 0% fee для первых 20 creators; Solana Foundation Grant; White-glove onboarding |
| Runway закончится | Средняя | Критический | Hackathon prize + Grant + savings = 6+ мес runway; Conservative scenario +50% buffer |
| Solo founder bottleneck | Высокая | Высокий | Part-time SC dev с мая; Cursor/Claude как force multiplier; Строгий scope для хакатона |
| Solana network downtime | Низкая | Средний | Multi-RPC (Helius primary + Triton fallback); Status page; Graceful degradation |
| Claude API недоступен | Низкая | Средний | Oban retry queue; Human review fallback; SLA мониторинг |

---

## Обновлённый Roadmap (патч к секции 11)

### Добавленные milestones в Phase 1:

```
May 2026:
- [ ] Human Review Queue (admin panel для team)
- [ ] Appeal mechanism (creator side)
- [ ] GitHub OAuth для evidence verification
- [ ] Legal process START (параллельно с dev)
- [ ] Solana Foundation Grant application

June 2026:
- [ ] Legal opinion received
- [ ] ToS + Privacy Policy reviewed
- [ ] Wyoming DAO LLC formed (или аналог)
- [ ] Smart contract audit завершён
- [ ] MAINNET LAUNCH (после legal + audit ✅)
```

### Пересмотренный найм:
```
15 May 2026: Smart Contract Developer (part-time, Rust/Anchor)
01 Aug 2026: Community Manager (part-time)
01 Oct 2026: Elixir Backend Developer (full-time, если revenue позволяет)
```

---

## Итоговая оценка изменений

| Замечание | Статус | Решение |
|-----------|--------|---------|
| Human fallback в v1 | ✅ Принято | Human Review Queue + Appeal с Day 1 |
| Cold start план | ✅ Принято | Детальный bootstrap playbook + 0% fee incentive |
| Solo founder риск | ✅ Принято | Честный plan + Cursor/AI как force multiplier |
| Legal gate ДО launch | ✅ Принято | Legal checkpoint май-июнь 2026, обязателен |
| Financial runway | ✅ Принято | 3 источника, 6+ мес runway план |
| Evidence ownership | ✅ Принято | AI check (v1) → GitHub OAuth (v2) → Civic (v3) |

---

*Qadam PRD v1.1 Patch | 30 марта 2026*
*Читать вместе с: PRD-Qadam-Full-Product-2026-03-30.md*
*Следующий review: после первых 10 кампаний (июнь 2026)*
