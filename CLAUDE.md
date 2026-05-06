# Qadam — Guide for AI Coding Assistants

> **Read first:** `QADAM_FOUNDATION.md` in the repo root. That document is the source of truth for what Qadam IS. This document is the source of truth for **how the codebase is organized**.

## What Qadam is (one paragraph)

Crowdfunding on Solana with milestone-gated escrow. Backers commit SOL into an on-chain PDA vault. The community of backers votes on each milestone before funds release. Backers earn ownership points (utility, not equity) proportional to their contribution and timing. The product also includes an AI Companion — a creator-side helper that assists with structuring milestones, drafting updates, and surfacing daily focus. The AI never publishes, never judges milestones, and never decides outcomes — that authority belongs to the community of backers.

If you find yourself writing code that puts AI in a judgment seat, stop. That's the old model. The Foundation rebuild (April 2026) moved verification to the community and reframed AI as a companion. Reread the Foundation if uncertain.

## Important: On-chain mechanic vs schema (May 6, 2026)

The schema is Foundation-correct (per-campaign `tier_config`, `vote_period_days`, `quorum_bps`, `approval_threshold_bps` are stored on `Campaign`). **The mechanic that consumes them is not yet rebuilt.** Today the on-chain `release_milestone` instruction is signed by `ai_agent_wallet`, `mark_under_human_review` and `admin_override_decision` instructions exist, the `MilestoneStatus` enum still contains `AIProcessing` and `UnderHumanReview`, and the Elixir `AIVerificationWorker` actively consumes submitted evidence and triggers releases via Claude API decisions.

The full rebuild is specified at `~/AI/qadam-business/02-strategy/voting-redesign-spec.md` and the Pass A mega-prompt at `.claude-prompts/MEGAPROMPT_BLOCK1_PASS_A_ANCHOR.md`. Until those execute, the production mechanic is hybrid — schema talks Foundation, runtime still talks AI-judge. New code should be written for the Foundation target (community votes resolve milestones), not for the hybrid present. If you find yourself adding to the AI verification path, stop and surface it.

## Project structure

```
Qadam/
├── qadam/                          # Anchor program (Solana smart contract)
│   ├── programs/qadam/src/
│   │   ├── lib.rs                  # Instruction entry point
│   │   ├── instructions/           # Instruction handlers
│   │   ├── state/                  # Account structs
│   │   ├── helpers/                # math.rs, release.rs (shared logic)
│   │   ├── constants.rs            # Protocol parameters
│   │   └── errors.rs               # Custom error codes
│   ├── tests/qadam.ts              # Integration tests
│   └── Anchor.toml
│
├── qadam_backend/                  # Elixir/Phoenix API
│   ├── lib/qadam_backend/          # DDD contexts
│   │   ├── campaigns/              # Campaign CRUD, discovery
│   │   ├── milestones/             # State machine + audit log
│   │   ├── backers/                # Positions, portfolio
│   │   ├── voting/                 # Community vote resolution
│   │   ├── ai/                     # AI Companion: nudges, drafts, chat
│   │   └── workers/                # Oban: sync, digest, deadline monitor
│   ├── lib/qadam_backend_web/      # Phoenix controllers, router
│   ├── priv/repo/migrations/
│   └── priv/solana/                # Node.js helpers for transaction signing
│
├── qadam_frontend/                 # Next.js client
│   ├── src/app/                    # App Router pages
│   ├── src/components/             # shadcn/ui + custom
│   ├── src/hooks/
│   │   ├── use-qadam-program.ts    # ALL on-chain calls go through here
│   │   ├── useProfile.ts
│   │   └── useAutoAuth.ts
│   ├── src/lib/
│   │   ├── program.ts              # Anchor client, PDA derivation
│   │   ├── api.ts                  # REST API + sync functions
│   │   └── evidence.ts             # SHA-256 of content
│   └── src/stores/                 # Zustand
│
├── README.md                       # Public-facing project description
├── CLAUDE.md                       # This file
└── QADAM_FOUNDATION.md             # Source of truth for product semantics
```

## Anchor program

**Build:** `cd qadam && anchor build`
**Test:** `cd qadam && anchor test`
**Deploy:** `cd qadam && anchor deploy --provider.cluster devnet`

### Architecture rules (load-bearing — do not violate)

- **No floating point.** Solana validators may produce different float results. Use `checked_mul` / `checked_div` with u128 intermediates for large multiplications. All percentages stored as basis points (bps) — 2.5% = 250 bps.
- **Vault is a System Account PDA**, not a token account. Native SOL only. Seeds: `["vault", campaign_pubkey]`.
- **Campaign PDA = SPL token mint authority.** Only the program can mint project tokens. Seeds: `["campaign", creator, nonce]`.
- **Lazy token minting.** Tokens are allocated on backing (rights stored in BackerPosition), minted on claim after milestone approval. Refunds simply skip un-minted tokens.
- **Vote weight comes from BackerPosition.points**, not token account balance. Cannot be Sybil-attacked by splitting wallets — one BackerPosition per (campaign, wallet).
- **Tier config and voting params are per-campaign.** Stored on the Campaign account, locked at launch. Don't hardcode tier multipliers or voting thresholds anywhere outside the campaign account.
- **Fee deducted FROM milestone amount**, not added on top. 2.5% to treasury, 97.5% to creator on release.
- **Community votes resolve milestones.** AI does not call `release_milestone`. Vote resolution checks quorum + threshold (both per-campaign), then triggers release.
- **Fresh blockhash per transaction.** Never cache. Always fetch immediately before signing.
- **Account close + rent reclaim** when campaigns reach terminal status. Use `#[account(close = destination)]`.

### Key instructions

The program's instruction set centers around the campaign lifecycle: create_campaign, back_campaign, increase_backing, submit_milestone_evidence, cast_vote, resolve_vote (releases on approve), claim_tokens, claim_refund, request_extension, vote_on_extension, execute_extension_result, close_backer_position, close_campaign, plus admin instructions (initialize_config, set_paused). Read the actual program source for the canonical list — it changes as we evolve.

## Elixir backend

**Run:** `cd qadam_backend && mix phx.server`
**Test:** `cd qadam_backend && mix test`
**Migrate:** `cd qadam_backend && mix ecto.migrate`

### DDD contexts

- **Campaigns** — CRUD, discovery, filtering by category/tag, story split (problem/solution/why_now/background/risks)
- **Milestones** — state machine with validated transitions + audit log
- **Backers** — positions (one per campaign+wallet), portfolio queries
- **Voting** — vote resolution: quorum check, threshold check, downstream release trigger
- **AI** — Companion: companion_nudges, companion_conversations, companion_messages tables
- **Reputation** — creator score (placeholder, not actively scored yet)

### Oban workers

- **CompanionDigestWorker** — daily cron at 9am creator-local-time, generates Daily Nudge for active campaigns. Dedup window of 20 hours.
- **TxBroadcastWorker** — signs and broadcasts on-chain transactions (e.g. release after vote resolution). Always fetches fresh blockhash before signing.
- **TxConfirmationWorker** — polls until finality, updates state.
- **DeadlineMonitorWorker** — cron every 5 min, transitions overdue milestones into grace period or extension flow.
- **Sync workers** — keep Postgres in sync with on-chain state via webhooks.

### Conventions

- All Anthropic API calls flow through `qadam_backend/lib/qadam_backend/ai/` — model: `claude-sonnet-4-20250514`.
- Action_fallback for error handling in controllers.
- Always `Repo.preload` associations before accessing them.
- Never `String.to_atom/1` on user input.

## Next.js frontend

**Dev:** `cd qadam_frontend && npm run dev`
**Build:** `cd qadam_frontend && npx next build`
**Type check:** `cd qadam_frontend && npx tsc --noEmit` (must show 0 errors after any change)

### Critical rule

**All on-chain transactions go through the `useQadamProgram()` hook** in `src/hooks/use-qadam-program.ts`. Components never call Anchor directly. The hook owns the connection, the wallet adapter integration, the program ID, and the IDL. Bypassing it leads to inconsistencies and broken transactions.

### Pages (App Router)

- `/` — Landing
- `/discover` — Campaign discovery with filters (category, tags, sort)
- `/campaigns/[id]` — Campaign detail (story split, milestones with acceptance criteria, tier config, voting rules)
- `/campaigns/[id]/back` — Backing flow
- `/create` — 5-step wizard (gated by profile setup)
- `/dashboard` — Creator dashboard with Daily Nudge
- `/dashboard/[id]` — Specific campaign management
- `/portfolio` — Backer portfolio (positions, vote actions, claim tokens, claim refund)
- `/profile/[wallet]` — Public creator profile
- `/profile/edit` — Edit own profile
- `/settings` — Account settings

### Conventions

- `"use client"` for components with state, hooks, or wallet integration
- React Query for server state, Zustand only for auth state
- shadcn/ui base components, no Lucide-React for icons (only)
- No emoji in product UI. Ever. Use Lucide icons.
- Buttons: amber primary (`bg-amber-500`), navy secondary (`bg-[#0F1724]`), outline tertiary
- Cards: `border border-black/[0.06] rounded-2xl`
- Toast notifications via sonner for all async operations
- Always have empty states — never blank pages

## Deploy

### Anchor (devnet)

```bash
cd qadam
anchor deploy --provider.cluster devnet
# Update PROGRAM_ID in .env files after deploy
```

### Backend (production)

The current production runs on a VPS with nginx + systemd. Configs live in `deploy/`. Backend service: `qadam-backend.service`. Reverse proxy routes `/api` → port 4000.

```bash
MIX_ENV=prod mix deps.get --only prod
MIX_ENV=prod mix compile
MIX_ENV=prod mix ecto.migrate
MIX_ENV=prod mix phx.server
```

### Frontend (production)

```bash
cd qadam_frontend
npm install
NODE_ENV=production npx next build
npx next start -p 3000
```

## Where business documentation lives

Code-related docs live here in the repo. Business / product / strategy / customer development / grants documentation lives at `~/AI/qadam-business/`. If you're an AI assistant working on code, you don't usually need that other folder — but if a question is about *why* something is the way it is rather than *how*, the answer probably lives there in `01-foundation/DECISIONS.md`.

## When in doubt

1. Read `QADAM_FOUNDATION.md` first.
2. If the Foundation doesn't answer it, the answer is probably in code — read the relevant context module / Anchor instruction directly.
3. If still unclear, **stop and surface the question** rather than silently making assumptions. The Foundation explicitly invites this: *"If you (Claude Code) disagree with something here — stop and surface it; do not silently deviate."*

---

*Qadam — Guide for AI Coding Assistants. Updated April 30, 2026 after Foundation v1 ship.*
