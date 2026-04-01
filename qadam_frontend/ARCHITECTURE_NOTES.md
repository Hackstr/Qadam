# Qadam — Architectural Decisions & UX Notes
## Апрель 2026 — после UX аудита

---

## Навигация — обновлённая структура

**Текущая:** Discover | Create | Dashboard | Portfolio

**Новая:**
```
Discover | Create | My Campaigns | My Backed | Analytics
```

- `My Campaigns` — creator panel (управление кампаниями, submit evidence)
- `My Backed` — backer panel (инвестиции, claim tokens, claim refund)
- `Analytics` — платформенная аналитика (GMV, active campaigns, AI decisions)

**НЕ нужен Профиль** для хакатона.
- В web3: wallet = identity. Пустой профиль хуже чем его отсутствие.
- Creator info = Dashboard (My Campaigns)
- Backer info = Portfolio (My Backed)
- После хакатона: /profile/[wallet] с reputation score

---

## Campaign Detail Page — что добавить

### Must Have (для хакатона)

1. **Cover hero** вверху страницы
   - Category gradient block (как в карточках)
   - Иконка Lucide centered, белая
   - Category label + status pill на cover
   - Высота: h-48 или h-56

2. **← Back navigation**
   ```tsx
   <Link href="/campaigns" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
     <ArrowLeft className="h-4 w-4" />
     Back to Discover
   </Link>
   ```

3. **Creator wallet → Solana Explorer link**
   ```tsx
   <a href={`https://explorer.solana.com/address/${campaign.creator_wallet}`} target="_blank">
     {campaign.creator_wallet.slice(0,4)}...{campaign.creator_wallet.slice(-4)}
     <ExternalLink className="h-3 w-3 inline ml-1" />
   </a>
   ```

4. **Social share кнопка**
   ```tsx
   // Twitter/X share
   const tweetText = `Just backed "${campaign.title}" on @QadamProtocol! SOL stays in escrow until AI verifies milestones.`;
   const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(currentUrl)}`;
   ```

### Nice to Have (после хакатона)

5. Update Feed от creator'а (посты о прогрессе)
6. Countdown timer до следующего milestone deadline
7. "X days to go" для funding period
8. Copy mint address button

---

## Hero Section — Split Layout

**Структура:**
```
Left (col-span-2): текст + CTA buttons
Right (col-span-3): visual — campaign card mock
```

**Декоративные элементы — Вариант A (рекомендуется):**
Floating pill badges над/вокруг campaign card:

```tsx
// Floating badges с rotation
<div className="relative">
  {/* Floating badge 1 */}
  <div className="absolute -top-4 -left-6 bg-amber-500/10 border border-amber-200 rounded-full px-3 py-1 text-xs font-medium text-amber-700 rotate-[-6deg] shadow-sm">
    ✓ AI Verified in 23s
  </div>

  {/* Floating badge 2 */}
  <div className="absolute -bottom-3 -right-4 bg-[#0F1724]/5 border border-black/10 rounded-full px-3 py-1 text-xs font-medium text-foreground rotate-[4deg] shadow-sm">
    🔒 Escrow protected
  </div>

  {/* Campaign card mock */}
  <div className="bg-white border border-black/[0.06] rounded-2xl overflow-hidden shadow-[0_8px_40px_rgba(0,0,0,0.08)] rotate-[-1deg]">
    ...
  </div>
</div>
```

**Место для картинки:**
Хаким будет вставлять картинку в левую или правую часть hero.
Оставить placeholder `<div>` с min-height и border-dashed для будущей картинки.

---

## Analytics Dashboard — что показывать

Для demo судьям. Должно выглядеть как живая платформа.

```
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  GMV Total   │ │  Campaigns   │ │  AI Decisions│ │  Avg Success │
│  $125,000    │ │  14 active   │ │  47 approved │ │    Rate 78%  │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘

Recent Activity Feed:
[timestamp] Campaign "ChainQuest" — Milestone 2 AI APPROVED — 20 SOL released
[timestamp] New backer: 0x1234...5678 backed "Nomad Finance" — 2 SOL
[timestamp] Campaign "InvoiceFlow" — Milestone 1 SUBMITTED — under AI review

Recent Campaigns (last 5)
Campaign funding chart (bar chart)
```

Данные берутся из PostgreSQL через Phoenix API.

---

## Rename Map

| Было | Стало | Route |
|------|-------|-------|
| Dashboard | My Campaigns | /my-campaigns |
| Portfolio | My Backed | /my-backed |
| — (new) | Analytics | /analytics |

Или сохранить routes как есть но изменить:
- `/dashboard` → "My Campaigns" (label change only)
- `/portfolio` → "My Backed" (label change only)  
- `/analytics` → новая страница

---

*Architectural Notes | Qadam | Апрель 2026*
