# Qadam — Rebuild Mega-Prompt

> **Read first:** `QADAM_FOUNDATION.md` in repo root.
>
> This document is your sequential plan to bring the Qadam codebase in line with the new Foundation. It's broken into 8 blocks. Each block is a self-contained Claude Code prompt. Run them in order. After each block: deploy to local/devnet, smoke-test the listed checkpoint, commit, then start the next block.
>
> Do not run blocks in parallel. Do not skip ahead. Each block changes assumptions the next one relies on.

---

## How to use this document

1. **Save `QADAM_FOUNDATION.md` to repo root.** Commit it. This is the single source of truth.
2. **Pick the next block.** Copy that block's prompt section (everything between the `### PROMPT` markers) into Claude Code.
3. **Let Claude Code work.** Don't push it forward — let it finish, ask clarifying questions if needed.
4. **Test the checkpoint.** Don't skip this. The checkpoint is what tells you the block is actually done, not just "compiled".
5. **Commit.** One commit per block, message format: `feat(rebuild-N): <title>`. This way you can roll back if something downstream blows up.
6. **Move to next block.**

If you hit something genuinely blocking (e.g. Anchor program won't redeploy on devnet), pause and bring it to a session with me. Don't hack around it — it usually means the foundation needs an adjustment.

---

## Pre-flight (do this once before Block 1)

```bash
cd /Users/khakim/Projects/Qadam
git checkout -b rebuild-from-foundation
git tag pre-rebuild-snapshot   # safety net to roll back
git push -u origin rebuild-from-foundation
git push --tags
```

Verify Anthropic API key is configured for backend (it already is — used by existing `/api/ai/help`). If not, set `ANTHROPIC_API_KEY` in backend `.env`.

Verify Solana devnet wallet has SOL for redeploys: `solana balance --url devnet`. Top up via faucet if under 5 SOL.

Confirm: backend runs (`mix phx.server`), frontend runs (`npm run dev`), Anchor builds (`anchor build`).

---

## Block summary

| # | Title | Estimated time | Touches |
|---|-------|----------------|---------|
| 1 | Database schema migration | 2–3 h | `qadam_backend/` migrations + schemas |
| 2 | Anchor program updates | 3–4 h | `qadam/programs/qadam/` + redeploy devnet |
| 3 | Backend service layer | 2–3 h | `qadam_backend/` contexts + controllers |
| 4 | Profile Setup flow | 2 h | backend endpoint + frontend modal |
| 5 | Wizard 5-step rebuild | 4–5 h | `qadam_frontend/src/app/create/` |
| 6 | Tier & voting configurators | 2 h | reusable components in wizard step 4 |
| 7 | AI Companion (4 surfaces) | 5–6 h | Oban worker + 3 endpoints + 4 components |
| 8 | Read-side: Detail / Discover / Portfolio | 3–4 h | `qadam_frontend/src/app/campaigns/`, `/discover/`, `/portfolio/` |

Total: ~25–30 hours of Claude Code work spread over multiple sessions. Don't try to do it in one weekend — quality drops, debugging compounds.

---

# Block 1 — Database schema migration

**Goal:** Bring Postgres schema in line with `QADAM_FOUNDATION.md` Section 02.

**Read first:** `QADAM_FOUNDATION.md` Sections 01, 02.

**Touches:**
- `qadam_backend/priv/repo/migrations/`
- `qadam_backend/lib/qadam/accounts/` (or wherever User/Profile schema lives)
- `qadam_backend/lib/qadam/campaigns/` (Campaign + Milestone schemas)

**Checkpoint to verify before starting:**
- Run `mix ecto.migrate` on current state — clean, no pending migrations.
- Run existing test suite — should pass.

### PROMPT

```
Read /Users/khakim/Projects/Qadam/QADAM_FOUNDATION.md (Sections 01 and 02) before starting.

Goal: bring the Postgres schema in line with the Foundation Data Model. Generate Ecto migrations and update schemas. Do NOT touch controllers, views, or any other layer in this block.

Tasks:

1. Create or update the `users` table to be the Creator Profile entity:
   - wallet_address (string, primary key — yes, primary key, not id)
   - display_name (string, not null)
   - avatar_url (string)
   - bio (text)
   - location (string)
   - socials (map / JSONB) — keys: twitter, telegram, github, website
   - previous_work (array of maps / JSONB)
   - timestamps()

   If a `users` table already exists with a different shape, write a migration that adds missing fields and migrates existing data. Do not destroy data.

2. Update the `campaigns` table:
   - DROP `about` column (or rename if data exists, then DROP after backfilling)
   - ADD problem, solution, why_now, background (all text)
   - ADD risks (text) — may already exist
   - ADD team_members (JSONB array, default [])
   - ADD funding_deadline (utc_datetime)
   - ADD vote_period_days (integer, default 7)
   - ADD quorum_pct (decimal, precision 5 scale 4, default 0.2000)
   - ADD approval_threshold_pct (decimal, precision 5 scale 4, default 0.5000)
   - ADD tier_config (JSONB array, default — see below)
   - ADD location (string)
   - ADD category (string) with check constraint for valid enum values: 'Tech', 'Hardware', 'Software', 'Art & Design', 'Music', 'Film', 'Education', 'Community', 'Research', 'Climate'
   - ADD tags (string array)

   Default tier_config for existing campaigns:
   ```json
   [
     {"name": "Founders", "multiplier": 1.00, "max_spots": 50},
     {"name": "Early Backers", "multiplier": 0.70, "max_spots": 200},
     {"name": "Supporters", "multiplier": 0.50, "max_spots": null}
   ]
   ```

3. Update the `milestones` table:
   - ADD acceptance_criteria (string array, default [])
   - ADD deliverables (text)
   - Keep existing description column for now (will be removed in a later block once frontend stops using it)

4. Update Ecto schemas to match. Use proper types — NaiveDateTime where appropriate, Decimal for percentages, embedded schemas or simple maps for socials/team_members/tier_config.

5. Add changeset validations:
   - Profile: display_name required, length 1..50; bio length 0..280
   - Campaign: category must be in enum; tier_config validates monotonic decrease and tier 1 = 1.00; quorum_pct between 0.10 and 0.50; approval_threshold_pct between 0.50 and 0.75; vote_period_days between 3 and 14
   - Milestone: acceptance_criteria max 5 items, each max 200 chars

6. Write rollback (`down`) for every migration. Test rollback works.

7. Update or add ExUnit tests covering changeset validations for the new fields.

DO NOT in this block:
- Touch controllers or views
- Touch the Anchor program
- Touch frontend
- Add new features beyond schema (e.g. don't write profile creation endpoint here — that's Block 4)

Acceptance:
- `mix ecto.migrate` succeeds
- `mix ecto.rollback --all` then `mix ecto.migrate` succeeds (rollback works end-to-end)
- `mix test` passes
- Existing demo campaign still queryable via `Repo.get` — old fields default sensibly, no nils where there shouldn't be

Commit message: feat(rebuild-1): data model migration to Foundation v1
```

---

# Block 2 — Anchor program updates

**Goal:** Update the Solana program to support per-campaign tier_config (so backing-time multiplier is enforceable on-chain) and per-campaign voting parameters.

**Read first:** `QADAM_FOUNDATION.md` Sections 03, 04, 05, and Tier Rewards.

**Touches:**
- `qadam/programs/qadam/src/` (Anchor program source)
- `qadam_frontend/src/lib/anchor/idl.json` (regenerated after redeploy)

**Checkpoint to verify before starting:**
- `anchor build` succeeds on current state.
- `anchor test` passes (or at least doesn't crash).
- You have devnet SOL for redeploy (~3 SOL min).

**Important:** This block requires devnet redeploy. Existing devnet campaigns may become unreadable with the new account layout. **That's acceptable.** Take a snapshot of existing devnet state, then redeploy fresh. We're pre-mainnet — a devnet wipe is fine.

### PROMPT

```
Read /Users/khakim/Projects/Qadam/QADAM_FOUNDATION.md (Sections 03, 04, 05, and Tier Rewards) before starting.

Goal: update the Anchor program so that tier multipliers are enforced on-chain at backing time, and voting parameters (period, quorum, threshold) are stored per-campaign and enforced at vote resolution time.

Context: The current Anchor program has hardcoded tier values and/or hardcoded voting params. We need them to come from the campaign account itself.

Tasks:

1. Read the existing program in qadam/programs/qadam/src/ thoroughly. Map out:
   - Current Campaign account fields
   - Current Backer account fields
   - Current Vote / Milestone account fields
   - Current instructions: create_campaign, back_campaign, submit_evidence, cast_vote, resolve_vote, release_milestone, request_extension, refund

2. Extend the Campaign account:
   - Add tier_config: Vec<TierConfig> where TierConfig is { name: [u8; 32], multiplier_bps: u16, max_spots: Option<u32> }
     (multiplier_bps stores multiplier × 10000, e.g. 100% = 10000, 70% = 7000)
   - Add vote_period_days: u8
   - Add quorum_bps: u16   (e.g. 20% = 2000)
   - Add approval_threshold_bps: u16   (e.g. 50% = 5000)
   - Resize account space accordingly. Use realloc or v2 account layout — do NOT silently corrupt.

3. Update create_campaign instruction:
   - Accept tier_config, vote_period_days, quorum_bps, approval_threshold_bps as args
   - Validate on-chain:
     - tier_config has 1..=10 entries
     - first tier multiplier_bps == 10000
     - multipliers are monotonically non-increasing
     - last tier max_spots is None
     - quorum_bps in 1000..=5000
     - approval_threshold_bps in 5000..=7500
     - vote_period_days in 3..=14
   - Reject otherwise with clear error codes

4. Update back_campaign instruction:
   - Determine which tier this backer falls into based on count of existing backers in earlier tiers
   - Compute points = sol_amount × multiplier_bps / 10000 (use checked math, store as u64 lamport-equivalents)
   - Store tier_index and points on the Backer account
   - The Backer account points field is locked at creation — never recomputed

5. Update cast_vote instruction:
   - Vote weight = backer.points (already stored, just read it)
   - Reject if backer doesn't exist for this campaign
   - Record { wallet, weight, choice (yes/no), cast_at } — only one ballot per backer per vote

6. Update resolve_vote instruction:
   - Read campaign.quorum_bps, campaign.approval_threshold_bps
   - Compute total_yes_weight, total_no_weight, total_participating from ballots
   - Compute total_pool_weight from sum of all backers.points for this campaign
   - quorum_met = total_participating × 10000 >= total_pool_weight × campaign.quorum_bps
   - approved = quorum_met AND (total_yes_weight × 10000 >= total_participating × campaign.approval_threshold_bps)
   - On approve: emit ReleaseMilestone (downstream instruction handles transfer)
   - On reject: mark vote failed; allow resubmit per Foundation Section 03

7. Keep platform fee at 2.5% (250 bps) hardcoded. Do not parametrize this. It's a system invariant.

8. Update release_milestone:
   - 97.5% to creator wallet
   - 2.5% to Qadam treasury wallet (read from program config or hardcoded for now — flag a TODO if hardcoded)

9. Add tests in qadam/tests/ covering:
   - Campaign with custom 4-tier structure validates and stores correctly
   - Tier validation rejects: zero tiers, 11 tiers, first tier != 10000, non-monotonic multipliers, last tier with spot limit
   - Backer points computed correctly for each tier
   - Vote with custom quorum/threshold resolves correctly under different participation scenarios

10. Build and deploy:
    - anchor build
    - Upgrade program on devnet (anchor upgrade) OR redeploy fresh if account layout incompatibilities
    - Regenerate IDL JSON for frontend at qadam_frontend/src/lib/anchor/idl.json
    - Update program ID references in frontend if changed

DO NOT in this block:
- Build any UI for tier configuration (that's Block 6)
- Build any backend service layer wiring (that's Block 3)
- Touch frontend except updating IDL

Acceptance:
- anchor build succeeds with no warnings
- anchor test passes covering new validation cases
- Program deployed/upgraded on devnet, deployment hash recorded
- Frontend can deserialize a Campaign account with new fields (verify via solana-cli or simple test script)
- Existing devnet test data may be invalidated — that's accepted, document it in commit message

Commit message: feat(rebuild-2): on-chain tier_config + voting params per campaign
```

---

# Block 3 — Backend service layer

**Goal:** Wire the new schema fields and Anchor params through Elixir contexts and controllers. Keep existing endpoints working; add new endpoints for fields that need them.

**Read first:** `QADAM_FOUNDATION.md` Sections 02, 03.

**Touches:**
- `qadam_backend/lib/qadam/campaigns.ex` (or context module)
- `qadam_backend/lib/qadam_web/controllers/campaign_controller.ex`
- `qadam_backend/lib/qadam/users.ex`
- `qadam_backend/lib/qadam/anchor/sync_worker.ex` (or wherever Anchor sync lives)

**Checkpoint:**
- Block 1 and Block 2 both committed and merged.
- `mix phx.server` starts clean.

### PROMPT

```
Read QADAM_FOUNDATION.md (Sections 02, 03) before starting.

Goal: wire the new fields from Block 1 (schema) and Block 2 (Anchor) through Elixir contexts and controllers. The frontend will start using these in Blocks 4–8.

Context: Block 1 added new columns. Block 2 added new Anchor account fields. Now we make Phoenix expose them properly.

Tasks:

1. Update Campaigns context (qadam_backend/lib/qadam/campaigns.ex or equivalent):
   - create_campaign now accepts: problem, solution, why_now, background, risks, team_members, funding_deadline, tier_config, vote_period_days, quorum_pct, approval_threshold_pct, location, category, tags
   - update_campaign supports same fields except for fields that lock at launch (vote params, tier_config — only editable while status = draft)
   - get_campaign preloads milestones with their acceptance_criteria
   - list_campaigns supports filter by category, tag, sort by funding_deadline

2. Update Users context:
   - create_or_update_profile/2 — upserts on wallet_address
   - get_profile_by_wallet/1 — returns nil if not exists
   - has_profile?/1 — boolean check

3. Update CampaignController:
   - GET /api/campaigns — accept ?category, ?tag, ?sort=ending_soon
   - GET /api/campaigns/:id — return all new fields including team_members, tier_config, voting params
   - POST /api/campaigns — accept and persist all new fields
   - PATCH /api/campaigns/:id — only allow new field edits if status = draft

4. Update CampaignJSON view (or whatever serializer is used):
   - Surface story split (problem, solution, why_now, background, risks) — not 'about'
   - Surface team_members
   - Surface tier_config (transformed from JSONB to clean array)
   - Surface voting params
   - Surface category, tags, location, funding_deadline
   - Compute and surface "days until funding deadline" as integer

5. Update the Anchor sync worker:
   - When a backing event is detected on-chain, write the points + tier_index to backings table (which should already exist from existing code — extend if needed)
   - When a vote resolution event is detected, mark vote status accordingly and trigger downstream notifications (notification work belongs to Block 7 but the sync part belongs here)

6. Keep backwards-compat where reasonable:
   - If frontend still sends 'about' field temporarily, accept it and store as 'solution' (deprecation alias). Log a warning.
   - Old campaigns without tier_config get the default. Same for voting params (defaults from Block 1).

7. Add controller tests for create_campaign with full new payload, list with filters, profile upsert.

DO NOT:
- Build frontend (next blocks)
- Add AI Companion endpoints (Block 7)
- Restructure existing notification system (Block 7 if needed)

Acceptance:
- POST /api/profile creates profile, returns 201
- POST /api/campaigns with full new payload creates campaign, returns 201 with all new fields in response
- GET /api/campaigns?category=Tech filters correctly
- GET /api/campaigns/:id returns story split, team, tier_config, voting params
- Existing demo campaign still loads via GET /api/campaigns/:id
- mix test passes

Commit message: feat(rebuild-3): backend service layer for new model
```

---

# Block 4 — Profile Setup flow

**Goal:** Build the pre-step profile setup modal so creators have a real identity before launching a campaign.

**Read first:** `QADAM_FOUNDATION.md` Section 02 (Creator Profile), Section 07 (Pre-step).

**Touches:**
- `qadam_frontend/src/components/profile/ProfileSetupModal.tsx` (new)
- `qadam_frontend/src/hooks/useProfile.ts` (new or update existing)
- `qadam_frontend/src/app/create/page.tsx` (gate behind profile)
- `qadam_frontend/src/app/profile/edit/page.tsx` (new — full edit flow outside modal)

**Checkpoint:**
- Block 3 committed.
- Backend POST /api/profile working (verify with curl).

### PROMPT

```
Read QADAM_FOUNDATION.md (Section 02 Creator Profile, Section 07 Pre-step) before starting.

Goal: build a Profile Setup flow. New wallets must complete profile before they can create a campaign.

Tasks:

1. Create useProfile hook (qadam_frontend/src/hooks/useProfile.ts):
   - getProfile(walletAddress) → calls GET /api/profile/:wallet
   - upsertProfile(data) → calls POST /api/profile
   - hasProfile derived state: boolean

2. Create ProfileSetupModal component:
   - Path: qadam_frontend/src/components/profile/ProfileSetupModal.tsx
   - Props: open, onComplete, onCancel
   - Single-screen modal (not multi-step — keep it under 60 seconds)
   - Fields:
     - display_name (required, 1–50 chars)
     - avatar_url (optional, URL — for now just a text input; image upload is a later improvement)
     - bio (optional, textarea, max 280 chars with counter)
     - location (optional, "City, Country" hint)
     - socials: 4 inputs — twitter, telegram, github, website (all optional, validate handle/URL format)
   - Save button → calls upsertProfile → onComplete(profile)
   - Use existing design tokens from /design-system. Match Foundation aesthetic — Instrument Serif for the modal title, Inter for inputs, amber for primary CTA.
   - Modal should be dismissable with Esc and outside-click (saves a draft locally if any field is filled — no — actually, on cancel, lose the data; this is an MVP).

3. Gate /create behind profile completion:
   - In qadam_frontend/src/app/create/page.tsx, on mount:
     - If wallet not connected → render existing connect prompt
     - If wallet connected and useProfile().hasProfile === false → render ProfileSetupModal with onComplete → close modal, continue to wizard
     - If profile exists → render wizard normally

4. Create /profile/edit page (separate from modal):
   - Same fields as modal but full-page layout
   - Navigation: settings menu in header → "Edit profile"
   - Save button → calls upsertProfile → toast confirmation, stay on page
   - Add a "View public profile" link that goes to /profile/[wallet]

5. Surface profile data wherever creator name/wallet currently shows:
   - Campaign cards: replace truncated wallet with display_name + small avatar
   - Campaign detail page: creator section shows full profile (avatar, name, location, bio short, socials icons linking)
   - Anywhere wallet is shown alone, fall back to wallet only if profile.display_name is null

DO NOT:
- Build the full /profile/[wallet] public page (that's Block 8)
- Add image upload (later improvement)
- Touch wizard internals (Block 5)

Acceptance:
- New wallet connects → clicks Create → modal appears → fills required fields → modal closes → wizard appears
- Existing wallet with profile → clicks Create → wizard appears immediately, no modal
- /profile/edit accessible from header menu, saves changes
- Campaign card and Campaign detail show display_name instead of wallet hash
- All bio counters, validation, and dirty-state UX work

Commit message: feat(rebuild-4): profile setup pre-step + edit flow
```

---

# Block 5 — Wizard 5-step rebuild

**Goal:** Rebuild Create Wizard with 5 steps matching Foundation Section 07. Story split, team step, structured acceptance criteria, configurable tier and voting params.

**Read first:** `QADAM_FOUNDATION.md` Section 07 (Wizard), Section 02 (full Campaign data model), Tier Rewards section.

**Touches:**
- `qadam_frontend/src/app/create/page.tsx`
- `qadam_frontend/src/app/create/components/` (Step1Idea, Step2Story, Step3Team, Step4Plan, Step5Preview)
- `qadam_frontend/src/lib/wizardState.ts` (state shape)

**Checkpoint:**
- Blocks 1–4 committed.
- /create gated by profile (from Block 4) works.
- Backend accepts new payload (verify with Postman or curl).

### PROMPT

```
Read QADAM_FOUNDATION.md (Section 07 Wizard, Section 02 Campaign data model, Tier Rewards section) before starting.

Goal: rebuild Create Wizard from 4 steps to 5 steps, matching the Foundation. Replace 'about' field with story split. Add Team step. Restructure Plan step.

Tasks:

1. Define wizard state shape (qadam_frontend/src/lib/wizardState.ts):

```ts
type WizardState = {
  // Step 1
  name: string;
  one_liner: string;
  category: Category;
  tags: string[];
  cover_image_url: string | null;
  pitch_video_url: string | null;
  location: string;

  // Step 2
  problem: string;
  solution: string;
  why_now: string;
  background: string; // optional
  risks: string;

  // Step 3 — auto-loaded from profile, plus team_members
  team_members: { name: string; role: string; avatar_url?: string; social_link?: string }[];

  // Step 4
  milestones: {
    title: string;
    deliverables: string;
    amount: number; // SOL
    deadline: string; // ISO
    acceptance_criteria: string[];
  }[];
  funding_deadline: string; // ISO
  tier_config: { name: string; multiplier: number; max_spots: number | null }[];
  vote_period_days: number;
  quorum_pct: number;
  approval_threshold_pct: number;
}
```

2. Persist wizard state to localStorage on every change (debounced 1s) so user doesn't lose progress on accidental close. Already exists for current wizard — extend pattern.

3. Build Step 1 — Idea (refactor existing Step 1):
   - Existing fields: name, one_liner, cover image, pitch video — keep
   - ADD category (dropdown of 10 enum values from Foundation)
   - ADD tags (chip input, max 5 tags, max 30 chars each)
   - ADD location (text input, free-form)
   - Each field has small "Need help?" link that calls existing /api/ai/help with context type 'title' or 'oneliner' — keep AI helper integration

4. Build Step 2 — Story (replaces existing 'about'):
   - 4 separate text fields (textareas), each with its own "Need help?" link:
     - Problem — placeholder: "What's broken in the world that this project fixes? For whom? How serious?"
     - Solution — placeholder: "How does this project solve the problem?"
     - Why now — placeholder: "What changed in the world (technology, market, regulation) that makes this the right time?"
     - Background (optional, collapsible) — placeholder: "Optional. The personal story behind this — how you arrived at this idea."
   - Risks field below — placeholder: "What could go wrong? Be uncomfortable. Backers respect honesty more than confidence."
   - Each AI helper call sends current field name as context type (e.g. ai_help.context_type = 'problem'). Backend AI prompt for each context lives in qadam_backend — update prompts there to be specific to each section.

5. Build Step 3 — Team (new step):
   - Top: read-only display of creator's profile (auto-loaded), with "Edit profile" link → opens /profile/edit in new tab
   - Below: "Add team members" section — start with empty list, "+ Add team member" button
   - Each team member row: name (req), role (req), social link (opt)
   - Avatar — defer to a placeholder for now (gradient circle with initials)
   - Skip button visible — team is optional

6. Build Step 4 — Plan (refactor existing Step 3 / Plan):
   - Milestones: list, "+ Add milestone" button (max 8 milestones)
   - Each milestone:
     - title (required, ~50 chars)
     - deliverables (textarea — what backers will see/get when this is approved)
     - amount in SOL (number input, min 0.1)
     - deadline (date picker, must be after previous milestone's deadline if any)
     - acceptance_criteria — special component:
       - Renders as a list of bullet inputs
       - "+ Add criterion" button (max 5)
       - Each bullet: text input, max 200 chars
       - Cannot be empty (at least 1 criterion required)
   - Funding goal — auto-computed from sum of milestone amounts, read-only
   - Funding deadline — date picker (must be before first milestone deadline)
   - **Tier configurator** — see Block 6 (build placeholder for now: simple <TierConfigurator value onChange /> stub component)
   - **Voting params** — three controls:
     - Vote period: slider 3–14 days (default 7)
     - Quorum: slider 10–50% (default 20%)
     - Approval threshold: slider 50–75% (default 50%)
   - Each control has a one-sentence explanation below it.

7. Build Step 5 — Preview:
   - Render what the campaign detail page will look like with the wizard data
   - Sections in order: hero (cover, name, one_liner, category, location), creator strip, story (Problem → Solution → Why Now → Background if present), team, plan (milestones with acceptance criteria visible), tier config, voting rules
   - "Edit" link in each section jumps back to corresponding step
   - "Launch campaign" button at bottom — sends POST to /api/campaigns with full state, on success → redirect to /campaigns/[id]?launched=1

8. Wizard navigation:
   - Top: 5-step indicator with completion checkmarks
   - Bottom: Back / Continue buttons
   - Continue disabled until current step's required fields are valid
   - Validation messages inline, not blocking

9. Remove old wizard files / components that are no longer used (Step3 plan if it was named differently, etc.). Don't keep dead code.

DO NOT:
- Build the Tier Configurator UI (Block 6)
- Build AI Companion daily nudge or panel (Block 7)
- Build campaign detail page changes (Block 8)

Acceptance:
- Full happy-path: connect wallet (with profile) → /create → fill 5 steps → preview → launch → land on campaign detail page → all fields display correctly
- localStorage save/restore: refresh during step 3, return → wizard continues at step 3 with all data intact
- Validation: try submitting with empty required fields → blocking message
- Tier configurator placeholder accepts a default tier_config and stores it in state
- Existing AI Helper integration still works (calls /api/ai/help) for fields where it was integrated before

Commit message: feat(rebuild-5): create wizard rebuild — 5 steps matching Foundation
```

---

# Block 6 — Tier & voting configurators

**Goal:** Build proper UIs for the tier_config and voting params. Replaces placeholders left in Block 5.

**Read first:** `QADAM_FOUNDATION.md` Tier Rewards section, Section 03 (Voting parameters).

**Touches:**
- `qadam_frontend/src/components/wizard/TierConfigurator.tsx` (new)
- `qadam_frontend/src/components/wizard/VotingParamsConfigurator.tsx` (new)
- `qadam_frontend/src/app/create/components/Step4Plan.tsx` (wire in)

**Checkpoint:**
- Block 5 committed. Wizard works end-to-end with default tier_config and voting params.

### PROMPT

```
Read QADAM_FOUNDATION.md (Tier Rewards section, Section 03 Voting Parameters) before starting.

Goal: replace the placeholder tier configurator and voting params controls in Wizard Step 4 with proper UIs that respect the Foundation's customization rules and guardrails.

Tasks:

1. Build <TierConfigurator value onChange />:
   - Renders a stack of Tier rows
   - Each row:
     - Drag handle (left)
     - Tier name (text input, default 'Tier 1', 'Tier 2', etc., user can rename)
     - Multiplier slider (0–100%, step 5%) — first tier locked at 100%, others must be ≤ previous
     - Max spots input (integer, min 1) — last tier shows "Unlimited" instead of input, locked
     - Delete button (only on tiers 2+)
   - Below: "+ Add tier" button (disabled when 10 tiers reached)
   - Above: brief explanation: "The earlier a backer joins, the larger their share. Configure how that scales."
   - Default value (if state empty): 3 tiers — Founders (100%, 50 spots), Early Backers (70%, 200 spots), Supporters (50%, unlimited)
   - Validation:
     - Tier 1 multiplier always 100% (UI prevents change)
     - Each subsequent tier multiplier ≤ previous (UI clamps slider on input)
     - At least 1 tier required (delete disabled when only 1 tier left)
     - Last tier always has max_spots = null (UI shows "Unlimited" non-editable)
   - Show preview snippet below configurator: "First 50 backers earn 1.0 points/SOL. Next 200 earn 0.7. Everyone after earns 0.5."

2. Build <VotingParamsConfigurator value onChange />:
   - Three labeled sliders, each with helper text:
     - Vote period: 3 to 14 days, default 7. "How long voting stays open after evidence is submitted."
     - Quorum: 10% to 50%, default 20%. "Minimum participation for a vote to be valid. Lower = easier to pass; higher = stronger consensus required."
     - Approval threshold: 50% to 75%, default 50%. "% of participating weight that must vote YES. 50% = simple majority. 75% = supermajority."
   - Below all three: a "Recommended for first-time creators" link that resets to defaults (7 / 20% / 50%)

3. Wire both into Step4Plan:
   - Replace placeholder with <TierConfigurator value={state.tier_config} onChange={...} />
   - Replace voting param placeholders with <VotingParamsConfigurator value={{...}} onChange={...} />

4. Display tier_config in Step 5 Preview:
   - Render as a clean table or stack of cards showing each tier with its multiplier and spots
   - Match the visual style from /design-system "Tier Rewards" cards

5. Display voting params in Step 5 Preview:
   - Three small stat cards: "Vote period: 7 days", "Quorum: 20%", "Threshold: 50% YES"

6. Update payload sent to backend on launch — include the configured tier_config and voting params as defined in Block 1's schema.

7. After campaign creation, the Anchor program from Block 2 enforces these on backing and voting. Verify by:
   - Creating a test campaign on devnet with custom tier_config (e.g. 2 tiers: 100% / 60%)
   - Backing it from a second wallet
   - Confirming the Backer account on-chain has correct points (sol × multiplier)

DO NOT:
- Add team management features here (not relevant)
- Touch AI Companion (Block 7)

Acceptance:
- Tier configurator: add tier, remove tier, slide multipliers, set max_spots, all validate per guardrails
- Voting configurator: three sliders work, defaults visible, "Recommended" link resets
- Preview step shows configured tier and voting params correctly
- End-to-end: create campaign with custom 2-tier structure → verify on-chain Backer account points are correct

Commit message: feat(rebuild-6): tier and voting configurators
```

---

# Block 7 — AI Companion (4 surfaces)

**Goal:** Build the AI Companion. Daily nudge, evidence outline, update draft, ask AI panel. Implements Foundation Section 06 in full.

**Read first:** `QADAM_FOUNDATION.md` Section 06 (AI Companion).

**Touches:**
- `qadam_backend/lib/qadam/ai/` (new module — companion_digest_worker, evidence_draft_agent, update_draft_agent, companion_chat)
- `qadam_backend/lib/qadam_web/controllers/ai_controller.ex` (extend)
- `qadam_backend/priv/repo/migrations/` (companion_nudges, companion_conversations tables)
- `qadam_frontend/src/components/ai/` (DailyNudge, AiOutlineHelper, AiUpdateHelper, AskAiTrigger, AskAiPanel)
- `qadam_frontend/src/app/dashboard/page.tsx` (mount DailyNudge)

**Checkpoint:**
- Blocks 1–6 committed.
- Anthropic API key works (test with existing /api/ai/help).

### PROMPT

```
Read QADAM_FOUNDATION.md Section 06 (AI Companion) before starting.

Goal: build the full AI Companion — 4 surfaces matching the Foundation. AI helps the creator ship, never judges, never publishes.

Tasks:

1. Create database tables (one migration):
   - companion_nudges: id, campaign_id (FK), creator_wallet, title, body, primary_cta_label, primary_cta_action, generated_at, dismissed_at (nullable), read_at (nullable), source_signals (JSONB — what triggered this nudge for debugging)
   - companion_conversations: id, campaign_id (FK), creator_wallet, started_at
   - companion_messages: id, conversation_id (FK), role (user|assistant), content (text), created_at, token_count

2. Build CompanionDigestWorker (qadam_backend/lib/qadam/ai/companion_digest_worker.ex):
   - Oban worker, scheduled daily at 9am creator-local-time (use creator profile's location to estimate timezone, fall back to UTC)
   - For each active campaign of each creator:
     - Build context bundle: { campaign, current_milestone, days_to_deadline, last_update_age_days, last_evidence_draft_age_days, backer_count, days_since_last_backer }
     - If a non-dismissed nudge already exists for this campaign generated <20 hours ago, skip
     - Call Anthropic API with this context using a system prompt that defines the role (per Foundation: partner who helps creator ship, never publishes, never judges)
     - Parse response into { title, body, primary_cta_label, primary_cta_action }
     - Insert into companion_nudges
   - Important: limit context bundle size — don't dump entire campaign history. Recent activity (last 14 days) is enough.
   - Add tests with mocked Anthropic client.

3. Build EvidenceDraftAgent endpoint:
   - POST /api/ai/evidence_draft, body { milestone_id }
   - Read milestone with acceptance_criteria
   - Call Anthropic with prompt: "Generate a structured outline for evidence submission. For each acceptance criterion, write a heading and 2–3 sentence scaffold of how the creator might prove it. Don't fabricate specifics — leave placeholders like [link to deployed app]."
   - Return JSON: [{ criterion: string, scaffold: string }]
   - Synchronous (no streaming).

4. Build UpdateDraftAgent endpoint:
   - POST /api/ai/update_draft, body { campaign_id, prompt }
   - Where 'prompt' is the creator's short description ("we shipped the auth system" etc.)
   - Read recent campaign activity (last week's commits/updates if any), milestone state
   - Call Anthropic with prompt: "Draft a structured campaign update with three sections: What got done, What's coming next, Any risks or asks for backers. Keep it under 200 words. Use creator's voice — match the existing campaign description tone."
   - Return JSON: { title, body, sections: { done, next, risks } }

5. Build CompanionChat (SSE streaming):
   - POST /api/ai/companion_chat, body { campaign_id, conversation_id (optional), message }
   - If conversation_id is null, create new conversation
   - Append user message to companion_messages
   - Build full conversation history for context (last 20 messages)
   - Call Anthropic with streaming, server-sent events back to frontend
   - On stream end, persist assistant message
   - SSE format: events { type: 'token', content: '...' } and { type: 'done' }
   - Use Phoenix.Endpoint chunking or PubSub — match what the existing /api/ai/help uses or upgrade if it doesn't stream.

6. Build <DailyNudge /> component:
   - Path: qadam_frontend/src/components/ai/DailyNudge.tsx
   - Props: campaignId
   - Fetches GET /api/ai/nudges?campaign_id=X (one most recent unread)
   - Renders the gradient amber card from /design-system AI section (already in design tokens)
   - Header: "TODAY'S FOCUS · AI COMPANION"
   - Title (Instrument Serif, 22px), body (Inter), primary CTA button (amber pill), "Not today" link (dismisses → marks dismissed_at)
   - On primary CTA click, route to the action specified (e.g. /dashboard/[id]/submit-evidence/[milestone] or /dashboard/[id]/update/new)

7. Mount DailyNudge in Dashboard:
   - At top of /dashboard/page.tsx (and creator-specific dashboard if separate)
   - For each active campaign owned by user, render at most one nudge card
   - If no nudges, render nothing — don't show empty placeholder

8. Build <AiOutlineHelper /> for Submit Evidence step 2:
   - On mount: GET acceptance criteria for the milestone
   - "Generate outline" button (small, amber, with sparkles icon)
   - On click: POST to /api/ai/evidence_draft → renders structured outline above the textarea
   - Each criterion shows as a heading with the AI's scaffold below — creator can click "Use this" to copy into the main textarea, or "Ignore" to dismiss that criterion's scaffold

9. Build <AiUpdateHelper /> for Post Update modal:
   - Adds a small "Need help drafting?" affordance at the top of the post-update form
   - On click: small input "What's the update about?" → on submit, calls /api/ai/update_draft → fills the form with returned draft
   - Creator edits and posts as normal

10. Build <AskAiTrigger /> + <AskAiPanel />:
    - AskAiTrigger: floating button bottom-right of any creator dashboard or campaign-edit page (only visible to creator). Sparkles icon, label "Ask AI". Click toggles panel.
    - AskAiPanel: side drawer (right side, 420px wide), full height. Header: "Ask AI · [campaign name]". Below: messages list (scrollable). Bottom: input + send.
    - Streaming token rendering — use the SSE endpoint from task 5
    - Persists to companion_conversations — on reopen, loads conversation history

DO NOT:
- Add backer-side AI surfaces (per Foundation, AI is creator-only)
- Add 'AI-assisted' badges visible to backers
- Auto-publish anything

Acceptance:
- Dashboard shows DailyNudge when generated; clicking primary CTA navigates correctly
- "Not today" dismisses, no second nudge until next day
- Submit Evidence: click Generate outline → structured suggestions appear → "Use this" copies into textarea
- Post Update: short input → AI fills draft → creator edits and posts
- Ask AI panel: open, type question, see streaming response, close, reopen → conversation preserved
- All endpoints respect Foundation boundaries (no auto-publish, never judges milestones, says "I'm not sure" when uncertain)

Commit message: feat(rebuild-7): AI Companion — daily nudge + 3 surfaces
```

---

# Block 8 — Read-side: Detail / Discover / Portfolio

**Goal:** Update the read-side pages to surface all the new fields properly. This is the layer backers see.

**Read first:** All of `QADAM_FOUNDATION.md`.

**Touches:**
- `qadam_frontend/src/app/campaigns/[id]/page.tsx`
- `qadam_frontend/src/app/discover/page.tsx`
- `qadam_frontend/src/app/portfolio/page.tsx`
- `qadam_frontend/src/app/profile/[wallet]/page.tsx` (new — public profile)
- `qadam_frontend/src/components/campaign/` (CampaignCard updates)

**Checkpoint:**
- Blocks 1–7 committed.
- A real test campaign exists on devnet created with the new wizard.

### PROMPT

```
Read all of QADAM_FOUNDATION.md before starting.

Goal: bring the backer-facing pages in line with the new data model. Surface story split, team, tier_config, voting params, funding deadline.

Tasks:

1. Update /campaigns/[id] page:
   - Hero section: cover image, category pill, name, one_liner, location, "X days left to back" countdown (computed from funding_deadline)
   - Creator strip: avatar, display_name, location, social icons (clickable). Clicking name → /profile/[wallet]
   - Tabs: About / Milestones / Updates / Backers / FAQ — keep existing tabs
   - About tab content (NEW STRUCTURE):
     - Section: The Problem → renders campaign.problem
     - Section: The Solution → renders campaign.solution
     - Section: Why Now → renders campaign.why_now
     - Section: Background (only if non-empty) → renders campaign.background
     - Risks & Challenges card (amber stroke) → renders campaign.risks
     - Team section: list of team members with avatar, name, role, social link. If no team, just show creator card.
   - Milestones tab content (REFACTOR):
     - Each milestone: title, deliverables, amount, deadline, acceptance_criteria as bullet list
     - Status pill (pending / in_progress / submitted / approved / rejected)
     - Visual milestone path at top — dots connected by lines, color-coded by status
   - Sidebar:
     - Funding card (existing) — shows raised / goal / progress bar / X days left to back / Back button
     - Tier rewards card — renders tier_config dynamically: cards per tier with multiplier, spots remaining, "spot left" hint when low
     - Voting rules card (NEW) — small card showing "Voting rules: X-day vote period · Y% quorum · Z% threshold". Just a stat line, no interaction.
   - Remove all hardcoded references to "Almaty, Kazakhstan", "Genesis/Early/Standard tiers", "1.0x/0.67x/0.5x", etc.

2. Update Discover page (/discover):
   - Top: filter bar
     - Category pills (10 categories from Foundation) — multi-select
     - Sort dropdown: Trending / Newest / Ending soon / Most backed
   - Grid: campaign cards
     - Card shows: cover, category pill, name, one_liner, creator display_name + avatar, raised/goal progress, "X days left" if funding_deadline approaching
     - On hover: subtle elevation, tier badges shown ("Founders open" / "Last few Founder spots" if applicable)
   - Empty state when filters return nothing: "No campaigns match. Try adjusting filters." with reset button

3. Update Portfolio page (/portfolio):
   - Stats grid (existing) — keep
   - For each backed campaign:
     - Show backer's tier name (from campaign.tier_config matched by backer.tier_index)
     - Show ownership points earned
     - Show projected token allocation when campaign completes (= my_points / total_points × estimated_total_tokens; if total_points unknown, show "Calculated at completion")
     - Show vote action chip when active vote available for this campaign

4. Build /profile/[wallet] public profile page (new):
   - Hero: avatar, display_name, location, bio
   - Below: socials icons row
   - "Campaigns by this creator" — grid of their campaigns (active + completed)
   - "Backed campaigns" — separate section, grid of campaigns this wallet has backed
   - Reputation indicator (placeholder for now): "X campaigns launched · Y completed · Z% on-time delivery" — compute from backend, expose via GET /api/profile/:wallet/stats

5. Update CampaignCard component:
   - Show creator display_name with avatar (from joined profile data)
   - Show category pill
   - Show "ending soon" amber badge when funding_deadline < 7 days
   - Truncate one_liner properly with ellipsis

6. Update navigation header:
   - Add /discover link if not present
   - User menu: profile avatar (from user profile if available, else default), dropdown with "View profile" / "Edit profile" / "My campaigns" / "Disconnect"

7. Smoke test: end-to-end with a real test campaign created in Block 5/6:
   - Open /discover → see campaign with new card
   - Click → /campaigns/[id] → see new About structure
   - Switch tabs, verify all content renders without errors
   - Back from second wallet → /portfolio → see ownership points and tier name
   - Open creator's /profile/[wallet] → see their campaign

DO NOT:
- Touch the wizard or AI Companion (those are done)
- Add new features beyond what Foundation specifies

Acceptance:
- /campaigns/[id] surfaces all new fields, no references to old hardcoded labels
- /discover filters by category, sorts by all four options
- /portfolio shows tier name and points (not just SOL backed)
- /profile/[wallet] page exists, shows real profile data, lists their campaigns
- Real devnet campaign created in Block 5/6 displays end-to-end with no errors

Commit message: feat(rebuild-8): read-side updates — detail / discover / portfolio / profile
```

---

# Final acceptance — when is the rebuild done?

After Block 8, you should be able to do this end-to-end without touching support tools:

1. **New wallet connects.** Sees onboarding profile modal. Fills it. Modal closes.
2. **Goes to /create.** Fills 5-step wizard with Story split, Team, Plan with structured acceptance criteria, custom tier config, custom voting rules. Hits Launch.
3. **Campaign appears on /discover** under correct category, with creator's display_name, with category pill.
4. **Campaign Detail page** shows Problem / Solution / Why Now sections, team, milestones with criteria, dynamic tier cards, voting rules card.
5. **Second wallet backs it.** Shows up in Portfolio with correct tier name, ownership points, projected allocation.
6. **Creator opens dashboard.** Sees Daily Nudge from AI Companion. Clicks "Submit evidence" → wizard appears with Evidence Outline helper. Generates outline. Edits. Submits.
7. **Backer votes.** Vote rules respect campaign's custom quorum/threshold/period. Quorum and threshold counts displayed live.
8. **Vote passes.** Anchor program releases milestone (97.5% to creator, 2.5% to treasury). Visible on Solana Explorer.
9. **Creator opens AI panel.** Asks "What should I do next?" Gets streaming response. Closes. Reopens later — conversation preserved.

If all 9 work without bugs, the rebuild is complete. Then the product is "целостный" — every screen aligns with Foundation, every entity is properly modeled, every system invariant is enforced where it should be.

---

# What's NOT in this mega-prompt (intentionally)

These are improvements for after the rebuild lands:

- **Landing page redesign** — current landing is okay, will polish after foundation work lands.
- **Image upload for avatar / cover** — using URL inputs for now. Add S3 / Cloudflare R2 later.
- **Public Pencil row screens** (Row 1, Row 2) — covered in code via the existing UI; we don't need separate Pencil mockups for these now.
- **Reputation system** (creator score, badges) — placeholder stat line in profile page; full system later.
- **Notifications taxonomy** (richer event coverage) — current minimal coverage from existing code is enough for now.
- **SEO metadata, sitemaps, OG images per campaign** — backlog for after first real creators are live.
- **Mobile responsive polish** — current app works on desktop; mobile pass after rebuild.

These are real and we'll get to them. They just don't belong in *this* sequence.

---

*This document, together with QADAM_FOUNDATION.md, fully specifies the rebuild. Save both files at repo root. Run blocks in order. Commit between blocks. Don't skip checkpoints.*
