<p align="center">
  <img src="qadam_frontend/public/qadam_logo.png" alt="Qadam" width="80" />
</p>

<h3 align="center">Qadam</h3>
<p align="center">Community-governed crowdfunding on Solana.<br/>Backers' SOL stays in escrow. They vote to release each milestone.<br/>Builders get paid for real progress, not promises.</p>

<p align="center">
  <a href="https://qadam.tips"><strong>qadam.tips</strong></a> &nbsp;·&nbsp;
  <code>4bummNmZFSwyRgwnfPHG6B9JPC8K6BigXgQYxoVKBcXj</code>
</p>

---

## How it works

1. **Creator** launches a campaign with milestones, tier rewards, and voting rules
2. **Backers** commit SOL &rarr; funds enter an on-chain vault (PDA) no human holds keys to
3. **Creator** submits evidence per milestone
4. **Community** votes &mdash; approve releases funds, reject sends creator back to revise
5. **If creator stalls** &mdash; backers vote to refund remaining escrow

Every vote is weighted by contribution amount and timing. Early backers carry more weight per SOL. AI helps creators structure plans &mdash; but never judges milestones. Community decides. Always.

## Quick start

```bash
# Smart contract
cd qadam && anchor build && anchor test      # 31 tests

# Backend
cd qadam_backend && mix deps.get && mix ecto.setup && mix phx.server

# Frontend
cd qadam_frontend && npm install && npm run dev
```

## Architecture

```
Frontend (Next.js 16)          Solana Program (Anchor/Rust)
  Wallet Adapter                 Campaign PDA + Vault PDA
  React Query + Zustand          Per-campaign tier_config
  shadcn/ui + Tailwind           Per-campaign voting params
       │                         SPL Token Mint (PDA auth)
       │ REST API                Integer-only math (u128)
       ▼                              ▲
Backend (Elixir/Phoenix)              │ Anchor RPC
  Auth (SIWS + JWT)                   │
  Campaigns / Milestones / Backers    │
  AI Companion (Oban workers)    ─────┘
  PostgreSQL
```

| Layer | Stack |
|-------|-------|
| Smart contract | Rust, Anchor, Solana |
| Backend | Elixir 1.18, Phoenix 1.8, Oban, PostgreSQL |
| Frontend | Next.js 16, React 19, Tailwind v4, shadcn/ui |
| AI Companion | Claude API (creator-side only) |
| Infra | Nginx, Let's Encrypt, systemd, GitHub Actions CI/CD |

## Project structure

```
qadam/                    Anchor program (18 instructions, 31 tests)
qadam_backend/            Elixir/Phoenix API (62 tests)
qadam_frontend/           Next.js client (35 routes)
deploy/                   nginx, systemd, deploy.sh, backups, healthcheck
```

## Status

Live on Solana devnet. Community voting works end-to-end on-chain. Quorum + threshold enforced. AI-judge path fully removed &mdash; community decides outcomes.

**Done:** Foundation v1 schema (3 layers), community voting, AI Companion, CI/CD, production deploy with SSL + backups

**Next:** security audit, mainnet deployment, first real campaigns

## License

MIT

