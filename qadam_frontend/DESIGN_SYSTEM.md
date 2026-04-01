# Qadam — Design System
## Source of truth. Cursor reads this before touching any UI.

> Version 1.0 | April 2026
> Every rule here exists for a reason. Don't break them without discussion.

---

## Philosophy

Qadam is a financial tool for builders. The design must feel:
- **Trustworthy** — people are putting real SOL in here
- **Serious but not cold** — amber warmth prevents it feeling like a bank
- **Minimal, not empty** — remove clutter, not substance

If something looks "playful" or "cute" — it's wrong for this product.

---

## 🚫 Hard Rules (never break)

1. **No emojis. Ever.** Not in UI, not in buttons, not in cards, not in headers.
   Use Lucide React icons instead. Always.

2. **No gradients on text.** Amber gradient text looks like a crypto scam.

3. **No ALL CAPS** except category labels (APPS, GAMES, SAAS...).

4. **No decorative fonts.** Inter only. Geist Mono for addresses/hashes.

5. **No shadows on buttons.** Flat buttons only, hover states via bg color.

6. **No colored borders.** Only black/[opacity] borders.

7. **No stock photo illustrations.** Category gradient covers only (see Cards section).

---

## Colors

```
Primary      #0F1724   Deep Navy   — main text, dark buttons, headers
Accent       #F5A623   Amber       — CTA buttons, progress bars, highlights
Surface      #FAFAF8   Off-white   — page backgrounds
White        #FFFFFF               — card backgrounds
Border       rgba(0,0,0,0.06)      — default borders
BorderHover  rgba(0,0,0,0.12)      — hover borders
MutedText    #6B7280               — secondary text, labels
Success      #22C55E   Green       — approved, completed
Warning      #F59E0B   Yellow      — pending, overdue
Error        #EF4444   Red         — rejected, refunded
```

### Category Colors (cover gradients only)

```
Apps           from #1E3A8A  to #3B82F6   (blue)
Games          from #5B21B6  to #A855F7   (violet)
SaaS           from #065F46  to #10B981   (emerald)
Tools          from #92400E  to #F59E0B   (amber)
Infrastructure from #1E293B  to #475569   (slate)
```

These colors are ONLY used for campaign card cover backgrounds.
Never use them for text, buttons, or backgrounds.

---

## Typography

Font stack: `Inter` for everything. `Geist Mono` for wallet addresses, tx hashes, mint addresses.

### Scale

```
text-xs    12px   — labels, captions, metadata
text-sm    14px   — body secondary, card descriptions
text-base  16px   — body primary
text-lg    18px   — card titles
text-xl    20px   — section headers
text-2xl   24px   — page subheadings
text-3xl   30px   — page headings
text-4xl   36px   — hero section
text-5xl+        — only for landing hero
```

### Weights

```
font-normal    400   — body text
font-medium    500   — labels, nav links
font-semibold  600   — card titles, stats
font-bold      700   — page headings, hero
```

### Rules

- Category labels: `text-xs font-medium uppercase tracking-wider text-muted-foreground`
- Status text: `capitalize` (not uppercase, not lowercase)
- Numbers/amounts: `tabular-nums font-semibold`
- Wallet addresses: `font-mono text-xs`
- Never use italic except for genuine quotes
- Line clamp descriptions at 2 lines on cards

---

## Spacing

Base unit: 4px. Always use Tailwind spacing scale.

```
space-1   4px    — icon gaps, tiny spacing
space-2   8px    — between inline elements
space-3   12px   — form field gaps, tight lists
space-4   16px   — default padding, card internal spacing
space-5   20px   — card padding (p-5)
space-6   24px   — section internal gaps
space-8   32px   — between sections
space-10  40px   — page top padding
space-12  48px   — large section padding
space-16  64px   — landing section gaps
space-20  80px   — hero sections
```

---

## Icons

Library: **Lucide React only.** Already installed. Never use other icon libraries.

### Sizes

```
h-3 w-3   — inline with text (small labels)
h-4 w-4   — default buttons, nav, cards
h-5 w-5   — medium emphasis
h-6 w-6   — large standalone icons
h-8 w-8   — stat cards, feature sections
```

### Colors

```
Default:   text-muted-foreground (gray)
Primary:   text-foreground (dark)
Accent:    text-amber-500
Success:   text-green-500
Error:     text-red-500
OnColor:   text-white (when on dark/colored bg)
```

### Category Icons (for card covers)

Use these specific Lucide icons for each category. White, centered, 40px.

```tsx
import { Smartphone, Gamepad2, BarChart3, Wrench, Globe } from "lucide-react";

const CATEGORY_ICONS = {
  Apps:           Smartphone,
  Games:          Gamepad2,
  SaaS:           BarChart3,
  Tools:          Wrench,
  Infrastructure: Globe,
}
```

---

## Cards

### Campaign Card Cover

```tsx
// Category gradient + Lucide icon. NO emojis. NO stock photos. NO text in cover.

const CATEGORY_COVERS = {
  Apps:           { from: "#1E3A8A", to: "#3B82F6", icon: Smartphone },
  Games:          { from: "#5B21B6", to: "#A855F7", icon: Gamepad2 },
  SaaS:           { from: "#065F46", to: "#10B981", icon: BarChart3 },
  Tools:          { from: "#92400E", to: "#F59E0B", icon: Wrench },
  Infrastructure: { from: "#1E293B", to: "#475569", icon: Globe },
}

// Cover markup:
<div
  className="h-40 rounded-t-2xl flex items-center justify-center"
  style={{
    background: `linear-gradient(135deg, ${cover.from}, ${cover.to})`
  }}
>
  <Icon className="h-10 w-10 text-white opacity-80" />
</div>
```

### Campaign Card Structure

```
┌─────────────────────────────────┐
│ COVER (h-40, gradient + icon)   │  ← rounded-t-2xl
├─────────────────────────────────┤
│ CATEGORY (xs, uppercase)  Status│  ← green/blue/red dot
│ Title (semibold, 15px)          │  ← group-hover: text-amber-600
│ Description (sm, muted, 2 lines)│
│                                 │
│ [spacer flex-1]                 │
│                                 │
│ 37.50 SOL        of 50.00 SOL  │  ← progress numbers
│ ████████████░░░░░░░░ (h-1.5)   │  ← amber progress bar
├─────────────────────────────────┤
│ 👤 42  ○●○○     Genesis        │  ← footer: backers, milestones, tier
└─────────────────────────────────┘
```

### Card Rules

- Background: white
- Border: `border border-black/[0.06]`
- Border radius: `rounded-2xl` (16px)
- Hover border: `border-black/[0.12]`
- Hover shadow: `shadow-[0_2px_20px_rgba(0,0,0,0.06)]`
- Card padding: `p-5` (20px)
- Transition: `transition-all duration-200`
- Hover arrow: `ArrowUpRight` in top-right, opacity-0 → opacity-40 on group-hover

---

## Buttons

### Variants

```tsx
// Primary CTA — amber. Use for main actions (Back Project, Get Started)
<Button className="bg-amber-500 hover:bg-amber-600 text-white">
  Back This Project
</Button>

// Dark — navy. Use for secondary CTAs (Create Campaign, Explore)
<Button className="bg-[#0F1724] hover:bg-[#1a2538] text-white">
  Create Campaign
</Button>

// Outline — for tertiary actions (Add Milestone, Cancel)
<Button variant="outline">
  Add Milestone
</Button>

// Ghost — for navigation-like actions (Back, Edit)
<Button variant="ghost">
  ← Back
</Button>
```

### Sizes

```
size="sm"   h-8  px-3  text-sm   — inline actions, table buttons
size="md"   h-10 px-4  text-sm   — default (most buttons)
size="lg"   h-11 px-6  text-base — main CTAs (hero, sidebar)
```

### Rules

- Always include icon with gap: `className="gap-2"`
- Icon size in buttons: `h-4 w-4`
- Loading state: replace icon with `<Loader2 className="h-4 w-4 animate-spin" />`
- Disabled: no cursor pointer, 50% opacity via Tailwind disabled:
- Never gradient, never shadow, never outlined-amber

---

## Status Indicators

### Dot + Label (for cards, lists)

```tsx
const STATUS_DOTS = {
  active:    "bg-green-500",
  completed: "bg-blue-500",
  refunded:  "bg-red-500",
  paused:    "bg-yellow-500",
  draft:     "bg-gray-400",
}

// Markup:
<div className="flex items-center gap-1.5">
  <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOTS[status]}`} />
  <span className="text-xs text-muted-foreground capitalize">{status}</span>
</div>
```

### Tier Labels (on cards and campaign page)

```tsx
const TIER_DISPLAY = {
  1: { label: "Genesis", color: "text-green-600",  bgColor: "bg-green-500/10" },
  2: { label: "Early",   color: "text-yellow-600", bgColor: "bg-yellow-500/10" },
  3: { label: "Standard",color: "text-gray-500",   bgColor: "bg-gray-500/10" },
}
```

### Milestone Status Icons

```tsx
import { CheckCircle2, Circle, Loader2, Clock, XCircle } from "lucide-react";

approved:      <CheckCircle2 className="text-green-500" />
pending:       <Circle className="text-black/[0.12]" />
submitted:     <Loader2 className="text-amber-500 animate-spin" />
under_review:  <Clock className="text-amber-500" />
rejected:      <XCircle className="text-red-400" />
failed:        <XCircle className="text-red-500" />
```

---

## Borders & Radius

```
Card borders:        border border-black/[0.06]
Input borders:       border border-input (shadcn default)
Dividers:            bg-black/[0.06] h-px  or  w-px h-5 (vertical)
Separators:          <Separator /> (shadcn)

Radius:
  rounded-full    → Header nav pill, tier badges, status dots
  rounded-2xl     → Cards, campaign covers (16px)
  rounded-xl      → Large modals, info cards (12px)
  rounded-lg      → Inputs, select, buttons, smaller cards (8px)
  rounded-md      → Badges, small elements (6px)
```

---

## Layout & Navigation

### Header

Floating centered pill. Fixed position. backdrop-blur.
- Never full-width sticky header
- Links show only when wallet connected (except Discover)
- Wallet button: dark navy pill, 32px height

### Page Layout

```tsx
// Standard page
<div className="container mx-auto px-4 py-10">
  <h1 className="text-3xl font-bold mb-2">Page Title</h1>
  <p className="text-muted-foreground mb-8">Subtitle description.</p>
  {/* content */}
</div>

// Max width for forms/single column
<div className="container mx-auto px-4 py-10 max-w-3xl">

// Max width for wide content
<div className="container mx-auto px-4 py-10 max-w-5xl">
```

### Grid Systems

```
Campaign grid:    grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6
Campaign detail:  grid-cols-1 lg:grid-cols-3 gap-8 (2+1 layout)
Stats grid:       grid-cols-2 md:grid-cols-4 gap-4
```

---

## Empty States

Always provide empty states. Never leave a blank page.

```tsx
// Standard empty state
<div className="text-center py-20">
  <Icon className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
  <p className="text-lg font-medium mb-1">Nothing here yet</p>
  <p className="text-sm text-muted-foreground mb-6">
    Helpful description of what to do next.
  </p>
  <Button>Primary Action</Button>
</div>
```

---

## Do's and Don'ts

### ✅ Do

- Use Lucide icons consistently at the right size
- Use amber-500 for the ONE main CTA per page
- Keep card descriptions at max 2 lines (line-clamp-2)
- Show loading states with Loader2 animate-spin
- Use tabular-nums for all numeric amounts
- Use toast notifications for all async operations (sonner)
- Keep milestone status text to 1-2 words max

### ❌ Don't

- Use emojis anywhere in the UI
- Use gradients on text
- Use colored backgrounds except for category covers
- Stack multiple amber elements on one screen
- Use different card layouts on the same grid
- Show raw Solana addresses without truncation (use slice(0,4)...slice(-4))
- Show loading as a full page spinner — use skeleton or inline spinner
- Use generic placeholder text like "Loading..." — use context ("Fetching campaigns...")

---

## Component Reference

These components are available in `/src/components/ui/` (shadcn/ui):

```
Button, Input, Textarea, Card/CardContent/CardHeader/CardTitle
Badge, Progress, Separator, Tabs/TabsList/TabsTrigger/TabsContent
Dialog, Avatar
```

Custom components in `/src/components/`:
```
campaign/CampaignCard       — card with cover gradient + Lucide icon
campaign/MilestoneTimeline  — milestone list with status icons
layout/Header               — floating pill nav
layout/Footer               — minimal footer
wallet/WalletProvider       — Solana wallet context
```

---

*Qadam Design System v1.0 | April 2026*
*Update this document before changing any design patterns.*
