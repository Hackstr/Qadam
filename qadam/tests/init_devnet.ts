import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Qadam } from "../target/types/qadam";
import { Keypair, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";

async function main() {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.qadam as Program<Qadam>;
  const admin = provider.wallet as anchor.Wallet;

  console.log("Admin:", admin.publicKey.toBase58());

  // 1. Initialize config
  const [configPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("config")],
    program.programId
  );

  const aiAgent = Keypair.generate();
  const treasury = Keypair.generate();

  try {
    await program.methods
      .initializeConfig(admin.publicKey, aiAgent.publicKey, treasury.publicKey)
      .accounts({ payer: admin.publicKey })
      .rpc();
    console.log("Config initialized!");
    console.log("AI Agent:", aiAgent.publicKey.toBase58());
    console.log("Treasury:", treasury.publicKey.toBase58());
  } catch (e: any) {
    if (e.message?.includes("already in use")) {
      console.log("Config already exists, skipping...");
    } else {
      throw e;
    }
  }

  // 2. Create a campaign with Foundation v1 tier_config + voting params
  const nonce = new anchor.BN(Date.now());
  const goal = new anchor.BN(2 * LAMPORTS_PER_SOL);
  const tokensPerLamport = new anchor.BN(10000);

  // Foundation v1: per-campaign tier config
  const tierConfigs = [
    { multiplierBps: 10000, maxSpots: 50 },   // Founders 100%, 50 spots
    { multiplierBps: 7000, maxSpots: 200 },    // Early Backers 70%, 200 spots
    { multiplierBps: 5000, maxSpots: 0 },      // Supporters 50%, unlimited (0 = unlimited)
  ];

  // Foundation v1: per-campaign voting params
  const votePeriodDays = 7;
  const quorumBps = 2000;              // 20%
  const approvalThresholdBps = 5000;   // 50%

  const [campaignPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("campaign"), admin.publicKey.toBuffer(), nonce.toArrayLike(Buffer, "le", 8)],
    program.programId
  );
  const [vaultPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("vault"), campaignPda.toBuffer()],
    program.programId
  );
  const [mintPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("mint"), campaignPda.toBuffer()],
    program.programId
  );

  await program.methods
    .createCampaign(
      "Qadam Platform Development",
      nonce,
      2,                    // milestones_count
      goal,
      tokensPerLamport,
      tierConfigs,
      votePeriodDays,
      quorumBps,
      approvalThresholdBps,
    )
    .accounts({
      creator: admin.publicKey,
      config: configPda,
      campaignVault: vaultPda,
      tokenMint: mintPda,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .rpc();

  console.log("Campaign created:", campaignPda.toBase58());

  // Add milestones
  const now = Math.floor(Date.now() / 1000);
  for (let i = 0; i < 2; i++) {
    const [milestonePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("milestone"), campaignPda.toBuffer(), Buffer.from([i])],
      program.programId
    );
    await program.methods
      .addMilestone(
        new anchor.BN(1 * LAMPORTS_PER_SOL),
        new anchor.BN(now + 86400 * 30 * (i + 1))
      )
      .accounts({
        creator: admin.publicKey,
        config: configPda,
        campaign: campaignPda,
        milestone: milestonePda,
      })
      .rpc();
    console.log(`Milestone ${i} added`);
  }

  console.log("\n=== DONE ===");
  console.log("Campaign PDA:", campaignPda.toBase58());
  console.log("Vault PDA:", vaultPda.toBase58());
  console.log("Mint PDA:", mintPda.toBase58());
  console.log("\nTier config: Founders (100%, 50 spots) / Early Backers (70%, 200) / Supporters (50%, unlimited)");
  console.log("Voting: 7-day period, 20% quorum, 50% threshold");
  console.log("\nAnyone can now back this campaign on devnet!");
}

main().catch(console.error);
