# Qadam — Product Roadmap (Pre-Mainnet)
## Состояние на 8 апреля 2026

> Цель: полноценный продукт готовый к реальным пользователям на devnet,
> параллельно с подготовкой к mainnet (аудит + legal + грант).

---

## ✅ Что уже сделано и работает

Не трогаем — это закрыто:

- On-chain ↔ PostgreSQL sync (syncCampaign, syncBacking, syncClaimTokens, syncVote, syncRefund)
- SIWS auth (useAutoAuth hook, JWT, protected endpoints)
- Webhook в public scope → AI pipeline запускается
- Server-side search (ilike, debounce, передаётся в backend)
- CORS — ограничен production domain через compile-time config
- Governance тесты: описание 9 (rejected, extension, vote, double-vote protection)
- Landing: redesign + ticker + animated hero + numbered steps
- OG image (1200×630)
- Analytics с real backend endpoint (/analytics/summary)
- NotificationBell + AccountSetupModal + SIWS flow
- Mobile hamburger menu
- Campaign Updates (creator → backers)
- Portfolio: Claim Tokens / Claim Refund / Governance кнопки
- Profile page (/profile/[wallet])
- Not-found (branded 404)
- TypeScript: 0 ошибок
- README

---

## 🔴 P0 — Без этого продукт неполный (делать в первую очередь)

### 1. Cover Image Upload в Create Campaign

**Проблема:** Поля для загрузки обложки нет. Все кампании — gradient placeholder.
Это первое что видит бэкер. Без изображения кампании выглядят как демо-данные.

**Что делать:**
- Добавить file input в `/create/page.tsx`
- Загружать в Cloudflare R2 (или любой S3-compatible) через backend endpoint
- `POST /api/campaigns/:id/cover` → сохранять URL в campaign.cover_image_url
- Показывать preview перед submit
- Добавить route в backend router

**Результат:** Кампании имеют реальные обложки → доверие растёт.

---

### 2. Acceptance Criteria — отдельное поле в Create

**Проблема:** AI верифицирует milestone, но acceptance_criteria в форме нет как явного поля
(placeholder говорит "include acceptance criteria" но это просто description).
Claude не имеет чёткого критерия → решения менее точные.

**Что делать:**
- В milestone форме добавить отдельный `<Textarea>` для acceptance_criteria
- Передавать в Anchor instruction (уже есть в schema milestone)
- Backend сохраняет и отдаёт AI agent
- AI prompt использует acceptance_criteria явно

---

### 3. Dynamic OG Meta для Campaign Pages

**Проблема:** Когда кто-то шерит `/campaigns/abc` — title "Qadam — Build step by step"
вместо "ChainQuest — On-chain RPG | Qadam". Это первое впечатление при шейринге.

**Что делать:**
- В `/campaigns/[id]/page.tsx` добавить `generateMetadata` (Next.js server function)
- Или использовать `<Head>` в client component с динамическими данными
- Format: `"{campaign.title} | Qadam"`
- Description: первые 160 символов campaign.description
- OG image: cover_image_url или дефолтный /og-image.png

---

### 4. FAQ Страница

**Проблема:** Каждый новый пользователь задаёт одни и те же вопросы.
Без FAQ — нет доверия к платформе с реальными деньгами.

**Что делать:** Создать `/app/faq/page.tsx` с ответами на:

```
Q: Как работает эскроу?
Q: Что если AI принял неверное решение?
Q: Как я получу токены?
Q: Можно ли вернуть SOL если проект провалится?
Q: Что такое Genesis / Early / Standard тир?
Q: Как creator подтверждает выполнение milestone?
Q: Сколько берёт платформа?
Q: Это безопасно? Аудит?
```

Добавить ссылку в Footer.

---

### 5. ToS + Privacy Policy Страницы

**Проблема:** Платформа работает с реальными деньгами. Без ToS — юридический риск.
Без Privacy Policy — нельзя собирать email.

**Что делать:**
- Создать `/app/terms/page.tsx` — Terms of Service
- Создать `/app/privacy/page.tsx` — Privacy Policy
- Добавить ссылки в Footer
- В AccountSetupModal добавить: "By saving, you agree to our [Terms] and [Privacy Policy]"
- Контент: стандартный web3 ToS + utility token disclaimer

---

## 🟠 P1 — Важно для доверия и UX (делать на этой неделе)

### 6. Governance Auto-Execute: завершение voting

**Проблема:** `DeadlineMonitorWorker` меняет статус в PostgreSQL при истечении voting
но НЕ вызывает `execute_extension_result` on-chain.
On-chain состояние и DB расходятся.

**Что делать:**
- В `DeadlineMonitorWorker` после auto-extend → добавить `TxBroadcastWorker` job
  с instruction `execute_extension_result`
- Или добавить отдельный `ExecuteExtensionWorker` cron job

---

### 7. Anchor Tests: claim_refund + execute_extension_result

**Проблема:** В describe-9 (Governance Flow) есть: rejected, extension, vote, double-vote.
НЕ покрыто: execute_extension_result + claim_refund flow.

**Что делать:** Добавить в describe-9:
```
it("execute extension result after voting period")
it("backer claims refund after failed campaign")
it("claim_refund fails if already claimed")
```

---

### 8. Portfolio Vote — исправить логику

**Проблема:**
```tsx
const needsVote = pos.campaign_status === "active"; // показывается ВСЕМ активным
```
"Governance" кнопка появляется для ВСЕХ активных кампаний, не только с `voting_active`.

**Что делать:**
- Добавить `campaign_has_active_vote: boolean` в portfolio API response
- Backend: `BackerController.portfolio` → join с milestones, проверить есть ли `voting_active`
- Frontend: `needsVote = pos.campaign_has_active_vote`

---

### 9. Success State после создания кампании

**Проблема:** После создания кампании → redirect на `/dashboard` без feedback.
Creator не знает что всё прошло успешно.

**Что делать:**
- После успешного создания → redirect на `/dashboard/{campaign.id}` с query param `?new=true`
- Dashboard/[id] при `?new=true` → показать toast "Campaign created!" + confetti или просто amber banner
- Или: dedicated `/create/success?id=xxx` страница с CTA "Share your campaign"

---

### 10. Campaign Detail: Deadline Countdown

**Проблема:** Бэкер видит дедлайн как дату (`4/15/2026`) — не понимает сколько осталось.

**Что делать:**
- В `MilestoneTimeline` для pending/active milestone добавить:
  `"5 days left"` или `"Overdue by 2 days"`
- Простая функция `daysUntil(deadline: string): string`
- Цвет: зелёный (>7 дней), жёлтый (≤7), красный (overdue)

---

### 11. Account Settings Страница

**Проблема:** После первого AccountSetupModal нет способа изменить email/preferences.
Пользователь не может обновить настройки.

**Что делать:**
- Создать `/app/settings/page.tsx` (или `/account/page.tsx`)
- Показывать: display_name, email, notification toggles
- Использует уже существующие `GET /me` + `PUT /me` endpoints
- Добавить ссылку в Header (рядом с wallet кнопкой) или в mobile menu

---

### 12. Creator Profile: показывать кампании

**Проблема:** `/profile/[wallet]` существует, но кампании creator'а не отображаются
или показываются неполно (не проверял детально).

**Что делать:**
- Убедиться что `GET /profiles/:wallet` возвращает campaigns[] с полными данными
- Показывать grid кампаний под bio
- Reputation score + статистика (milestones on time, campaigns completed)

---

## 🟡 P2 — Growth и Polish (следующая итерация)

### 13. GitHub OAuth Verification

**Проблема:** `User.github_verified: boolean` есть в schema, но OAuth не реализован.
Trust layer не работает.

**Что делать:**
- Backend: `GET /auth/github` → GitHub OAuth flow → сохранить username + verified=true
- Frontend: кнопка "Connect GitHub" в Account Settings
- Campaign detail: verified badge рядом с creator wallet
- Это повышает доверие бэкеров к creator'у

---

### 14. Email Verification

**Проблема:** email сохраняется без подтверждения. Можно ввести чужой email.

**Что делать:**
- При save email → отправить verification email через Resend
- Email содержит link с token (`/verify-email?token=xxx`)
- Backend: `GET /auth/verify-email?token=xxx` → ставит email_verified=true
- До верификации — пометить email как "unverified" в UI

---

### 15. IPFS для Evidence Files

**Проблема:** При submit evidence creator может только текст + ссылки.
Нет загрузки файлов (скриншоты, документы, APK и т.д.).
Evidence folder в backend пустая.

**Что делать:**
- Подключить Pinata API (env vars уже в .env.example)
- `POST /api/evidence/upload` → загружает файл в IPFS → возвращает CID
- В Submit Evidence форме добавить file drag-and-drop
- IPFS CIDs включаются в evidence_hash расчёт

---

### 16. Landing: Живые Stats из API

**Проблема:** Stats секция (2.5%, <60s, Free, 100%) — захардкожены.
Живые платформенные данные (сколько кампаний, сколько raised) не показываются.

**Что делать:**
- Подключить `/analytics/summary` к stats секции
- Показывать реальные: "X active campaigns", "$Y raised", "Z backers"
- Оставить захардкоженные как fallback если API не ответил

---

### 17. Pitch Video URL в Create

**Проблема:** `pitch_video_url` есть в Campaign schema и DB, но нет поля в create форме.

**Что делать:**
- Добавить input "Pitch Video (YouTube/Loom URL)" в create форме
- Необязательное поле
- На campaign detail — показывать embedded video если есть

---

### 18. Mobile UX Аудит

**Проблема:** Приложение не проверялось на реальных устройствах.
Mobile header есть, но детали могут не работать.

**Что делать:**
- Проверить на 375px (iPhone SE) и 390px (iPhone 14)
- Campaign cards: проверить что cover + content нормально
- Create форма: удобно ли заполнять на мобиле
- Backing flow: кнопка wallet popup на мобиле

---

### 19. Onboarding для новых Creator'ов

**Проблема:** Нет guidance для первого creator'а как начать.
Человек зашёл, видит "Create" — не понимает что от него ожидается.

**Что делать:**
- Простой "How to launch" раздел на /create до формы: 3 шага с иконками
- Или: tooltip system для полей формы
- FAQ ссылка рядом с кнопкой Create в header

---

## 📋 Порядок выполнения

```
Неделя 1 (самое важное для первых юзеров):
  P0-1: Cover image upload
  P0-2: Acceptance criteria поле
  P0-4: FAQ страница (контент написать самому)
  P1-9: Success state после создания
  P1-10: Deadline countdown

Неделя 2 (доверие и legal):
  P0-3: Dynamic OG meta
  P0-5: ToS + Privacy
  P1-6: Governance auto-execute
  P1-7: Anchor tests: claim_refund
  P1-8: Portfolio vote логика фикс

Неделя 3 (product completeness):
  P1-11: Account Settings страница
  P1-12: Creator profile + кампании
  P2-13: GitHub OAuth
  P2-16: Landing live stats
  P2-17: Pitch video

Неделя 4 (качество):
  P2-14: Email verification
  P2-15: IPFS evidence
  P2-18: Mobile audit
  P2-19: Creator onboarding

Параллельно всегда:
  → Искать 3-5 первых beta creator'ов (devnet OK)
  → Solana Foundation Grant подача
  → Переговоры с аудиторами (Ottersec quote)
```

---

## 🎯 Критерий готовности к первым реальным пользователям

Продукт готов к beta когда:
- [ ] Кампания создаётся с обложкой и acceptance criteria
- [ ] AI верификация запускается и работает < 60s
- [ ] Бэкер может найти кампанию, вложить SOL, видеть токены
- [ ] Creator получает SOL после approved milestone
- [ ] Есть FAQ и ToS
- [ ] Share кампании → красивый preview в Telegram/Twitter
- [ ] Creator может написать update для бэкеров

---

*Qadam Product Roadmap | Апрель 2026*
*Обновлять после каждой итерации*
