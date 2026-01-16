import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import { assert } from "chai";
import { OnchainXyberPoints } from "../target/types/onchain_xyber_points";
import { OnchainXyberPointsSDK } from "../ts-sdk/src";
import { getExplorerUrl, getAccountUrl, loadKeypair, doAndCheckError } from "./utils";

describe("onchain-xyber-points", () => {
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.OnchainXyberPoints as Program<OnchainXyberPoints>;
  const provider = anchor.getProvider() as anchor.AnchorProvider;
  const sdk = OnchainXyberPointsSDK.create(provider, program);

  let deployerKeypair: anchor.web3.Keypair;
  let adminKeypair: anchor.web3.Keypair;
  let minterKeypair: anchor.web3.Keypair;
  let user1Keypair: anchor.web3.Keypair;
  let user2Keypair: anchor.web3.Keypair;

  before(async () => {
    deployerKeypair = loadKeypair("localnet/deployer.json");
    adminKeypair = loadKeypair("localnet/admin.json");
    minterKeypair = loadKeypair("localnet/minter.json");
    user1Keypair = loadKeypair("localnet/user1.json");
    user2Keypair = loadKeypair("localnet/user2.json");

    let signature = await provider.connection.requestAirdrop(deployerKeypair.publicKey, 100 * anchor.web3.LAMPORTS_PER_SOL);
    await provider.connection.confirmTransaction(signature);
    signature = await provider.connection.requestAirdrop(adminKeypair.publicKey, 100 * anchor.web3.LAMPORTS_PER_SOL);
    await provider.connection.confirmTransaction(signature);
    signature = await provider.connection.requestAirdrop(minterKeypair.publicKey, 100 * anchor.web3.LAMPORTS_PER_SOL);
    await provider.connection.confirmTransaction(signature);
    signature = await provider.connection.requestAirdrop(user1Keypair.publicKey, 100 * anchor.web3.LAMPORTS_PER_SOL);
    await provider.connection.confirmTransaction(signature);
  });

  it("Should initialize config and points mint", async () => {
    const [configPda] = sdk.getConfigPda();
    const [pointsMintPda] = sdk.getPointsMintPda();

    console.log("Program ID:", program.programId.toBase58());
    console.log("  Explorer:", getAccountUrl(provider, program.programId));
    console.log("Config PDA:", configPda.toBase58());
    console.log("  Explorer:", getAccountUrl(provider, configPda));
    console.log("Points Mint PDA:", pointsMintPda.toBase58());
    console.log("  Explorer:", getAccountUrl(provider, pointsMintPda));
    console.log("Deployer:", deployerKeypair.publicKey.toBase58());
    console.log("Admin:", adminKeypair.publicKey.toBase58());
    console.log("Minter:", minterKeypair.publicKey.toBase58());

    const signature = await sdk.initialize({
      authority: deployerKeypair.publicKey,
      newAdmin: adminKeypair.publicKey,
      newMinter: minterKeypair.publicKey,
      signers: [deployerKeypair],
    });

    console.log("Initialize signature:", signature);
    console.log("  Explorer:", getExplorerUrl(provider, signature));


    const configAccount = await program.account.config.fetch(configPda);
    assert.equal(configAccount.admin.toBase58(), adminKeypair.publicKey.toBase58(), "Admin should be set correctly");
    assert.equal(configAccount.minter.toBase58(), minterKeypair.publicKey.toBase58(), "Minter should be set correctly");
    assert.equal(
      configAccount.pointsMint.toBase58(),
      pointsMintPda.toBase58(),
      "Points mint should be set correctly"
    );

    const mintInfo = await provider.connection.getAccountInfo(pointsMintPda);
    assert.isNotNull(mintInfo, "Points mint account should exist");
    assert.equal(
      mintInfo.owner.toBase58(),
      TOKEN_2022_PROGRAM_ID.toBase58(),
      "Mint should be owned by Token-2022 program"
    );
  });

  it("Should reject second initialization (not idempotent)", async () => {
    await doAndCheckError(
      sdk.initialize({
        authority: deployerKeypair.publicKey,
        newAdmin: adminKeypair.publicKey,
        newMinter: minterKeypair.publicKey,
        signers: [deployerKeypair],
      }),
      "already in use"
    );
    console.log("Second initialization correctly rejected");
  });

  it("Should mint points to user1", async () => {
    const amount = new anchor.BN(1000);

    const signature = await sdk.mintPoints({
      authority: minterKeypair.publicKey,
      recipient: user1Keypair.publicKey,
      amount,
      signers: [minterKeypair],
    });

    console.log("Mint points signature:", signature);
    console.log("  Explorer:", getExplorerUrl(provider, signature));
    console.log("Points minted to user1 successfully");
  });

  it("Should mint points to user2", async () => {
    const amount = new anchor.BN(500);

    const signature = await sdk.mintPoints({
      authority: minterKeypair.publicKey,
      recipient: user2Keypair.publicKey,
      amount,
      signers: [minterKeypair],
    });

    console.log("Mint points signature:", signature);
    console.log("  Explorer:", getExplorerUrl(provider, signature));
    console.log("Points minted to user2 successfully");
  });

  it("Should reject minting with wrong authority", async () => {
    const amount = new anchor.BN(500);

    await doAndCheckError(
      sdk.mintPoints({
        authority: adminKeypair.publicKey,
        recipient: user1Keypair.publicKey,
        amount,
        signers: [adminKeypair],
      }),
      "Unauthorized"
    );
    console.log("Minting with wrong authority correctly rejected");
  });

  it("Should allow transferring points between users", async () => {
    const { getAssociatedTokenAddressSync, createTransferCheckedInstruction, getAccount } = await import("@solana/spl-token");

    const [pointsMintPda] = sdk.getPointsMintPda();

    const user1Ata = getAssociatedTokenAddressSync(
      pointsMintPda,
      user1Keypair.publicKey,
      false,
      TOKEN_2022_PROGRAM_ID
    );

    const user2Ata = getAssociatedTokenAddressSync(
      pointsMintPda,
      user2Keypair.publicKey,
      false,
      TOKEN_2022_PROGRAM_ID
    );

    const user1BalanceBefore = (await getAccount(provider.connection, user1Ata, undefined, TOKEN_2022_PROGRAM_ID)).amount;
    const user2BalanceBefore = (await getAccount(provider.connection, user2Ata, undefined, TOKEN_2022_PROGRAM_ID)).amount;

    const transferAmount = 100n;

    const transferIx = createTransferCheckedInstruction(
      user1Ata,
      pointsMintPda,
      user2Ata,
      user1Keypair.publicKey,
      transferAmount,
      0,
      [],
      TOKEN_2022_PROGRAM_ID
    );

    const tx = new anchor.web3.Transaction().add(transferIx);

    const signature = await provider.sendAndConfirm(tx, [user1Keypair]);
    console.log("Transfer signature:", signature);
    console.log("  Explorer:", getExplorerUrl(provider, signature));

    const user1BalanceAfter = (await getAccount(provider.connection, user1Ata, undefined, TOKEN_2022_PROGRAM_ID)).amount;
    const user2BalanceAfter = (await getAccount(provider.connection, user2Ata, undefined, TOKEN_2022_PROGRAM_ID)).amount;

    assert.equal(user1BalanceAfter, user1BalanceBefore - transferAmount, "User1 balance should decrease");
    assert.equal(user2BalanceAfter, user2BalanceBefore + transferAmount, "User2 balance should increase");
    console.log("Transfer successful: user1 ->", transferAmount.toString(), "points -> user2");
  });
});
