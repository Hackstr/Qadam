# Qadam — AI-Verified Crowdfunding on Solana

[![Solana](https://img.shields.io/badge/Solana-devnet-9945FF)](https://solana.com)
[![Anchor](https://img.shields.io/badge/Anchor-0.31.1-blue)](https://www.anchor-lang.com)
[![Elixir](https://img.shields.io/badge/Elixir-1.18-purple)](https://elixir-lang.org)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org)
[![Hackathon](https://img.shields.io/badge/National_Solana_Hackathon-2026-14F195)](https://decentrathon.com)

> Milestone-based crowdfunding where SOL stays in escrow until Claude AI verifies real progress. Backers aren't donors — they're co-owners with token equity and governance rights.

[Live App](https://qadam.duckdns.org) · [Video Demo](#) · [Pitch Deck](#)

---

## Submission to National Solana Hackathon 2026

| Name | Role | Contact |
|------|------|---------|
| Khakim | Founder & Full-Stack Engineer | [Telegram](#) |

---

## Problem and Solution

### 1. No Accountability in Crowdfunding
- **Problem:** Traditional platforms (Kickstarter, GoFundMe) release funds upfront. 9% of Kickstarter projects fail to deliver, and backers have no recourse.
- **Qadam:** SOL is locked in on-chain escrow. Funds release only after AI verifies each milestone is complete.

### 2. Backers Have Zero Upside
- **Problem:** Backers are treated as donors. If a project succeeds wildly, they get nothing beyond their reward tier.
- **Qadam:** Backers receive SPL tokens proportional to their contribution — real equity with governance rights. Early backers get better rates through a 3-tier system.

### 3. Milestone Verification is Manual and Slow
- **Problem:** Existing platforms rely on manual review or honor system for milestone completion.
- **Qadam:** Claude AI analyzes submitted evidence against milestone criteria, delivering decisions in seconds. Edge cases escalate to human review.

### 4. Governance is Absent
- **Problem:** When projects miss deadlines, backers have no voice. The creator decides everything.
- **Qadam:** Backers vote on deadline extensions using token-weighted governance with a 20% cap per position to prevent whale dominance.

---

## Why Solana

- **Speed** — Sub-second finality for real-time milestone verification and fund release
- **Cost** — $0.00025/tx makes micro-backing economically viable (min 0.1 SOL)
- **SPL Tokens** — Native token standard for backer equity with built-in mint authority via PDA
- **Composability** — Anchor's account model enables atomic multi-instruction transactions (create campaign + add milestones in one tx)

---

## How It Works

```
Creator                    Solana Program                 AI Pipeline
   │                            │                             │
   ├── create_campaign ────────▶│ Campaign PDA created        │
   ├── add_milestones ─────────▶│ Vault PDA holds SOL        │
   │                            │                             │
Backer                          │                             │
   ├── back_campaign ──────────▶│ SOL → vault, tokens alloc  │
   │                            │                             │
Creator                         │                             │
   ├── submit_milestone ───────▶│ Evidence hash on-chain ────▶│ Claude API
   │                            │                             │ analyzes evidence
   │                            │◀── release_milestone ───────┤ APPROVED → release
   │                            │    (SOL → creator)          │ PARTIAL → human review
   │                            │                             │ REJECTED → retry
Backer                          │                             │
   ├── claim_tokens ───────────▶│ SPL tokens minted          │
   ├── vote_on_extension ──────▶│ Governance recorded        │
   └── claim_refund ───────────▶│ SOL returned if failed     │
```

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                        Next.js Frontend                          │
│  Landing · Discovery · Create · Back · Dashboard · Portfolio     │
│  Solana Wallet Adapter · Anchor Client · React Query · Zustand   │
└────────────────┬──────────────────────┬──────────────────────────┘
                 │ REST API             │ Anchor RPC
                 ▼                      ▼
┌────────────────────────┐    ┌────────────────────────────┐
│   Phoenix Backend      │    │   Solana Program (Anchor)  │
│                        │    │                            │
│  Auth (SIWS + JWT)     │    │  18 Instructions           │
│  Campaign CRUD         │    │  Campaign PDA + Vault PDA  │
│  Milestone State Machine│   │  SPL Token Mint Authority  │
│  AI Pipeline (Oban)    │    │  Integer-only math (u128)  │
│  Sync Controller       │    │  24 custom error codes     │
│                        │    │                            │
│  ┌──────────────────┐  │    └────────────────────────────┘
│  │ AI Verification  │  │
│  │ Worker           │──┼──▶ Claude API (evidence analysis)
│  ├──────────────────┤  │
│  │ TX Broadcast     │  │
│  │ Worker           │──┼──▶ Solana RPC (sign + send)
│  ├──────────────────┤  │
│  │ TX Confirmation  │  │
│  │ Worker           │──┼──▶ Poll until finalized
│  ├──────────────────┤  │
│  │ Deadline Monitor │  │
│  │ (cron 5min)      │──┼──▶ Transition overdue milestones
│  └──────────────────┘  │
│                        │
│  PostgreSQL            │
└────────────────────────┘
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Smart Contract | Rust · Anchor 0.31.1 · Solana |
| Backend API | Elixir 1.18 · Phoenix 1.8 · Oban · Joken |
| Frontend | Next.js 16 · React 19 · TailwindCSS 4 · shadcn/ui |
| AI Verification | Claude API (Anthropic) |
| Database | PostgreSQL |
| State Management | Zustand · TanStack React Query |
| Wallet | Solana Wallet Adapter (Phantom, Solflare, etc.) |
| Deployment | Nginx · Let's Encrypt · Systemd |

---

## Smart Contract — 18 Instructions

| Category | Instruction | Description |
|----------|-----------|-------------|
| **Admin** | `initialize_config` | Set admin, AI agent, treasury wallets |
| | `set_paused` | Emergency pause/unpause |
| **Campaign** | `create_campaign` | Deploy campaign with goal, token params |
| | `add_milestone` | Add milestone (amount, deadline), auto-activates |
| | `cancel_campaign` | Creator reclaims deposit if no backers |
| **Backing** | `back_campaign` | Send SOL to vault, get token allocation |
| | `increase_backing` | Add more SOL to existing position |
| **Milestones** | `submit_milestone` | Submit evidence (SHA-256 hash on-chain) |
| | `release_milestone` | AI approved — release SOL to creator |
| | `mark_under_human_review` | AI uncertain — escalate to admin |
| | `admin_override_decision` | Admin approves/rejects manually |
| **Tokens** | `claim_tokens` | Mint SPL tokens after milestone approval |
| **Governance** | `request_extension` | Creator requests deadline extension |
| | `vote_on_extension` | Backer votes (20% cap per position) |
| | `execute_extension_result` | Execute vote result (20% quorum) |
| **Refund** | `claim_refund` | Claim SOL back if campaign fails |
| **Cleanup** | `close_backer_position` | Close position, reclaim rent |
| | `close_campaign` | Close campaign after all backers exit |

---

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| **Lazy token minting** | Tokens allocated on backing, minted on claim. Simplifies refunds — unminted tokens don't exist |
| **Campaign PDA = mint authority** | Only the program can mint tokens. No external minting possible |
| **Integer-only math** | No floating point in Solana. All calculations use `checked_mul`/`checked_div` with u128 intermediates |
| **Fee from milestone amount** | 2.5% Qadam fee deducted FROM release, not additionally from vault |
| **Vote cap 20%** | Prevents whale dominance. Combined with 20% quorum requirement |
| **Content-addressed evidence** | SHA-256 of content (not URL) stored on-chain. Prevents evidence swapping |
| **Fresh blockhash per TX** | Never cached. Prevents expired transaction errors in AI pipeline |
| **3-tier backer system** | First 50 backers: 1x rate, 51-250: 0.67x, 251+: 0.5x. Rewards early believers |

---

## On-Chain Constants

| Parameter | Value |
|-----------|-------|
| Platform fee | 2.5% |
| Security deposit | 0.5% of goal |
| Min backing | 0.1 SOL |
| Max milestones | 5 |
| Grace period | 7 days |
| Voting period | 7 days |
| Max extension | 30 days |
| Quorum | 20% |
| Vote cap | 20% per position |

---

## Project Structure

```
Qadam/
├── qadam/                          # Anchor program (Solana)
│   ├── programs/qadam/src/
│   │   ├── lib.rs                  # 18 instructions entry point
│   │   ├── instructions/           # Instruction handlers
│   │   ├── state/                  # Account structs (Campaign, Milestone, Backer, Config)
│   │   ├── helpers/                # math.rs (u128), release.rs (shared logic)
│   │   ├── constants.rs            # All protocol parameters
│   │   └── errors.rs               # 24 custom error codes
│   ├── tests/qadam.ts              # Integration tests (1,200+ lines)
│   └── Anchor.toml
│
├── qadam_backend/                  # Elixir/Phoenix API
│   ├── lib/qadam_backend/
│   │   ├── campaigns/              # Campaign CRUD & discovery
│   │   ├── milestones/             # State machine + audit log
│   │   ├── backers/                # Positions & portfolio
│   │   ├── ai/                     # Claude integration
│   │   ├── governance/             # Extension voting
│   │   ├── reputation/             # Creator scoring
│   │   ├── evidence/               # File uploads + IPFS
│   │   └── workers/                # Oban: AI → TX → Confirm → Deadline
│   ├── lib/qadam_backend_web/
│   │   ├── controllers/            # REST API + Sync + Webhooks
│   │   └── router.ex               # All routes
│   ├── config/                     # Dev/Prod/Runtime config
│   └── Dockerfile                  # Multi-stage build
│
├── qadam_frontend/                 # Next.js client
│   ├── src/app/                    # 10 routes (App Router)
│   ├── src/components/             # shadcn/ui + custom components
│   ├── src/hooks/                  # useQadamProgram, useAutoAuth
│   ├── src/lib/
│   │   ├── program.ts              # Anchor client + PDA derivation
│   │   └── api.ts                  # REST API + sync functions
│   └── src/stores/                 # Zustand (auth state)
│
├── deploy/                         # Production configs
│   ├── nginx.conf                  # Reverse proxy
│   └── qadam-backend.service       # Systemd service
│
├── TECHNICAL_DECISIONS.md          # Architecture decisions
└── README.md
```

---

## Quick Start

**Prerequisites:** Node.js 18+, Rust, Anchor CLI 0.31.1, Solana CLI, Elixir 1.18+, PostgreSQL

### 1. Smart Contract

```bash
cd qadam
anchor build
anchor test
# Deploy to devnet (needs ~4 SOL)
anchor deploy --provider.cluster devnet
```

### 2. Backend

```bash
cd qadam_backend

# Install dependencies
mix deps.get

# Setup database
mix ecto.create
mix ecto.migrate

# Seed demo data (optional)
mix run priv/repo/seeds.exs

# Start server
mix phx.server
# → http://localhost:4000
```

**Environment variables:**

```bash
DATABASE_URL=ecto://user:pass@localhost/qadam_dev
SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_PROGRAM_ID=4bummNmZFSwyRgwnfPHG6B9JPC8K6BigXgQYxoVKBcXj
CLAUDE_API_KEY=sk-ant-...
JWT_SECRET=<min-32-chars>
SECRET_KEY_BASE=<mix-phx.gen.secret>
```

### 3. Frontend

```bash
cd qadam_frontend

# Install dependencies
npm install

# Start dev server
npm run dev
# → http://localhost:3000
```

**Environment variables** (`.env.local`):

```bash
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_PROGRAM_ID=4bummNmZFSwyRgwnfPHG6B9JPC8K6BigXgQYxoVKBcXj
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

---

## AI Verification Pipeline

The core innovation — an async, idempotent pipeline that bridges off-chain AI with on-chain state:

```
Evidence Submitted (on-chain)
        │
        ▼
┌─ AIVerificationWorker ─┐
│  1. Fetch evidence      │
│  2. Call Claude API     │
│  3. Parse decision      │
│  4. Store in PostgreSQL │
└────────┬────────────────┘
         │ APPROVED
         ▼
┌─ TxBroadcastWorker ────┐
│  1. Fresh blockhash     │
│  2. Build release TX    │
│  3. Sign with AI wallet │
│  4. Broadcast to Solana │
└────────┬────────────────┘
         │
         ▼
┌─ TxConfirmationWorker ─┐
│  1. Poll confirmation   │
│  2. Wait for finality   │
│  3. Update milestone    │
│  4. Notify stakeholders │
└─────────────────────────┘
```

**Reliability guarantees:**
- Oban unique jobs prevent duplicate processing
- Fresh blockhash fetched immediately before signing
- Exponential backoff retry on TX failure
- State rollback if broadcast fails
- DeadlineMonitorWorker (cron 5min) catches missed deadlines

---

## State Machines

### Campaign Status
```
Draft → Active → Completed
                → Refunded
                → Paused → Active
       → Cancelled (no backers)
```

### Milestone Status
```
Pending → GracePeriod → Failed
       → Submitted → AIProcessing → Approved (→ SOL released)
                                   → Rejected (→ retry)
                                   → UnderHumanReview → Approved/Rejected
                   → ExtensionRequested → VotingActive → Extended
                                                       → Failed (→ Refunded)
```

---

## Testing

### Smart Contract Tests (30 test cases)

```bash
cd qadam && anchor test
```

Covers:
- Happy path (create → back → submit → release → claim → close)
- Multi-backer tier allocation (Tier 1, 2, 3)
- Governance flow (extension request, voting, double-vote prevention)
- Refund mechanics
- Admin overrides
- Cancel campaign (with and without backers)
- Negative cases (invalid status, unauthorized access, math overflow)

### Backend Tests

```bash
cd qadam_backend && mix test
```

---

## Deployment

### Production (VPS)

```bash
# Sync code
rsync -avz --exclude='node_modules' --exclude='.next' --exclude='_build' . ubuntu@server:/home/ubuntu/qadam/

# Backend
cd qadam_backend
MIX_ENV=prod mix deps.get --only prod
MIX_ENV=prod mix compile
MIX_ENV=prod mix ecto.migrate
MIX_ENV=prod mix phx.server

# Frontend
cd qadam_frontend
npm install
NODE_ENV=production npx next build
npx next start -p 3000
```

**Infrastructure:**
- Nginx reverse proxy (/ → :3000, /api → :4000)
- Let's Encrypt SSL
- PostgreSQL
- Systemd services for auto-restart

---

## Roadmap

- [x] Anchor smart contract (18 instructions)
- [x] Integration test suite (30 test cases)
- [x] Devnet deployment
- [x] Phoenix backend with DDD contexts
- [x] AI verification pipeline (Claude)
- [x] Next.js frontend (10 routes)
- [x] Wallet authentication (SIWS)
- [x] On-chain ↔ PostgreSQL sync
- [x] Production deployment with SSL
- [ ] Mainnet deployment
- [ ] IPFS evidence storage (Pinata)
- [ ] Email notifications (Resend)
- [ ] Mobile responsive optimization
- [ ] Multi-language support

---

## Resources

- [Live Application](https://qadam.duckdns.org)
- [Technical Decisions](TECHNICAL_DECISIONS.md)

---

## License

MIT
