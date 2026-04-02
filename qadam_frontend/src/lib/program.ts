import { Program, AnchorProvider, BN } from "@coral-xyz/anchor";
import { Connection, PublicKey, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync } from "@solana/spl-token";
import { PROGRAM_ID, SOLANA_RPC_URL } from "./constants";
import idl from "./idl.json";

// ═══════════════════════════════════════════
// Program setup
// ═══════════════════════════════════════════

export function getProgram(provider: AnchorProvider) {
  const programId = new PublicKey(PROGRAM_ID);
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
// PDA derivations (must match Anchor seeds)
// ═══════════════════════════════════════════

const programId = () => new PublicKey(PROGRAM_ID);

export function getConfigPda(): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("config")],
    programId()
  );
  return pda;
}

export function getCampaignPda(
  creator: PublicKey,
  nonce: BN
): PublicKey {
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

export function getMilestonePda(
  campaign: PublicKey,
  index: number
): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("milestone"), campaign.toBuffer(), Buffer.from([index])],
    programId()
  );
  return pda;
}

export function getBackerPositionPda(
  campaign: PublicKey,
  backer: PublicKey
): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("backer"), campaign.toBuffer(), backer.toBuffer()],
    programId()
  );
  return pda;
}

export function getVotingStatePda(milestone: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("voting"), milestone.toBuffer()],
    programId()
  );
  return pda;
}

export function getVotePda(
  milestone: PublicKey,
  voter: PublicKey
): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("vote"), milestone.toBuffer(), voter.toBuffer()],
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
  tokensPerLamport: BN
) {
  const campaignPda = getCampaignPda(creator, nonce);
  const vaultPda = getVaultPda(campaignPda);
  const mintPda = getMintPda(campaignPda);

  return program.methods
    .createCampaign(title, nonce, milestonesCount, goalLamports, tokensPerLamport)
    .accounts({
      creator,
      config: getConfigPda(),
      campaignVault: vaultPda,
      tokenMint: mintPda,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
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
      config: getConfigPda(),
      campaign: campaignPda,
      milestone: milestonePda,
    })
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
      config: getConfigPda(),
      campaign: campaignPda,
      campaignVault: vaultPda,
      backerPosition: backerPositionPda,
    })
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

  return program.methods
    .submitMilestone(milestoneIndex, evidenceHash)
    .accounts({
      creator,
      config: getConfigPda(),
      campaign: campaignPda,
      milestone: milestonePda,
    })
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
      config: getConfigPda(),
      campaign: campaignPda,
      backerPosition: backerPositionPda,
      tokenMint: mintPda,
      backerTokenAccount: backerAta,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
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
      config: getConfigPda(),
      campaign: campaignPda,
      campaignVault: vaultPda,
      backerPosition: backerPositionPda,
    })
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
  const votingStatePda = getVotingStatePda(milestonePda);

  return program.methods
    .requestExtension(milestoneIndex, reasonHash, newDeadline)
    .accounts({
      creator,
      config: getConfigPda(),
      campaign: campaignPda,
      milestone: milestonePda,
      votingState: votingStatePda,
    })
    .transaction();
}

export async function voteOnExtensionTx(
  program: Program,
  voter: PublicKey,
  campaignPda: PublicKey,
  milestoneIndex: number,
  approve: boolean
) {
  const milestonePda = getMilestonePda(campaignPda, milestoneIndex);
  const backerPositionPda = getBackerPositionPda(campaignPda, voter);
  const votingStatePda = getVotingStatePda(milestonePda);
  const votePda = getVotePda(milestonePda, voter);

  return program.methods
    .voteOnExtension(milestoneIndex, approve)
    .accounts({
      voter,
      config: getConfigPda(),
      campaign: campaignPda,
      milestone: milestonePda,
      backerPosition: backerPositionPda,
      votingState: votingStatePda,
      extensionVote: votePda,
    })
    .transaction();
}
