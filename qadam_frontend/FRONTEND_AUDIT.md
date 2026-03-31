# Qadam Frontend — Полный UX Аудит по Ролям

> Дата: 31 марта 2026
> Аудит проведён после первого прохода Cursor.
> Что исправлено ✅, что упущено ❌, что must-have для хакатона 🔴.

---

## Что Cursor уже исправил ✅

- Token display: "105x" → "105 tokens/SOL · 70 tokens/SOL · 52 tokens/SOL"
- Button disabled пока форма не заполнена полностью
- "User rejected" → toast "Transaction cancelled" (не dev overlay)
- Loading states: "Waiting for wallet..." → "Confirming..." → "Done"
- "0% For early creators" → "Free"

---

## 🔴 РОЛЬ 1: CREATOR (Создатель кампании)

### Flow: /create → /dashboard → submit evidence → получить деньги

---

### 🔴 КРИТИЧНО: Страница управления кампанией не существует

В dashboard есть кнопка:
```tsx
<Link href={`/dashboard/${campaign.id}/submit`}>
  Submit Evidence
</Link>
```

Но директория `app/dashboard/[id]` **пустая** — нет `page.tsx`.
Creator нажимает "Submit Evidence" → 404.

**Нужно создать:**
- `/dashboard/[id]/page.tsx` — детальная страница кампании (milestone timeline, статусы, stats)
- `/dashboard/[id]/submit/page.tsx` (или modal) — форма загрузки доказательств

---

### 🔴 КРИТИЧНО: Token Configuration — неправильная бизнес-логика

**Сейчас:** один параметр "Tokens per SOL (base rate)" = 105
Creator не понимает что это значит в контексте его проекта.

**Как думает creator:**
> "Я выпускаю 1,000,000 токенов. 20% отдаю бэкерам. Токен называется MYAPP."

**Как должен выглядеть UI:**

```
Token Name:        [ MyApp Token        ]
Token Symbol:      [ MYAPP              ]
Total Supply:      [ 1,000,000          ]
% for Backers:     [ 20%                ] = 200,000 tokens

── Автоматически рассчитывается ──
Goal: 10 SOL → 200,000 tokens total
Genesis Tier (1.0x): 20,000 MYAPP per SOL
Early Tier (0.67x):  13,400 MYAPP per SOL
Standard (0.50x):    10,000 MYAPP per SOL
```

**Зачем это важно:**
- Creator контролирует dilution (сколько % компании отдаёт)
- Бэкер видит осмысленное название токена а не "105 tokens"
- На странице кампании: "1 SOL = 20,000 MYAPP (Genesis)" — понятно и мотивирует

---

### 🟠 ВАЖНО: Нет warning о security deposit при создании

Creator не видит что при создании кампании спишется 0.5% от цели как security deposit.
При цели 100 SOL → спишется 0.5 SOL.

Нужно: предупреждение под кнопкой Create Campaign:
```
ℹ️ Security deposit: 0.015 SOL (0.5% of goal)
   Returned progressively as milestones are approved.
```

---

### 🟠 ВАЖНО: Нет success state после создания кампании

После create → redirect на /dashboard без feedback.
Creator видит список кампаний — непонятно успешно ли всё прошло.

Нужно: toast "🎉 Campaign created! Share it to get your first backers." + highlight новой кампании.

---

### 🟡 NICE TO HAVE: Нет preview кампании перед деплоем

Creator не видит как кампания будет выглядеть для бэкеров до публикации.
Простое решение: collapsible "Preview" секция в форме.

---

---

## 🔴 РОЛЬ 2: BACKER (Инвестор)

### Flow: /campaigns → /campaigns/[id] → back → /portfolio → claim tokens

---

### 🔴 КРИТИЧНО: Страница кампании не существует

`CampaignCard` ссылается на `/campaigns/${campaign.id}`.
Директория `app/campaigns/[id]` **пустая** — нет `page.tsx`.

Backer кликает на кампанию → 404. Backing невозможен физически.

**Что должна содержать `/campaigns/[id]`:**

```
┌─────────────────────────────────────────┐
│  [Cover Image]                          │
│  Campaign Title                         │
│  Category · Creator: 0x1234...          │
│                                         │
│  Progress: ████████░░ 73%              │
│  Raised: 7.3 SOL / 10 SOL             │
│  Backers: 34                           │
│                                         │
│  🟢 Genesis Tier (16 spots left)       │
│  1 SOL = 20,000 MYAPP tokens           │
│                                         │
│  [  Amount: [____] SOL  ]              │
│  [  You receive: 20,000 MYAPP  ]       │
│  [  Back This Project →  ]             │
└─────────────────────────────────────────┘
│                                         │
│  Milestone Roadmap                      │
│  ✅ M1: Prototype (1 SOL) — Approved   │
│  ⏳ M2: Beta (1 SOL) — Pending         │
│  🔒 M3: Launch (1 SOL) — Locked        │
│                                         │
│  About this project...                  │
│  [Description text]                     │
└─────────────────────────────────────────┘
```

---

### 🔴 КРИТИЧНО: Нет Claim Tokens в Portfolio

В `/portfolio` показываются позиции: "70 / 300,000 tokens claimed".
Но нет кнопки "Claim Tokens" рядом с каждой позицией.

```tsx
// Нужно добавить в каждую позицию:
{pos.milestones_claimed_through < campaign.milestones_approved && (
  <Button onClick={() => claimTokens(pos.campaign_id)}>
    Claim {unclaimed} MYAPP
  </Button>
)}
```

---

### 🔴 КРИТИЧНО: Нет Claim Refund при провале кампании

Если кампания в статусе `refunded` — backer должен видеть кнопку "Claim Refund".
В portfolio нет этой логики совсем.

---

### 🟠 ВАЖНО: Нет Governance Voting UI

Когда creator запрашивает extension → backer должен увидеть:
```
⚠️ Campaign "MyApp" needs your vote
   Creator requested +30 days extension
   Reason: "Backend development took longer..."
   
   [Approve Extension]  [Request Refund]
   Voting ends in: 5 days 12 hours
```

Нигде в UI этого нет.

---

### 🟡 NICE TO HAVE: Нет Increase Backing

Backer хочет добавить ещё SOL к своей позиции — нет такой возможности в UI.

---

## 🟠 РОЛЬ 3: ADMIN

### 🟠 Нет auth guard на /admin

`/admin` доступен ЛЮБОМУ кто знает URL — нет проверки что подключён admin wallet.

```tsx
// Нужно добавить:
const { publicKey } = useWallet();
const isAdmin = publicKey?.toBase58() === process.env.NEXT_PUBLIC_ADMIN_WALLET;
if (!isAdmin) return <Unauthorized />;
```

---

### 🟡 Нет Platform Stats в /admin

Admin не видит: сколько активных кампаний, общий GMV, сколько pending reviews, revenue.

---

### 🟡 Нет истории AI решений

Admin не может посмотреть все прошлые AI решения (APPROVED/REJECTED/PARTIAL) с объяснениями.

---

## 🟡 БИЗНЕС ПЕРСПЕКТИВА

### 0% Fee для первых 20 creators — не работает в логике

На landing показано "Free for first 20 creators" — но в Anchor программе
fee всегда 2.5% (QADAM_FEE_BPS = 250). Нигде нет логики трекинга "первые 20".

Решение для MVP: в backend вручную возвращать fee первым 20 creators off-chain.
Или добавить в Anchor config: `free_campaigns_remaining: u8`.

---

### Нет Creator Reputation Score в UI

В backend есть `creator_reputation` таблица и score (0-100).
В frontend нигде не показывается — ни на странице кампании, ни в профиле.

На странице кампании должен быть: "Creator Score: 87 ⭐ (3 campaigns, 100% success)"

---

### Нет Shareable Campaign Links / Social

После создания кампании нет "Share" кнопки.
В крипто community шейринг = главный acquisition канал.

Нужно: кнопка "Share on Twitter" с pre-filled tweet:
```
Just launched [Campaign Name] on @QadamProtocol 🚀
Back it here: qadam.xyz/campaigns/[id]
Get MYAPP tokens at Genesis price!
```

---

---

## Итоговая матрица приоритетов

### 🔴 Must-have для хакатона (без этого demo сломан)

| Проблема | Роль | Файлы для создания |
|----------|------|-------------------|
| `/campaigns/[id]` страница не существует | Backer | `app/campaigns/[id]/page.tsx` |
| `/dashboard/[id]` страница не существует | Creator | `app/dashboard/[id]/page.tsx` |
| Submit Evidence форма не существует | Creator | `app/dashboard/[id]/submit/page.tsx` или modal |
| Claim Tokens кнопки нет в portfolio | Backer | `app/portfolio/page.tsx` — добавить кнопку |
| Claim Refund кнопки нет в portfolio | Backer | `app/portfolio/page.tsx` — добавить кнопку |
| Token Configuration — нет имени/тикера/supply | Creator | `app/create/page.tsx` — переработать секцию |

---

### 🟠 Важно (заметно на demo, но не блокирует)

| Проблема | Роль |
|----------|------|
| Нет auth guard на /admin | Admin |
| Нет security deposit warning при создании | Creator |
| Нет success state после создания кампании | Creator |
| Нет governance voting UI | Backer |

---

### 🟡 Nice to have (после хакатона)

| Проблема | Роль |
|----------|------|
| Share кнопка для кампании | Creator/Backer |
| Creator Reputation Score visible | Backer |
| 0% fee для первых 20 creators в логике | Business |
| Platform stats в /admin | Admin |
| Rich text editor в форме создания | Creator |
| Cover image upload | Creator |
| Increase Backing | Backer |

---

## Token Configuration — рекомендуемый UI

```tsx
// НОВАЯ СЕКЦИЯ "Token Configuration" в /create

<Card>
  <CardHeader>
    <CardTitle>Project Token</CardTitle>
    <CardDescription>
      Backers receive your project tokens as co-owners.
      You control the name, supply, and what percentage backers receive.
    </CardDescription>
  </CardHeader>
  <CardContent>
    <div className="grid grid-cols-2 gap-4">
      <Input placeholder="Token Name" hint="e.g. MyApp Token" />
      <Input placeholder="Symbol" hint="e.g. MYAPP" maxLength={10} />
    </div>
    <div className="grid grid-cols-2 gap-4 mt-4">
      <Input
        type="number"
        label="Total Supply"
        hint="Total tokens you'll ever issue"
        placeholder="1,000,000"
      />
      <Input
        type="number"
        label="% for Backers"
        hint="What % of total supply goes to backers"
        placeholder="20"
        suffix="%"
      />
    </div>

    {/* Auto-calculated preview */}
    <div className="mt-4 p-3 bg-muted rounded-lg text-sm">
      <p className="font-medium mb-2">Token Distribution Preview:</p>
      <p>🟢 Genesis Tier: <strong>20,000 MYAPP per SOL</strong> (1.0x)</p>
      <p>🟡 Early Tier: <strong>13,400 MYAPP per SOL</strong> (0.67x)</p>
      <p>⚪ Standard: <strong>10,000 MYAPP per SOL</strong> (0.5x)</p>
      <p className="mt-2 text-muted-foreground">
        Total for backers: 200,000 MYAPP (20% of 1,000,000)
      </p>
    </div>
  </CardContent>
</Card>
```

---

## Страница /campaigns/[id] — минимальный scope для хакатона

```tsx
// Минимальный viable campaign page для demo

export default function CampaignDetailPage({ params }) {
  // 1. Fetch campaign + milestones от backend API
  // 2. Показать: title, description, progress bar, tier badge
  // 3. Back Campaign форма: input сумма + кнопка
  // 4. Milestone timeline (компонент уже есть!)
}
```

Компонент `milestone-timeline.tsx` уже создан — просто нужна страница которая его рендерит.

---

*FRONTEND_AUDIT.md | Qadam | 31 марта 2026*
