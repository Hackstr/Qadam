# Seed demo campaigns and milestones
#
# Run: mix run priv/repo/seeds.exs

alias QadamBackend.Repo
alias QadamBackend.Campaigns.Campaign
alias QadamBackend.Milestones.Milestone

# 1 SOL in lamports
sol = 1_000_000_000

now = DateTime.utc_now() |> DateTime.truncate(:second)
future = fn days -> DateTime.add(now, days * 86400, :second) end
past = fn days -> DateTime.add(now, -days * 86400, :second) end

IO.puts("Seeding campaigns...")

campaigns = [
  %{
    solana_pubkey: "demo_nomad_001",
    creator_wallet: "Cr1NomadXYZ111111111111111111111111111111111",
    title: "Nomad — Digital Nomad Finance App",
    description: "All-in-one banking for remote workers. Multi-currency accounts, crypto off-ramps, tax tools for 40+ countries.",
    category: "Tech",
    status: "active",
    goal_lamports: 50 * sol,
    raised_lamports: trunc(37.5 * sol),
    backers_count: 42,
    milestones_count: 4,
    milestones_approved: 1,
    token_mint_address: "mint_nomad_001",
    tokens_per_lamport: 20_000,
    milestones: [
      %{index: 0, title: "Prototype & Core Banking API", description: "Core banking API with multi-currency account creation, basic transfers, and KYC integration for 3 countries.", acceptance_criteria: "Live demo showing account creation, SOL↔USD transfer, and KYC flow completion.", amount_lamports: trunc(12.5 * sol), deadline: past.(3), status: "approved", ai_decision: "approved", ai_explanation: "Prototype demonstrates working multi-currency account creation and basic transfer functionality. Live demo verified.", decided_at: past.(2)},
      %{index: 1, title: "Crypto Off-Ramp Integration", description: "Integration with local payment rails in KZ, RU, and EU for SOL-to-fiat conversion.", acceptance_criteria: "Working off-ramp demo: user converts 1 SOL to local currency. Transaction completes within 24 hours.", amount_lamports: trunc(12.5 * sol), deadline: future.(14), status: "pending"},
      %{index: 2, title: "Tax Reporting Engine", description: "Automated tax report generation for freelancers in 40+ countries. Supports KZ, RU, EU tax formats.", acceptance_criteria: "Generate sample tax reports for 3 jurisdictions. Reports match local format requirements.", amount_lamports: trunc(12.5 * sol), deadline: future.(30), status: "pending"},
      %{index: 3, title: "Public Launch + App Store", description: "iOS and Android app submission. Public launch with marketing site and onboarding flow.", acceptance_criteria: "App live on App Store and Google Play. 100+ downloads in first week.", amount_lamports: trunc(12.5 * sol), deadline: future.(45), status: "pending"},
    ]
  },
  %{
    solana_pubkey: "demo_chainquest_002",
    creator_wallet: "Cr2ChainQuestABC1111111111111111111111111111",
    title: "ChainQuest — On-chain RPG",
    description: "Fully on-chain RPG where every item, quest, and battle is a Solana transaction. Play-to-own, not play-to-earn.",
    category: "Community",
    status: "active",
    goal_lamports: 100 * sol,
    raised_lamports: 23 * sol,
    backers_count: 156,
    milestones_count: 5,
    milestones_approved: 0,
    token_mint_address: "mint_chainquest_002",
    tokens_per_lamport: 10_000,
    milestones: [
      %{index: 0, title: "Game Engine + Character System", amount_lamports: 20 * sol, deadline: future.(7), status: "submitted", submitted_at: past.(1)},
      %{index: 1, title: "Quest & Battle Mechanics", amount_lamports: 20 * sol, deadline: future.(21), status: "pending"},
      %{index: 2, title: "NFT Items & Marketplace", amount_lamports: 20 * sol, deadline: future.(35), status: "pending"},
      %{index: 3, title: "Multiplayer & Guilds", amount_lamports: 20 * sol, deadline: future.(49), status: "pending"},
      %{index: 4, title: "Public Beta Launch", amount_lamports: 20 * sol, deadline: future.(60), status: "pending"},
    ]
  },
  %{
    solana_pubkey: "demo_invoiceflow_003",
    creator_wallet: "Cr3InvoiceFlowDEF11111111111111111111111111",
    title: "InvoiceFlow — AI Accounting for Freelancers",
    description: "Snap a photo of any receipt or invoice. AI categorizes, tracks expenses, generates tax reports. Supports KZ, RU, EU.",
    category: "Software",
    status: "active",
    goal_lamports: 20 * sol,
    raised_lamports: trunc(18.5 * sol),
    backers_count: 28,
    milestones_count: 3,
    milestones_approved: 2,
    token_mint_address: "mint_invoiceflow_003",
    tokens_per_lamport: 50_000,
    milestones: [
      %{index: 0, title: "OCR + AI Categorization", amount_lamports: 7 * sol, deadline: past.(15), status: "approved", ai_decision: "approved", ai_explanation: "OCR accurately reads invoices in 3 languages. AI categorization 94% accurate on test set.", decided_at: past.(14)},
      %{index: 1, title: "Tax Report Generation", amount_lamports: 7 * sol, deadline: past.(5), status: "approved", ai_decision: "approved", ai_explanation: "Tax reports generated correctly for KZ and RU formats. EU support confirmed with sample data.", decided_at: past.(4)},
      %{index: 2, title: "Mobile App + Integrations", amount_lamports: 6 * sol, deadline: future.(10), status: "pending"},
    ]
  },
  %{
    solana_pubkey: "demo_solanaguard_004",
    creator_wallet: "Cr4SolanaGuardGHI1111111111111111111111111",
    title: "SolanaGuard — Smart Contract Audit Tool",
    description: "Automated security scanner for Anchor programs. Finds common vulnerabilities before hackers do. CLI + Web dashboard.",
    category: "Software",
    status: "completed",
    goal_lamports: 30 * sol,
    raised_lamports: 30 * sol,
    backers_count: 67,
    milestones_count: 3,
    milestones_approved: 3,
    token_mint_address: "mint_solanaguard_004",
    tokens_per_lamport: 30_000,
    milestones: [
      %{index: 0, title: "Vulnerability Scanner Core", amount_lamports: 10 * sol, deadline: past.(25), status: "approved", ai_decision: "approved", ai_explanation: "Scanner detects 12 common vulnerability patterns. Test suite passes with 95% accuracy.", decided_at: past.(24)},
      %{index: 1, title: "Anchor Program Support", amount_lamports: 10 * sol, deadline: past.(18), status: "approved", ai_decision: "approved", ai_explanation: "Full Anchor IDL parsing. Detects PDA misuse, missing signer checks, arithmetic overflow.", decided_at: past.(17)},
      %{index: 2, title: "Web Dashboard + CI/CD Plugin", amount_lamports: 10 * sol, deadline: past.(10), status: "approved", ai_decision: "approved", ai_explanation: "Dashboard live at demo URL. GitHub Actions plugin works. Documentation complete.", decided_at: past.(9)},
    ]
  },
  %{
    solana_pubkey: "demo_mesh_005",
    creator_wallet: "Cr5MeshCDNJKL111111111111111111111111111111",
    title: "Mesh — Decentralized CDN on Solana",
    description: "Share your spare bandwidth, earn SOL. Web3 alternative to Cloudflare with edge nodes in 50+ countries.",
    category: "Tech",
    status: "active",
    goal_lamports: 200 * sol,
    raised_lamports: 45 * sol,
    backers_count: 89,
    milestones_count: 5,
    milestones_approved: 0,
    token_mint_address: "mint_mesh_005",
    tokens_per_lamport: 5_000,
    milestones: [
      %{index: 0, title: "Node Client + Protocol", amount_lamports: 40 * sol, deadline: future.(20), status: "pending"},
      %{index: 1, title: "Payment Layer (SOL streaming)", amount_lamports: 40 * sol, deadline: future.(40), status: "pending"},
      %{index: 2, title: "CDN Routing Algorithm", amount_lamports: 40 * sol, deadline: future.(55), status: "pending"},
      %{index: 3, title: "Dashboard + Analytics", amount_lamports: 40 * sol, deadline: future.(70), status: "pending"},
      %{index: 4, title: "Public Network Launch", amount_lamports: 40 * sol, deadline: future.(90), status: "pending"},
    ]
  },
  %{
    solana_pubkey: "demo_langbridge_006",
    creator_wallet: "Cr6LangBridgeMNO1111111111111111111111111",
    title: "LangBridge — Real-time Translation Earbuds",
    description: "Hardware + software: wireless earbuds with on-device AI translation. 30 languages, <500ms latency.",
    category: "Hardware",
    status: "active",
    goal_lamports: 150 * sol,
    raised_lamports: 112 * sol,
    backers_count: 234,
    milestones_count: 4,
    milestones_approved: 1,
    token_mint_address: "mint_langbridge_006",
    tokens_per_lamport: 8_000,
    milestones: [
      %{index: 0, title: "AI Translation Model", amount_lamports: trunc(37.5 * sol), deadline: past.(10), status: "approved", ai_decision: "approved", ai_explanation: "Translation model handles 30 languages. Demo shows <500ms latency on test phrases.", decided_at: past.(9)},
      %{index: 1, title: "Hardware Prototype", amount_lamports: trunc(37.5 * sol), deadline: future.(15), status: "submitted", submitted_at: past.(2)},
      %{index: 2, title: "Manufacturing Partner", amount_lamports: trunc(37.5 * sol), deadline: future.(40), status: "pending"},
      %{index: 3, title: "Shipping v1", amount_lamports: trunc(37.5 * sol), deadline: future.(60), status: "pending"},
    ]
  },
  %{
    solana_pubkey: "demo_farmdao_007",
    creator_wallet: "Cr7FarmDAOPQR11111111111111111111111111111",
    title: "FarmDAO — Tokenized Agriculture in Kazakhstan",
    description: "Invest in real farms through tokens. Track crop growth via IoT sensors. Harvest = dividends.",
    category: "Climate",
    status: "active",
    goal_lamports: 80 * sol,
    raised_lamports: 80 * sol,
    backers_count: 51,
    milestones_count: 3,
    milestones_approved: 1,
    token_mint_address: "mint_farmdao_007",
    tokens_per_lamport: 12_000,
    milestones: [
      %{index: 0, title: "IoT Sensor Network", amount_lamports: 27 * sol, deadline: past.(8), status: "approved", ai_decision: "approved", ai_explanation: "Sensor network deployed on 3 test farms. Dashboard shows real-time soil moisture and temperature.", decided_at: past.(7)},
      %{index: 1, title: "Token + Dashboard", amount_lamports: 27 * sol, deadline: future.(12), status: "pending"},
      %{index: 2, title: "First Harvest + Distribution", amount_lamports: 26 * sol, deadline: future.(30), status: "pending"},
    ]
  },
  %{
    solana_pubkey: "demo_pixelforge_008",
    creator_wallet: "Cr8PixelForgeSTU1111111111111111111111111",
    title: "PixelForge — AI Game Asset Generator",
    description: "Generate 2D/3D game assets from text prompts. Spritesheets, tilesets, character animations. Free for indie devs.",
    category: "Art & Design",
    status: "completed",
    goal_lamports: 15 * sol,
    raised_lamports: 15 * sol,
    backers_count: 35,
    milestones_count: 2,
    milestones_approved: 2,
    token_mint_address: "mint_pixelforge_008",
    tokens_per_lamport: 60_000,
    milestones: [
      %{index: 0, title: "2D Sprite Generation", amount_lamports: trunc(7.5 * sol), deadline: past.(30), status: "approved", ai_decision: "approved", ai_explanation: "Sprite generation produces consistent style. 16x16 to 128x128 supported. Tileset generation working.", decided_at: past.(29)},
      %{index: 1, title: "3D Models + Animation", amount_lamports: trunc(7.5 * sol), deadline: past.(20), status: "approved", ai_decision: "approved", ai_explanation: "3D model generation from text prompts working. Basic walk/idle animations. Export to glTF format.", decided_at: past.(19)},
    ]
  },
  %{
    solana_pubkey: "demo_solmail_009",
    creator_wallet: "Cr9SolMailVWX111111111111111111111111111111",
    title: "SolMail — Encrypted Email on Solana",
    description: "End-to-end encrypted email where your wallet IS your address. No servers, no censorship, no spam.",
    category: "Software",
    status: "active",
    goal_lamports: 40 * sol,
    raised_lamports: 8 * sol,
    backers_count: 12,
    milestones_count: 3,
    milestones_approved: 0,
    token_mint_address: "mint_solmail_009",
    tokens_per_lamport: 25_000,
    milestones: [
      %{index: 0, title: "Encryption Protocol + Relay", description: "Build the core encryption layer using Solana keypairs for identity. Set up relay infrastructure for message routing without storing plaintext.", acceptance_criteria: "Working demo: two wallets exchange encrypted messages via relay. Message unreadable by relay operator. Latency under 3 seconds.", amount_lamports: 15 * sol, deadline: future.(25), status: "pending"},
      %{index: 1, title: "Web Client + Contacts", description: "Browser-based email client with wallet login. Contact management using on-chain identity. Inbox, sent, drafts.", acceptance_criteria: "Deployed web app at demo URL. User can log in with Phantom, send/receive encrypted email, manage contacts.", amount_lamports: 15 * sol, deadline: future.(45), status: "pending"},
      %{index: 2, title: "Mobile App + Notifications", description: "React Native app for iOS and Android. Push notifications for new messages. Offline draft support.", acceptance_criteria: "TestFlight/APK available. Push notifications working. App loads inbox within 2 seconds.", amount_lamports: 10 * sol, deadline: future.(60), status: "pending"},
    ]
  },
  %{
    solana_pubkey: "demo_bootcamp_010",
    creator_wallet: "E5k4pce2gbPhd2y3rBVfCnNKe4hqVJvsuswaNZGEA9nz",
    title: "The Lobby Bootcamp — Esports Retreat in Almaty",
    description: "The first esports retreat in Central Asia. A cottage in the Almaty foothills with five gaming PCs, a streaming station, six beds, and one mission — give serious CS2 players a place to live, train, and grow as a team.",
    category: "Community",
    status: "active",
    goal_lamports: 200 * sol,
    raised_lamports: 0,
    backers_count: 0,
    milestones_count: 4,
    milestones_approved: 0,
    token_mint_address: "mint_bootcamp_010",
    tokens_per_lamport: 5_000,
    # Foundation v1 story fields
    problem: "CIS has 30 million CS2 players and zero infrastructure for them. In Almaty alone there are over 600 gaming clubs — all of them computer cafes, not training facilities. You rent a PC by the hour, bring your own peripherals, go home when your session ends. You can't stay overnight. You can't store equipment. You can't review demos with your team after midnight. For someone who wants to actually become a competitive player, there is no place to go in this region. Meanwhile Korea, Germany, Sweden, US have had bootcamps since 2002 — team houses with 24/7 access, coaches, kitchens, beds. We surveyed 84 CS2 players across Almaty, Astana, Tashkent, Bishkek — 7 of 84 had ever played from the same location as their whole team for more than one night. Zero had been in a place built for the purpose.",
    solution: "A rented two-storey cottage in the Almaty foothills, 30 minutes from city center. Training room: 5 gaming PCs (i7-14700K, RTX 4070 Super, 240Hz monitors), 1 streaming/coaching station, 1 Gbps fiber. Common space: kitchen, 8-seat dining table, lounge with projector, outdoor terrace with mountain view. Sleeping: 3 bedrooms, 6 beds, 2 bathrooms. Teams book 5-day retreats — arrive Sunday night, train Monday through Friday with a coach, play scrims and ranked, review demos, eat together, leave Friday as a different team.",
    why_now: "Three things converged: CS2 replaced CS:GO and reset the competitive ladder — every team in CIS is rebuilding strats from scratch, which means demand for focused practice is at an all-time high. Second, the Kazakhstan esports federation is launching a new national ranking system that rewards teams who train together. Third, we already have the community — the-lobby.pro platform has active tournament players, and Clash Arena events proved the demand.",
    background: "We've been in this for three years. Khakim Yessenzhanov built The Lobby — a tournament platform at the-lobby.pro with active CS2 leagues. Alisher Yessenzhanov organized Clash Arena — Almaty's first grassroots CS2 LAN at 322 CyberLounge. Together we've seen hundreds of players who want to improve but have nowhere to go. This bootcamp is the answer to the question every serious player has asked us: where can my team actually train?",
    risks: "1. Construction delays — Cottage renovation depends on contractor availability. Mitigated by starting lease in July (low season) and having backup venues scouted. 2. Demand risk — What if teams don't book? We have pre-interest from 12 teams via the-lobby.pro community + Clash Arena alumni. First 3 months of weekends are spoken for before we open. 3. Equipment costs fluctuate — GPU/monitor prices volatile. Budget includes 15% hardware buffer. We'll publish actual purchase receipts. 4. Location may change — If the specific cottage falls through, we move to another in the same area. The concept isn't tied to one building. 5. We're two people — Small team risk. Mitigated by The Lobby platform infrastructure (booking, payments, scheduling already built).",
    team_members: [
      %{"name" => "Khakim Yessenzhanov", "role" => "Co-founder & Platform", "social_link" => "https://x.com/khakim_y"},
      %{"name" => "Alisher Yessenzhanov", "role" => "Co-founder & Operations", "social_link" => ""}
    ],
    tier_config: [
      %{"name" => "Founders", "multiplier" => 1.0, "max_spots" => 20},
      %{"name" => "Early Backers", "multiplier" => 0.7, "max_spots" => 50},
      %{"name" => "Supporters", "multiplier" => 0.5, "max_spots" => nil}
    ],
    vote_period_days: 7,
    quorum_pct: Decimal.new("0.2000"),
    approval_threshold_pct: Decimal.new("0.5000"),
    faq: [
      %{"q" => "Where exactly is the bootcamp?", "a" => "Almaty foothills, ~30 min from city center. Exact address shared with backers after lease is signed."},
      %{"q" => "What games do you support?", "a" => "CS2 at launch. Stretch goals unlock Dota 2 and Valorant setups."},
      %{"q" => "Can individuals book, or only teams?", "a" => "Both. Solo players can join open weekends. Teams book 5-day retreats."},
      %{"q" => "Is there a coach?", "a" => "Yes — a contracted CS2 coach for team sessions. Individual coaching available separately."},
      %{"q" => "What's the minimum team size?", "a" => "3 players minimum for a team booking. We can mix partial teams for open weekends."},
      %{"q" => "Do backers get lifetime benefits?", "a" => "Yes. Founders tier gets permanent 30% discount. All backers get priority booking for life."},
      %{"q" => "What happens if the campaign doesn't reach its goal?", "a" => "On Qadam, funds are held in escrow and released per milestone. If milestones fail, community votes on refund."},
      %{"q" => "Can I visit before backing?", "a" => "Yes — we'll host an open day in Almaty once the cottage is leased. Backers get first invite."}
    ],
    location: "Almaty, Kazakhstan",
    launched_at: DateTime.utc_now() |> DateTime.truncate(:second),
    funding_deadline: future.(35),
    milestones: [
      %{index: 0, title: "Lease + Renovation", description: "Lease the cottage, begin renovation, install electrical and internet infrastructure. Publish photos and floor plan.", acceptance_criteria: "Lease document hash on-chain. 3+ photos of renovation progress published in campaign update. Internet speed test screenshot showing 1 Gbps.", amount_lamports: 60 * sol, deadline: future.(60), status: "pending"},
      %{index: 1, title: "PCs + Equipment Installed", description: "Assemble and install 5 gaming PCs, streaming station, monitors, peripherals. Test all equipment.", acceptance_criteria: "5-minute video walkthrough of training room with all PCs running. Equipment spec sheet published. Network latency test results.", amount_lamports: 60 * sol, deadline: future.(90), status: "pending"},
      %{index: 2, title: "Soft Opening + First Cohort", description: "First weekend with Founders-tier backers. First full team bootcamp week. Collect feedback.", acceptance_criteria: "Live photos from bootcamp weekend. Signed attendance from at least 4 backers. Post-retreat survey results published.", amount_lamports: 50 * sol, deadline: future.(120), status: "pending"},
      %{index: 3, title: "Public Opening", description: "Public booking calendar live. First public bookings accepted. Marketing launch.", acceptance_criteria: "Booking page live at the-lobby.pro/bootcamp. At least 3 public bookings confirmed. First month revenue report.", amount_lamports: 30 * sol, deadline: future.(150), status: "pending"}
    ]
  },
]

for campaign_data <- campaigns do
  {milestones_data, campaign_attrs} = Map.pop(campaign_data, :milestones, [])

  campaign_attrs = Map.merge(campaign_attrs, %{
    inserted_at: now,
    updated_at: now,
  })

  {:ok, campaign} = %Campaign{}
    |> Campaign.changeset(campaign_attrs)
    |> Repo.insert()

  IO.puts("  Created: #{campaign.title} (#{campaign.id})")

  for milestone_data <- milestones_data do
    grace_deadline = DateTime.add(milestone_data.deadline, 7 * 86400, :second)

    milestone_attrs = Map.merge(milestone_data, %{
      campaign_id: campaign.id,
      grace_deadline: grace_deadline,
      inserted_at: now,
      updated_at: now,
    })

    %Milestone{}
    |> Milestone.changeset(milestone_attrs)
    |> Repo.insert!()
  end
end

IO.puts("\nSeeded #{length(campaigns)} campaigns with milestones.")
