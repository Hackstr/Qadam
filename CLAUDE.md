# Qadam — Project Guide

## What is this

Decentralized crowdfunding on Solana with AI milestone verification. Backers' SOL goes to escrow, Claude AI verifies milestone completion, tokens represent backer equity.

## Project structure

```
Qadam/
├── qadam/                    # Anchor program (Solana smart contract)
│   ├── programs/qadam/src/   # Rust source
│   ├── tests/                # TypeScript integration tests
│   └── Anchor.toml           # Anchor config
├── qadam_backend/            # Elixir/Phoenix API
│   ├── lib/qadam_backend/    # DDD contexts, Oban workers, Solana client
│   └── config/               # Runtime config reads env vars
├── qadam_frontend/           # Next.js frontend
│   ├── src/app/              # 8 routes (landing, campaigns, create, dashboard, portfolio, admin)
│   ├── src/lib/program.ts    # Anchor program client + PDA derivation
│   └── src/hooks/            # useQadamProgram hook
├── PRD-*.md                  # Product requirements
└── TECHNICAL_DECISIONS.md    # Architecture decisions (source of truth)
```

## Anchor program

**Build:** `cd qadam && anchor build`
**Test:** `cd qadam && anchor test`
**Deploy:** `cd qadam && anchor deploy --provider.cluster devnet`

### Key architecture rules (from TECHNICAL_DECISIONS.md)

- **No floating point** in Solana program. Only `checked_mul`/`checked_div` via `helpers/math.rs`
- **Fee deducted FROM milestone amount**, not additionally from vault
- **Lazy token minting** — tokens allocated at backing, minted at claim
- **Campaign PDA = token mint authority** — only program can mint
- **Voting uses BackerPosition.tokens_allocated**, not minted token balance
- **Vote cap 20%** per position to prevent whale dominance
- **Vault = SystemAccount PDA** holding native SOL

### 17 instructions

Admin: `initialize_config`, `set_paused`
Campaign: `create_campaign`, `add_milestone`, `cancel_campaign`
Backing: `back_campaign`, `increase_backing`
Milestones: `submit_milestone`, `release_milestone`, `mark_under_human_review`, `admin_override_decision`
Tokens: `claim_tokens`
Governance: `request_extension`, `vote_on_extension`, `execute_extension_result`
Refund: `claim_refund`
Cleanup: `close_backer_position`, `close_campaign`

## Elixir backend

**Run:** `cd qadam_backend && mix phx.server`
**Test:** `cd qadam_backend && mix test`
**Migrate:** `cd qadam_backend && mix ecto.migrate`

### DDD Contexts
- `Campaigns` — campaign CRUD, discovery, filtering
- `Milestones` — state machine with validated transitions + audit log
- `Backers` — positions, portfolio
- `AI` — Claude decisions log
- `Reputation` — creator score
- `Governance` — extension voting

### Oban Workers (AI Pipeline)
1. `AIVerificationWorker` — Claude API call, parse decision
2. `TxBroadcastWorker` — sign + send Solana transaction (FRESH blockhash!)
3. `TxConfirmationWorker` — poll until confirmed
4. `DeadlineMonitorWorker` — cron every 5 min, transitions overdue milestones

## Next.js frontend

**Dev:** `cd qadam_frontend && npm run dev`
**Build:** `cd qadam_frontend && npx next build`

### Pages
- `/` — Landing
- `/campaigns` — Discovery with filters
- `/campaigns/[id]` — Detail + milestone timeline
- `/campaigns/[id]/back` — Backing flow (connected to Anchor)
- `/create` — Campaign creation wizard (connected to Anchor)
- `/dashboard` — Creator dashboard
- `/portfolio` — Backer portfolio
- `/admin` — Human review queue

## Deploy

**Anchor:** `cd qadam && anchor deploy --provider.cluster devnet`
  - Need ~4 SOL in deployer wallet
  - After deploy: update PROGRAM_ID in .env files

**Backend:** Deploy to Fly.io
  - `cd qadam_backend && fly launch`
  - Set env vars: DATABASE_URL, SOLANA_RPC_URL, CLAUDE_API_KEY, JWT_SECRET

**Frontend:** Deploy to Vercel
  - `cd qadam_frontend && vercel`
  - Set env vars: NEXT_PUBLIC_PROGRAM_ID, NEXT_PUBLIC_API_URL

## Tech stack

- **Anchor** 0.31.1 / Rust / Solana
- **Elixir** 1.18 / Phoenix 1.8 / Oban / Joken
- **Next.js** 15 / TailwindCSS / shadcn/ui / Solana wallet adapter
- **Claude API** for AI milestone verification

## Conventions

- Russian for PRDs and communication, English for code and comments
- Integer math only in smart contracts (u128 intermediate for large multiplications)
- All state structs use `#[derive(InitSpace)]` for automatic space calculation
- Shared release logic in `helpers/release.rs` — used by both AI release and admin override
