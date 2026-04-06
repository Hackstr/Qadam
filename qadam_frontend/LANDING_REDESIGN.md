# Qadam Landing Page — Редизайн
## Инструкция для Claude Code / Cursor

Файл: `qadam_frontend/src/app/page.tsx`

Читай DESIGN_SYSTEM.md перед тем как делать что-либо.
Светлая цветовая схема. Никаких тёмных фонов в секциях (кроме существующего Stats блока).

---

## ОБЩИЙ ПРИНЦИП

Сейчас всё выглядит плоско и generic. Три вещи которые это исправят:
1. Dot grid background в hero — texture без noise
2. H1 крупнее, больше visual weight
3. Campaign card с настоящей глубиной (shadow, glow, rotation)

Framer Motion уже установлен. Все анимации сохранить.

---

## СЕКЦИЯ 1: HERO

### Что меняем

**Background героя** — добавить subtle dot grid pattern поверх белого фона.
Реализация: SVG pattern как background-image через inline style или className.

```tsx
// Добавить на секцию hero:
<section
  className="relative container mx-auto px-4 pt-20 pb-8 md:pt-28 md:pb-12 overflow-hidden"
  style={{
    backgroundImage: `radial-gradient(circle, rgba(0,0,0,0.06) 1px, transparent 1px)`,
    backgroundSize: '24px 24px',
  }}
>
  {/* Fade bottom — dot grid не должен залезать в следующую секцию */}
  <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent pointer-events-none" />
  ...content...
</section>
```

**H1 — увеличить размер:**
- Было: `text-4xl md:text-5xl`
- Стало: `text-5xl md:text-6xl lg:text-7xl`
- tracking: `tracking-tight`
- leading: `leading-[1.1]`

**Campaign Card (HeroCampaignMock) — добавить depth:**

```tsx
// Обернуть карточку в ambient glow контейнер
<div className="relative w-full max-w-sm mx-auto">
  {/* Ambient amber glow позади карточки */}
  <div className="absolute inset-0 -m-8 bg-amber-500/10 rounded-3xl blur-3xl" />

  {/* Сама карточка */}
  <div className="relative">
    <HeroCampaignMock />
  </div>
</div>
```

**Карточка внутри HeroCampaignMock:**
- Было: `shadow-[0_8px_40px_rgba(0,0,0,0.10)]`
- Стало: `shadow-[0_20px_60px_rgba(0,0,0,0.14)] ring-1 ring-black/[0.04]`
- Rotation оставить: `-rotate-[1deg]`

**Floating badges — glassmorphism:**
```tsx
// Badge 1 (AI Verified) — было: bg-amber-50 border-amber-200
// Стало:
className="absolute -top-6 left-2 z-10 bg-white/90 backdrop-blur-sm border border-amber-200/60 rounded-full px-3 py-1.5 flex items-center gap-1.5 shadow-[0_4px_16px_rgba(0,0,0,0.08)] -rotate-[6deg]"

// Badge 2 (Escrow) — оставить тёмным, только улучшить shadow:
className="absolute -bottom-5 right-0 z-10 bg-[#0F1724] text-white rounded-full px-3 py-1.5 flex items-center gap-1.5 shadow-[0_4px_20px_rgba(15,23,36,0.25)] rotate-[4deg]"
```

**Grid layout hero:**
- Было: `grid-cols-1 lg:grid-cols-2 gap-12`
- Стало: `grid-cols-1 lg:grid-cols-[1fr_420px] gap-16 items-center`

---

## СЕКЦИЯ 2: HOW IT WORKS — Полный редизайн

Текущий вариант (4 маленькие иконки) убрать полностью. Заменить на numbered steps.

### Новый дизайн

```tsx
<motion.section className="py-20 md:py-24 bg-white">
  <div className="container mx-auto px-4">
    <motion.h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
      How It Works
    </motion.h2>
    <motion.p className="text-muted-foreground text-center mb-16 max-w-lg mx-auto">
      Four steps from idea to funded. AI handles verification so you don't have to trust anyone.
    </motion.p>

    <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-4">
      {steps.map((step, idx) => (
        <div
          key={step.title}
          className={`
            relative rounded-2xl p-6 border transition-all
            ${step.highlight
              ? 'bg-amber-500 text-white border-amber-400'
              : 'bg-white border-black/[0.06] hover:border-black/[0.12] hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)]'
            }
          `}
        >
          {/* Большой номер */}
          <div className={`
            text-5xl font-bold mb-4 leading-none
            ${step.highlight ? 'text-white/30' : 'text-black/[0.06]'}
          `}>
            0{idx + 1}
          </div>

          {/* Иконка */}
          <step.icon className={`h-6 w-6 mb-3 ${step.highlight ? 'text-white' : 'text-amber-500'}`} />

          {/* Title */}
          <h3 className={`font-semibold text-base mb-2 ${step.highlight ? 'text-white' : ''}`}>
            {step.title}
          </h3>

          {/* Description */}
          <p className={`text-sm leading-relaxed ${step.highlight ? 'text-white/80' : 'text-muted-foreground'}`}>
            {step.desc}
          </p>

          {/* Arrow connector (desktop) */}
          {idx < 3 && (
            <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 z-10">
              <div className="w-6 h-6 rounded-full bg-white border border-black/[0.06] flex items-center justify-center shadow-sm">
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  </div>
</motion.section>
```

Данные для steps:
```tsx
const steps = [
  {
    icon: PenLine,
    title: "Create",
    desc: "Define your project, milestones, and funding goal. Set acceptance criteria for each stage.",
    highlight: false,
  },
  {
    icon: Users,
    title: "Fund",
    desc: "Backers send SOL directly to a smart contract escrow. Not to you — to the contract.",
    highlight: false,
  },
  {
    icon: ScanSearch,
    title: "AI Verifies",
    desc: "Submit evidence. Claude AI evaluates your milestone in under 60 seconds. Objective, instant.",
    highlight: true, // amber card
  },
  {
    icon: Banknote,
    title: "Release",
    desc: "Approved? SOL automatically transfers to the creator. Rejected? Backers vote on next steps.",
    highlight: false,
  },
]
```

---

## СЕКЦИЯ 3: WHY QADAM — Переработать layout

Убрать вертикальный list с маленькими иконками. Заменить на 2-column grid.

```tsx
<motion.section className="bg-[#FAFAF8] py-20 md:py-24">
  <div className="container mx-auto px-4 max-w-5xl">
    <motion.h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
      Why Qadam
    </motion.h2>
    <motion.p className="text-muted-foreground text-center mb-16 max-w-lg mx-auto">
      Built for builders who want accountability, not just capital.
    </motion.p>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {features.map((f) => (
        <motion.div
          key={f.title}
          className="bg-white rounded-2xl p-6 border border-black/[0.06] hover:border-black/[0.10] hover:shadow-[0_4px_24px_rgba(0,0,0,0.06)] transition-all"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center mb-4">
            <f.icon className="h-5 w-5 text-amber-500" />
          </div>
          <h3 className="font-semibold text-base mb-2">{f.title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
        </motion.div>
      ))}
    </div>
  </div>
</motion.section>
```

Фон секции: `#FAFAF8` (off-white) — чуть отличается от белого.
Иконки в квадратных `bg-amber-500/10` контейнерах — это правильно для feature grid.

---

## СЕКЦИЯ 4: ACTIVE CAMPAIGNS — Добавить stats header

Перед grid карточек добавить строку с живыми цифрами платформы:

```tsx
<motion.div className="flex items-center justify-between mb-8">
  <div>
    <h2 className="text-2xl font-bold mb-1">Active Campaigns</h2>
    {/* Если есть данные — показать stats */}
    <p className="text-sm text-muted-foreground">
      {campaigns.length} campaigns · {/* total raised */} SOL raised
    </p>
  </div>
  <Link href="/campaigns" className="text-sm text-amber-600 hover:text-amber-700 font-medium flex items-center gap-1">
    View all <ArrowRight className="h-3.5 w-3.5" />
  </Link>
</motion.div>
```

Grid карточек — добавить stagger animation (уже есть, проверить что работает).

---

## СЕКЦИЯ 5: STATS — Добавить brief context под цифрами

Было: только цифра + label
Стало: цифра + label + краткий context (grey, smaller)

```tsx
const stats = [
  { value: "2.5%", label: "Platform fee", context: "vs 8-10% on Kickstarter" },
  { value: "< 60s", label: "AI verification", context: "Claude evaluates evidence" },
  { value: "Free", label: "For first 20 creators", context: "No fee on first campaign" },
  { value: "100%", label: "On-chain", context: "Every decision verifiable" },
]

// В разметке добавить:
<p className="text-xs text-gray-500 mt-1">{stat.context}</p>
```

---

## СЕКЦИЯ 6: CTA — Дифференцировать Creator vs Backer

Было: одна кнопка "Start a Campaign"
Стало: две колонки — для creator и для backer

```tsx
<motion.section className="py-20 md:py-24">
  <div className="container mx-auto px-4 max-w-4xl">
    <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Ready to start?</h2>
    <p className="text-muted-foreground text-center mb-12 max-w-md mx-auto">
      Whether you're building something or looking for early opportunities.
    </p>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Creator card */}
      <div className="bg-[#0F1724] rounded-2xl p-8 text-white">
        <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center mb-4">
          <PenLine className="h-5 w-5 text-amber-400" />
        </div>
        <h3 className="text-xl font-bold mb-2">I'm a Creator</h3>
        <p className="text-sm text-gray-400 mb-6 leading-relaxed">
          Launch a campaign, set milestones, and get funded as you deliver real results.
        </p>
        <Link href="/create">
          <Button className="gap-2 bg-amber-500 hover:bg-amber-600 text-white w-full">
            Start a Campaign <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>

      {/* Backer card */}
      <div className="bg-white rounded-2xl p-8 border border-black/[0.06]">
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center mb-4">
          <Coins className="h-5 w-5 text-amber-500" />
        </div>
        <h3 className="text-xl font-bold mb-2">I'm a Backer</h3>
        <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
          Discover projects, back milestones, and receive tokens as the project grows.
        </p>
        <Link href="/campaigns">
          <Button variant="outline" className="gap-2 w-full border-black/[0.15]">
            Explore Campaigns <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  </div>
</motion.section>
```

---

## РИТМ СЕКЦИЙ (порядок и фоны)

```
1. Hero              — белый + dot grid background
2. How It Works      — белый
3. Why Qadam         — #FAFAF8 (off-white, еле-еле отличается)
4. Active Campaigns  — белый
5. Stats             — #0F1724 dark navy (не менять, хорошо)
6. CTA               — белый
```

---

## ЧТО НЕ ТРОГАТЬ

- Framer Motion анимации (fadeUp, stagger, whileInView) — сохранить все
- Логика `ActiveCampaignsSection` (fetch из API) — сохранить
- Campaign cards (`CampaignCard` компонент) — не менять
- Цвета из DESIGN_SYSTEM.md — строго соблюдать
- Header и Footer — не трогать
