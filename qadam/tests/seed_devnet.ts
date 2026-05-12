import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Qadam } from "../target/types/qadam";
import { Keypair, PublicKey, LAMPORTS_PER_SOL, Connection } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";

async function main() {
  const connection = new Connection("https://api.devnet.solana.com", "confirmed");
  const wallet = anchor.Wallet.local();
  const provider = new anchor.AnchorProvider(connection, wallet, { commitment: "confirmed" });
  anchor.setProvider(provider);

  const program = anchor.workspace.qadam as Program<Qadam>;
  const admin = wallet;

  console.log("Program:", program.programId.toBase58());
  console.log("Admin:", admin.publicKey.toBase58());
  console.log("Balance:", await connection.getBalance(admin.publicKey) / LAMPORTS_PER_SOL, "SOL");

  const [configPda] = PublicKey.findProgramAddressSync([Buffer.from("config")], program.programId);

  // Init config if needed
  // Init config
  const treasury = Keypair.generate();
  try {
    await program.methods.initializeConfig(admin.publicKey, treasury.publicKey).rpc();
    console.log("Config initialized! Treasury:", treasury.publicKey.toBase58());
  } catch (e: any) {
    if (e.transactionLogs?.some((l: string) => l.includes("already in use"))) {
      console.log("Config already exists, continuing...");
    } else {
      throw e;
    }
  }

  const now = Math.floor(Date.now() / 1000);

  // === Campaign 1: Qadam ===
  const nonce1 = new anchor.BN(1001);
  const [c1Pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("campaign"), admin.publicKey.toBuffer(), nonce1.toArrayLike(Buffer, "le", 8)],
    program.programId
  );
  const [v1] = PublicKey.findProgramAddressSync([Buffer.from("vault"), c1Pda.toBuffer()], program.programId);
  const [m1] = PublicKey.findProgramAddressSync([Buffer.from("mint"), c1Pda.toBuffer()], program.programId);

  try {
    await program.methods
      .createCampaign("Qadam Platform", nonce1, 5, new anchor.BN(500 * LAMPORTS_PER_SOL), new anchor.BN(10000),
        [{ multiplierBps: 10000, maxSpots: 25 }, { multiplierBps: 7000, maxSpots: 100 }, { multiplierBps: 5000, maxSpots: 0 }],
        7, 2000, 5000)
      .accounts({ creator: admin.publicKey, campaignVault: v1, tokenMint: m1, tokenProgram: TOKEN_PROGRAM_ID } as any)
      .rpc();
    console.log("Campaign 1 (Qadam):", c1Pda.toBase58());
  } catch (e: any) {
    if (e.transactionLogs?.some((l: string) => l.includes("already in use")) || e.message?.includes("already in use")) console.log("Campaign 1 exists:", c1Pda.toBase58());
    else throw e;
  }

  // Milestones for Qadam
  for (const [i, sol, days] of [[0,75,30],[1,50,45],[2,150,75],[3,125,105],[4,100,150]] as [number,number,number][]) {
    const [mp] = PublicKey.findProgramAddressSync([Buffer.from("milestone"), c1Pda.toBuffer(), Buffer.from([i])], program.programId);
    try {
      await program.methods.addMilestone(new anchor.BN(sol * LAMPORTS_PER_SOL), new anchor.BN(now + 86400 * days))
        .accounts({ creator: admin.publicKey, campaign: c1Pda, milestone: mp } as any).rpc();
      console.log(`  M${i}: ${sol} SOL, ${days}d`);
    } catch (e: any) {
      if (e.transactionLogs?.some((l: string) => l.includes("already in use")) || e.message?.includes("already in use")) console.log(`  M${i} exists`);
      else console.error(`  M${i} error:`, e.message?.slice(0, 80));
    }
  }

  // === Campaign 2: Lobby ===
  const nonce2 = new anchor.BN(1002);
  const [c2Pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("campaign"), admin.publicKey.toBuffer(), nonce2.toArrayLike(Buffer, "le", 8)],
    program.programId
  );
  const [v2] = PublicKey.findProgramAddressSync([Buffer.from("vault"), c2Pda.toBuffer()], program.programId);
  const [m2] = PublicKey.findProgramAddressSync([Buffer.from("mint"), c2Pda.toBuffer()], program.programId);

  try {
    await program.methods
      .createCampaign("The Lobby Bootcamp", nonce2, 4, new anchor.BN(200 * LAMPORTS_PER_SOL), new anchor.BN(5000),
        [{ multiplierBps: 10000, maxSpots: 20 }, { multiplierBps: 7000, maxSpots: 50 }, { multiplierBps: 5000, maxSpots: 0 }],
        7, 2000, 5000)
      .accounts({ creator: admin.publicKey, campaignVault: v2, tokenMint: m2, tokenProgram: TOKEN_PROGRAM_ID } as any)
      .rpc();
    console.log("Campaign 2 (Lobby):", c2Pda.toBase58());
  } catch (e: any) {
    if (e.transactionLogs?.some((l: string) => l.includes("already in use")) || e.message?.includes("already in use")) console.log("Campaign 2 exists:", c2Pda.toBase58());
    else throw e;
  }

  // Milestones for Lobby
  for (const [i, sol, days] of [[0,60,60],[1,60,90],[2,50,120],[3,30,150]] as [number,number,number][]) {
    const [mp] = PublicKey.findProgramAddressSync([Buffer.from("milestone"), c2Pda.toBuffer(), Buffer.from([i])], program.programId);
    try {
      await program.methods.addMilestone(new anchor.BN(sol * LAMPORTS_PER_SOL), new anchor.BN(now + 86400 * days))
        .accounts({ creator: admin.publicKey, campaign: c2Pda, milestone: mp } as any).rpc();
      console.log(`  M${i}: ${sol} SOL, ${days}d`);
    } catch (e: any) {
      if (e.transactionLogs?.some((l: string) => l.includes("already in use")) || e.message?.includes("already in use")) console.log(`  M${i} exists`);
      else console.error(`  M${i} error:`, e.message?.slice(0, 80));
    }
  }

  console.log("\n=== DONE ===");
  console.log("Qadam PDA:", c1Pda.toBase58());
  console.log("Lobby PDA:", c2Pda.toBase58());
  console.log("\nSQL to update Postgres:");
  console.log(`UPDATE campaigns SET solana_pubkey = '${c1Pda.toBase58()}' WHERE solana_pubkey = 'qadam_platform_001';`);
  console.log(`UPDATE campaigns SET solana_pubkey = '${c2Pda.toBase58()}' WHERE solana_pubkey = 'demo_bootcamp_010';`);
}

main().catch(console.error);
