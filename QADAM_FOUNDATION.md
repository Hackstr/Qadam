# Qadam — Product Foundation

> This document is the source of truth for what Qadam is and how it works. Every screen, every backend service, every Anchor instruction must align with this. If a part of the codebase contradicts this — fix the code, not the document. If you (Claude Code) disagree with something here — stop and surface it; do not silently deviate.

---

## 01 · Concept

**One line:**
Crowdfunding where progress unlocks funding. Backers' SOL stays in escrow. Community votes on each milestone. Creators get paid for real progress. Backers earn ownership points proportional to contribution and timing.

**What Qadam is NOT:**
- Not Kickstarter — there creator gets all money upfront and can disappear.
- Not a securities platform — ownership points are utility, not equity.
- Not AI-as-judge — community votes on milestones, AI never decides outcomes.
- Not all-in-one — narrow tool: create → escrow → milestone → vote → release.

**Primary user:** Creator. Without supply (creators with real projects) there are no campaigns. Backers will appear when there's something worth backing. All UX is optimized for creators first, backers second.

---

## 02 · Data Model

Three entities. Profile is shared across campaigns. Campaign holds story + plan + team. Tier rewards are computed from a per-campaign config, not stored per-tier.

### Creator Profile (one per wallet)
Filled once before first campaign. Shared across all future campaigns.

```
- wallet_address   primary key
- display_name     required
- avatar_url
- bio              short, ~280 chars
- location         city, country
- socials          { twitter, telegram, github, website }
- previous_work    [{ title, url, description }]
- created_at, updated_at
```

### Campaign

**Identity & discovery:**
```
- id, slug
- name             3–8 words
- one_liner        one sentence pitch, ~120 chars
- category         enum: Tech, Hardware, Software, Art & Design, Music, Film, Education, Community, Research, Climate
- tags             3–5 free-form keywords (text array)
- cover_image_url
- pitch_video_url  optional, YouTube/Vimeo embed
- location         project location, can differ from creator
```

**Story (split, not single 'about'):**
```
- problem          what's broken in the world, for whom, how serious
- solution         how this project solves it
- why_now          what changed (tech / market / regulation) that makes timing right
- background       optional — personal story, how creator arrived at idea
- risks            uncomfortable truths about what could go wrong
```

**Team:**
```
- creator_wallet   FK → Creator Profile
- team_members     JSONB array: [{ name, role, avatar_url, social_link }]
```

**Plan & funding:**
```
- milestones[]     [{
    title,
    deliverables,                  what backers see/get when approved
    amount,                        SOL allocated to this milestone
    deadline,                      when creator must submit evidence
    acceptance_criteria[]          structured array of 3–5 testable bullets
  }]
- funding_goal     sum of milestone amounts (computed)
- funding_deadline when backing window closes (DB-only enforcement)
- tier_config      JSONB array, see "Tier Rewards" below
- vote_period_days int, see "Voting"
- quorum_pct       decimal, see "Voting"
- approval_threshold_pct  decimal, see "Voting"
```

**Engagement:**
```
- updates[]        { title, body, posted_at }
- faq[]            { question, answer }
- comments[]       campaign-level + per-milestone
```

**Meta:**
```
- status           draft | active | funded | in_progress | completed | failed | refunded
- created_at, launched_at, funded_at
```

---

## 03 · Voting (community side)

Backers don't just give money — they decide outcomes. Voting is the symmetric counterpart to AI Companion: AI helps the creator ship; community decides if shipping happened.

**Who votes:** Only backers of the campaign — scoped to that campaign only. You can't vote on a campaign you didn't back. Random platform users have no say. Voting power is tied directly to skin in the game.

**What backers vote on (3 types):**

1. **Approve a milestone.** Creator submits evidence. Community decides: did this milestone actually happen as promised? Approve releases funds. Reject sends it back.
2. **Grant a deadline extension.** Creator can request more time before a milestone deadline. Backers decide: is the reason fair? Granted = new deadline. Denied = original deadline stands.
3. **Trigger a refund.** If creator goes silent past deadline + grace period, backers can vote to terminate the campaign and recover remaining escrow funds.

**Voting weight:**
```
vote_weight = backer's ownership_points in this campaign
            = sol_contributed × tier_multiplier_at_backing_time
```
A Founder who backed 2 SOL at 100% multiplier carries 2.0 weight. A Supporter who backed 1 SOL at 50% multiplier carries 0.5 weight. Skin in the game and timing both matter.

**Weight is locked at the moment of backing.** It does not change later — even if the campaign adds more tiers or restructures.

**Vote parameters (creator picks at campaign creation, locked at launch):**

| Parameter | Range | Meaning |
|-----------|-------|---------|
| `vote_period_days` | 3 – 14 | How long voting stays open after creator submits evidence |
| `quorum_pct` | 0.10 – 0.50 | Minimum participating weight (as % of total weight) for vote to be valid |
| `approval_threshold_pct` | 0.50 – 0.75 | % of participating weight that must vote YES for approval |

**Guardrails (platform invariants — Qadam enforces, cannot be changed):**
- Only campaign backers can vote on that campaign. Wallets without backing have zero weight.
- Vote weight is locked at the moment of backing — never recomputed later.
- Quorum failure = vote invalid. Falls through to deadline + grace path (creator gets one more chance, or refund vote opens).
- Tie at threshold = milestone is rejected. Burden of proof is on the creator.
- Vote is final once period closes. No re-opening, no re-voting, no admin override.
- Voting parameters lock at campaign launch — creator cannot change rules mid-campaign.

**Vote record (data shape):**
```
- vote_id, campaign_id, milestone_id (or extension_id, refund_id)
- vote_type             milestone_approval | extension_grant | refund_trigger
- opens_at, closes_at   computed from vote_period
- quorum_required, threshold_required   copied from campaign at vote open
- ballots[]             [{ wallet, weight, choice (yes/no), cast_at, comment? }]
- status                open | passed | failed_threshold | failed_quorum
- resolved_at, total_yes_weight, total_no_weight, total_participating
```

---

## 04 · Escrow & Money Flow

Where the SOL physically lives, when it moves, who can move it. This is the layer that makes Qadam different from Kickstarter — funds don't reach the creator until community approves progress.

**Where funds live:** On-chain, in a per-campaign Solana PDA vault. Each campaign has its own Program Derived Address. Funds aren't pooled across campaigns. Qadam team has no key to withdraw from any vault — only the Anchor program can release SOL, and only by following the rules below.

**Money flow (4 stages):**

1. **Lock — backer commits SOL.** Backer signs a transaction. SOL leaves their wallet, enters the campaign vault. Backer record created with amount, tier multiplier, and ownership points (= weight).
   - Direction: `backer wallet → campaign PDA vault`. Fee: Solana network only.

2. **Hold — funds wait in vault.** While campaign is active, all backings accumulate in vault. Creator cannot touch them. Qadam cannot touch them. Only on-chain rules can move SOL — and they only move it on milestone approval or refund.
   - State visible to anyone via Solana Explorer.

3. **Release — milestone approved by community.** Vote passes (quorum + threshold reached). On-chain release executes: milestone amount minus platform fee goes to creator. Platform fee goes to Qadam treasury wallet. Vault balance decreases by milestone amount.
   - Direction: `vault → creator wallet (97.5%) + Qadam treasury (2.5%)`.

4. **Refund — alternative path.** If milestone vote fails AND refund vote passes, OR if creator misses deadline beyond grace period, refund executes. Remaining vault balance distributes back to backers proportional to their original contribution. Platform fee is NOT refunded for milestones already released.
   - Direction: `vault remainder → all backers (proportional, no fee)`.

**Platform fee:** 2.5% — taken on release, never on backing.
- Backer commits 1.0 SOL — full 1.0 SOL enters vault, no fee at this point.
- When milestone of 1.0 SOL is approved, 0.975 SOL goes to creator, 0.025 SOL goes to Qadam treasury.
- If milestone is rejected, no fee is taken.
- Solana network fees (~0.000005 SOL per tx) are paid by whoever signs — backer for backing, creator for submitting evidence, vote-caster for voting.

**Guardrails (on-chain enforcement):**
- Funds move only through Anchor program instructions. No EOA (humans, including admins) can withdraw from a vault directly.
- Release requires an approved vote on-chain. Off-chain consensus alone does not release funds.
- Vault rent is closed and returned when campaign reaches terminal status (completed, refunded, or cancelled).
- Creator never holds keys to vault. Even compromised creator wallet cannot drain a vault — funds always require community vote.
- Refund mechanism is unconditional: backers always have a path to recover unreleased funds if the project fails or stalls.
- Platform fee percentage is hardcoded in Anchor program — Qadam team cannot raise it on existing campaigns.

---

## 05 · Tokens & Ownership

Backers don't get equity — they earn ownership points. Two roles, one math: voting weight while the campaign runs, claimable project tokens once it completes.

**Definition:** Ownership points are a number — utility, not equity. They represent your share of voting power and your share of the eventual project token supply. They are not securities. They do not promise dividends, profit, or financial return. They give you participation in the project's outcome.

**Formula:**
```
points = sol_contributed × tier_multiplier_at_backing_time
```

The multiplier is locked at the moment of backing — it never changes after. Same number drives both voting weight (during campaign) and final token allocation (after completion).

**Worked example:**
```
Backer A backs 2 SOL as Founder (100%)        → 2.0 points
Backer B backs 5 SOL as Early Backer (70%)    → 3.5 points
Backer C backs 2 SOL as Supporter (50%)       → 1.0 points

Total points pool: 6.5
A holds 31%, B holds 54%, C holds 15%
```

**Two roles:**

| When | What points do |
|------|----------------|
| During campaign | Voting weight on every milestone, extension, and refund decision in this campaign. Higher points = bigger voice. See Section 03. |
| After completion | When all milestones approve, the campaign mints SPL project tokens proportional to total points. Each backer claims their share based on their points / total points ratio. |

**Lifecycle:**

| When | What happens to points |
|------|------------------------|
| At backing | Awarded immediately. Locked. Visible in Portfolio. |
| During campaign | Active as voting weight on milestones / extensions / refund. |
| Milestone rejected | Points unaffected. They stay with the backer regardless of milestone outcomes. |
| Refund triggered | Points are burned proportionally to refunded amount. No tokens to claim. |
| Campaign completed | Convertible to project SPL tokens via claim. Backer signs claim tx, receives tokens. |

**Boundaries — what ownership points are NOT:**
- Not equity. Not a security. No promise of profit, dividend, buyback, or financial return.
- Not transferable while campaign is active. Points are tied to wallet that backed.
- Not redeemable for SOL. Backers can only get refunded via the refund vote mechanism.
- Not a guarantee of value. Project tokens claimed at the end have whatever value the project gives them — Qadam doesn't price or back them.
- Not retroactively re-tierable. If creator updates campaign structure later, existing backers' points stay computed by their original tier.

---

## Tier Rewards (configurable per campaign)

Each campaign sets its own tier structure during creation. **Qadam holds the rules of the system, not the values.**

**Formula (same as ownership points):**
```
points = sol_contributed × tier_multiplier
```
Multiplier sits between 0.0 and 1.0. Higher = more share per SOL. Founders get the highest multiplier; later backers get less.

**What creator picks (per campaign, locked at launch):**

| Parameter | Range | Notes |
|-----------|-------|-------|
| Number of tiers | 1 to 10 | Single tier = no ranking, all backers equal. Multiple tiers create urgency for early support. |
| Spots per tier | any integer | Last tier is automatically unlimited — creator only sets earlier ones. |
| Multiplier per tier | 0% to 100% | First tier locks at 100%. Each later tier ≤ previous. |

**Storage shape (`campaigns.tier_config` JSONB):**
```json
[
  { "name": "Founders",      "multiplier": 1.00, "max_spots": 50  },
  { "name": "Early Backers", "multiplier": 0.70, "max_spots": 200 },
  { "name": "Supporters",    "multiplier": 0.50, "max_spots": null }
]
```

**Guardrails (platform invariants):**
- Tier 1 multiplier is always 1.00 (Founders earn the full rate). Math invariant.
- Multipliers must be monotonically decreasing — no later tier can earn more than an earlier one.
- Last tier has `max_spots: null` (so the campaign never refuses backers).
- Tier structure is locked once campaign launches — backers can't be re-tiered after the fact.
- `tier_config` is stored both in Postgres (for UI) and serialized into the Anchor program account (for on-chain enforcement at backing time).

---

## 06 · AI Companion (creator side)

A partner that helps the creator reach milestones on time. Not a verifier. Not a chatbot. Not a writer. A presence that watches progress, notices risks, suggests next actions.

**Role:** Helps the creator ship — not the platform judge progress.

**Boundaries (what AI never does):**
- Never publishes anything. Creator approves and edits everything.
- Never grades milestones — that's the community's job.
- Never lies. If unsure of technical specifics — says so.
- No "AI-assisted" markers visible to backers. Creator writes; AI is an editor.

**Context AI knows:**
- Campaign goals: description, milestones, acceptance criteria
- Current milestone: deadline, days remaining, status
- Creator activity: last update, last evidence draft, last login
- Backer state: count, time since last update
- Risk signals: deadline approaching + activity gap + no draft

**4 surface points:**

### 01 · Daily Nudge (Dashboard hero card)
Once per day. One single suggestion, the most important today. Format: short title + 1–2 sentence rationale + primary CTA + dismiss.

Example: *"Deadline in 5 days. Last update 9 days ago — backers are quiet. Time to show progress."*

Backend: `CompanionDigestWorker` (Oban) runs daily 9am creator-local-time → for each active campaign of each creator → calls Anthropic API with context bundle → writes nudge to `companion_nudges` table → dashboard reads, displays, marks read on click.

### 02 · Evidence Outline (inline in Submit Evidence)
AI reads acceptance criteria, generates structured outline (one section per criterion). Creator fills in real content, edits scaffold.

Endpoint: `POST /api/ai/evidence_draft?milestone_id=...`
Returns: structured outline JSON.

### 03 · Update Draft (inline in Post Update)
Creator clicks 'Post Update'. AI asks 'what's the update about?' — short input. Drafts: what got done, what's coming next, risks/asks. Creator edits, publishes.

Endpoint: `POST /api/ai/update_draft?campaign_id=...`
Returns: structured update JSON.

### 04 · Ask AI Panel (sticky sidebar)
Free-form chat, scoped to this campaign. Persistent conversation history. Creator returns to old discussions. SSE streaming for live feel.

Example questions:
- *"What should I do today to reach the milestone?"*
- *"Backers are quiet — what should I tell them?"*
- *"I'm stuck on this task — how do I break it down?"*

Endpoint: `POST /api/ai/companion_chat` (SSE streaming).
Persists to `companion_conversations` table.

---

## 07 · Create Wizard (5 steps + pre-step)

Profile setup once per wallet. Then 5 steps to launch a campaign. AI Companion is present at each step but unobtrusive — small "Need help?" button per field, never invasive.

**Pre-step — Profile Setup (one-time per wallet):**
Required before first `/create`. display_name, avatar, bio, location, socials. Without it, Create button shows "Set up your profile first".

**Step 1 — Idea**
name, one_liner, category, tags, cover image, pitch video (optional)

**Step 2 — Story**
problem, solution, why_now, background (optional), risks. Each as separate prompt with its own AI Helper button.

**Step 3 — Team**
your profile auto-loaded. Add team members (optional, can be 0).

**Step 4 — Plan**
milestones with structured acceptance criteria, funding goal (auto-sum of milestone amounts), funding deadline, tier_config, voting parameters (vote_period_days, quorum_pct, approval_threshold_pct).

**Step 5 — Preview**
What backers will see. Edit toggles per section. Launch button.

---

*This document is the source of truth. Every screen in this canvas references it. Every Claude Code mega-prompt for Qadam should start by quoting it. If a UI screen contradicts it — fix the screen, not the document.*
