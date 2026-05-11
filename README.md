# Qadam — Crowdfunding on Solana

[![Solana](https://img.shields.io/badge/Solana-devnet-9945FF)](https://solana.com)
[![Anchor](https://img.shields.io/badge/Anchor-0.31.1-blue)](https://www.anchor-lang.com)
[![Elixir](https://img.shields.io/badge/Elixir-1.18-purple)](https://elixir-lang.org)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

> Crowdfunding where progress unlocks funding. Backers' SOL stays in escrow. The community of backers votes on each milestone before funds release. Creators get paid for real progress.

**Live devnet:** [qadam.tips](https://qadam.tips)
**Solana program (devnet):** `4bummNmZFSwyRgwnfPHG6B9JPC8K6BigXgQYxoVKBcXj`

---

## What this is

A crowdfunding platform built on a simple principle: money should follow progress, not promises.

When a backer commits SOL, it goes into an on-chain vault — not the creator's wallet. The creator submits evidence as they hit each milestone. The community of backers (only those who actually backed the campaign) votes on whether the evidence demonstrates real progress. Approve releases that milestone's funds. Reject sends the creator back to revise. Refund returns SOL to backers if the project stalls.

The creator defines the rules of their own campaign — number of milestones, voting periods, quorum requirements, tier rewards for early backers — within constraints the platform enforces. Qadam holds the rules of the system; creators choose the values.

There's also an **AI Companion** built into the product, but it never judges milestones — that's the community's job. The AI sits on the creator's side as a partner: helping turn vague ideas into clear milestones with measurable acceptance criteria, drafting campaign updates when stuck, surfacing today's most important focus when a deadline approaches.

## Core mechanics

**Escrow.** Each campaign has its own Program Derived Address (PDA) holding native SOL. Funds aren't pooled across campaigns. Qadam team has no key to any vault — only the Anchor program can release SOL, and only by following the rules.

**Community voting.** Only backers of a campaign can vote on that campaign. Voting weight equals their ownership points (= sol_contributed × tier_multiplier_at_backing_time), locked at the moment of backing. Vote parameters (period, quorum, threshold) are configured by the creator at campaign creation and locked at launch.

**Ownership points (utility, not equity).** Backers earn points proportional to contribution and timing. Points give voting weight during the campaign and a claim on project tokens at completion. They are not equity, not securities, no promise of profit.

**AI Companion.** Four surfaces: Daily Nudge (dashboard), Evidence Outline (in submit), Update Draft (in post update), Ask AI Panel (sticky sidebar). Helps creators ship; never publishes, never judges, never decides outcomes.

## Why Solana

Sub-second finality means milestone releases feel immediate. ~$0.00025 per transaction makes 0.1 SOL micro-backings economically viable. SPL token standard with PDA mint authority covers the project token mechanic without custom infrastructure. Anchor's account model enables atomic multi-instruction transactions cleanly.

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                        Next.js Frontend                          │
│  Landing · Discover · Create wizard · Campaign · Portfolio       │
│  Profile · Dashboard · AI Companion (4 surfaces)                 │
│  Solana Wallet Adapter · Anchor Client · React Query · Zustand   │
└────────────────┬──────────────────────┬──────────────────────────┘
                 │ REST API             │ Anchor RPC
                 ▼                      ▼
┌────────────────────────┐    ┌────────────────────────────┐
│   Phoenix Backend      │    │   Solana Program (Anchor)  │
│                        │    │                            │
│  Auth (SIWS + JWT)     │    │  Campaign PDA + Vault PDA  │
│  Profile context       │    │  Per-campaign tier_config  │
│  Campaigns context     │    │  Per-campaign voting params│
│  Voting context        │    │  SPL Token Mint (PDA auth) │
│  AI Companion (Oban)   │    │  Integer-only math (u128)  │
│  Sync workers          │    │  Custom error codes        │
│                        │    └────────────────────────────┘
│  PostgreSQL            │
└────────────────────────┘
```

## Tech stack

| Layer | Technology |
|-------|-----------|
| Smart contract | Rust · Anchor 0.31.1 · Solana |
| Backend API | Elixir 1.18 · Phoenix 1.8 · Oban · Joken |
| Frontend | Next.js 16 · React 19 · TailwindCSS · shadcn/ui |
| AI Companion | Anthropic Claude API (claude-sonnet-4-20250514) |
| Database | PostgreSQL |
| State | Zustand · TanStack React Query |
| Wallet | Solana Wallet Adapter (Phantom, Solflare, etc.) |
| Deploy | Nginx · Let's Encrypt · Systemd |

## Project structure

```
Qadam/
├── qadam/                          # Anchor program (Solana smart contract)
│   ├── programs/qadam/src/
│   │   ├── lib.rs                  # Instruction entry point
│   │   ├── instructions/           # Instruction handlers
│   │   ├── state/                  # Account structs
│   │   └── helpers/                # math.rs (u128), release.rs
│   └── tests/qadam.ts
│
├── qadam_backend/                  # Elixir/Phoenix API
│   ├── lib/qadam_backend/
│   │   ├── campaigns/              # Campaign CRUD & discovery
│   │   ├── milestones/             # State machine + audit log
│   │   ├── backers/                # Positions & portfolio
│   │   ├── voting/                 # Community vote resolution
│   │   ├── ai/                     # AI Companion (4 surfaces)
│   │   ├── reputation/             # Creator scoring
│   │   └── workers/                # Oban: sync, AI digest, deadline monitor
│   └── lib/qadam_backend_web/
│
├── qadam_frontend/                 # Next.js client
│   ├── src/app/                    # App Router routes
│   ├── src/components/             # shadcn/ui + custom
│   ├── src/hooks/                  # useQadamProgram, useProfile, useAutoAuth
│   └── src/lib/                    # Anchor client + REST API
│
├── deploy/                         # Production infra (nginx, systemd, CI/CD, backups)
├── .github/workflows/deploy.yml    # CI/CD: push main → auto-deploy
├── README.md                       # This file
├── CLAUDE.md                       # Guide for AI coding assistants
└── QADAM_FOUNDATION.md             # Source of truth for what Qadam IS
```

## Single source of truth

`QADAM_FOUNDATION.md` is the authoritative document for what Qadam is and how it works. Every screen, every backend service, every Anchor instruction must align with it. If a part of the codebase contradicts the Foundation — fix the code, not the document.

Business and product documentation (vision, roadmap, customer development, grants) lives separately at `~/AI/qadam-business/` to keep the code repo focused on code.

## Quick start

**Prerequisites:** Node.js 18+, Rust, Anchor CLI 0.31.1, Solana CLI, Elixir 1.18+, PostgreSQL

### Smart contract

```bash
cd qadam
anchor build
anchor test
# Deploy to devnet (needs ~4 SOL)
anchor deploy --provider.cluster devnet
```

### Backend

```bash
cd qadam_backend
mix deps.get
mix ecto.create && mix ecto.migrate
mix phx.server  # → http://localhost:4000
```

Required env vars: `DATABASE_URL`, `SOLANA_RPC_URL`, `SOLANA_PROGRAM_ID`, `ANTHROPIC_API_KEY`, `JWT_SECRET`, `SECRET_KEY_BASE`.

### Frontend

```bash
cd qadam_frontend
npm install
npm run dev  # → http://localhost:3000
```

Required env vars (`.env.local`): `NEXT_PUBLIC_SOLANA_NETWORK`, `NEXT_PUBLIC_SOLANA_RPC_URL`, `NEXT_PUBLIC_PROGRAM_ID`, `NEXT_PUBLIC_API_URL`.

## Status (May 11, 2026)

**Schema and runtime fully Foundation v1.** AI-judge path removed. Community voting resolves milestones on-chain with quorum enforcement.

- ✅ Foundation v1 schema rebuild (8 blocks shipped April)
- ✅ Anchor program deployed on devnet with per-campaign tier_config + voting params
- ✅ Community voting: `cast_vote` → `resolve_vote` (permissionless, quorum + threshold enforced)
- ✅ AI-judge remnants fully removed (no `release_milestone`, no `AIProcessing`, no `verify_milestone`)
- ✅ Backend service layer + AI Companion (Daily Nudge, Evidence Outline, Update Draft, Ask AI Panel)
- ✅ Frontend: 5-step create wizard, read-side updates, marketing pages aligned to Foundation
- ✅ Visual identity refresh: forest green palette + warm cream background (May 2026)
- ✅ Production deployment with SSL, systemd, CI/CD (GitHub Actions), DB backups, healthchecks
- ✅ Admin wallet whitelist (multi-admin support)
- ⏳ Mainnet deployment (Q2 2026)
- ⏳ External code review
- ⏳ First real concierge campaigns

## License

MIT

---

*Qadam — Build step by step.*
