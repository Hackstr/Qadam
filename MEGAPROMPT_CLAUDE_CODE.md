# Qadam — Мега-промпт для Claude Code
## Pre-Mainnet Product Completeness Sprint

---

## О проекте

**Qadam** — milestone-based crowdfunding на Solana. SOL в escrow, Claude AI верифицирует каждый milestone, бэкеры получают токены.

**Стек:**
- Frontend: `qadam_frontend/` — Next.js 15, TailwindCSS, shadcn/ui, Framer Motion, @tanstack/react-query, Zustand, @solana/wallet-adapter
- Backend: `qadam_backend/` — Elixir/Phoenix, PostgreSQL, Oban workers
- Blockchain: `qadam/` — Solana/Anchor (Rust)

**Обязательно читай перед любым UI изменением:** `qadam_frontend/DESIGN_SYSTEM.md`
**Архитектурные решения:** `CLAUDE.md`, `TECHNICAL_DECISIONS.md`

---

## Что уже работает — не трогать

- Весь Anchor program (18 инструкций), все PDA derivations в `src/lib/program.ts`
- On-chain ↔ PostgreSQL sync (5 webhook endpoints в SyncController)
- SIWS auth (useAutoAuth, JWT, localStorage)
- Все страницы: campaigns, create, back, dashboard, portfolio, profile, vote, admin, analytics
- CampaignCard: поддерживает cover_image_url (показывает img если есть)
- MilestoneTimeline: статусы, AI explanation, appeal button
- ShareButtons: Twitter + Telegram + Copy
- AccountSetupModal: display_name, email, notification prefs
- Header: floating pill, notifications bell, mobile hamburger

---

## Задачи — выполнять по приоритету

---

### ЗАДАЧА 1 (P0): Cover Image Upload в Create Campaign

**Файлы:** `qadam_frontend/src/app/create/page.tsx`, `qadam_backend/lib/qadam_backend_web/`

**Проблема:** Campaign.cover_image_url поле есть в DB schema и в types/index.ts, но в create форме нет поля для загрузки.

**Что делать:**

**Backend — новый endpoint:**
```
POST /api/campaigns/upload-cover
Content-Type: multipart/form-data
Body: { file: File }
Response: { url: string }
```
Сохранять в Cloudflare R2 или (для devnet) просто сохранять base64 в PostgreSQL во временное поле. Добавить в `router.ex` в authenticated scope.

**Frontend — в `create/page.tsx`:**
1. Добавить state: `const [coverImageUrl, setCoverImageUrl] = useState("")`
2. В секцию "Project Details" добавить после Description:
```tsx
<div>
  <label className="text-sm font-medium mb-1 block">Cover Image (optional)</label>
  <input
    type="file"
    accept="image/*"
    onChange={async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      // upload → получить URL → setCoverImageUrl(url)
    }}
    className="..."
  />
  {coverImageUrl && (
    <img src={coverImageUrl} className="mt-2 h-24 w-full object-cover rounded-lg" />
  )}
</div>
```
3. Передавать `cover_image_url: coverImageUrl` в `syncCampaignCreation()`

**Важно:** `syncCampaignCreation` в api.ts нужно добавить `cover_image_url?: string` в тип параметра.
**Важно:** SyncController должен сохранять cover_image_url в Campaign.

---

### ЗАДАЧА 2 (P0): Acceptance Criteria — отдельное поле в milestone форме

**Файлы:** `qadam_frontend/src/app/create/page.tsx`, `qadam_frontend/src/lib/api.ts`

**Проблема:** `acceptance_criteria` поле есть в Milestone schema (DB + Elixir + TypeScript types) и используется в AI prompt (`PromptBuilder.build_verification_prompt`). Но в create форме нет отдельного поля — только description с placeholder "include acceptance criteria".

**Что делать:**

В `MilestoneInput` interface добавить `acceptance_criteria: string`.

В milestone форме добавить отдельный Textarea после description:
```tsx
<Textarea
  value={m.acceptance_criteria}
  onChange={(e) => updateMilestone(idx, "acceptance_criteria", e.target.value)}
  placeholder="What specific criteria must be met? e.g. 'Working demo at [URL], 100+ test users, screenshot of analytics'"
  rows={2}
/>
<p className="text-xs text-muted-foreground">Claude AI will evaluate evidence against these criteria.</p>
```

В `syncCampaignCreation` milestones[] добавить `acceptance_criteria: m.acceptance_criteria`.
В SyncController при создании milestone добавить `acceptance_criteria: m["acceptance_criteria"]`.

---

### ЗАДАЧА 3 (P0): Баг — Portfolio "Governance" кнопка

**Файл:** `qadam_frontend/src/app/portfolio/page.tsx` строка ~77

**Проблема:**
```tsx
const needsVote = pos.campaign_status === "active"; // ВСЕГДА true для активных кампаний
```
Governance кнопка показывается для ВСЕХ активных кампаний, не только с `voting_active`.

**Что делать:**

**Backend** — в `BackerController.portfolio` response добавить поле:
```elixir
has_active_vote: has_active_vote?(p.campaign_id)
```
Где `has_active_vote?` проверяет наличие milestone со статусом "voting_active" для этой кампании.

**Frontend** — заменить:
```tsx
const needsVote = pos.has_active_vote === true;
```

Также — BackerController portfolio response сейчас **не возвращает `wallet_address`** для backer position (смотри backer_controller.ex). А в portfolio/page.tsx используется `pos.wallet_address` для syncRefund и syncClaimTokens. Добавить в response:
```elixir
wallet_address: p.wallet_address,
```

---

### ЗАДАЧА 4 (P0): Баг — acceptance_criteria не передаётся в SyncController

**Файл:** `qadam_backend/lib/qadam_backend_web/controllers/sync_controller.ex`

**Проблема:** В `sync_campaign` при создании milestones `acceptance_criteria` не передаётся:
```elixir
%QadamBackend.Milestones.Milestone{
  ...
  # acceptance_criteria отсутствует!
}
```

**Что делать:** Добавить `acceptance_criteria: m["acceptance_criteria"]` в milestone struct при создании.

---

### ЗАДАЧА 5 (P0): FAQ Страница

**Файл:** создать `qadam_frontend/src/app/faq/page.tsx`

**Что делать:** Создать страницу `/faq` со следующими вопросами и ответами:

```
Q: How does escrow work?
A: When you back a project, your SOL goes directly into a smart contract on Solana — not to the creator. The contract holds it until Claude AI verifies that the creator has completed each milestone.

Q: What if AI makes a wrong decision?
A: Every AI decision can be appealed. Creators can request human review from the Qadam team within 48 hours. Human reviewers check the evidence and can override the AI decision.

Q: How do I receive tokens?
A: After each milestone is approved, you can claim your tokens in My Backed → "Claim Tokens". Tokens are released proportionally per approved milestone.

Q: Can I get my SOL back if the project fails?
A: Yes. If a milestone fails and backers vote for refund, SOL is returned proportionally to all backers based on their contribution.

Q: What are Genesis / Early / Standard tiers?
A: The first 50 backers get Genesis tier (1.0x tokens per SOL). Next 200 get Early tier (0.67x). Everyone after is Standard (0.5x). Back early for better allocation.

Q: How does milestone submission work?
A: Creator writes what they accomplished, adds demo links, and submits. Claude AI evaluates the evidence against the milestone's acceptance criteria in under 60 seconds.

Q: What's the platform fee?
A: 2.5%, deducted automatically from each milestone release. Zero fee if creator earns zero.

Q: Is this safe? Has it been audited?
A: The smart contract is deployed on Solana Devnet and currently undergoing preparation for a formal security audit. Never invest more than you can afford to lose on devnet.
```

Дизайн: чистая accordion-style или просто секции. Использовать дизайн-систему из DESIGN_SYSTEM.md.
Добавить в Footer ссылку на /faq.

---

### ЗАДАЧА 6 (P0): ToS и Privacy страницы + Footer

**Файлы:** создать `qadam_frontend/src/app/terms/page.tsx`, `qadam_frontend/src/app/privacy/page.tsx`, обновить `qadam_frontend/src/components/layout/footer.tsx`

**Footer сейчас:** только 2 строки текста, нет ссылок.
**Что делать:** Добавить ссылки: FAQ · Terms · Privacy

```tsx
export function Footer() {
  return (
    <footer className="border-t py-8 mt-auto">
      <div className="container mx-auto px-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>Qadam &mdash; Build step by step</p>
          <div className="flex items-center gap-4">
            <Link href="/faq" className="hover:text-foreground transition-colors">FAQ</Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            <p>Powered by Solana &middot; Verified by AI</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
```

**ToS страница** (`/terms`): стандартный web3 ToS с:
- Utility token disclaimer: "Qadam tokens are utility tokens providing product access and governance rights. They are not investments, do not represent equity, and carry no guarantee of financial return."
- Platform не отвечает за потерю средств на devnet
- Пользователь сам несёт ответственность за свой кошелёк

**Privacy страница** (`/privacy`): что собираем (email — только если пользователь ввёл), для чего (уведомления), как защищаем.

---

### ЗАДАЧА 7 (P1): Success State после создания кампании

**Файл:** `qadam_frontend/src/app/create/page.tsx`

**Проблема:** После `handleCreate()` → `router.push("/dashboard")` — нет feedback.

**Что делать:** После успешного создания:
```tsx
router.push(`/dashboard?created=true`);
```

В `dashboard/page.tsx` — добавить:
```tsx
const searchParams = useSearchParams();
const justCreated = searchParams.get("created") === "true";

// В JSX, выше grid кампаний:
{justCreated && (
  <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
    <div>
      <p className="font-medium text-green-800">Campaign created!</p>
      <p className="text-sm text-green-700">Share it with your community to get backers.</p>
    </div>
  </div>
)}
```

---

### ЗАДАЧА 8 (P1): Deadline Countdown в MilestoneTimeline

**Файл:** `qadam_frontend/src/components/campaign/milestone-timeline.tsx`

**Проблема:** Показывает только дату дедлайна. Нет ощущения срочности.

**Что делать:** Добавить helper функцию:
```tsx
function getDaysUntil(deadline: string): { text: string; color: string } {
  const diff = Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return { text: `Overdue by ${Math.abs(diff)} days`, color: "text-red-500" };
  if (diff === 0) return { text: "Due today", color: "text-red-500" };
  if (diff <= 7) return { text: `${diff} days left`, color: "text-amber-500" };
  return { text: `${diff} days left`, color: "text-muted-foreground" };
}
```

В рендере milestone заменить:
```tsx
<p className="text-xs text-muted-foreground mt-2">
  Deadline: {new Date(milestone.deadline).toLocaleDateString()}
</p>
```
На:
```tsx
{(milestone.status === "pending" || milestone.status === "grace_period" || milestone.status === "extended") && (() => {
  const { text, color } = getDaysUntil(milestone.deadline);
  return <p className={`text-xs mt-2 ${color}`}>{text} · {new Date(milestone.deadline).toLocaleDateString()}</p>;
})()}
```

---

### ЗАДАЧА 9 (P1): Account Settings Страница

**Файл:** создать `qadam_frontend/src/app/settings/page.tsx`

**Проблема:** После первого AccountSetupModal нет способа изменить настройки.

**Что делать:** Создать `/settings` страницу. Использует `GET /me` и `PUT /me` (уже существуют).

Форма: display_name, email (с пометкой "Used for notifications only"), notification checkboxes (те же что в AccountSetupModal).

Добавить ссылку в Header — в мобильном меню добавить "Settings" link, или в desktop — при hover на wallet кнопку показывать dropdown. Простейший вариант: добавить в мобильное меню `{ href: "/settings", label: "Settings", public: false }`.

---

### ЗАДАЧА 10 (P1): Dynamic OG Meta для Campaign Pages

**Файл:** `qadam_frontend/src/app/campaigns/[id]/page.tsx`

**Проблема:** `/campaigns/abc` — title всегда "Qadam — Build step by step".

**Решение:** Так как страница client component (`"use client"`), используем `document.title`:

```tsx
useEffect(() => {
  if (campaign?.title) {
    document.title = `${campaign.title} | Qadam`;
  }
  return () => { document.title = "Qadam — Build step by step"; };
}, [campaign?.title]);
```

Для полноценного OG — нужно сделать `page.tsx` server component или использовать `generateMetadata`. Это сложнее из-за wallet adapter. Простой путь: добавить `useEffect` для `document.title` — этого достаточно для браузерных вкладок.

---

### ЗАДАЧА 11 (P2): Pitch Video URL в Create

**Файл:** `qadam_frontend/src/app/create/page.tsx`

`pitch_video_url` поле есть в Campaign schema. Добавить optional input в "Project Details":
```tsx
<div>
  <label className="text-sm font-medium mb-1 block">Pitch Video URL (optional)</label>
  <Input
    value={pitchVideoUrl}
    onChange={(e) => setPitchVideoUrl(e.target.value)}
    placeholder="https://youtube.com/... or https://loom.com/..."
  />
</div>
```

Передавать в `syncCampaignCreation`. В campaign detail показывать embedded видео если есть.

---

### ЗАДАЧА 12 (P2): Landing — живые цифры из API

**Файл:** `qadam_frontend/src/app/page.tsx`

**Проблема:** Stats секция (2.5%, <60s, Free, 100%) захардкожена. Реальная платформенная статистика не отображается.

В `ActiveCampaignsSection` уже есть fetch из API. Добавить fetch `getAnalyticsSummary()`:
```tsx
const { data: analyticsData } = useQuery({
  queryKey: ["analytics-summary"],
  queryFn: getAnalyticsSummary,
  retry: false,
});
```

В секцию Active Campaigns добавить header с живыми цифрами:
```tsx
{analyticsData?.data && (
  <div className="text-sm text-muted-foreground mb-2">
    {analyticsData.data.active_campaigns} active campaigns ·{" "}
    {formatSol(analyticsData.data.total_raised_lamports)} raised ·{" "}
    {analyticsData.data.total_backers} backers
  </div>
)}
```

---

## Правила при написании кода

### UI — строго из DESIGN_SYSTEM.md:
- Никаких emojis нигде в UI. Только Lucide React иконки.
- Кнопки: amber primary (`bg-amber-500`), dark secondary (`bg-[#0F1724]`), outline tertiary
- Карточки: `border border-black/[0.06] rounded-2xl`
- Текст: Inter для всего, Geist Mono для адресов/хешей
- Loading states: `<Loader2 className="h-4 w-4 animate-spin" />` — никогда не full-page spinner
- Toast уведомления через sonner для всех async операций
- Empty states всегда — никогда пустая страница

### Elixir/Phoenix:
- Читай `qadam_backend/AGENTS.md` — там важные правила Elixir
- Не используй `String.to_atom/1` на user input
- Всегда `Repo.preload` ассоциации перед обращением к ним
- action_fallback для error handling в controllers

### Next.js:
- Читай `qadam_frontend/AGENTS.md` — там предупреждение о breaking changes
- `"use client"` для компонентов с state/hooks/wallet
- React Query для server state, Zustand только для auth state
- `useQadamProgram()` hook для всех Anchor транзакций

### TypeScript:
- 0 ошибок после изменений: `cd qadam_frontend && npx tsc --noEmit`
- Типы в `src/types/index.ts` — не дублировать

---

## Порядок выполнения

```
Неделя 1:
  ✅ Задача 3: Portfolio needsVote bug + wallet_address в response
  ✅ Задача 4: acceptance_criteria в SyncController
  ✅ Задача 7: Success state после create
  ✅ Задача 8: Deadline countdown
  ✅ Задача 5: FAQ страница
  ✅ Задача 6: ToS + Privacy + Footer ссылки

Неделя 2:
  ✅ Задача 1: Cover image upload (backend endpoint + frontend UI)
  ✅ Задача 2: Acceptance criteria поле в create форме
  ✅ Задача 9: Account Settings страница
  ✅ Задача 10: Dynamic title для campaign pages

Неделя 3:
  ✅ Задача 11: Pitch video URL
  ✅ Задача 12: Landing live stats
```

---

## Критерий готовности

Продукт готов к первым реальным пользователям когда:
- [ ] Кампания создаётся с обложкой и явными acceptance criteria
- [ ] AI верификация работает < 60s (тест на devnet)
- [ ] Бэкер находит кампанию, вкладывает SOL, видит токены в portfolio
- [ ] Creator получает SOL после approved milestone
- [ ] FAQ, ToS, Privacy страницы существуют и доступны из footer
- [ ] Share кампании → правильный title в браузерной вкладке
- [ ] Creator может написать update для бэкеров (уже работает)
- [ ] Нет баги с needsVote в portfolio
- [ ] TypeScript: 0 ошибок

---

*Qadam Megaprompt v2 | Апрель 2026 | Читать весь файл перед началом работы*
