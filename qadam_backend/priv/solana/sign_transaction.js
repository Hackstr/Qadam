#!/usr/bin/env node
/**
 * Sign Solana transactions for the AI agent.
 * Called by Elixir TransactionBuilder via System.cmd("node", [...]).
 *
 * Input: JSON string as first CLI argument
 * Output: JSON to stdout { signedTx: base64 } or { error: string }
 */

const fs = require("fs");
const { Connection, Keypair, PublicKey, Transaction, SystemProgram } = require("@solana/web3.js");

async function main() {
  try {
    const input = JSON.parse(process.argv[2]);
    const { instruction, params, programId, rpcUrl, keypairPath } = input;

    // Load AI agent keypair
    const keypairData = JSON.parse(fs.readFileSync(keypairPath, "utf-8"));
    const keypair = Keypair.fromSecretKey(Uint8Array.from(keypairData));

    const connection = new Connection(rpcUrl, "confirmed");

    // For now, build a minimal transaction that calls the program
    // In production, this would use the Anchor IDL for proper instruction encoding
    // The Anchor client library handles serialization

    const tx = new Transaction();
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
