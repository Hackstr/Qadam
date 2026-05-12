"use client";

import { useConnection, useWallet, useAnchorWallet } from "@solana/wallet-adapter-react";
import { useMemo, useState, useCallback } from "react";
import { BN } from "@coral-xyz/anchor";
import { PublicKey, Transaction, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { toast } from "sonner";
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
  castVoteTx,
  resolveVoteTx,
  requestExtensionTx,
} from "@/lib/program";

type TxStatus = "idle" | "building" | "signing" | "broadcasting" | "confirming" | "done" | "error";

/** Wrap sendTransaction with proper error handling and toast feedback */
async function sendWithFeedback(
  sendTransaction: any,
  tx: Transaction,
  connection: any,
  feePayer: PublicKey,
  setStatus: (s: TxStatus) => void,
  label: string
): Promise<string> {
  try {
    // Set feePayer and fresh blockhash before sending
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");
    tx.recentBlockhash = blockhash;
    tx.feePayer = feePayer;

    setStatus("signing");
    toast.loading(`Waiting for wallet approval...`, { id: label });

    const sig = await sendTransaction(tx, connection, {
      skipPreflight: false,
      preflightCommitment: "confirmed",
    });

    setStatus("confirming");
    toast.loading(`Confirming transaction...`, { id: label });

    await connection.confirmTransaction(
      { signature: sig, blockhash, lastValidBlockHeight },
      "confirmed"
    );

    setStatus("done");
    toast.success(`${label} successful!`, { id: label });

    return sig;
  } catch (err: any) {
    setStatus("error");

    // User explicitly rejected in wallet popup
    const msg = err?.message || "";
    if (
      msg.includes("User rejected") ||
      msg.includes("rejected the request") ||
      msg.includes("user rejected") ||
      err?.code === 4001
    ) {
      toast.info("Transaction cancelled", { id: label });
      throw new Error("cancelled");
    }

    // Extract meaningful error from Solana logs
    const logs: string[] = err?.logs || err?.transactionLogs || [];
    const programError = logs.find((l: string) => l.includes("Error") || l.includes("failed"));
    const errorDetail = programError
      ? programError.replace(/^Program log: /, "")
      : msg.includes("Unexpected error")
        ? "Transaction simulation failed. Check your balance and try again."
        : msg;

    console.error(`${label} failed:`, err);
    if (logs.length > 0) console.error("Program logs:", logs);

    toast.error(`${label} failed: ${errorDetail}`, { id: label, duration: 8000 });
    throw err;
  }
}

export function useQadamProgram() {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();
  const { sendTransaction, publicKey } = useWallet();
  const [txStatus, setTxStatus] = useState<TxStatus>("idle");

  const program = useMemo(() => {
    if (!wallet) return null;
    const provider = getProvider(connection, wallet);
    return getProgram(provider);
  }, [connection, wallet]);

  const createCampaign = useCallback(async (params: {
    title: string;
    nonce: number;
    milestonesCount: number;
    goalSol: number;
    tokensPerLamport: number;
    milestones: { amountSol: number; deadline: Date }[];
    tierConfigs?: { multiplierBps: number; maxSpots: number }[];
    votePeriodDays?: number;
    quorumBps?: number;
    approvalThresholdBps?: number;
  }) => {
    if (!program || !publicKey) throw new Error("Wallet not connected");

    setTxStatus("building");
    toast.loading("Building transaction...", { id: "create" });

    const nonceBN = new BN(params.nonce);
    const goalLamports = new BN(params.goalSol * LAMPORTS_PER_SOL);
    const tokensPerLamport = new BN(params.tokensPerLamport);

    const createTx = await createCampaignTx(
      program, publicKey, params.title, nonceBN,
      params.milestonesCount, goalLamports, tokensPerLamport,
      params.tierConfigs, params.votePeriodDays,
      params.quorumBps, params.approvalThresholdBps,
    );

    const campaignPda = getCampaignPda(publicKey, nonceBN);

    const milestoneTxs = await Promise.all(
      params.milestones.map((m, idx) =>
        addMilestoneTx(
          program, publicKey, campaignPda, idx,
          new BN(m.amountSol * LAMPORTS_PER_SOL),
          new BN(Math.floor(m.deadline.getTime() / 1000))
        )
      )
    );

    const tx = new Transaction();
    tx.add(createTx);
    milestoneTxs.forEach((mt) => tx.add(mt));

    const sig = await sendWithFeedback(sendTransaction, tx, connection, publicKey, setTxStatus, "Create campaign");
    return { signature: sig, campaignPda: campaignPda.toBase58() };
  }, [program, publicKey, sendTransaction, connection]);

  const backCampaign = useCallback(async (campaignPubkey: string, amountSol: number) => {
    if (!program || !publicKey) throw new Error("Wallet not connected");

    setTxStatus("building");
    const campaignPda = new PublicKey(campaignPubkey);
    const tx = await backCampaignTx(program, publicKey, campaignPda, new BN(amountSol * LAMPORTS_PER_SOL));
    return sendWithFeedback(sendTransaction, tx, connection, publicKey, setTxStatus, "Back campaign");
  }, [program, publicKey, sendTransaction, connection]);

  const submitMilestone = useCallback(async (
    campaignPubkey: string, milestoneIndex: number, evidenceHash: string
  ) => {
    if (!program || !publicKey) throw new Error("Wallet not connected");

    setTxStatus("building");
    const hashBytes = Array.from(Buffer.from(evidenceHash, "hex"));
    const campaignPda = new PublicKey(campaignPubkey);
    const tx = await submitMilestoneTx(program, publicKey, campaignPda, milestoneIndex, hashBytes);
    return sendWithFeedback(sendTransaction, tx, connection, publicKey, setTxStatus, "Submit evidence");
  }, [program, publicKey, sendTransaction, connection]);

  const claimTokens = useCallback(async (campaignPubkey: string) => {
    if (!program || !publicKey) throw new Error("Wallet not connected");

    setTxStatus("building");
    const campaignPda = new PublicKey(campaignPubkey);
    const tx = await claimTokensTx(program, publicKey, campaignPda);
    return sendWithFeedback(sendTransaction, tx, connection, publicKey, setTxStatus, "Claim tokens");
  }, [program, publicKey, sendTransaction, connection]);

  const claimRefund = useCallback(async (campaignPubkey: string) => {
    if (!program || !publicKey) throw new Error("Wallet not connected");

    setTxStatus("building");
    const campaignPda = new PublicKey(campaignPubkey);
    const tx = await claimRefundTx(program, publicKey, campaignPda);
    return sendWithFeedback(sendTransaction, tx, connection, publicKey, setTxStatus, "Claim refund");
  }, [program, publicKey, sendTransaction, connection]);

  const castVote = useCallback(async (
    campaignPubkey: string, milestoneIndex: number, voteType: number, approve: boolean
  ) => {
    if (!program || !publicKey) throw new Error("Wallet not connected");

    setTxStatus("building");
    const campaignPda = new PublicKey(campaignPubkey);
    const tx = await castVoteTx(program, publicKey, campaignPda, milestoneIndex, voteType, approve);
    const label = voteType === 1
      ? (approve ? "Vote extend" : "Vote deny extension")
      : (approve ? "Vote approve" : "Vote reject");
    return sendWithFeedback(sendTransaction, tx, connection, publicKey, setTxStatus, label);
  }, [program, publicKey, sendTransaction, connection]);

  const resolveVote = useCallback(async (
    campaignPubkey: string, milestoneIndex: number, voteType: number
  ) => {
    if (!program || !publicKey) throw new Error("Wallet not connected");

    setTxStatus("building");
    const campaignPda = new PublicKey(campaignPubkey);
    const tx = await resolveVoteTx(program, publicKey, campaignPda, milestoneIndex, voteType);
    return sendWithFeedback(sendTransaction, tx, connection, publicKey, setTxStatus, "Resolve vote");
  }, [program, publicKey, sendTransaction, connection]);

  const requestExtension = useCallback(async (
    campaignPubkey: string, milestoneIndex: number, reasonHash: string, newDeadline: Date
  ) => {
    if (!program || !publicKey) throw new Error("Wallet not connected");

    setTxStatus("building");
    const campaignPda = new PublicKey(campaignPubkey);
    const hashBytes = Array.from(Buffer.from(reasonHash, "hex"));
    const deadlineBN = new BN(Math.floor(newDeadline.getTime() / 1000));
    const tx = await requestExtensionTx(program, publicKey, campaignPda, milestoneIndex, hashBytes, deadlineBN);
    return sendWithFeedback(sendTransaction, tx, connection, publicKey, setTxStatus, "Request extension");
  }, [program, publicKey, sendTransaction, connection]);

  return {
    program,
    connected: !!wallet,
    publicKey,
    txStatus,
    createCampaign,
    backCampaign,
    submitMilestone,
    claimTokens,
    claimRefund,
    castVote,
    resolveVote,
    requestExtension,
  };
}
