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
├── qadam_backend/            # Elixir/Phoenix API (future)
├── qadam_frontend/           # Next.js frontend (future)
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

## Tech stack

- **Anchor** 0.31.1 / Rust / Solana
- **Elixir** 1.18 / Phoenix 1.7+ (backend, future)
- **Next.js** 15 / TailwindCSS (frontend, future)
- **Claude API** for AI milestone verification

## Conventions

- Russian for PRDs and communication, English for code and comments
- Integer math only in smart contracts (u128 intermediate for large multiplications)
- All state structs use `#[derive(InitSpace)]` for automatic space calculation
- Shared release logic in `helpers/release.rs` — used by both AI release and admin override
