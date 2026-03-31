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
    category: "Apps",
    status: "active",
    goal_lamports: 50 * sol,
    raised_lamports: trunc(37.5 * sol),
    backers_count: 42,
    milestones_count: 4,
    milestones_approved: 1,
    token_mint_address: "mint_nomad_001",
    tokens_per_lamport: 20_000,
    milestones: [
      %{index: 0, title: "Prototype & Core Banking API", amount_lamports: trunc(12.5 * sol), deadline: past.(3), status: "approved", ai_decision: "approved", ai_explanation: "Prototype demonstrates working multi-currency account creation and basic transfer functionality. Live demo verified.", decided_at: past.(2)},
      %{index: 1, title: "Crypto Off-Ramp Integration", amount_lamports: trunc(12.5 * sol), deadline: future.(14), status: "pending"},
      %{index: 2, title: "Tax Reporting Engine", amount_lamports: trunc(12.5 * sol), deadline: future.(30), status: "pending"},
      %{index: 3, title: "Public Launch + App Store", amount_lamports: trunc(12.5 * sol), deadline: future.(45), status: "pending"},
    ]
  },
  %{
    solana_pubkey: "demo_chainquest_002",
    creator_wallet: "Cr2ChainQuestABC1111111111111111111111111111",
    title: "ChainQuest — On-chain RPG",
    description: "Fully on-chain RPG where every item, quest, and battle is a Solana transaction. Play-to-own, not play-to-earn.",
    category: "Games",
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
    category: "SaaS",
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
    category: "Tools",
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
    category: "Infrastructure",
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
    category: "Apps",
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
    category: "SaaS",
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
    category: "Games",
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
    category: "Tools",
    status: "active",
    goal_lamports: 40 * sol,
    raised_lamports: 8 * sol,
    backers_count: 12,
    milestones_count: 3,
    milestones_approved: 0,
    token_mint_address: "mint_solmail_009",
    tokens_per_lamport: 25_000,
    milestones: [
      %{index: 0, title: "Encryption Protocol + Relay", amount_lamports: 15 * sol, deadline: future.(25), status: "pending"},
      %{index: 1, title: "Web Client + Contacts", amount_lamports: 15 * sol, deadline: future.(45), status: "pending"},
      %{index: 2, title: "Mobile App + Notifications", amount_lamports: 10 * sol, deadline: future.(60), status: "pending"},
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
