#!/usr/bin/env node
/**
 * Sign and build Solana transactions for backend-initiated operations.
 * Called by Elixir TransactionBuilder via System.cmd("node", [...]).
 *
 * Post-Foundation v1: Only handles execute_extension_result.
 * Milestone releases happen via on-chain resolve_vote (community voting).
 *
 * Input: JSON string as first CLI argument
 * Output: JSON to stdout { signedTx: base64 } or { error: string }
 */

const fs = require("fs");
const path = require("path");
const anchor = require("@coral-xyz/anchor");
const { Connection, Keypair, PublicKey, SystemProgram } = require("@solana/web3.js");

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

    // Load keypair
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

    let tx;

    switch (instruction) {
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

    // Set blockhash and fee payer — always use fresh blockhash passed from Elixir
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

main();
