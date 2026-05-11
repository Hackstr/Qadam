# Qadam — Guide for AI Coding Assistants

> **Read first:** `QADAM_FOUNDATION.md` in the repo root. That document is the source of truth for what Qadam IS. This document is the source of truth for **how the codebase is organized**.

## What Qadam is (one paragraph)

Crowdfunding on Solana with milestone-gated escrow. Backers commit SOL into an on-chain PDA vault. The community of backers votes on each milestone before funds release. Backers earn ownership points (utility, not equity) proportional to their contribution and timing. The product also includes an AI Companion — a creator-side helper that assists with structuring milestones, drafting updates, and surfacing daily focus. The AI never publishes, never judges milestones, and never decides outcomes — that authority belongs to the community of backers.

If you find yourself writing code that puts AI in a judgment seat, stop. That's the old model. The Foundation rebuild (April 2026) moved verification to the community and reframed AI as a companion. Reread the Foundation if uncertain.

## On-chain mechanic status (May 11, 2026)

Both schema and runtime are Foundation-correct. The AI-judge path has been fully removed:

- **On-chain:** `release_milestone`, `mark_under_human_review`, `admin_override_decision` instructions are gone. `AIProcessing` and `UnderHumanReview` statuses removed from `MilestoneStatus`. No `ai_agent_wallet` on config.
- **Backend:** `verify_milestone`, `build_verification_prompt` deleted. `ai_decision`/`ai_explanation` fields removed from Milestone schema. `ai_verification` Oban queue removed. `sign_transaction.js` only handles `execute_extension_result`.
- **Voting:** `resolve_vote` is permissionless (anyone can call after deadline). Quorum enforcement checks `quorum_bps` against `total_tokens_allocated`. Approval threshold checked via `approval_threshold_bps`. Apathy (no votes) = approval.
- **Admin override:** `AdminController.decide` transitions DB state only (emergency use). No on-chain tx broadcast.

If you find yourself adding AI verification or judgment code, stop. Community votes resolve milestones.

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
├── deploy/                         # Production infrastructure
│   ├── nginx.conf                  # Nginx + SSL config
│   ├── qadam-backend.service       # Systemd service (Phoenix)
│   ├── qadam-frontend.service      # Systemd service (Next.js)
│   ├── deploy.sh                   # Manual deploy script
│   ├── backup-db.sh                # PostgreSQL daily backup
│   └── healthcheck.sh              # Auto-restart on failure
│
├── .github/workflows/deploy.yml    # CI/CD: push main → deploy
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
- **TxBroadcastWorker** — signs and broadcasts on-chain transactions (extension results only post-Foundation). Always fetches fresh blockhash before signing.
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

### CI/CD (automatic)

Push to `main` triggers GitHub Actions (`.github/workflows/deploy.yml`):
1. TypeScript type check
2. SSH to server → `git pull` → build frontend → compile backend → migrate → restart systemd services
3. Healthcheck

GitHub Secrets: `SERVER_IP`, `SSH_PRIVATE_KEY`.

### Manual deploy

```bash
ssh ubuntu@185.22.65.51
cd ~/qadam
./deploy/deploy.sh              # deploy everything
./deploy/deploy.sh frontend     # frontend only
./deploy/deploy.sh backend      # backend only
```

### Production infrastructure

- **Server:** 185.22.65.51 (VPS, Ubuntu)
- **Domain:** qadam.tips (SSL via Let's Encrypt, auto-renew)
- **Nginx:** reverse proxy, `/` → :3000, `/api` → :4000, HTTP→HTTPS redirect
- **Systemd:** `qadam-frontend.service`, `qadam-backend.service` (auto-restart on failure)
- **Environment:** `/home/ubuntu/qadam/.env.production` (single source, loaded via `EnvironmentFile`)
- **DB backups:** `deploy/backup-db.sh` — cron daily 3am, pg_dump, 7 days retention, stored at `~/backups/postgres/`
- **Healthcheck:** `deploy/healthcheck.sh` — cron every 5 min, auto-restarts dead services
- **Logs:** `journalctl -u qadam-backend -f` / `journalctl -u qadam-frontend -f`

### Anchor (devnet)

```bash
cd qadam
anchor deploy --provider.cluster devnet
# Update PROGRAM_ID in .env files after deploy
```

## Where business documentation lives

Code-related docs live here in the repo. Business / product / strategy / customer development / grants documentation lives at `~/AI/qadam-business/`. If you're an AI assistant working on code, you don't usually need that other folder — but if a question is about *why* something is the way it is rather than *how*, the answer probably lives there in `01-foundation/DECISIONS.md`.

## When in doubt

1. Read `QADAM_FOUNDATION.md` first.
2. If the Foundation doesn't answer it, the answer is probably in code — read the relevant context module / Anchor instruction directly.
3. If still unclear, **stop and surface the question** rather than silently making assumptions. The Foundation explicitly invites this: *"If you (Claude Code) disagree with something here — stop and surface it; do not silently deviate."*

---

*Qadam — Guide for AI Coding Assistants. Updated May 11, 2026 — AI-judge removed, quorum enforced, CI/CD + systemd deployed.*
