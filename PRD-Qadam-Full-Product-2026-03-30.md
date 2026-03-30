# Qadam — Product Requirements Document
## Полноценный продукт v1.0

> **"Build step by step."**
> *Версия 1.0 | 30 марта 2026*

---

## 1. Executive Summary

**Qadam** — децентрализованная краудфандинговая платформа нового поколения на Solana.
Создатели получают финансирование поэтапно — только после того, как AI верифицирует реальный прогресс. Бэкеры становятся совладельцами проектов через токены, а не просто донорами.

### Ключевые цифры
| Метрика | Цель Year 1 |
|---------|-------------|
| GMV (объём транзакций) | $13.75M |
| Количество кампаний | 500 |
| Выручка платформы | $343K |
| Средний размер кампании | $27K |
| AI verification accuracy | >90% |

### Почему сейчас
- Краудфандинг-скамы: $500M+ потеряно бэкерами ежегодно
- Solana DeFi достиг зрелости: низкие комиссии, высокая скорость
- AI верификация (Claude API) доступна и надёжна
- Нет ни одного конкурента с milestone escrow + AI + token equity на Solana

---

## 2. Проблема и Рынок

### Проблема
Традиционный краудфандинг сломан фундаментально:

**Для создателей:**
- Нет доверия со стороны бэкеров ("а вдруг скам?")
- Высокие комиссии платформ (5-10%)
- Нет инструментов для построения community вокруг проекта
- Невозможно предложить финансовый upside бэкерам (только физические rewards)

**Для бэкеров:**
- Деньги уходят создателю сразу — без гарантий прогресса
- Нет финансового стимула (только "моральное удовлетворение")
- Нет прозрачности: непонятно на что тратятся деньги
- Нет механизма защиты при провале проекта

### Рынок

| Рынок | Размер | Рост |
|-------|--------|------|
| Global Crowdfunding (TAM) | $17.2B (2025) | 16% YoY |
| Crypto/Web3 Funding (SAM) | $3B+ | 35% YoY |
| IT/Startup on-chain funding (SOM) | $500M | — |

**Qadam target Year 1:** $13.75M GMV = 2.75% SOM

---

## 3. Решение и Value Proposition

### Как работает Qadam

```
Создатель описывает проект + roadmap из milestones
↓
Бэкеры вносят SOL → смарт-контракт (не создателю!)
Бэкеры получают токены проекта (совладельцы)
↓
Создатель выполняет milestone → загружает доказательства
↓
Claude AI верифицирует: APPROVED / REJECTED
↓
APPROVED → SOL автоматически переходит создателю
Qadam берёт 2.5% в момент release
↓
Если провал → бэкеры голосуют: продлить или refund
```

### Ключевые дифференциаторы

1. **Milestone Escrow** — деньги физически не могут уйти без доказательства прогресса
2. **AI Verification** — объективный, мгновенный, дешёвый арбитр
3. **Token Equity** — бэкеры становятся совладельцами, а не просто донорами
4. **Early Backer Tiers** — FOMO механика: первые получают лучшую цену токенов
5. **On-chain Transparency** — все решения, все транзакции — публично верифицируемы
6. **Permissionless** — любой в мире может создать кампанию или поддержать

---

## 4. Целевая Аудитория

### Персона 1: Indie Builder (Создатель)
**Имя:** Арман, 26 лет, Алматы
**Профиль:** Соло-разработчик, делает мобильное приложение для казахстанского рынка
**Боль:** Банк не даёт кредит без залога. Ангелы не смотрят на ранние стадии.
**Цель на Qadam:** Привлечь $15,000 за 3 milestone этапа
**Мотивация:** Получить деньги И сформировать community первых пользователей

### Персона 2: Startup Founder (Создатель)
**Имя:** Сергей, 31 год, Берлин
**Профиль:** Co-founder SaaS стартапа, есть MVP, нужен $50K на growth
**Боль:** YC reject, angels хотят equity что размывает cap table
**Цель на Qadam:** Привлечь капитал не размывая equity — токены отдельно от компании
**Мотивация:** Гибкое финансирование + crypto-community как early adopters

### Персона 3: Crypto Investor (Бэкер)
**Имя:** Дима, 28 лет, Москва
**Профиль:** Держит крипту, активен в Solana ecosystem
**Боль:** Все хорошие early-stage deals — закрытые раунды
**Цель на Qadam:** Получить токены перспективных проектов по лучшей цене
**Мотивация:** Финансовый upside + участие в развитии продукта

### Персона 4: Tech Enthusiast (Бэкер)
**Имя:** Анна, 24 года, Варшава
**Профиль:** Продакт-менеджер, верит в открытые проекты
**Боль:** Kickstarter не даёт ничего кроме физических наград
**Цель на Qadam:** Стать частью проекта в который верит
**Мотивация:** Community + токены как proof of early support


---

## 5. Конкурентный Анализ

| Платформа | Milestone Escrow | AI Верификация | Token Equity | On-chain | Comission |
|-----------|:----------------:|:--------------:|:------------:|:--------:|:---------:|
| **Qadam** | ✅ | ✅ | ✅ | ✅ Solana | 2.5% |
| Kickstarter | ❌ | ❌ | ❌ | ❌ | 5% + 3-5% |
| Indiegogo | ❌ | ❌ | ❌ | ❌ | 5% |
| Republic | ❌ | ❌ | ✅ equity | ❌ | 6% |
| Juicebox | Частично | ❌ | ✅ | ✅ ETH | ~0% |
| Mirror.xyz | ❌ | ❌ | ✅ | ✅ ETH | ~0% |
| Gitcoin | ❌ | ❌ | ❌ | ✅ | 0% |

**Вывод:** Qadam — единственный продукт объединяющий все четыре ключевых свойства.
Juicebox ближайший конкурент, но сложен в использовании и не имеет AI верификации.

---

## 6. Продукт — Полный Feature Set

### 6.1 Campaign Creation

**Creator заполняет:**
- Название, описание, категория
- Цель финансирования (SOL)
- 1–5 milestones: название, описание, сумма, дедлайн, критерии принятия
- Token configuration: название, ticker, total supply, % для бэкеров
- Campaign media: обложка, видео-питч, links

**Система валидации:**
- AI-assisted: при создании milestone, Claude предлагает чёткие критерии принятия
- Минимальная детализация milestone для публикации
- Автоматическая проверка: сумма milestones = цель

**Smart Contract деплой:**
- Создатель вносит security deposit (0.5% от цели) — возвращается при успехе
- Контракт деплоится on-chain
- Creator получает уведомление с адресом контракта и Explorer ссылкой

---

### 6.2 Campaign Discovery

**Главная страница:**
- Featured кампании (editorial picks)
- Trending (по объёму backing за 24ч)
- New Launches (последние 7 дней)
- Categories: Apps, Games, SaaS, Tools, Infrastructure

**Поиск и фильтры:**
- Поиск по названию / описанию
- Фильтр: категория, статус (active/completed), размер ($0-10K, $10-50K, $50K+)
- Фильтр: tier availability (есть ли ещё 1.0x места)
- Сортировка: trending, newest, ending soon, most backed

**Campaign Card показывает:**
- Название + краткое описание
- Progress bar (raised/goal)
- Текущий tier (🟢 1.0x | 🟡 1.5x | 🔴 2.0x)
- Количество бэкеров
- Следующий milestone deadline


---

### 6.3 Backing и Token Mechanics

**Early Backer Tier System:**
```
Tier 1 (Genesis):   первые 50 бэкеров  → токены × 1.0 (лучшая цена)
Tier 2 (Early):     следующие 200       → токены × 1.5
Tier 3 (Standard):  все остальные       → токены × 2.0
```
Счётчик видим на странице кампании в реальном времени. Создаёт FOMO.

**Backing flow:**
1. Выбрать сумму (минимум 0.1 SOL)
2. Увидеть: сколько токенов получишь по текущему tier
3. Нажать "Back This Project" → Phantom popup → подтвердить
4. SOL уходит в смарт-контракт
5. Токены минтятся и приходят на кошелёк бэкера автоматически

**Токен права:**
- Utility: ранний доступ к продукту когда запустится
- Governance: голосование за milestone extension / refund
- [v2] Whitelist на будущие токен-продажи проекта

**On-chain Backer NFT Badges (Metaplex):**
| Badge | Условие | Редкость |
|-------|---------|---------|
| Genesis Backer | Tier 1 бэкер | Редкий |
| Day One | Поддержал в первые 24ч | Редкий |
| Diamond Hands | Не продал токены до финального milestone | Легендарный |
| Top Supporter | Топ-3 бэкера по сумме | Уникальный |
| Streak Backer | Поддержал 5+ проектов | Необычный |

---

### 6.4 Milestone Verification System (Core)

**Submission flow:**
1. Creator открывает дашборд → milestone с истёкшим/активным дедлайном
2. Заполняет форму:
   - Что сделано (текст, 500-2000 символов)
   - Demo ссылки (live URL, video, app store, landing page)
   - Скриншоты / изображения (загружаются в IPFS)
   - Видео-демо (ссылка на YouTube/Loom)
   - PDF документы (финансовые отчёты, дизайн-доки)
   - GitHub ссылка [optional, bonus]
3. Submit → evidence hash записывается on-chain (timestamp + immutable proof)

**AI Verification Process:**
```
Evidence hash зафиксирован on-chain
↓
Elixir AI Agent получает событие через Solana WebSocket
↓
Формирует промпт для Claude:
- Оригинальное описание milestone
- Acceptance criteria
- Все доказательства
↓
Claude анализирует: APPROVED / REJECTED / PARTIAL
↓
APPROVED: AI agent подписывает release_milestone()
- SOL переходит создателю
- 2.5% Qadam fee удерживается автоматически
- On-chain лог: AI decision hash записывается

REJECTED: Создатель получает feedback
- Может переподать через 48ч

PARTIAL: UI показывает конкретно что не выполнено
- Creator исправляет и переподаёт
```

**AI Prompt Template:**
```
Role: You are a fair milestone evaluator for a blockchain crowdfunding platform.
Context: The creator committed to this milestone: [description]
Acceptance criteria: [criteria]
Evidence submitted:
- Text: [description]
- Links: [list]
- Files: [descriptions]

Evaluate strictly but fairly. Respond:
Line 1: APPROVED, REJECTED, or PARTIAL
Line 2-4: Explanation (what was done well, what is missing)
Be specific. The creator's funding depends on your decision.
```


---

### 6.5 Milestone Failure & Governance

**Если дедлайн прошёл без submission:**

**Шаг 1 — Grace Period (7 дней автоматически):**
- Creator получает уведомление
- Может сделать submission в grace period без объяснений

**Шаг 2 — Extension Request (если grace прошёл):**
- Creator запрашивает продление: причина + новая дата (+30 дней max)
- Запрос публикуется on-chain — видим всем бэкерам

**Шаг 3 — Backer Vote (7 дней):**
- Бэкеры голосуют своими токенами: "Продлить" / "Refund"
- Quorum: 30% токенов от общего в обращении
- Если quorum не набран → автоматически ПРОДЛИТЬ (benefit of doubt)

**Шаг 4 — Execution:**
- Большинство за продление → milestone продлевается на указанный срок
- Большинство за refund → автоматический proportional refund всем бэкерам
- Токены сжигаются пропорционально refund

---

### 6.6 Creator Dashboard

**Мои кампании:**
- Список всех кампаний с статусом
- Quick stats: raised, backers, next milestone deadline

**Детальная страница кампании:**
- Milestone timeline (completed ✅ / pending ⏳ / overdue ⚠️)
- Submit Evidence форма для текущего milestone
- AI feedback история (прошлые decisions)
- Backer list (анонимные адреса + суммы)
- Update feed (creator posts updates)
- Treasury баланс (сколько SOL осталось в контракте)

**Analytics [Pro tier]:**
- Backing dynamics (график по времени)
- Tier distribution (сколько в каком tier)
- Token holder map
- Conversion rate (просмотр → backing)
- Geographic distribution бэкеров

---

### 6.7 Backer Portfolio Dashboard

**Мои инвестиции:**
- Все проекты с суммой вложений
- Текущий статус каждого milestone
- Estimated token value (если есть secondary market)
- Unrealized P&L (если токены изменились в цене)

**Notifications:**
- Milestone submitted (creator надо верифицировать)
- Milestone APPROVED / REJECTED
- Milestone overdue → extension request
- Vote reminder (osталось X дней)
- Campaign update от creator

**NFT Badge Collection:**
- Галерея полученных badges
- Sharable card для Twitter/X

**Referral:**
- Уникальная реф-ссылка
- Статистика: сколько привёл, сколько заработал бонус-токенов

---

### 6.8 Creator Profile & On-chain Reputation

**Публичный профиль:**
- Wallet address (или ENS-like Solana Name Service)
- Аватар + bio
- Портфолио кампаний: успешные / в процессе / провалившиеся
- On-chain Reputation Score (0-100):

**Reputation Score расчёт:**
```
+30 pts  за каждый выполненный milestone в срок
+20 pts  за успешно завершённую кампанию
+10 pts  за каждые 100 бэкеров
-20 pts  за каждый пропущенный milestone без extension request
-30 pts  за refund (провал проекта)
```
Высокий score → featured placement + доступ к larger campaigns.


---

## 7. Бизнес-модель и Монетизация

### Модель 1 (Primary): Success Fee — 2.5%
Берётся автоматически смарт-контрактом в момент каждого milestone release.

```
Пример: кампания на $30,000 (≈500 SOL), 3 milestones
Milestone 1: $10,000 released → Qadam: $250
Milestone 2: $10,000 released → Qadam: $250
Milestone 3: $10,000 released → Qadam: $250
Итого с одной кампании: $750
```

**Почему 2.5%:**
- Kickstarter берёт 5% + 3-5% payment processing = 8-10%
- 2.5% — значительно дешевле
- Aligned incentives: Qadam зарабатывает только когда создатель зарабатывает
- При $13.75M GMV → $343K revenue Year 1

---

### Модель 2 (Secondary): Premium Creator Tiers

| Tier | Цена | Лимит кампании | Доп. функции |
|------|------|---------------|--------------|
| **Free** | $0 | до $25K | Базовый AI, стандартный placement |
| **Pro** | $49/мес | до $150K | Analytics dashboard, Featured placement, Priority AI |
| **Studio** | $199/мес | Unlimited | White-label, B2B API access, Dedicated support, Multi-campaign |

**Прогноз Year 1:**
- 50 Pro subscribers × $49 × 12 = $29K
- 10 Studio subscribers × $199 × 12 = $24K
- Subtotal: $53K/year

---

### Модель 3 (Future v2): B2B API

Accelerators, VC firms, corporate innovation programs — интегрируют Qadam
milestone verification protocol в свои платформы.

```
API Subscription: $500-2000/мес
Use case: accelerator проводит program, хочет milestone-based выплаты
```

---

### Модель 4 (Future v3): QADAM Platform Token

Governance token платформы.
- Staking rewards из protocol fees
- Voting: параметры платформы, новые features, fee structure
- Creator incentives: скидки на fees за QADAM staking
- Launch: после достижения $5M GMV и смарт-контракт audit

---

### Revenue Projections

| Период | Кампании | GMV | Success Fee | Premium | Total Revenue |
|--------|----------|-----|-------------|---------|---------------|
| Q2 2026 | 50 | $1M | $25K | $5K | $30K |
| Q3 2026 | 150 | $3.75M | $93K | $12K | $105K |
| Q4 2026 | 300 | $9M | $225K | $21K | $246K |
| **Year 1** | **500** | **$13.75M** | **$343K** | **$53K** | **$396K** |
| Year 2 | 1,500 | $45M | $1.1M | $180K | $1.3M |
| Year 3 | 4,000 | $120M | $3M | $500K | $3.5M |


---

## 8. Go-to-Market Strategy

### Phase 1 — Community First (Апрель–Июнь 2026)

**Цель:** 10 успешных кампаний как proof of concept

**Тактики:**
- Выступление на Decentrathon с победой → immediate credibility в Solana CIS
- Ручной outreach: Solana KZ/RU Discord, CIS Web3 Telegram, CIS Indie Devs
- Первые 10 создателей — white glove onboarding (помогаем создать кампанию лично)
- AMA в Discord: "Как Qadam решает проблему скама на Kickstarter"
- Twitter/X threads: "Почему AI-verified crowdfunding — следующий шаг"

**KPI Phase 1:**
- 10 активных кампаний
- $200K GMV
- 500 уникальных пользователей (wallet connections)

---

### Phase 2 — Growth (Июль–Сентябрь 2026)

**Цель:** 50+ кампаний, $1M GMV, выход за СНГ

**Тактики:**
- Product Hunt launch (подготовить за 2 недели, запустить во вторник)
- IndieHackers.com: написать story "How we raised $50K through milestone-based crowdfunding"
- Партнёрства: 2-3 Solana ecosystem проектов (cross-promotion)
- Creator ambassador program: успешные создатели рекомендуют Qadam
- PR pitch в Decrypt, The Block, Cointelegraph: "AI-verified crowdfunding на Solana"
- Hackathon sponsorship: быть партнёром других web3 хакатонов

**KPI Phase 2:**
- 50 кампаний (total)
- $1M GMV
- 5,000 уникальных пользователей
- 1 крупный медиа материал

---

### Phase 3 — Scale (Октябрь 2026 – Март 2027)

**Цель:** 200+ кампаний, $5M GMV, B2B первые клиенты

**Тактики:**
- B2B: pitch accelerators (AIFC Astana, Ала-Тоо digital, Turkish tech hubs)
- Referral program: платим бонус-токены за приведённых создателей
- Creator grants: Qadam Treasury оплачивает первый month Pro для top creators
- Ecosystem integrations: Jupiter, Raydium (Solana DeFi) — cross-promotion
- Regional events: присутствие на Web3 Summit Astana, CIS Blockchain Week

**KPI Phase 3:**
- 200 кампаний (total)
- $5M GMV
- 3 B2B clients
- $1M ARR run-rate

---

## 9. Полная Техническая Архитектура

### System Overview

```
┌─────────────────────────────────────────────────────────┐
│                     QADAM PLATFORM                       │
├─────────────┬───────────────────┬───────────────────────┤
│   Frontend   │    Backend        │    Blockchain         │
│  (Next.js)  │  (Elixir/Phoenix) │    (Solana)          │
│             │                   │                        │
│  Campaign   │  REST API         │  Anchor Program       │
│  Discovery  │  Phoenix Channels │  SPL Token            │
│  Dashboard  │  AI Agent         │  Metaplex NFT         │
│  Portfolio  │  Event Listener   │                        │
│  Wallet UI  │  PostgreSQL       │                        │
└─────────────┴───────────────────┴───────────────────────┘
         │              │                   │
    Phantom/         Claude API         Solana RPC
    Solflare         (Anthropic)        (Helius/Triton)
```

### Blockchain Layer (Solana)

```
Network:          Solana Mainnet (Devnet для тестов)
Framework:        Anchor (Rust)
Token:            SPL Token Program
NFT:              Metaplex Core [v2]
RPC Provider:     Helius или Triton (premium RPCs)
Fee buffer:       Priority fees для Solana congestion
```

**Anchor Program Instructions:**
```rust
create_campaign(title, goal, milestones[], token_config, deposit)
update_campaign(campaign_id, updates)          // до начала funding
back_campaign(campaign_id, amount)             // минт токенов автоматически
submit_milestone(campaign_id, idx, evidence_hash)
release_milestone(campaign_id, idx)            // ТОЛЬКО AI agent wallet
request_extension(campaign_id, idx, reason, new_deadline)
vote_extension(campaign_id, idx, approve)
execute_extension_result(campaign_id, idx)     // callable после voting period
refund_backers(campaign_id)                    // при провале
claim_creator_fee(campaign_id)                 // creator security deposit return
```


### Backend (Elixir/Phoenix)

```
Language:     Elixir 1.17+
Framework:    Phoenix 1.7+ (REST API + WebSockets)
Database:     PostgreSQL 16 (кэш состояния, analytics)
Cache:        Redis (sessions, real-time counters)
Job Queue:    Oban (background jobs, retries)
File Storage: AWS S3 / Cloudflare R2 (images, files)
IPFS:         Pinata / Web3.Storage (decentralized evidence storage) [v2]
Email:        Resend (transactional)
Monitoring:   Fly.io metrics + Sentry
Deploy:       Fly.io (auto-scaling)
```

**Phoenix Modules:**
```
Qadam.Campaigns        — CRUD, discovery, search
Qadam.Milestones       — submission, status tracking
Qadam.Backers          — positions, token calculations
Qadam.AIAgent          — GenServer, Claude integration
Qadam.SolanaListener   — WebSocket RPC event subscriptions
Qadam.Notifications    — email + push (Expo для mobile v2)
Qadam.Analytics        — events tracking, dashboards
Qadam.Auth             — wallet signature verification (SIWS)
```

### Frontend (Next.js)

```
Framework:    Next.js 15 App Router
Styling:      TailwindCSS 4 + shadcn/ui
Animation:    Framer Motion
Web3:         @solana/web3.js v2 + @solana/wallet-adapter
Wallets:      Phantom, Solflare, Backpack
State:        Zustand (client) + React Query (server state)
Forms:        React Hook Form + Zod validation
Icons:        Lucide React
Charts:       Recharts (analytics dashboards)
Upload:       uploadthing (file uploads)
Deploy:       Vercel
```

**Страницы / роуты:**
```
/                          Landing + Discover
/campaign/[id]             Campaign detail page
/campaign/[id]/back        Backing flow
/create                    Campaign creation wizard (5 steps)
/dashboard                 Creator dashboard
/dashboard/[id]            Specific campaign management
/portfolio                 Backer portfolio
/profile/[wallet]          Public creator profile
/admin                     Internal admin panel
```

### AI Agent Architecture (Elixir GenServer)

```elixir
defmodule Qadam.AIAgent do
  use GenServer

  # Lifecycle:
  # 1. Подписка на Solana events через WebSocket RPC
  # 2. При MilestoneSubmitted event → verify_milestone/2
  # 3. Claude API call с полным контекстом
  # 4. Parse response → APPROVED/REJECTED/PARTIAL
  # 5. APPROVED → sign_and_broadcast release_milestone()
  # 6. Log decision on-chain + in PostgreSQL

  # Security:
  # - AI wallet keypair в environment variables (never in code)
  # - Rate limit: 1 verification per milestone per hour
  # - Fallback: manual review queue если Claude недоступен
  # - Decision audit: всё логируется с hash

  # Retry logic:
  # - Claude API timeout → retry 3 раза с exponential backoff
  # - Solana RPC timeout → Oban job queue с retries
  # - Failed broadcast → alert + manual queue
end
```


### Полная Data Model (PostgreSQL)

```sql
-- Кампании
campaigns (
  id uuid PK,
  solana_pubkey varchar UNIQUE,
  creator_wallet varchar,
  title varchar,
  description text,
  category varchar,
  cover_image_url varchar,
  pitch_video_url varchar,
  goal_sol decimal,
  raised_sol decimal DEFAULT 0,
  backers_count integer DEFAULT 0,
  token_mint_address varchar,
  reputation_required integer DEFAULT 0,
  status campaign_status, -- draft|active|completed|refunded|paused
  featured boolean DEFAULT false,
  created_at timestamptz,
  funded_at timestamptz,
  completed_at timestamptz
)

-- Milestones
milestones (
  id uuid PK,
  campaign_id uuid FK,
  index integer,
  title varchar,
  description text,
  acceptance_criteria text,
  amount_sol decimal,
  deadline timestamptz,
  grace_deadline timestamptz,
  extension_deadline timestamptz,
  status milestone_status, -- pending|submitted|approved|rejected|failed|extended
  evidence_text text,
  evidence_links jsonb,
  evidence_files jsonb,
  evidence_hash varchar,
  ai_decision ai_decision_type,
  ai_explanation text,
  ai_decision_hash varchar,
  ai_solana_tx varchar,
  submitted_at timestamptz,
  decided_at timestamptz,
  released_at timestamptz
)

-- Позиции бэкеров
backer_positions (
  id uuid PK,
  campaign_id uuid FK,
  wallet_address varchar,
  amount_sol decimal,
  tokens_received decimal,
  tier smallint,
  referral_code varchar,
  backed_at timestamptz
)

-- Голосования по extension
extension_votes (
  id uuid PK,
  milestone_id uuid FK,
  voter_wallet varchar,
  token_weight decimal,
  vote boolean, -- true=extend, false=refund
  voted_at timestamptz
)

-- AI Decisions Log
ai_decisions (
  id uuid PK,
  milestone_id uuid FK,
  prompt_hash varchar,
  response_hash varchar,
  decision varchar,
  explanation text,
  claude_model varchar,
  latency_ms integer,
  solana_tx_signature varchar,
  created_at timestamptz
)

-- Creator Reputation
creator_reputation (
  id uuid PK,
  wallet_address varchar UNIQUE,
  score integer DEFAULT 50,
  milestones_on_time integer DEFAULT 0,
  milestones_late integer DEFAULT 0,
  campaigns_completed integer DEFAULT 0,
  campaigns_refunded integer DEFAULT 0,
  updated_at timestamptz
)

-- Platform Analytics Events
analytics_events (
  id uuid PK,
  event_type varchar,
  wallet_address varchar,
  campaign_id uuid,
  properties jsonb,
  created_at timestamptz
)
```


---

## 10. Дизайн-система Qadam

### Brand Identity

```
Название:    Qadam (قدم — шаг, тюркск.)
Tagline:     "Build step by step."
Tone:        Уверенный, builder-first, честный, не корпоративный
Voice:       "Для тех кто делает, а не только мечтает"
```

### Цветовая палитра

```
Primary    #0F1724   Deep Navy        — доверие, серьёзность
Accent     #F5A623   Amber            — milestone released, энергия, деньги
Success    #22C55E   Green            — APPROVED, success states
Warning    #F59E0B   Yellow           — overdue, pending vote
Error      #EF4444   Red              — REJECTED, critical alerts
Surface    #FAFAF8   Off-White        — backgrounds, cards
Muted      #6B7280   Gray             — secondary text, borders
```

### Типографика

```
Display:    Satoshi Bold (логотип, hero заголовки)
Headings:   Satoshi Medium (h1-h3)
Body:       Inter Regular (основной текст)
Mono:       Geist Mono (адреса кошельков, хэши, код)
```

### Логотип

```
Wordmark: "Qadam"
Стилизация: буква Q — кружок с маленькой точкой внутри
             точка внутри Q = milestone (этап на пути)
Варианты: light / dark / monochrome
Без отдельной иконки — только wordmark
```

### Компоненты (shadcn/ui base)

```
CampaignCard      — карточка кампании в discovery
MilestoneTimeline — визуал прогресса кампании
TierBadge         — текущий tier (Amber/Yellow/Gray)
AIDecisionBanner  — APPROVED / REJECTED с объяснением
BackerBadge       — NFT badge визуализация
ProgressBar       — raised/goal с анимацией
WalletButton      — connect/disconnect с avatar
EvidenceUploader  — drag-and-drop форма доказательств
```

---

## 11. Roadmap 18 месяцев

### Phase 0 — Хакатон (Апрель 2026)
- [x] Anchor program: create, back, submit, release
- [x] AI Agent: Claude верификация + подпись транзакции
- [x] Frontend: Landing, Campaign, Dashboard, Submit Evidence
- [x] Phantom wallet integration
- [x] Solana Devnet deploy
- [x] Demo flow для судей

### Phase 1 — MVP Launch (Май–Июль 2026)
- [ ] Security deposit для создателей
- [ ] Full token mechanics (тiers on-chain)
- [ ] Metaplex NFT Badges
- [ ] Creator Profile + Reputation Score
- [ ] Governance voting (milestone extension)
- [ ] IPFS для file evidence uploads
- [ ] Notification система (email + in-app)
- [ ] Campaign Updates (creator posts)
- [ ] Search & Filter discovery
- [ ] Referral система
- [ ] Mainnet deploy + Smart Contract Audit
- [ ] 10 beta кампаний (ручной onboarding)

### Phase 2 — Growth (Август–Октябрь 2026)
- [ ] Analytics dashboard (Pro feature)
- [ ] Premium tiers (Pro $49, Studio $199)
- [ ] Creator ambassador program
- [ ] Product Hunt launch
- [ ] Featured campaigns editorial
- [ ] Social sharing (sharable campaign/badge cards)
- [ ] Mobile responsive (PWA)
- [ ] 50 total campaigns target

### Phase 3 — Scale (Ноябрь 2026 – Март 2027)
- [ ] B2B API (accelerator integrations)
- [ ] Mobile app (React Native)
- [ ] Multi-sig для кампаний >$100K
- [ ] Secondary token market (AMM integration)
- [ ] AI appeal mechanism (человек-арбитр для disputed cases)
- [ ] KYC для крупных кампаний (>$50K)
- [ ] 200+ total campaigns

### Phase 4 — Expansion (Q2 2027+)
- [ ] QADAM platform governance token
- [ ] Multi-chain expansion (Base, Arbitrum)
- [ ] Physical goods campaigns (hardware, merch)
- [ ] Non-IT categories (creative projects, social initiatives)
- [ ] VC / accelerator integrations (deal flow)
- [ ] 1000+ кампаний/год


---

## 12. Команда и Ресурсы

### Текущая команда
| Роль | Кто | Status |
|------|-----|--------|
| Founder / Product / Frontend | Кхаким | ✅ Full-time |
| Elixir Backend | Кхаким / найм | 🔍 Найм Q2 2026 |
| Smart Contract (Rust/Anchor) | External / найм | 🔍 Найм Q2 2026 |
| Community Manager | — | 🔍 Найм Q3 2026 |

### Внешние Партнёры
| Сервис | Назначение | Стоимость |
|--------|-----------|-----------|
| Ottersec / Neodyme | Smart Contract Audit | $25-50K (one-time) |
| Legal Advisor (Wyoming DAO LLC) | Юридическая структура | $8-12K |
| Helius | Solana RPC | $200-500/мес |
| Anthropic | Claude API | ~$0.01/verification |

### Операционные расходы Year 1
| Статья | Мес | Год |
|--------|-----|-----|
| Infrastructure (Fly.io, Vercel, R2) | $500 | $6K |
| Solana RPC (Helius) | $300 | $3.6K |
| Claude API (Anthropic) | $200 → $2K | $12K |
| Email (Resend) | $50 | $600 |
| Smart Contract Audit | — | $35K |
| Legal (DAO LLC) | — | $10K |
| Marketing / Events | $2K | $24K |
| **Total** | | **~$91K** |

---

## 13. Юридические Аспекты

### Структура

**Рекомендуемая форма:** Wyoming DAO LLC или Marshall Islands DAO LLC
- Юридически признанный статус для DAO
- Liability protection для участников
- Гибкость в governance через токены

### Токены — Правовой статус

**SPL Utility + Governance токены = НЕ securities если:**
- Нет прямого права на прибыль компании
- Нет гарантии финансового возврата
- Токены дают доступ к сервису (utility) и право голоса (governance)
- Кампания не рекламируется как "инвестиция"

**Что РАЗРЕШЕНО:**
- Utility: "токены дают ранний доступ к продукту когда он запустится"
- Governance: "держатели голосуют за extension milestones"

**Что ЗАПРЕЩЕНО без регуляторного одобрения:**
- Revenue share: "держатели получают % от прибыли проекта"
- Implied financial return: "цена токенов будет расти"

**Mitigation:**
- Terms of Service явно указывают: токены не являются инвестицией
- No revenue share в v1/v2 (только utility + governance)
- Revenue share → v3 с юридической консультацией

### KYC / AML

| Размер кампании | Требования |
|----------------|-----------|
| < $10,000 | Только wallet verification (on-chain identity) |
| $10,000 - $50,000 | Email верификация + creator profile |
| > $50,000 | KYC через third-party (Persona / Sumsub) |

**Backers:** Permissionless (как Uniswap) — без KYC.

---

## 14. Риски и Митигация

| Риск | Вероятность | Impact | Митигация |
|------|------------|--------|-----------|
| AI неверное решение | Средняя | Высокий | Evidence hash on-chain, appeal mechanism, human review queue |
| Smart contract exploit | Низкая | Критический | Formal audit (Ottersec), bug bounty program, staged rollout |
| AI wallet compromise | Низкая | Критический | Отдельный keypair, минимальные права, instant revoke mechanism |
| Регуляторное давление | Средняя | Высокий | Utility-only tokens, DAO LLC, legal advisory |
| Cold start (нет кампаний) | Высокая | Средний | 10 ручных кампаний, creator grants, ambassador program |
| Solana network downtime | Низкая | Средний | Multi-RPC providers, graceful degradation, status page |
| Creator fraud | Средняя | Средний | On-chain reputation, KYC для крупных, community reporting |
| Claude API недоступен | Низкая | Средний | Fallback manual review queue, Oban retry jobs |
| Competition | Средняя | Средний | First mover на Solana, community moat, token network effects |


---

## 15. KPI и Метрики

### Product KPIs (еженедельно)

| Метрика | Цель Q2 2026 | Цель Q4 2026 |
|---------|-------------|-------------|
| Active campaigns | 10 | 100 |
| GMV (SOL) | 5,000 SOL | 50,000 SOL |
| Unique wallet connections | 500 | 10,000 |
| Campaign success rate | >60% | >70% |
| Avg milestones/campaign | 2.5 | 3 |
| AI verification time | <60s | <30s |
| AI accuracy (human review spot check) | >85% | >92% |
| Backer return rate | — | >30% |

### Business KPIs (ежемесячно)

| Метрика | Цель |
|---------|------|
| Monthly Revenue | $30K (Q2) → $80K (Q4) |
| Take rate (actual) | 2.5% of GMV |
| CAC (creator) | <$50 |
| LTV (creator, avg 3 campaigns) | >$2,250 |
| LTV/CAC ratio | >45x |
| Pro/Studio conversion | >10% active creators |

### Milestones для Инвесторов

| Milestone | Metric | Timeline |
|-----------|--------|----------|
| Product-Market Fit | 10 успешных кампаний | Июнь 2026 |
| Initial Traction | $1M GMV | Сентябрь 2026 |
| Revenue | $30K/мес MRR | Декабрь 2026 |
| Scale | $5M GMV | Март 2027 |
| Platform | $1M ARR | Июнь 2027 |

---

## 16. Операционная Модель

### Release Process

**Smart Contract Changes:**
1. Код review (internal + external)
2. Anchor tests (100% coverage)
3. Devnet deploy + testing
4. External audit review
5. Staged Mainnet deploy (небольшие кампании первые)

**AI Agent Updates:**
1. Prompt изменения тестируются на synthetic dataset
2. A/B тест на 10% трафика
3. Human review sample (20 decisions/неделю)
4. Rollback план если accuracy падает

**Frontend Deploys:**
- CI/CD через GitHub Actions → Vercel
- Feature flags для постепенного rollout
- Monitoring через Sentry + Fly.io

---

## 17. Хакатонный Scope (Для справки)

*Что реализуется за 7 дней для демонстрации:*

**In Scope:**
- Anchor program: create_campaign, back_campaign, submit_milestone, release_milestone
- AI Agent (Elixir): Claude API + sign transaction
- Frontend: Landing, Campaign, Creator Dashboard, Submit Evidence form
- Phantom wallet integration
- Solana Devnet

**Out of Scope (v2+):**
- Token tiers и NFT badges
- Governance voting
- File uploads (только текст + links)
- Premium tiers
- Analytics
- Creator reputation
- Notifications
- Mobile

---

## Appendix A — Глоссарий

| Термин | Определение |
|--------|-------------|
| Milestone | Конкретный этап проекта с описанием, суммой и дедлайном |
| Evidence | Доказательства выполнения milestone (текст, ссылки, файлы) |
| AI Agent | Автономный Elixir процесс который вызывает Claude API и подписывает транзакции |
| Release | Автоматический перевод SOL создателю после AI APPROVED |
| Tier | Ценовой уровень для ранних бэкеров (1.0x, 1.5x, 2.0x) |
| GMV | Gross Merchandise Volume — общий объём SOL через платформу |
| Reputation Score | On-chain метрика надёжности создателя (0-100) |

## Appendix B — Технические Зависимости

```
Solana:    >=1.18
Anchor:    >=0.30
Elixir:    >=1.17
Phoenix:   >=1.7
Next.js:   >=15.0
Node.js:   >=22.0
PostgreSQL: >=16
```

---

*Qadam — Build step by step.*
*Версия 1.0 | 30 марта 2026*
*Следующий review: после хакатона (апрель 2026)*
