import { fromWorkspace, LiteSVMProvider } from "anchor-litesvm";
import { FailedTransactionMetadata, LiteSVM } from "litesvm";
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { SendTransactionError } from "@solana/web3.js";
import { assert } from "chai";
import bs58 from "bs58";
import { OnchainXyberPoints } from "../target/types/onchain_xyber_points";
import { OnchainXyberPointsSDK } from "../ts-sdk/src";
import { TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import { doAndCheckError, loadKeypair } from "./utils";

function encodeSignatureSafe(sigRaw: any): string {
  if (!sigRaw) throw new Error("Missing signature");
  if (typeof sigRaw === "string") return sigRaw;
  if (Array.isArray(sigRaw)) return bs58.encode(Uint8Array.from(sigRaw));
  if (sigRaw instanceof Uint8Array) return bs58.encode(sigRaw);
  if (Buffer.isBuffer(sigRaw)) return bs58.encode(new Uint8Array(sigRaw));
  if (sigRaw?.buffer && typeof sigRaw.byteLength === "number") {
    return bs58.encode(new Uint8Array(sigRaw.buffer, sigRaw.byteOffset ?? 0, sigRaw.byteLength));
  }
  if (sigRaw?.data) {
    try { return bs58.encode(Uint8Array.from(sigRaw.data)); } catch { }
  }
  throw new TypeError("Unsupported signature type for encoding");
}

function sendTxWithMeta(
  client: LiteSVM,
  feePayer: anchor.web3.PublicKey,
  signers: anchor.web3.Keypair[],
  instructions: anchor.web3.TransactionInstruction | anchor.web3.TransactionInstruction[] | anchor.web3.Transaction,
): { signature: string; computeUnitsConsumed: bigint } {
  let tx: anchor.web3.Transaction;
  if (instructions instanceof anchor.web3.Transaction) {
    tx = instructions;
  } else if (Array.isArray(instructions)) {
    tx = new anchor.web3.Transaction().add(...instructions);
  } else {
    tx = new anchor.web3.Transaction().add(instructions);
  }
  tx.feePayer = feePayer;
  tx.recentBlockhash = client.latestBlockhash();
  signers.forEach((s) => tx.partialSign(s));
  const sigRaw = tx.signature;
  const signature = encodeSignatureSafe(sigRaw);
  const res = client.sendTransaction(tx);

  if (res instanceof FailedTransactionMetadata || (res as any).err) {
    const failedMeta = res as FailedTransactionMetadata;
    const meta = failedMeta.meta();
    if (!meta) {
      throw new Error(`Transaction ${signature} failed: ${failedMeta.err().toString()} (no metadata available)`);
    }
    throw new SendTransactionError({
      action: "send",
      signature,
      transactionMessage: failedMeta.err().toString(),
      logs: meta.logs(),
    } as any);
  }

  return { signature, computeUnitsConsumed: res.computeUnitsConsumed() };
}

function sendTx(
  client: LiteSVM,
  feePayer: anchor.web3.PublicKey,
  signers: anchor.web3.Keypair[],
  instructions: anchor.web3.TransactionInstruction | anchor.web3.TransactionInstruction[] | anchor.web3.Transaction,
): string {
  return sendTxWithMeta(client, feePayer, signers, instructions).signature;
}

describe("onchain-xyber-points", () => {
  let client: LiteSVM;
  let provider: LiteSVMProvider;
  let program: Program<OnchainXyberPoints>;
  let sdk: ReturnType<typeof OnchainXyberPointsSDK.create>;
  let deployerKeypair: anchor.web3.Keypair;
  let adminKeypair: anchor.web3.Keypair;
  let minterKeypair: anchor.web3.Keypair;
  let user1Keypair: anchor.web3.Keypair;
  let user2Keypair: anchor.web3.Keypair;

  before(async () => {
    client = fromWorkspace(".");
    provider = new LiteSVMProvider(client);
    program = anchor.workspace.OnchainXyberPoints as Program<OnchainXyberPoints>;
    sdk = OnchainXyberPointsSDK.create(provider, program);

    deployerKeypair = loadKeypair("localnet/deployer.json");
    adminKeypair = loadKeypair("localnet/admin.json");
    minterKeypair = loadKeypair("localnet/minter.json");
    user1Keypair = loadKeypair("localnet/user1.json");
    user2Keypair = loadKeypair("localnet/user2.json");

    client.airdrop(deployerKeypair.publicKey, BigInt(100 * anchor.web3.LAMPORTS_PER_SOL));
    client.airdrop(minterKeypair.publicKey, BigInt(100 * anchor.web3.LAMPORTS_PER_SOL));
    client.airdrop(user1Keypair.publicKey, BigInt(10 * anchor.web3.LAMPORTS_PER_SOL));
  });

  it("Should initialize config and points mint", async () => {
    const [configPda] = sdk.getConfigPda();
    const [pointsMintPda] = sdk.getPointsMintPda();

    console.log("Program ID:", program.programId.toBase58());
    console.log("Config PDA:", configPda.toBase58());
    console.log("Points Mint PDA:", pointsMintPda.toBase58());
    console.log("Deployer:", deployerKeypair.publicKey.toBase58());
    console.log("Admin:", adminKeypair.publicKey.toBase58());
    console.log("Minter:", minterKeypair.publicKey.toBase58());

    const tx = await sdk.initializeTx({
      authority: deployerKeypair.publicKey,
      newAdmin: adminKeypair.publicKey,
      newMinter: minterKeypair.publicKey,
    });

    const { signature, computeUnitsConsumed } = sendTxWithMeta(client, deployerKeypair.publicKey, [deployerKeypair], tx);

    console.log("Transaction succeeded");
    console.log("Compute units consumed:", computeUnitsConsumed.toString());
    console.log("Initialize signature:", signature);

    const configAccountInfo = client.getAccount(configPda);
    assert.isNotNull(configAccountInfo, "Config account should exist");

    const configAccount = program.coder.accounts.decode("config", Buffer.from(configAccountInfo.data));
    assert.equal(
      configAccount.admin.toBase58(),
      adminKeypair.publicKey.toBase58(),
      "Admin should be set correctly"
    );
    assert.equal(
      configAccount.minter.toBase58(),
      minterKeypair.publicKey.toBase58(),
      "Minter should be set correctly"
    );
    assert.equal(
      configAccount.pointsMint.toBase58(),
      pointsMintPda.toBase58(),
      "Points mint should be set correctly"
    );

    const mintInfo = client.getAccount(pointsMintPda);
    assert.isNotNull(mintInfo, "Points mint account should exist");
    assert.equal(
      mintInfo.owner.toBase58(),
      TOKEN_2022_PROGRAM_ID.toBase58(),
      "Mint should be owned by Token-2022 program"
    );
  });

  it("Should reject second initialization (not idempotent)", async () => {
    const tx = await sdk.initializeTx({
      authority: deployerKeypair.publicKey,
      newAdmin: adminKeypair.publicKey,
      newMinter: minterKeypair.publicKey,
    });

    await doAndCheckError(
      Promise.resolve().then(() => sendTx(client, deployerKeypair.publicKey, [deployerKeypair], tx)),
      "already in use"
    );
    console.log("Second initialization correctly rejected");
  });

  it("Should mint points to user1", async () => {
    const amount = new anchor.BN(1000);

    const tx = await sdk.mintPointsTx({
      authority: minterKeypair.publicKey,
      recipient: user1Keypair.publicKey,
      amount,
    });

    const { signature, computeUnitsConsumed } = sendTxWithMeta(client, minterKeypair.publicKey, [minterKeypair], tx);

    console.log("Transaction succeeded");
    console.log("Compute units consumed:", computeUnitsConsumed.toString());
    console.log("Mint points signature:", signature);
    console.log("Points minted to user1 successfully");
  });

  it("Should mint points to user2", async () => {
    const amount = new anchor.BN(500);

    const tx = await sdk.mintPointsTx({
      authority: minterKeypair.publicKey,
      recipient: user2Keypair.publicKey,
      amount,
    });

    const { signature, computeUnitsConsumed } = sendTxWithMeta(client, minterKeypair.publicKey, [minterKeypair], tx);

    console.log("Transaction succeeded");
    console.log("Compute units consumed:", computeUnitsConsumed.toString());
    console.log("Mint points signature:", signature);
    console.log("Points minted to user2 successfully");
  });

  it("Should reject minting with wrong authority", async () => {
    const amount = new anchor.BN(500);

    const tx = await sdk.mintPointsTx({
      authority: adminKeypair.publicKey,
      recipient: user1Keypair.publicKey,
      amount,
    });

    await doAndCheckError(
      Promise.resolve().then(() => sendTx(client, adminKeypair.publicKey, [adminKeypair], tx)),
      "Unauthorized"
    );
    console.log("Minting with wrong authority correctly rejected");
  });

  it("Should transfer points between users", async () => {
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

    const TRANSFER_AMOUNT = 100n;

    const transferIx = createTransferCheckedInstruction(
      user1Ata,
      pointsMintPda,
      user2Ata,
      user1Keypair.publicKey,
      TRANSFER_AMOUNT,
      0,
      [],
      TOKEN_2022_PROGRAM_ID
    );

    const tx = new anchor.web3.Transaction().add(transferIx);

    const { signature, computeUnitsConsumed } = sendTxWithMeta(client, user1Keypair.publicKey, [user1Keypair], tx);

    console.log("Transfer succeeded");
    console.log("Compute units consumed:", computeUnitsConsumed.toString());
    console.log("Transfer signature:", signature);

    const { unpackAccount } = await import("@solana/spl-token");

    const user1AccountInfo = client.getAccount(user1Ata);
    const user2AccountInfo = client.getAccount(user2Ata);

    const user1Account = unpackAccount(user1Ata, {
      data: Buffer.from(user1AccountInfo.data),
      executable: user1AccountInfo.executable,
      lamports: Number(user1AccountInfo.lamports),
      owner: user1AccountInfo.owner,
      rentEpoch: 0,
    }, TOKEN_2022_PROGRAM_ID);

    const user2Account = unpackAccount(user2Ata, {
      data: Buffer.from(user2AccountInfo.data),
      executable: user2AccountInfo.executable,
      lamports: Number(user2AccountInfo.lamports),
      owner: user2AccountInfo.owner,
      rentEpoch: 0,
    }, TOKEN_2022_PROGRAM_ID);

    assert.equal(user1Account.amount, 900n, "User1 balance should be 900 after transfer");
    assert.equal(user2Account.amount, 600n, "User2 balance should be 600 after transfer");

    console.log("User1 balance after transfer:", user1Account.amount.toString());
    console.log("User2 balance after transfer:", user2Account.amount.toString());
  });
});
