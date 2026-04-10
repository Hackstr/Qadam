# Admin Panel — Implementation Roadmap

## Архитектурные решения

- **Layout**: `/admin/layout.tsx` — sidebar + wallet guard + breadcrumbs
- **Backend**: расширяем AdminController + 2 новых (AdminDashboardController, AdminAuditController)
- **Таблицы**: простые shadcn/ui Table, ручная сортировка/фильтры (не tanstack-table)
- **Графики**: Recharts — минимально (pie + bar), добавлять по мере надобности
- **Settings**: read-only view с tooltip "Hardcoded in smart contract"

---

## Шаги реализации

### Шаг 1: Admin Layout + Sidebar + Routing
**Backend:** ничего
**Frontend:**
- `/admin/layout.tsx` — wallet guard, sidebar, breadcrumbs
- Sidebar: 9 nav items с Lucide icons
- Wallet check: connected && publicKey === ADMIN_WALLET
- Mobile: sidebar collapsible
- Перенести текущий `/admin/page.tsx` в `/admin/reviews/page.tsx`
- `/admin/page.tsx` станет Overview (пока placeholder)

### Шаг 2: Backend — Dashboard endpoint
**Backend:**
- `GET /api/admin/dashboard` — агрегирует:
  - basic metrics (reuse analytics summary logic)
  - pending_reviews count
  - overdue_milestones count
  - stuck_in_ai count (ai_processing > 5 min)
  - ai_accuracy (approved / total decisions)
  - recent_activity (last 10 state transitions)
  - needs_attention items list
**Frontend:** ничего пока

### Шаг 3: Overview Dashboard page
**Frontend:**
- 6 metric cards (верхний ряд)
- "Needs Attention" таблица (нижний ряд)
- Кликабельные items → навигация в соответствующий раздел

### Шаг 4: Backend — Campaigns list + detail endpoints
**Backend:**
- `GET /api/admin/campaigns` — с фильтрами: status, category, search, sort_by, page/per_page
- `GET /api/admin/campaigns/:id` — полная детализация: campaign + milestones + backers + updates
- `POST /api/admin/campaigns/:id/pause` — меняет status на "paused"
- `POST /api/admin/campaigns/:id/resume` — меняет status на "active"

### Шаг 5: Campaigns list page
**Frontend:**
- `/admin/campaigns/page.tsx` — таблица с фильтрами
- Search, status dropdown, category dropdown, sort
- Row actions: View, Toggle Featured, Pause/Resume
- Pagination

### Шаг 6: Campaign detail page
**Frontend:**
- `/admin/campaigns/[id]/page.tsx`
- Все поля кампании
- Milestone timeline (reuse MilestoneTimeline component)
- Backers list
- Updates list
- Solana Explorer link

### Шаг 7: Review Queue — расширенная версия
**Backend:**
- Расширить review_queue response: добавить acceptance_criteria, creator reputation, state transitions
**Frontend:**
- `/admin/reviews/page.tsx` — переработанная из текущего `/admin`
- Acceptance criteria vs evidence
- Creator reputation score
- State history
- Admin notes (textarea → сохраняется в decide metadata)
- "Request More Evidence" action

### Шаг 8: Backend — Milestones + Audit endpoints
**Backend:**
- `GET /api/admin/milestones` — с фильтрами: status, ai_decision, campaign_id, date range, preset views
- `GET /api/admin/milestones/:id` — полная детализация + transitions
- `GET /api/admin/audit` — unified audit log (transitions + AI decisions merged, sorted by time)

### Шаг 9: Milestones list + detail pages
**Frontend:**
- `/admin/milestones/page.tsx` — таблица с preset views (Stuck in AI, Overdue, Past Grace, Recent)
- `/admin/milestones/[id]/page.tsx` — evidence, AI decision, state history, acceptance criteria

### Шаг 10: Audit Log page
**Frontend:**
- `/admin/audit/page.tsx` — unified timeline
- Фильтры: actor, action type, campaign, date range
- Color-coded entries по actor type

### Шаг 11: Backend — Users + Governance endpoints
**Backend:**
- `GET /api/admin/users` — с фильтрами, include reputation + campaign/backer counts
- `GET /api/admin/users/:wallet` — полная детализация
- `PUT /api/admin/users/:wallet/reputation` — корректировка с reason
- `GET /api/admin/governance` — active votes с деталями
- `GET /api/admin/governance/history` — прошедшие голосования

### Шаг 12: Users list + detail pages
**Frontend:**
- `/admin/users/page.tsx` — таблица
- `/admin/users/[wallet]/page.tsx` — profile, reputation breakdown, campaigns, backed positions

### Шаг 13: Governance page
**Frontend:**
- `/admin/governance/page.tsx` — active votes + history
- Progress bars для extend/refund
- Quorum indicator
- Individual votes list

### Шаг 14: AI Analytics
**Backend:**
- `GET /api/admin/ai/stats` — decision distribution, avg latency, model breakdown
- `GET /api/admin/ai/decisions` — paginated list с фильтрами
**Frontend:**
- `/admin/ai/page.tsx`
- Pie chart: decision distribution (Recharts)
- Metric cards: approval rate, partial rate, avg latency
- Recent decisions table

### Шаг 15: Settings (read-only)
**Frontend:**
- `/admin/settings/page.tsx`
- Read-only cards с текущими значениями
- Tooltip на каждом: "Hardcoded in Anchor program (constants.rs)" или "Set via environment variable"
- Wallet addresses с Explorer links
- Devnet/Mainnet indicator

---

## Зависимости (установить перед шагом 1)

```bash
cd qadam_frontend && npm install recharts
```

---

## Файловая структура результата

```
qadam_frontend/src/app/admin/
├── layout.tsx              # Sidebar + wallet guard
├── page.tsx                # Overview dashboard
├── reviews/
│   └── page.tsx            # Review Queue (расширенная)
├── campaigns/
│   ├── page.tsx            # Campaign list
│   └── [id]/
│       └── page.tsx        # Campaign detail
├── milestones/
│   ├── page.tsx            # Milestone list
│   └── [id]/
│       └── page.tsx        # Milestone detail
├── users/
│   ├── page.tsx            # User list
│   └── [wallet]/
│       └── page.tsx        # User detail
├── governance/
│   └── page.tsx            # Votes
├── ai/
│   └── page.tsx            # AI Analytics
├── audit/
│   └── page.tsx            # Audit Log
└── settings/
    └── page.tsx            # Read-only settings

qadam_backend/lib/qadam_backend_web/controllers/
├── admin_controller.ex     # Расширенный (reviews, campaigns, pause/resume)
├── admin_dashboard_controller.ex  # Dashboard metrics
└── admin_audit_controller.ex      # Audit log + AI stats
```
