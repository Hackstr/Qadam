#!/usr/bin/env node
/**
 * Sign and build Solana transactions for the AI agent.
 * Called by Elixir TransactionBuilder via System.cmd("node", [...]).
 *
 * Uses @coral-xyz/anchor with the Qadam IDL for proper instruction encoding.
 *
 * Input: JSON string as first CLI argument
 * Output: JSON to stdout { signedTx: base64 } or { error: string }
 */

const fs = require("fs");
const path = require("path");
const anchor = require("@coral-xyz/anchor");
const { Connection, Keypair, PublicKey, Transaction, SystemProgram } = require("@solana/web3.js");

const IDL = JSON.parse(fs.readFileSync(path.join(__dirname, "idl.json"), "utf-8"));

// Minimal wallet wrapper for Anchor Provider (no browser wallet needed)
class NodeWallet {
  constructor(keypair) {
    this.payer = keypair;
    this.publicKey = keypair.publicKey;
  }
  async signTransaction(tx) {
    tx.partialSign(this.payer);
    return tx;
  }
  async signAllTransactions(txs) {
    return txs.map((tx) => { tx.partialSign(this.payer); return tx; });
  }
}

// PDA derivations — must match Anchor program seeds
function getConfigPda(programId) {
  const [pda] = PublicKey.findProgramAddressSync([Buffer.from("config")], programId);
  return pda;
}
function getVaultPda(campaign, programId) {
  const [pda] = PublicKey.findProgramAddressSync([Buffer.from("vault"), campaign.toBuffer()], programId);
  return pda;
}
function getMilestonePda(campaign, index, programId) {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("milestone"), campaign.toBuffer(), Buffer.from([index])],
    programId
  );
  return pda;
}
function getVotingStatePda(milestone, programId) {
  const [pda] = PublicKey.findProgramAddressSync([Buffer.from("voting"), milestone.toBuffer()], programId);
  return pda;
}

async function main() {
  try {
    const input = JSON.parse(process.argv[2]);
    const { instruction, params, programId: programIdStr, rpcUrl, keypairPath } = input;

    // Load AI agent keypair
    const keypairData = JSON.parse(fs.readFileSync(keypairPath, "utf-8"));
    const keypair = Keypair.fromSecretKey(Uint8Array.from(keypairData));

    const programId = new PublicKey(programIdStr);
    const connection = new Connection(rpcUrl, "confirmed");
    const wallet = new NodeWallet(keypair);
    const provider = new anchor.AnchorProvider(connection, wallet, {
      commitment: "confirmed",
      skipPreflight: true,
    });
    const program = new anchor.Program(IDL, provider);

    const campaignPda = new PublicKey(params.campaign);
    const milestoneIndex = params.milestone_index;
    const milestonePda = getMilestonePda(campaignPda, milestoneIndex, programId);
    const configPda = getConfigPda(programId);
    const vaultPda = getVaultPda(campaignPda, programId);

    let tx;

    switch (instruction) {
      case "release_milestone": {
        // Parse ai_decision_hash — hex string to byte array
        const hashBytes = parseHash(params.ai_decision_hash);

        // Fetch campaign to get creator and treasury from config
        const campaignAccount = await program.account.campaign.fetch(campaignPda);
        const configAccount = await program.account.qadamConfig.fetch(configPda);

        tx = await program.methods
          .releaseMilestone(milestoneIndex, hashBytes)
          .accounts({
            authority: keypair.publicKey,
            config: configPda,
            campaign: campaignPda,
            milestone: milestonePda,
            campaignVault: vaultPda,
            creator: campaignAccount.creator,
            qadamTreasury: configAccount.qadamTreasury,
            systemProgram: SystemProgram.programId,
          })
          .transaction();
        break;
      }

      case "mark_under_human_review": {
        const hashBytes = parseHash(params.ai_decision_hash);

        tx = await program.methods
          .markUnderHumanReview(milestoneIndex, hashBytes)
          .accounts({
            authority: keypair.publicKey,
            config: configPda,
            campaign: campaignPda,
            milestone: milestonePda,
          })
          .transaction();
        break;
      }

      case "admin_override_decision": {
        const hashBytes = parseHash(params.ai_decision_hash);
        const campaignAccount = await program.account.campaign.fetch(campaignPda);
        const configAccount = await program.account.qadamConfig.fetch(configPda);

        // Admin override with approved=true uses release_milestone
        tx = await program.methods
          .releaseMilestone(milestoneIndex, hashBytes)
          .accounts({
            authority: keypair.publicKey,
            config: configPda,
            campaign: campaignPda,
            milestone: milestonePda,
            campaignVault: vaultPda,
            creator: campaignAccount.creator,
            qadamTreasury: configAccount.qadamTreasury,
            systemProgram: SystemProgram.programId,
          })
          .transaction();
        break;
      }

      case "execute_extension_result": {
        const votingStatePda = getVotingStatePda(milestonePda, programId);

        tx = await program.methods
          .executeExtensionResult(milestoneIndex)
          .accounts({
            payer: keypair.publicKey,
            config: configPda,
            campaign: campaignPda,
            milestone: milestonePda,
            votingState: votingStatePda,
          })
          .transaction();
        break;
      }

      default:
        throw new Error(`Unknown instruction: ${instruction}`);
    }

    // Set blockhash and fee payer
    tx.recentBlockhash = params.blockhash;
    tx.feePayer = keypair.publicKey;

    // Sign
    tx.sign(keypair);

    // Serialize to base64
    const serialized = tx.serialize().toString("base64");
    console.log(JSON.stringify({ signedTx: serialized }));

  } catch (err) {
    console.log(JSON.stringify({ error: err.message }));
    process.exit(0); // Exit 0 so Elixir reads the JSON error
  }
}

/**
 * Parse hex string to 32-byte array for ai_decision_hash
 */
function parseHash(hashStr) {
  if (!hashStr) return Array(32).fill(0);
  const bytes = Buffer.from(hashStr, "hex");
  // Pad or trim to exactly 32 bytes
  const result = new Uint8Array(32);
  result.set(bytes.subarray(0, 32));
  return Array.from(result);
}

main();
