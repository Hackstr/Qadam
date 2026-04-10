# Qadam Admin Panel — Design Specification

> Полноценная админка для управления платформой, мониторинга AI pipeline,
> модерации контента и работы с пользователями.

---

## Навигация

Левый сайдбар (collapsible) с разделами:

```
[Qadam Admin]

  Overview          — главный дашборд
  Review Queue      — milestone'ы на ручной проверке
  Campaigns         — все кампании
  Milestones        — все milestone'ы и AI decisions
  Users             — пользователи и reputation
  Governance        — активные голосования
  AI Analytics      — производительность AI pipeline
  Audit Log         — полный лог всех изменений
  Settings          — настройки платформы
```

---

## 1. Overview (Dashboard)

Главная страница — snapshot состояния платформы за один взгляд.

### Верхний ряд — ключевые метрики (6 карточек)

| Метрика | Откуда | Формат |
|---------|--------|--------|
| Active Campaigns | campaigns where status = "active" | число |
| Total Raised | sum(raised_lamports) / 1e9 | "X.XX SOL" |
| Total Backers | sum(backers_count) | число |
| Pending Reviews | milestones where status = "under_human_review" | число + badge если > 0 |
| Success Rate | completed / (completed + refunded) * 100 | "XX%" |
| AI Accuracy | approved decisions / total decisions * 100 | "XX%" |

### Средний ряд — графики (2 колонки)

**Левый — "Platform Activity" (line chart):**
- X: последние 30 дней
- Y1: новые кампании (по дню)
- Y2: новые бэкинги (по дню)
- Данные: group by date из campaigns.inserted_at и backer_positions.inserted_at

**Правый — "Fund Flow" (bar chart):**
- X: последние 30 дней
- Y: SOL released (из milestones where status = "approved", group by released_at)
- Overlay: SOL refunded

### Нижний ряд — "Needs Attention" (таблица)

Показывает items требующие действий:
- Milestones в "under_human_review" (кликабельно → Review Queue)
- Campaigns с overdue milestones (deadline < now, status = "pending")
- Milestones в "ai_processing" дольше 5 минут (pipeline может быть stuck)

Каждый item: campaign title, milestone #, время ожидания, кнопка действия.

---

## 2. Review Queue (расширенная версия текущей)

Текущая страница `/admin` — только approve/reject. Расширяем:

### Карточка milestone'а

```
┌─────────────────────────────────────────────────────┐
│ [Campaign Title]  →  Milestone 2: "Beta Launch"     │
│ Creator: 4xK2..9nFz (display_name if exists)        │
│ Reputation: 72/100  ●●●●●●●○○○                      │
│ Status: Under Human Review  |  Submitted: 2h ago    │
├─────────────────────────────────────────────────────┤
│                                                     │
│ ACCEPTANCE CRITERIA:                                │
│ "Working demo at URL, 100+ test users, analytics"   │
│                                                     │
│ EVIDENCE:                                           │
│ Creator submitted:                                  │
│ "Deployed beta at app.example.com, 150 users        │
│  signed up in first week. See analytics below."     │
│                                                     │
│ Links:                                              │
│   • https://app.example.com                         │
│   • https://analytics.example.com/dashboard         │
│                                                     │
│ FILES: (если IPFS подключён)                         │
│   • screenshot-analytics.png [View]                 │
│   • user-feedback.pdf [View]                        │
│                                                     │
├─────────────────────────────────────────────────────┤
│ AI ASSESSMENT:                                      │
│ Decision: PARTIAL (confidence: medium)               │
│ "The demo URL works and shows a functional app.     │
│  However, I could not independently verify the      │
│  claimed 150 users from the provided screenshot.    │
│  The analytics dashboard requires authentication."  │
│                                                     │
│ Model: claude-sonnet-4-20250514                     │
│ Latency: 4.2s                                       │
├─────────────────────────────────────────────────────┤
│ STATE HISTORY:                                      │
│ pending → submitted (Apr 5, 14:20)                  │
│ submitted → ai_processing (Apr 5, 14:20)            │
│ ai_processing → under_human_review (Apr 5, 14:21)   │
├─────────────────────────────────────────────────────┤
│ ADMIN NOTES: (textarea — сохраняется в metadata)     │
│ [_______________________________________________]    │
│                                                     │
│ [Approve]  [Reject]  [Request More Evidence]         │
└─────────────────────────────────────────────────────┘
```

### Новые actions:

- **Approve** — release_milestone on-chain (как сейчас)
- **Reject** — admin_override_decision с rejected (как сейчас)
- **Request More Evidence** — новый: меняет статус на "rejected" с metadata "needs_more_evidence: true", creator видит сообщение и может переподать. Не наказывает reputation.

### Фильтры:

- По campaign
- По дате submitted
- Сортировка: oldest first (default), newest first

---

## 3. Campaigns

Полный список всех кампаний с управлением.

### Таблица

| Колонка | Сортировка | Фильтр |
|---------|-----------|--------|
| Title (+ cover thumbnail) | — | search |
| Creator (wallet / display_name) | — | — |
| Status | yes | dropdown: all/active/completed/refunded/paused/cancelled |
| Category | yes | dropdown |
| Goal | yes | — |
| Raised | yes | — |
| Backers | yes | — |
| Milestones (approved/total) | — | — |
| Created | yes | date range |
| Featured | — | toggle |

### Действия (row actions):

- **View Details** — открывает detail panel (slide-over или отдельная страница)
- **Toggle Featured** — ставит/снимает featured badge (уже есть endpoint)
- **Pause Campaign** — меняет status на "paused" (нужен новый endpoint)
- **Resume Campaign** — меняет status обратно на "active"

### Campaign Detail Panel

Показывает:
- Все поля кампании
- Milestone timeline с полными данными (acceptance criteria, evidence, AI decisions)
- Список backers (wallet, amount, tier, tokens claimed/allocated, refund status)
- Campaign updates (creator posts)
- On-chain data link (Solana Explorer)

---

## 4. Milestones

Глобальный вид ВСЕХ milestone'ов по всем кампаниям.

### Таблица

| Колонка | Фильтр |
|---------|--------|
| Campaign | search |
| Milestone # | — |
| Title | — |
| Status | dropdown (все 11 статусов) |
| AI Decision | dropdown: none/approved/rejected/partial |
| Amount (SOL) | — |
| Deadline | date range |
| Submitted At | date range |
| Decided At | date range |
| AI Latency | — |

### Ключевые views (preset фильтры):

- **Stuck in AI** — status = "ai_processing" и submitted_at > 5 мин назад
- **Overdue** — status = "pending" и deadline < now
- **Past Grace** — status in ["pending", "grace_period"] и grace_deadline < now
- **Recently Decided** — decided_at в последние 24 часа

### Milestone Detail

- Все поля milestone'а
- Evidence: text, links, files
- AI Decision: decision, explanation, model, latency, tx signature
- State Transitions: полная история переходов с timestamps
- Acceptance Criteria vs Evidence — side-by-side view для быстрого ревью

---

## 5. Users

### Таблица

| Колонка | Фильтр |
|---------|--------|
| Wallet | search |
| Display Name | search |
| Email | — |
| Reputation Score | range slider |
| Campaigns Created | sort |
| Total Backed (SOL) | sort |
| GitHub Verified | toggle |
| Joined | date range |

### User Detail

- Profile info (wallet, name, email, avatar)
- Reputation breakdown:
  - Score: 72/100
  - Milestones on time: 5
  - Milestones late: 1
  - Campaigns completed: 2
  - Campaigns refunded: 0
- Created campaigns (список)
- Backed campaigns (список с amounts)
- Notification preferences
- Actions:
  - **Adjust Reputation** — ручная корректировка score с причиной (сохраняется в audit)
  - **Verify GitHub** — ручная верификация (если OAuth не прошёл)

---

## 6. Governance

Все активные и прошедшие голосования.

### Active Votes

Для каждого milestone с status = "voting_active" или "extension_requested":

```
┌─────────────────────────────────────────────────────┐
│ [Campaign] → Milestone 3: "Mainnet Deploy"          │
│ Creator requested 14-day extension                   │
│ Voting ends: Apr 20, 2026 (5 days left)             │
├─────────────────────────────────────────────────────┤
│                                                     │
│ FOR EXTENSION: ████████████░░░░░  68%               │
│ FOR REFUND:    ░░░░░░░░░░░░█████  32%               │
│                                                     │
│ Quorum: 23% (met, need 20%)                         │
│ Total votes: 12 / 45 eligible backers               │
│                                                     │
│ Individual votes:                                    │
│ • 4xK2..9nFz  —  Extend  —  1,200 tokens (cap: 240)│
│ • 8jR1..2mPq  —  Refund  —  800 tokens  (cap: 160) │
│ • ...                                               │
├─────────────────────────────────────────────────────┤
│ [Force Execute] [Extend Voting Period]               │
└─────────────────────────────────────────────────────┘
```

### Voting History

Таблица прошедших голосований:
- Campaign, Milestone, Result (extended/refunded), Quorum reached, Total votes, Date

---

## 7. AI Analytics

Мониторинг производительности AI pipeline.

### Метрики (верхний ряд)

| Метрика | Описание |
|---------|----------|
| Total Decisions | все AI decisions за период |
| Approval Rate | approved / total |
| Partial Rate | partial / total (сколько уходит на human review) |
| Avg Latency | среднее время от submitted → decided |
| Pipeline Health | stuck jobs count (ai_processing > 5 min) |

### Графики

**Decision Distribution (pie chart):**
- Approved: X%
- Rejected: Y%
- Partial (Human Review): Z%

**Latency Over Time (line chart):**
- X: дни
- Y: avg latency (ms)
- Показывает тренд — если latency растёт, pipeline деградирует

**Decision by Campaign Category (stacked bar):**
- Как AI решает по разным категориям
- Может показать что для определённых категорий AI чаще сомневается

### Recent Decisions (таблица)

| Campaign | Milestone | Decision | Explanation (truncated) | Latency | Model | Date |
|----------|-----------|----------|------------------------|---------|-------|------|

Кликабельно → полный AI decision detail.

---

## 8. Audit Log

Полный immutable лог всех действий в системе.

### Источники данных:

1. **Milestone State Transitions** — from_state → to_state, metadata, timestamp
2. **AI Decisions** — каждое решение AI с хешами
3. **Admin Actions** — approve/reject (через metadata в transitions)

### Таблица

| Time | Actor | Action | Target | Details |
|------|-------|--------|--------|---------|
| Apr 5 14:21 | AI Agent | Decision: PARTIAL | Campaign X → MS 2 | "Could not verify user count" |
| Apr 5 15:03 | Admin (4xK2..) | Approved | Campaign X → MS 2 | Note: "Verified manually" |
| Apr 5 15:03 | System | TX Broadcast | Campaign X → MS 2 | tx: 5jK2.. |
| Apr 5 15:04 | System | TX Confirmed | Campaign X → MS 2 | 32 confirmations |
| Apr 6 09:00 | Deadline Monitor | Grace Period | Campaign Y → MS 1 | deadline was Apr 5 |

### Фильтры:
- По actor: AI / Admin / System / DeadlineMonitor
- По action type
- По campaign
- По date range
- Full-text search в details

---

## 9. Settings

Конфигурация платформы (сейчас через env vars, потом через UI).

### Sections:

**Platform:**
- Platform fee (BPS) — сейчас 250 (2.5%)
- Min backing amount (lamports)
- Max milestones per campaign
- Grace period duration (days)
- Voting period duration (days)

**AI Pipeline:**
- Claude model ID
- Max AI processing time before alert (seconds)
- Auto-retry count for failed TX

**Wallets:**
- Admin wallet address
- AI Agent wallet address
- Treasury wallet address
- Ссылки на Solana Explorer для каждого

**Danger Zone:**
- Pause all campaigns (set_paused on-chain)
- Emergency: disable AI pipeline (stop Oban workers)

---

## Дизайн и UX

### Layout

```
┌──────────────────────────────────────────────────┐
│ [=] Qadam Admin              [Bell] [Admin 4xK2]  │
├────────┬─────────────────────────────────────────┤
│        │                                         │
│ Side   │  Content Area                           │
│ bar    │                                         │
│        │  Breadcrumbs: Overview > Campaigns > X  │
│ [icon] │                                         │
│ Over.  │  ┌─────────┐ ┌─────────┐ ┌─────────┐  │
│        │  │ Metric 1│ │ Metric 2│ │ Metric 3│  │
│ [icon] │  └─────────┘ └─────────┘ └─────────┘  │
│ Review │                                         │
│        │  ┌─────────────────────────────────┐    │
│ [icon] │  │                                 │    │
│ Camp.  │  │  Table / Chart / Detail         │    │
│        │  │                                 │    │
│ [icon] │  └─────────────────────────────────┘    │
│ Miles. │                                         │
│        │                                         │
│ ...    │                                         │
│        │                                         │
├────────┴─────────────────────────────────────────┤
│ Qadam Admin v1 · Connected to devnet              │
└──────────────────────────────────────────────────┘
```

### Стиль

- Тот же design system что и основной сайт (Inter, amber accent, navy)
- Но с более "data-dense" layout — меньше whitespace, больше информации
- Таблицы: zebra striping, sticky headers, pagination (20 items per page)
- Карточки метрик: border border-black/[0.06], rounded-2xl
- Графики: Recharts (уже в Next.js ecosystem, лёгкий)
- Status badges с цветами:
  - green: approved, completed, active
  - amber: pending, grace_period, voting_active, extended
  - red: rejected, failed, refunded, cancelled
  - purple: under_human_review, ai_processing
  - gray: draft

### Routing

```
/admin                    → Overview dashboard
/admin/reviews            → Review Queue
/admin/campaigns          → Campaign list
/admin/campaigns/[id]     → Campaign detail
/admin/milestones         → Milestone list
/admin/milestones/[id]    → Milestone detail
/admin/users              → User list
/admin/users/[wallet]     → User detail
/admin/governance         → Governance votes
/admin/ai                 → AI Analytics
/admin/audit              → Audit Log
/admin/settings           → Platform Settings
```

### Авторизация

- Отдельный `/admin` layout с sidebar
- Проверка wallet === ADMIN_WALLET (как сейчас)
- В будущем: массив admin wallets в QadamConfig on-chain
- Все admin действия логируются в audit log с wallet address

---

## Backend endpoints (что нужно добавить)

| Endpoint | Method | Описание |
|----------|--------|----------|
| `/api/admin/dashboard` | GET | Все метрики для overview |
| `/api/admin/campaigns` | GET | Кампании с фильтрами и пагинацией |
| `/api/admin/campaigns/:id` | GET | Полная детализация кампании |
| `/api/admin/campaigns/:id/pause` | POST | Пауза кампании |
| `/api/admin/campaigns/:id/resume` | POST | Возобновление |
| `/api/admin/milestones` | GET | Milestones с фильтрами |
| `/api/admin/milestones/:id` | GET | Детализация milestone |
| `/api/admin/milestones/:id/transitions` | GET | Audit log для milestone |
| `/api/admin/users` | GET | Пользователи с фильтрами |
| `/api/admin/users/:wallet` | GET | Детализация пользователя |
| `/api/admin/users/:wallet/reputation` | PUT | Корректировка reputation |
| `/api/admin/governance` | GET | Активные голосования |
| `/api/admin/governance/history` | GET | Прошедшие голосования |
| `/api/admin/ai/stats` | GET | AI pipeline метрики |
| `/api/admin/ai/decisions` | GET | Список AI decisions |
| `/api/admin/audit` | GET | Audit log с фильтрами |

Все endpoints за `pipe_through [:api, :admin]` pipeline.

---

## Приоритет реализации

```
Фаза 1 (MVP — первая итерация):
  1. Overview dashboard (метрики + needs attention)
  2. Review Queue (расширенная)
  3. Campaign list + detail
  4. Audit Log (basic)

Фаза 2 (полноценная):
  5. Milestone list + detail
  6. User list + detail + reputation
  7. AI Analytics

Фаза 3 (advanced):
  8. Governance monitoring
  9. Settings UI
  10. Charts и визуализация
```

---

## Зависимости

- **Recharts** — графики (npm install recharts)
- **@tanstack/react-table** — таблицы с сортировкой, фильтрами, пагинацией
- Всё остальное уже есть: shadcn/ui, React Query, Lucide icons

---

*Qadam Admin Panel Spec v1 | Апрель 2026*
