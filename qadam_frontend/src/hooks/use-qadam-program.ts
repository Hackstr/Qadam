"use client";

import { useConnection, useWallet, useAnchorWallet } from "@solana/wallet-adapter-react";
import { useMemo } from "react";
import { AnchorProvider, BN } from "@coral-xyz/anchor";
import { PublicKey, Transaction, LAMPORTS_PER_SOL } from "@solana/web3.js";
import {
  getProgram,
  getProvider,
  getCampaignPda,
  createCampaignTx,
  addMilestoneTx,
  backCampaignTx,
  submitMilestoneTx,
  claimTokensTx,
  claimRefundTx,
} from "@/lib/program";

export function useQadamProgram() {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();
  const { sendTransaction, publicKey } = useWallet();

  const program = useMemo(() => {
    if (!wallet) return null;
    const provider = getProvider(connection, wallet);
    return getProgram(provider);
  }, [connection, wallet]);

  const createCampaign = async (params: {
    title: string;
    nonce: number;
    milestonesCount: number;
    goalSol: number;
    tokensPerLamport: number;
    milestones: { amountSol: number; deadline: Date }[];
  }) => {
    if (!program || !publicKey) throw new Error("Wallet not connected");

    const nonceBN = new BN(params.nonce);
    const goalLamports = new BN(params.goalSol * LAMPORTS_PER_SOL);
    const tokensPerLamport = new BN(params.tokensPerLamport);

    // Build create_campaign transaction
    const createTx = await createCampaignTx(
      program,
      publicKey,
      params.title,
      nonceBN,
      params.milestonesCount,
      goalLamports,
      tokensPerLamport
    );

    const campaignPda = getCampaignPda(publicKey, nonceBN);

    // Build add_milestone transactions
    const milestoneTxs = await Promise.all(
      params.milestones.map((m, idx) =>
        addMilestoneTx(
          program,
          publicKey,
          campaignPda,
          idx,
          new BN(m.amountSol * LAMPORTS_PER_SOL),
          new BN(Math.floor(m.deadline.getTime() / 1000))
        )
      )
    );

    // Bundle all into single transaction
    const tx = new Transaction();
    tx.add(createTx);
    milestoneTxs.forEach((mt) => tx.add(mt));

    const sig = await sendTransaction(tx, connection);
    await connection.confirmTransaction(sig, "confirmed");

    return { signature: sig, campaignPda: campaignPda.toBase58() };
  };

  const backCampaign = async (campaignPubkey: string, amountSol: number) => {
    if (!program || !publicKey) throw new Error("Wallet not connected");

    const campaignPda = new PublicKey(campaignPubkey);
    const tx = await backCampaignTx(
      program,
      publicKey,
      campaignPda,
      new BN(amountSol * LAMPORTS_PER_SOL)
    );

    const sig = await sendTransaction(tx, connection);
    await connection.confirmTransaction(sig, "confirmed");
    return sig;
  };

  const submitMilestone = async (
    campaignPubkey: string,
    milestoneIndex: number,
    evidenceHash: string
  ) => {
    if (!program || !publicKey) throw new Error("Wallet not connected");

    // Convert hex hash to byte array
    const hashBytes = Array.from(Buffer.from(evidenceHash, "hex"));

    const campaignPda = new PublicKey(campaignPubkey);
    const tx = await submitMilestoneTx(
      program,
      publicKey,
      campaignPda,
      milestoneIndex,
      hashBytes
    );

    const sig = await sendTransaction(tx, connection);
    await connection.confirmTransaction(sig, "confirmed");
    return sig;
  };

  const claimTokens = async (campaignPubkey: string) => {
    if (!program || !publicKey) throw new Error("Wallet not connected");

    const campaignPda = new PublicKey(campaignPubkey);
    const tx = await claimTokensTx(program, publicKey, campaignPda);

    const sig = await sendTransaction(tx, connection);
    await connection.confirmTransaction(sig, "confirmed");
    return sig;
  };

  const claimRefund = async (campaignPubkey: string) => {
    if (!program || !publicKey) throw new Error("Wallet not connected");

    const campaignPda = new PublicKey(campaignPubkey);
    const tx = await claimRefundTx(program, publicKey, campaignPda);

    const sig = await sendTransaction(tx, connection);
    await connection.confirmTransaction(sig, "confirmed");
    return sig;
  };

  return {
    program,
    connected: !!wallet,
    publicKey,
    createCampaign,
    backCampaign,
    submitMilestone,
    claimTokens,
    claimRefund,
  };
}
