import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Qadam } from "../target/types/qadam";
import { expect } from "chai";
import { Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync } from "@solana/spl-token";

describe("qadam", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.qadam as Program<Qadam>;
  const connection = provider.connection;

  // Wallets
  const admin = provider.wallet as anchor.Wallet;
  const aiAgent = Keypair.generate();
  const creator = Keypair.generate();
  const backer1 = Keypair.generate();
  const backer2 = Keypair.generate();
  const backer3 = Keypair.generate();

  // PDAs
  let configPda: PublicKey;
  let campaignPda: PublicKey;
  let vaultPda: PublicKey;
  let mintPda: PublicKey;
  const nonce = new anchor.BN(1);
  const campaignGoal = new anchor.BN(3 * LAMPORTS_PER_SOL); // 3 SOL
  const tokensPerLamport = new anchor.BN(100); // 100 tokens per lamport

  // Qadam treasury
  const qadamTreasury = Keypair.generate();

  before(async () => {
    // Derive PDAs
    [configPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("config")],
      program.programId
    );

    // Airdrop to all participants
    const airdrops = [
      aiAgent.publicKey,
      creator.publicKey,
      backer1.publicKey,
      backer2.publicKey,
      backer3.publicKey,
      qadamTreasury.publicKey,
    ].map(async (pubkey) => {
      const sig = await connection.requestAirdrop(pubkey, 10 * LAMPORTS_PER_SOL);
      await connection.confirmTransaction(sig);
    });
    await Promise.all(airdrops);
  });

  // ═══════════════════════════════════════════
  // TEST 1: HAPPY PATH
  // Config → Create → Back → Submit → Release → Claim Tokens → Close
  // ═══════════════════════════════════════════

  describe("1. Happy Path", () => {
    it("initializes config", async () => {
      await program.methods
        .initializeConfig(admin.publicKey, aiAgent.publicKey, qadamTreasury.publicKey)
        .accounts({ payer: admin.publicKey })
        .rpc();

      const config = await program.account.qadamConfig.fetch(configPda);
      expect(config.adminWallet.toBase58()).to.equal(admin.publicKey.toBase58());
      expect(config.aiAgentWallet.toBase58()).to.equal(aiAgent.publicKey.toBase58());
      expect(config.paused).to.equal(false);
    });

    it("creates campaign", async () => {
      [campaignPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("campaign"), creator.publicKey.toBuffer(), nonce.toArrayLike(Buffer, "le", 8)],
        program.programId
      );
      [vaultPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("vault"), campaignPda.toBuffer()],
        program.programId
      );
      [mintPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("mint"), campaignPda.toBuffer()],
        program.programId
      );

      await program.methods
        .createCampaign("Test Campaign", nonce, 3, campaignGoal, tokensPerLamport)
        .accounts({
          creator: creator.publicKey,
          config: configPda,
          campaignVault: vaultPda,
          tokenMint: mintPda,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([creator])
        .rpc();

      const campaign = await program.account.campaign.fetch(campaignPda);
      expect(campaign.title).to.equal("Test Campaign");
      expect(campaign.status).to.deep.equal({ draft: {} });
      expect(campaign.milestonesCount).to.equal(3);
      expect(campaign.milestonesInitialized).to.equal(0);
    });

    it("adds 3 milestones and activates campaign", async () => {
      const now = Math.floor(Date.now() / 1000);
      const milestoneAmounts = [
        new anchor.BN(1 * LAMPORTS_PER_SOL),
        new anchor.BN(1 * LAMPORTS_PER_SOL),
        new anchor.BN(1 * LAMPORTS_PER_SOL),
      ];

      for (let i = 0; i < 3; i++) {
        const [milestonePda] = PublicKey.findProgramAddressSync(
          [Buffer.from("milestone"), campaignPda.toBuffer(), Buffer.from([i])],
          program.programId
        );

        await program.methods
          .addMilestone(milestoneAmounts[i], new anchor.BN(now + 86400 * (i + 1)))
          .accounts({
            creator: creator.publicKey,
            config: configPda,
            campaign: campaignPda,
            milestone: milestonePda,
          })
          .signers([creator])
          .rpc();
      }

      const campaign = await program.account.campaign.fetch(campaignPda);
      expect(campaign.status).to.deep.equal({ active: {} });
      expect(campaign.milestonesInitialized).to.equal(3);
    });

    it("backer1 backs the campaign (Tier 1) — full goal", async () => {
      const [backerPositionPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("backer"), campaignPda.toBuffer(), backer1.publicKey.toBuffer()],
        program.programId
      );

      // Back full campaign goal so vault has enough for all milestones
      const backAmount = new anchor.BN(3 * LAMPORTS_PER_SOL);

      await program.methods
        .backCampaign(backAmount)
        .accounts({
          backer: backer1.publicKey,
          config: configPda,
          campaign: campaignPda,
          campaignVault: vaultPda,
          backerPosition: backerPositionPda,
        })
        .signers([backer1])
        .rpc();

      const position = await program.account.backerPosition.fetch(backerPositionPda);
      expect(position.tier).to.equal(1);
      expect(position.lamportsBacked.toNumber()).to.equal(3 * LAMPORTS_PER_SOL);
      // Tier 1: tokens = amount * tokensPerLamport * 1.0x
      expect(position.tokensAllocated.toNumber()).to.equal(3 * LAMPORTS_PER_SOL * 100);
      expect(position.tokensClaimed.toNumber()).to.equal(0);

      const campaign = await program.account.campaign.fetch(campaignPda);
      expect(campaign.backerCount).to.equal(1);
      expect(campaign.raisedLamports.toNumber()).to.equal(3 * LAMPORTS_PER_SOL);
    });

    it("creator submits milestone 0", async () => {
      const [milestonePda] = PublicKey.findProgramAddressSync(
        [Buffer.from("milestone"), campaignPda.toBuffer(), Buffer.from([0])],
        program.programId
      );

      // Fake evidence hash
      const evidenceHash = Buffer.alloc(32);
      evidenceHash.fill(1);

      await program.methods
        .submitMilestone(0, Array.from(evidenceHash))
        .accounts({
          creator: creator.publicKey,
          config: configPda,
          campaign: campaignPda,
          milestone: milestonePda,
        })
        .signers([creator])
        .rpc();

      const milestone = await program.account.milestoneAccount.fetch(milestonePda);
      expect(milestone.status).to.deep.equal({ submitted: {} });
    });

    it("AI agent releases milestone 0", async () => {
      const [milestonePda] = PublicKey.findProgramAddressSync(
        [Buffer.from("milestone"), campaignPda.toBuffer(), Buffer.from([0])],
        program.programId
      );

      const aiDecisionHash = Buffer.alloc(32);
      aiDecisionHash.fill(2);

      const creatorBalanceBefore = await connection.getBalance(creator.publicKey);

      await program.methods
        .releaseMilestone(0, Array.from(aiDecisionHash))
        .accounts({
          authority: aiAgent.publicKey,
          config: configPda,
          campaign: campaignPda,
          milestone: milestonePda,
          campaignVault: vaultPda,
          creator: creator.publicKey,
          qadamTreasury: qadamTreasury.publicKey,
        })
        .signers([aiAgent])
        .rpc();

      const milestone = await program.account.milestoneAccount.fetch(milestonePda);
      expect(milestone.status).to.deep.equal({ approved: {} });

      const campaign = await program.account.campaign.fetch(campaignPda);
      expect(campaign.milestonesApproved).to.equal(1);

      // Verify creator received funds (milestone - 2.5% fee + deposit return)
      const creatorBalanceAfter = await connection.getBalance(creator.publicKey);
      expect(creatorBalanceAfter).to.be.greaterThan(creatorBalanceBefore);
    });

    it("backer1 claims tokens for milestone 0", async () => {
      const [backerPositionPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("backer"), campaignPda.toBuffer(), backer1.publicKey.toBuffer()],
        program.programId
      );

      const backerAta = getAssociatedTokenAddressSync(mintPda, backer1.publicKey);

      await program.methods
        .claimTokens()
        .accounts({
          backer: backer1.publicKey,
          config: configPda,
          campaign: campaignPda,
          backerPosition: backerPositionPda,
          tokenMint: mintPda,
          backerTokenAccount: backerAta,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([backer1])
        .rpc();

      const position = await program.account.backerPosition.fetch(backerPositionPda);
      expect(position.milestonesClaimedThrough).to.equal(1);
      expect(position.tokensClaimed.toNumber()).to.be.greaterThan(0);
    });
  });

  // ═══════════════════════════════════════════
  // TEST 2: HUMAN REVIEW FLOW
  // Submit → PARTIAL → Human Review → Admin Approve
  // ═══════════════════════════════════════════

  describe("2. Human Review Flow", () => {
    it("creator submits milestone 1", async () => {
      const [milestonePda] = PublicKey.findProgramAddressSync(
        [Buffer.from("milestone"), campaignPda.toBuffer(), Buffer.from([1])],
        program.programId
      );

      const evidenceHash = Buffer.alloc(32);
      evidenceHash.fill(3);

      await program.methods
        .submitMilestone(1, Array.from(evidenceHash))
        .accounts({
          creator: creator.publicKey,
          config: configPda,
          campaign: campaignPda,
          milestone: milestonePda,
        })
        .signers([creator])
        .rpc();
    });

    it("AI marks milestone 1 as under human review (PARTIAL)", async () => {
      const [milestonePda] = PublicKey.findProgramAddressSync(
        [Buffer.from("milestone"), campaignPda.toBuffer(), Buffer.from([1])],
        program.programId
      );

      const aiHash = Buffer.alloc(32);
      aiHash.fill(4);

      await program.methods
        .markUnderHumanReview(1, Array.from(aiHash))
        .accounts({
          authority: aiAgent.publicKey,
          config: configPda,
          campaign: campaignPda,
          milestone: milestonePda,
        })
        .signers([aiAgent])
        .rpc();

      const milestone = await program.account.milestoneAccount.fetch(milestonePda);
      expect(milestone.status).to.deep.equal({ underHumanReview: {} });
    });

    it("admin approves milestone 1 after human review", async () => {
      const [milestonePda] = PublicKey.findProgramAddressSync(
        [Buffer.from("milestone"), campaignPda.toBuffer(), Buffer.from([1])],
        program.programId
      );

      const decisionHash = Buffer.alloc(32);
      decisionHash.fill(5);

      await program.methods
        .adminOverrideDecision(1, true, Array.from(decisionHash))
        .accounts({
          admin: admin.publicKey,
          config: configPda,
          campaign: campaignPda,
          milestone: milestonePda,
          campaignVault: vaultPda,
          creator: creator.publicKey,
          qadamTreasury: qadamTreasury.publicKey,
        })
        .rpc();

      const milestone = await program.account.milestoneAccount.fetch(milestonePda);
      expect(milestone.status).to.deep.equal({ approved: {} });

      const campaign = await program.account.campaign.fetch(campaignPda);
      expect(campaign.milestonesApproved).to.equal(2);
    });
  });

  // ═══════════════════════════════════════════
  // TEST 3: COMPLETE CAMPAIGN + CLEANUP
  // Release milestone 2 → Campaign complete → Close positions
  // ═══════════════════════════════════════════

  describe("3. Complete Campaign + Cleanup", () => {
    it("submits and releases milestone 2 → campaign complete", async () => {
      const [milestonePda] = PublicKey.findProgramAddressSync(
        [Buffer.from("milestone"), campaignPda.toBuffer(), Buffer.from([2])],
        program.programId
      );

      const evidenceHash = Buffer.alloc(32);
      evidenceHash.fill(6);

      await program.methods
        .submitMilestone(2, Array.from(evidenceHash))
        .accounts({
          creator: creator.publicKey,
          config: configPda,
          campaign: campaignPda,
          milestone: milestonePda,
        })
        .signers([creator])
        .rpc();

      const aiHash = Buffer.alloc(32);
      aiHash.fill(7);

      await program.methods
        .releaseMilestone(2, Array.from(aiHash))
        .accounts({
          authority: aiAgent.publicKey,
          config: configPda,
          campaign: campaignPda,
          milestone: milestonePda,
          campaignVault: vaultPda,
          creator: creator.publicKey,
          qadamTreasury: qadamTreasury.publicKey,
        })
        .signers([aiAgent])
        .rpc();

      const campaign = await program.account.campaign.fetch(campaignPda);
      expect(campaign.status).to.deep.equal({ completed: {} });
      expect(campaign.milestonesApproved).to.equal(3);
    });

    it("backer1 claims remaining tokens", async () => {
      const [backerPositionPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("backer"), campaignPda.toBuffer(), backer1.publicKey.toBuffer()],
        program.programId
      );

      const backerAta = getAssociatedTokenAddressSync(mintPda, backer1.publicKey);

      await program.methods
        .claimTokens()
        .accounts({
          backer: backer1.publicKey,
          config: configPda,
          campaign: campaignPda,
          backerPosition: backerPositionPda,
          tokenMint: mintPda,
          backerTokenAccount: backerAta,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([backer1])
        .rpc();

      const position = await program.account.backerPosition.fetch(backerPositionPda);
      expect(position.milestonesClaimedThrough).to.equal(3);
    });

    it("backer1 closes position → reclaims rent", async () => {
      const [backerPositionPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("backer"), campaignPda.toBuffer(), backer1.publicKey.toBuffer()],
        program.programId
      );

      const balanceBefore = await connection.getBalance(backer1.publicKey);

      await program.methods
        .closeBackerPosition()
        .accounts({
          backer: backer1.publicKey,
          campaign: campaignPda,
          backerPosition: backerPositionPda,
        })
        .signers([backer1])
        .rpc();

      const balanceAfter = await connection.getBalance(backer1.publicKey);
      expect(balanceAfter).to.be.greaterThan(balanceBefore);

      const campaign = await program.account.campaign.fetch(campaignPda);
      expect(campaign.positionsClosed).to.equal(1);
    });

    it("creator closes campaign → reclaims rent", async () => {
      await program.methods
        .closeCampaign()
        .accounts({
          creator: creator.publicKey,
          campaign: campaignPda,
        })
        .signers([creator])
        .rpc();

      // Campaign account should be gone
      const info = await connection.getAccountInfo(campaignPda);
      expect(info).to.be.null;
    });
  });

  // ═══════════════════════════════════════════
  // TEST 4: PAUSE / UNPAUSE
  // ═══════════════════════════════════════════

  describe("4. Pause / Unpause", () => {
    let campaignPda2: PublicKey;
    let vaultPda2: PublicKey;
    let mintPda2: PublicKey;
    const nonce2 = new anchor.BN(2);

    before(async () => {
      [campaignPda2] = PublicKey.findProgramAddressSync(
        [Buffer.from("campaign"), creator.publicKey.toBuffer(), nonce2.toArrayLike(Buffer, "le", 8)],
        program.programId
      );
      [vaultPda2] = PublicKey.findProgramAddressSync(
        [Buffer.from("vault"), campaignPda2.toBuffer()],
        program.programId
      );
      [mintPda2] = PublicKey.findProgramAddressSync(
        [Buffer.from("mint"), campaignPda2.toBuffer()],
        program.programId
      );
    });

    it("admin pauses program", async () => {
      await program.methods
        .setPaused(true)
        .accounts({ admin: admin.publicKey, config: configPda })
        .rpc();

      const config = await program.account.qadamConfig.fetch(configPda);
      expect(config.paused).to.equal(true);
    });

    it("create_campaign fails when paused", async () => {
      try {
        await program.methods
          .createCampaign("Paused Campaign", nonce2, 1, new anchor.BN(LAMPORTS_PER_SOL), tokensPerLamport)
          .accounts({
            creator: creator.publicKey,
            config: configPda,
            campaignVault: vaultPda2,
            tokenMint: mintPda2,
            tokenProgram: TOKEN_PROGRAM_ID,
          })
          .signers([creator])
          .rpc();
        expect.fail("Should have thrown");
      } catch (err: any) {
        expect(err.error.errorCode.code).to.equal("ProgramPaused");
      }
    });

    it("admin unpauses", async () => {
      await program.methods
        .setPaused(false)
        .accounts({ admin: admin.publicKey, config: configPda })
        .rpc();

      const config = await program.account.qadamConfig.fetch(configPda);
      expect(config.paused).to.equal(false);
    });

    it("create_campaign works after unpause", async () => {
      await program.methods
        .createCampaign("After Unpause", nonce2, 1, new anchor.BN(LAMPORTS_PER_SOL), tokensPerLamport)
        .accounts({
          creator: creator.publicKey,
          config: configPda,
          campaignVault: vaultPda2,
          tokenMint: mintPda2,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([creator])
        .rpc();

      const campaign = await program.account.campaign.fetch(campaignPda2);
      expect(campaign.title).to.equal("After Unpause");
    });
  });

  // ═══════════════════════════════════════════
  // TEST 5: CANCEL CAMPAIGN (no backers)
  // ═══════════════════════════════════════════

  describe("5. Cancel Campaign (no backers)", () => {
    let campaignPda3: PublicKey;
    let vaultPda3: PublicKey;
    let mintPda3: PublicKey;
    const nonce3 = new anchor.BN(3);

    it("creates and cancels campaign with no backers → deposit returned", async () => {
      [campaignPda3] = PublicKey.findProgramAddressSync(
        [Buffer.from("campaign"), creator.publicKey.toBuffer(), nonce3.toArrayLike(Buffer, "le", 8)],
        program.programId
      );
      [vaultPda3] = PublicKey.findProgramAddressSync(
        [Buffer.from("vault"), campaignPda3.toBuffer()],
        program.programId
      );
      [mintPda3] = PublicKey.findProgramAddressSync(
        [Buffer.from("mint"), campaignPda3.toBuffer()],
        program.programId
      );

      // Create campaign
      await program.methods
        .createCampaign("Cancel Me", nonce3, 1, new anchor.BN(LAMPORTS_PER_SOL), tokensPerLamport)
        .accounts({
          creator: creator.publicKey,
          config: configPda,
          campaignVault: vaultPda3,
          tokenMint: mintPda3,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([creator])
        .rpc();

      // Add milestone to activate
      const now = Math.floor(Date.now() / 1000);
      const [milestonePda] = PublicKey.findProgramAddressSync(
        [Buffer.from("milestone"), campaignPda3.toBuffer(), Buffer.from([0])],
        program.programId
      );

      await program.methods
        .addMilestone(new anchor.BN(LAMPORTS_PER_SOL), new anchor.BN(now + 86400))
        .accounts({
          creator: creator.publicKey,
          config: configPda,
          campaign: campaignPda3,
          milestone: milestonePda,
        })
        .signers([creator])
        .rpc();

      const balanceBefore = await connection.getBalance(creator.publicKey);

      // Cancel
      await program.methods
        .cancelCampaign()
        .accounts({
          creator: creator.publicKey,
          campaign: campaignPda3,
          campaignVault: vaultPda3,
        })
        .signers([creator])
        .rpc();

      const campaign = await program.account.campaign.fetch(campaignPda3);
      expect(campaign.status).to.deep.equal({ cancelled: {} });
      expect(campaign.vaultBalance.toNumber()).to.equal(0);

      const balanceAfter = await connection.getBalance(creator.publicKey);
      expect(balanceAfter).to.be.greaterThan(balanceBefore);
    });

    it("creator can close cancelled campaign", async () => {
      await program.methods
        .closeCampaign()
        .accounts({
          creator: creator.publicKey,
          campaign: campaignPda3,
        })
        .signers([creator])
        .rpc();

      const info = await connection.getAccountInfo(campaignPda3);
      expect(info).to.be.null;
    });
  });

  // ═══════════════════════════════════════════
  // TEST 6: NEGATIVE CASES (security)
  // ═══════════════════════════════════════════

  describe("6. Negative Cases", () => {
    let campaignPda6: PublicKey;
    let vaultPda6: PublicKey;
    let mintPda6: PublicKey;
    const nonce6 = new anchor.BN(6);

    before(async () => {
      // Create a fresh campaign for negative tests
      [campaignPda6] = PublicKey.findProgramAddressSync(
        [Buffer.from("campaign"), creator.publicKey.toBuffer(), nonce6.toArrayLike(Buffer, "le", 8)],
        program.programId
      );
      [vaultPda6] = PublicKey.findProgramAddressSync(
        [Buffer.from("vault"), campaignPda6.toBuffer()],
        program.programId
      );
      [mintPda6] = PublicKey.findProgramAddressSync(
        [Buffer.from("mint"), campaignPda6.toBuffer()],
        program.programId
      );

      await program.methods
        .createCampaign("Security Test", nonce6, 2, new anchor.BN(2 * LAMPORTS_PER_SOL), tokensPerLamport)
        .accounts({
          creator: creator.publicKey,
          config: configPda,
          campaignVault: vaultPda6,
          tokenMint: mintPda6,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([creator])
        .rpc();

      const now = Math.floor(Date.now() / 1000);
      for (let i = 0; i < 2; i++) {
        const [mPda] = PublicKey.findProgramAddressSync(
          [Buffer.from("milestone"), campaignPda6.toBuffer(), Buffer.from([i])],
          program.programId
        );
        await program.methods
          .addMilestone(new anchor.BN(LAMPORTS_PER_SOL), new anchor.BN(now + 86400 * (i + 1)))
          .accounts({
            creator: creator.publicKey,
            config: configPda,
            campaign: campaignPda6,
            milestone: mPda,
          })
          .signers([creator])
          .rpc();
      }

      // Backer1 backs
      const [bp] = PublicKey.findProgramAddressSync(
        [Buffer.from("backer"), campaignPda6.toBuffer(), backer1.publicKey.toBuffer()],
        program.programId
      );
      await program.methods
        .backCampaign(new anchor.BN(2 * LAMPORTS_PER_SOL))
        .accounts({
          backer: backer1.publicKey,
          config: configPda,
          campaign: campaignPda6,
          campaignVault: vaultPda6,
          backerPosition: bp,
        })
        .signers([backer1])
        .rpc();
    });

    it("non-AI agent cannot call release_milestone", async () => {
      // First submit evidence
      const [mPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("milestone"), campaignPda6.toBuffer(), Buffer.from([0])],
        program.programId
      );
      const hash = Buffer.alloc(32); hash.fill(99);

      await program.methods
        .submitMilestone(0, Array.from(hash))
        .accounts({
          creator: creator.publicKey,
          config: configPda,
          campaign: campaignPda6,
          milestone: mPda,
        })
        .signers([creator])
        .rpc();

      // Random backer tries to release — should fail
      try {
        await program.methods
          .releaseMilestone(0, Array.from(hash))
          .accounts({
            authority: backer1.publicKey,
            config: configPda,
            campaign: campaignPda6,
            milestone: mPda,
            campaignVault: vaultPda6,
            creator: creator.publicKey,
            qadamTreasury: qadamTreasury.publicKey,
          })
          .signers([backer1])
          .rpc();
        expect.fail("Should have thrown UnauthorizedSigner");
      } catch (err: any) {
        expect(err.error.errorCode.code).to.equal("UnauthorizedSigner");
      }
    });

    it("non-admin cannot call set_paused", async () => {
      try {
        await program.methods
          .setPaused(true)
          .accounts({ admin: backer1.publicKey, config: configPda })
          .signers([backer1])
          .rpc();
        expect.fail("Should have thrown Unauthorized");
      } catch (err: any) {
        expect(err.error.errorCode.code).to.equal("Unauthorized");
      }
    });

    it("cancel_campaign fails when campaign has backers", async () => {
      try {
        await program.methods
          .cancelCampaign()
          .accounts({
            creator: creator.publicKey,
            campaign: campaignPda6,
            campaignVault: vaultPda6,
          })
          .signers([creator])
          .rpc();
        expect.fail("Should have thrown CampaignHasBackers");
      } catch (err: any) {
        expect(err.error.errorCode.code).to.equal("CampaignHasBackers");
      }
    });

    it("claim_tokens fails when no milestones approved", async () => {
      const [bp] = PublicKey.findProgramAddressSync(
        [Buffer.from("backer"), campaignPda6.toBuffer(), backer1.publicKey.toBuffer()],
        program.programId
      );
      const backerAta = getAssociatedTokenAddressSync(mintPda6, backer1.publicKey);

      try {
        await program.methods
          .claimTokens()
          .accounts({
            backer: backer1.publicKey,
            config: configPda,
            campaign: campaignPda6,
            backerPosition: bp,
            tokenMint: mintPda6,
            backerTokenAccount: backerAta,
            tokenProgram: TOKEN_PROGRAM_ID,
          })
          .signers([backer1])
          .rpc();
        expect.fail("Should have thrown NothingToClaim");
      } catch (err: any) {
        expect(err.error.errorCode.code).to.equal("NothingToClaim");
      }
    });
  });

  // ═══════════════════════════════════════════
  // TEST 7: INCREASE BACKING
  // ═══════════════════════════════════════════

  describe("7. Increase Backing", () => {
    let campaignPda7: PublicKey;
    let vaultPda7: PublicKey;
    let mintPda7: PublicKey;
    const nonce7 = new anchor.BN(7);

    before(async () => {
      [campaignPda7] = PublicKey.findProgramAddressSync(
        [Buffer.from("campaign"), creator.publicKey.toBuffer(), nonce7.toArrayLike(Buffer, "le", 8)],
        program.programId
      );
      [vaultPda7] = PublicKey.findProgramAddressSync(
        [Buffer.from("vault"), campaignPda7.toBuffer()],
        program.programId
      );
      [mintPda7] = PublicKey.findProgramAddressSync(
        [Buffer.from("mint"), campaignPda7.toBuffer()],
        program.programId
      );

      await program.methods
        .createCampaign("Increase Test", nonce7, 1, new anchor.BN(5 * LAMPORTS_PER_SOL), tokensPerLamport)
        .accounts({
          creator: creator.publicKey,
          config: configPda,
          campaignVault: vaultPda7,
          tokenMint: mintPda7,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([creator])
        .rpc();

      const now = Math.floor(Date.now() / 1000);
      const [mPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("milestone"), campaignPda7.toBuffer(), Buffer.from([0])],
        program.programId
      );
      await program.methods
        .addMilestone(new anchor.BN(5 * LAMPORTS_PER_SOL), new anchor.BN(now + 86400))
        .accounts({
          creator: creator.publicKey,
          config: configPda,
          campaign: campaignPda7,
          milestone: mPda,
        })
        .signers([creator])
        .rpc();

      // Backer1 backs initially
      const [bp] = PublicKey.findProgramAddressSync(
        [Buffer.from("backer"), campaignPda7.toBuffer(), backer1.publicKey.toBuffer()],
        program.programId
      );
      await program.methods
        .backCampaign(new anchor.BN(1 * LAMPORTS_PER_SOL))
        .accounts({
          backer: backer1.publicKey,
          config: configPda,
          campaign: campaignPda7,
          campaignVault: vaultPda7,
          backerPosition: bp,
        })
        .signers([backer1])
        .rpc();
    });

    it("backer1 increases backing", async () => {
      const [bp] = PublicKey.findProgramAddressSync(
        [Buffer.from("backer"), campaignPda7.toBuffer(), backer1.publicKey.toBuffer()],
        program.programId
      );

      const positionBefore = await program.account.backerPosition.fetch(bp);
      const tokensBefore = positionBefore.tokensAllocated.toNumber();

      await program.methods
        .increaseBacking(new anchor.BN(1 * LAMPORTS_PER_SOL))
        .accounts({
          backer: backer1.publicKey,
          config: configPda,
          campaign: campaignPda7,
          campaignVault: vaultPda7,
          backerPosition: bp,
        })
        .signers([backer1])
        .rpc();

      const positionAfter = await program.account.backerPosition.fetch(bp);
      expect(positionAfter.lamportsBacked.toNumber()).to.equal(2 * LAMPORTS_PER_SOL);
      expect(positionAfter.tokensAllocated.toNumber()).to.be.greaterThan(tokensBefore);
      // Tier should stay the same (Tier 1)
      expect(positionAfter.tier).to.equal(1);

      const campaign = await program.account.campaign.fetch(campaignPda7);
      expect(campaign.raisedLamports.toNumber()).to.equal(2 * LAMPORTS_PER_SOL);
      // backer_count should NOT increment (same backer)
      expect(campaign.backerCount).to.equal(1);
    });
  });

  // ═══════════════════════════════════════════
  // TEST 8: MULTI-BACKER TIERS
  // ═══════════════════════════════════════════

  describe("8. Multi-Backer Tiers", () => {
    let campaignPda8: PublicKey;
    let vaultPda8: PublicKey;
    let mintPda8: PublicKey;
    const nonce8 = new anchor.BN(8);

    before(async () => {
      [campaignPda8] = PublicKey.findProgramAddressSync(
        [Buffer.from("campaign"), creator.publicKey.toBuffer(), nonce8.toArrayLike(Buffer, "le", 8)],
        program.programId
      );
      [vaultPda8] = PublicKey.findProgramAddressSync(
        [Buffer.from("vault"), campaignPda8.toBuffer()],
        program.programId
      );
      [mintPda8] = PublicKey.findProgramAddressSync(
        [Buffer.from("mint"), campaignPda8.toBuffer()],
        program.programId
      );

      await program.methods
        .createCampaign("Tier Test", nonce8, 1, new anchor.BN(10 * LAMPORTS_PER_SOL), tokensPerLamport)
        .accounts({
          creator: creator.publicKey,
          config: configPda,
          campaignVault: vaultPda8,
          tokenMint: mintPda8,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([creator])
        .rpc();

      const now = Math.floor(Date.now() / 1000);
      const [mPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("milestone"), campaignPda8.toBuffer(), Buffer.from([0])],
        program.programId
      );
      await program.methods
        .addMilestone(new anchor.BN(10 * LAMPORTS_PER_SOL), new anchor.BN(now + 86400))
        .accounts({
          creator: creator.publicKey,
          config: configPda,
          campaign: campaignPda8,
          milestone: mPda,
        })
        .signers([creator])
        .rpc();
    });

    it("backer1 gets Tier 1, backer2 gets Tier 1 (both under 50)", async () => {
      // Backer1
      const [bp1] = PublicKey.findProgramAddressSync(
        [Buffer.from("backer"), campaignPda8.toBuffer(), backer1.publicKey.toBuffer()],
        program.programId
      );
      await program.methods
        .backCampaign(new anchor.BN(1 * LAMPORTS_PER_SOL))
        .accounts({
          backer: backer1.publicKey,
          config: configPda,
          campaign: campaignPda8,
          campaignVault: vaultPda8,
          backerPosition: bp1,
        })
        .signers([backer1])
        .rpc();

      // Backer2
      const [bp2] = PublicKey.findProgramAddressSync(
        [Buffer.from("backer"), campaignPda8.toBuffer(), backer2.publicKey.toBuffer()],
        program.programId
      );
      await program.methods
        .backCampaign(new anchor.BN(1 * LAMPORTS_PER_SOL))
        .accounts({
          backer: backer2.publicKey,
          config: configPda,
          campaign: campaignPda8,
          campaignVault: vaultPda8,
          backerPosition: bp2,
        })
        .signers([backer2])
        .rpc();

      const pos1 = await program.account.backerPosition.fetch(bp1);
      const pos2 = await program.account.backerPosition.fetch(bp2);

      // Both Tier 1 (under 50 backers)
      expect(pos1.tier).to.equal(1);
      expect(pos2.tier).to.equal(1);

      // Same amount → same tokens (Tier 1 = 1.0x)
      expect(pos1.tokensAllocated.toNumber()).to.equal(pos2.tokensAllocated.toNumber());

      const campaign = await program.account.campaign.fetch(campaignPda8);
      expect(campaign.backerCount).to.equal(2);
    });
  });

  // ═══════════════════════════════════════════
  // TEST 9: GOVERNANCE — Extension Request + Vote
  // ═══════════════════════════════════════════

  describe("9. Governance Flow", () => {
    let campaignPda9: PublicKey;
    let vaultPda9: PublicKey;
    let mintPda9: PublicKey;
    let milestonePda9: PublicKey;
    const nonce9 = new anchor.BN(9);

    before(async () => {
      // Create campaign with 1 milestone
      [campaignPda9] = PublicKey.findProgramAddressSync(
        [Buffer.from("campaign"), creator.publicKey.toBuffer(), nonce9.toArrayLike(Buffer, "le", 8)],
        program.programId
      );
      [vaultPda9] = PublicKey.findProgramAddressSync(
        [Buffer.from("vault"), campaignPda9.toBuffer()],
        program.programId
      );
      [mintPda9] = PublicKey.findProgramAddressSync(
        [Buffer.from("mint"), campaignPda9.toBuffer()],
        program.programId
      );
      [milestonePda9] = PublicKey.findProgramAddressSync(
        [Buffer.from("milestone"), campaignPda9.toBuffer(), Buffer.from([0])],
        program.programId
      );

      await program.methods
        .createCampaign("Governance Test", nonce9, 1, new anchor.BN(1 * LAMPORTS_PER_SOL), tokensPerLamport)
        .accounts({
          creator: creator.publicKey,
          config: configPda,
          campaignVault: vaultPda9,
          tokenMint: mintPda9,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([creator])
        .rpc();

      const now = Math.floor(Date.now() / 1000);
      await program.methods
        .addMilestone(new anchor.BN(1 * LAMPORTS_PER_SOL), new anchor.BN(now + 86400))
        .accounts({
          creator: creator.publicKey,
          config: configPda,
          campaign: campaignPda9,
          milestone: milestonePda9,
        })
        .signers([creator])
        .rpc();

      // Backer1 backs
      const [bp] = PublicKey.findProgramAddressSync(
        [Buffer.from("backer"), campaignPda9.toBuffer(), backer1.publicKey.toBuffer()],
        program.programId
      );
      await program.methods
        .backCampaign(new anchor.BN(1 * LAMPORTS_PER_SOL))
        .accounts({
          backer: backer1.publicKey,
          config: configPda,
          campaign: campaignPda9,
          campaignVault: vaultPda9,
          backerPosition: bp,
        })
        .signers([backer1])
        .rpc();

      // Submit evidence
      const hash = Buffer.alloc(32); hash.fill(77);
      await program.methods
        .submitMilestone(0, Array.from(hash))
        .accounts({
          creator: creator.publicKey,
          config: configPda,
          campaign: campaignPda9,
          milestone: milestonePda9,
        })
        .signers([creator])
        .rpc();

      // AI marks as PARTIAL → under human review
      const aiHash = Buffer.alloc(32); aiHash.fill(78);
      await program.methods
        .markUnderHumanReview(0, Array.from(aiHash))
        .accounts({
          authority: aiAgent.publicKey,
          config: configPda,
          campaign: campaignPda9,
          milestone: milestonePda9,
        })
        .signers([aiAgent])
        .rpc();

      // Admin rejects milestone
      const decisionHash = Buffer.alloc(32); decisionHash.fill(79);
      await program.methods
        .adminOverrideDecision(0, false, Array.from(decisionHash))
        .accounts({
          admin: admin.publicKey,
          config: configPda,
          campaign: campaignPda9,
          milestone: milestonePda9,
          campaignVault: vaultPda9,
          creator: creator.publicKey,
          qadamTreasury: qadamTreasury.publicKey,
        })
        .rpc();
    });

    it("milestone is rejected", async () => {
      const milestone = await program.account.milestoneAccount.fetch(milestonePda9);
      expect(milestone.status).to.deep.equal({ rejected: {} });
    });

    it("creator requests extension", async () => {
      const now = Math.floor(Date.now() / 1000);
      const reasonHash = Buffer.alloc(32); reasonHash.fill(79);

      const [votingStatePda] = PublicKey.findProgramAddressSync(
        [Buffer.from("voting"), milestonePda9.toBuffer()],
        program.programId
      );

      await program.methods
        .requestExtension(0, Array.from(reasonHash), new anchor.BN(now + 86400 * 14))
        .accounts({
          creator: creator.publicKey,
          config: configPda,
          campaign: campaignPda9,
          milestone: milestonePda9,
          votingState: votingStatePda,
        })
        .signers([creator])
        .rpc();

      const milestone = await program.account.milestoneAccount.fetch(milestonePda9);
      expect(milestone.status).to.deep.equal({ votingActive: {} });
    });

    it("backer1 votes to extend", async () => {
      const [votingStatePda] = PublicKey.findProgramAddressSync(
        [Buffer.from("voting"), milestonePda9.toBuffer()],
        program.programId
      );
      const [votePda] = PublicKey.findProgramAddressSync(
        [Buffer.from("vote"), milestonePda9.toBuffer(), backer1.publicKey.toBuffer()],
        program.programId
      );
      const [bp] = PublicKey.findProgramAddressSync(
        [Buffer.from("backer"), campaignPda9.toBuffer(), backer1.publicKey.toBuffer()],
        program.programId
      );

      await program.methods
        .voteOnExtension(0, true)
        .accounts({
          voter: backer1.publicKey,
          config: configPda,
          campaign: campaignPda9,
          milestone: milestonePda9,
          backerPosition: bp,
          votingState: votingStatePda,
          extensionVote: votePda,
        })
        .signers([backer1])
        .rpc();

      const vote = await program.account.extensionVote.fetch(votePda);
      expect(vote.voteApprove).to.equal(true);
      expect(vote.votingPower.toNumber()).to.be.greaterThan(0);
    });

    it("backer1 cannot vote twice", async () => {
      const [votingStatePda] = PublicKey.findProgramAddressSync(
        [Buffer.from("voting"), milestonePda9.toBuffer()],
        program.programId
      );
      const [votePda] = PublicKey.findProgramAddressSync(
        [Buffer.from("vote"), milestonePda9.toBuffer(), backer1.publicKey.toBuffer()],
        program.programId
      );
      const [bp] = PublicKey.findProgramAddressSync(
        [Buffer.from("backer"), campaignPda9.toBuffer(), backer1.publicKey.toBuffer()],
        program.programId
      );

      try {
        await program.methods
          .voteOnExtension(0, false)
          .accounts({
            voter: backer1.publicKey,
            config: configPda,
            campaign: campaignPda9,
            milestone: milestonePda9,
            backerPosition: bp,
            votingState: votingStatePda,
            extensionVote: votePda,
          })
          .signers([backer1])
          .rpc();
        expect.fail("Should have thrown — already voted");
      } catch (err: any) {
        // PDA already exists — Anchor will reject init
        expect(err).to.exist;
      }
    });
  });
});
