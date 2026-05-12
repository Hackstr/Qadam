import { Program, AnchorProvider, BN } from "@coral-xyz/anchor";
import { Connection, PublicKey, SystemProgram } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync } from "@solana/spl-token";
import { PROGRAM_ID } from "./constants";
import idl from "./idl.json";

// ═══════════════════════════════════════════
// Program setup
// ═══════════════════════════════════════════

export function getProgram(provider: AnchorProvider) {
  return new Program(idl as any, provider);
}

export function getProvider(
  connection: Connection,
  wallet: any
): AnchorProvider {
  return new AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });
}

// ═══════════════════════════════════════════
// PDA derivations — MUST match Anchor seeds exactly
//
// Seed reference (from Rust):
//   config:        ["config"]
//   campaign:      ["campaign", creator, nonce_le_bytes]
//   vault:         ["vault", campaign]
//   mint:          ["mint", campaign]
//   milestone:     ["milestone", campaign, [index]]
//   backer:        ["backer", campaign, backer]
//   vote_state:    ["vote_state", [vote_type], milestone]
//   vote:          ["vote", voting_state, voter]
// ═══════════════════════════════════════════

const programId = () => new PublicKey(PROGRAM_ID);

export function getConfigPda(): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("config")],
    programId()
  );
  return pda;
}

export function getCampaignPda(creator: PublicKey, nonce: BN): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("campaign"), creator.toBuffer(), nonce.toArrayLike(Buffer, "le", 8)],
    programId()
  );
  return pda;
}

export function getVaultPda(campaign: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("vault"), campaign.toBuffer()],
    programId()
  );
  return pda;
}

export function getMintPda(campaign: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("mint"), campaign.toBuffer()],
    programId()
  );
  return pda;
}

export function getMilestonePda(campaign: PublicKey, index: number): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("milestone"), campaign.toBuffer(), Buffer.from([index])],
    programId()
  );
  return pda;
}

export function getBackerPositionPda(campaign: PublicKey, backer: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("backer"), campaign.toBuffer(), backer.toBuffer()],
    programId()
  );
  return pda;
}

// VoteType enum values (must match Rust VoteType):
//   0 = MilestoneApproval
//   1 = ExtensionGrant
//   2 = Refund
export function getVotingStatePda(voteType: number, milestone: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("vote_state"), Buffer.from([voteType]), milestone.toBuffer()],
    programId()
  );
  return pda;
}

export function getVotePda(votingState: PublicKey, voter: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("vote"), votingState.toBuffer(), voter.toBuffer()],
    programId()
  );
  return pda;
}

// ═══════════════════════════════════════════
// Transaction builders
// ═══════════════════════════════════════════

export async function createCampaignTx(
  program: Program,
  creator: PublicKey,
  title: string,
  nonce: BN,
  milestonesCount: number,
  goalLamports: BN,
  tokensPerLamport: BN,
  tierConfigs?: { multiplierBps: number; maxSpots: number }[],
  votePeriodDays?: number,
  quorumBps?: number,
  approvalThresholdBps?: number,
) {
  const campaignPda = getCampaignPda(creator, nonce);
  const vaultPda = getVaultPda(campaignPda);
  const mintPda = getMintPda(campaignPda);

  const tiers = tierConfigs || [
    { multiplierBps: 10000, maxSpots: 50 },
    { multiplierBps: 7000, maxSpots: 200 },
    { multiplierBps: 5000, maxSpots: 0 },
  ];

  return program.methods
    .createCampaign(
      title, nonce, milestonesCount, goalLamports, tokensPerLamport,
      tiers, votePeriodDays || 7, quorumBps || 2000, approvalThresholdBps || 5000,
    )
    .accounts({
      creator,
      campaignVault: vaultPda,
      tokenMint: mintPda,
      tokenProgram: TOKEN_PROGRAM_ID,
    } as any)
    .transaction();
}

export async function addMilestoneTx(
  program: Program,
  creator: PublicKey,
  campaignPda: PublicKey,
  milestoneIndex: number,
  amountLamports: BN,
  deadline: BN
) {
  const milestonePda = getMilestonePda(campaignPda, milestoneIndex);

  return program.methods
    .addMilestone(amountLamports, deadline)
    .accounts({
      creator,
      campaign: campaignPda,
      milestone: milestonePda,
    } as any)
    .transaction();
}

export async function backCampaignTx(
  program: Program,
  backer: PublicKey,
  campaignPda: PublicKey,
  amountLamports: BN
) {
  const vaultPda = getVaultPda(campaignPda);
  const backerPositionPda = getBackerPositionPda(campaignPda, backer);

  return program.methods
    .backCampaign(amountLamports)
    .accounts({
      backer,
      campaign: campaignPda,
      campaignVault: vaultPda,
      backerPosition: backerPositionPda,
    } as any)
    .transaction();
}

export async function submitMilestoneTx(
  program: Program,
  creator: PublicKey,
  campaignPda: PublicKey,
  milestoneIndex: number,
  evidenceHash: number[]
) {
  const milestonePda = getMilestonePda(campaignPda, milestoneIndex);
  // submit_milestone creates a VotingState for MilestoneApproval (type 0)
  const votingStatePda = getVotingStatePda(0, milestonePda);

  // Pad/trim hash to exactly 32 bytes
  const hash32 = new Array(32).fill(0);
  for (let i = 0; i < Math.min(evidenceHash.length, 32); i++) {
    hash32[i] = evidenceHash[i];
  }

  return program.methods
    .submitMilestone(milestoneIndex, hash32)
    .accounts({
      creator,
      campaign: campaignPda,
      milestone: milestonePda,
      votingState: votingStatePda,
    } as any)
    .transaction();
}

export async function claimTokensTx(
  program: Program,
  backer: PublicKey,
  campaignPda: PublicKey
) {
  const backerPositionPda = getBackerPositionPda(campaignPda, backer);
  const mintPda = getMintPda(campaignPda);
  const backerAta = getAssociatedTokenAddressSync(mintPda, backer);

  return program.methods
    .claimTokens()
    .accounts({
      backer,
      campaign: campaignPda,
      backerPosition: backerPositionPda,
      tokenMint: mintPda,
      backerTokenAccount: backerAta,
      tokenProgram: TOKEN_PROGRAM_ID,
    } as any)
    .transaction();
}

export async function claimRefundTx(
  program: Program,
  backer: PublicKey,
  campaignPda: PublicKey
) {
  const vaultPda = getVaultPda(campaignPda);
  const backerPositionPda = getBackerPositionPda(campaignPda, backer);

  return program.methods
    .claimRefund()
    .accounts({
      backer,
      campaign: campaignPda,
      campaignVault: vaultPda,
      backerPosition: backerPositionPda,
    } as any)
    .transaction();
}

export async function requestExtensionTx(
  program: Program,
  creator: PublicKey,
  campaignPda: PublicKey,
  milestoneIndex: number,
  reasonHash: number[],
  newDeadline: BN
) {
  const milestonePda = getMilestonePda(campaignPda, milestoneIndex);
  // request_extension creates a VotingState for ExtensionGrant (type 1)
  const votingStatePda = getVotingStatePda(1, milestonePda);

  const hash32 = new Array(32).fill(0);
  for (let i = 0; i < Math.min(reasonHash.length, 32); i++) {
    hash32[i] = reasonHash[i];
  }

  return program.methods
    .requestExtension(milestoneIndex, hash32, newDeadline)
    .accounts({
      creator,
      campaign: campaignPda,
      milestone: milestonePda,
      votingState: votingStatePda,
    } as any)
    .transaction();
}

export async function castVoteTx(
  program: Program,
  voter: PublicKey,
  campaignPda: PublicKey,
  milestoneIndex: number,
  voteType: number,
  approve: boolean
) {
  const milestonePda = getMilestonePda(campaignPda, milestoneIndex);
  const backerPositionPda = getBackerPositionPda(campaignPda, voter);
  const votingStatePda = getVotingStatePda(voteType, milestonePda);
  const votePda = getVotePda(votingStatePda, voter);

  return program.methods
    .castVote(voteType, approve)  // Only 2 args: vote_type + approve
    .accounts({
      voter,
      campaign: campaignPda,
      milestone: milestonePda,
      backerPosition: backerPositionPda,
      votingState: votingStatePda,
      vote: votePda,
    } as any)
    .transaction();
}

export async function resolveVoteTx(
  program: Program,
  payer: PublicKey,
  campaignPda: PublicKey,
  milestoneIndex: number,
  voteType: number
) {
  const milestonePda = getMilestonePda(campaignPda, milestoneIndex);
  const votingStatePda = getVotingStatePda(voteType, milestonePda);
  const vaultPda = getVaultPda(campaignPda);

  // For MilestoneApproval (type 0), we need creator + treasury for fund release
  // For other types, these are optional (Anchor handles None)
  const accounts: any = {
    payer,
    campaign: campaignPda,
    milestone: milestonePda,
    votingState: votingStatePda,
  };

  // Optional accounts for MilestoneApproval release
  if (voteType === 0) {
    accounts.campaignVault = vaultPda;
    // creator_account and qadam_treasury are resolved by the program from campaign/config
    // We pass them so Anchor can do the CPI transfers
  }

  return program.methods
    .resolveVote(voteType)  // Only 1 arg: vote_type
    .accounts(accounts)
    .transaction();
}
