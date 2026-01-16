import * as anchor from "@coral-xyz/anchor";
import { Command } from "commander";
import { getExplorerUrl, getAccountUrl, loadKeypair, runWithSdk } from "./utils";

async function main() {
  const program = new Command();

  program
    .requiredOption("--new-admin <pubkey>", "New admin public key")
    .requiredOption("--new-minter <pubkey>", "New minter public key")
    .requiredOption("--signer-keypair <path>", "Path to signer keypair (deployer for first run, admin for updates)")
    .parse(process.argv);

  const opts = program.opts();

  const newAdmin = new anchor.web3.PublicKey(opts.newAdmin);
  const newMinter = new anchor.web3.PublicKey(opts.newMinter);
  const signerKeypair = loadKeypair(opts.signerKeypair);

  await runWithSdk(async ({ provider, sdk, program }) => {
    console.log("Initializing onchain-xyber-points:");
    console.log("  New admin:", newAdmin.toBase58());
    console.log("  New minter:", newMinter.toBase58());
    console.log("  Signer:", signerKeypair.publicKey.toBase58());

    const [configPda] = sdk.getConfigPda();
    const [pointsMintPda] = sdk.getPointsMintPda();

    console.log("  Config PDA:", configPda.toBase58());
    console.log("  Points Mint PDA:", pointsMintPda.toBase58());

    console.log("\nSending transaction...");

    const tx = await sdk.initializeTx({
      authority: signerKeypair.publicKey,
      newAdmin,
      newMinter,
    });

    const signature = await provider.sendAndConfirm(tx, [signerKeypair]);

    console.log("\n✅ Success!");
    console.log("Transaction signature:", signature);
    console.log("Explorer:", getExplorerUrl(provider, signature));
    console.log("\nCreated accounts:");
    console.log("  Config:", getAccountUrl(provider, configPda));
    console.log("  Points Mint:", getAccountUrl(provider, pointsMintPda));

    const configAccount = await program.account.config.fetch(configPda);
    console.log("\nConfig state:");
    console.log("  Admin:", configAccount.admin.toBase58());
    console.log("  Minter:", configAccount.minter.toBase58());
    console.log("  Points Mint:", configAccount.pointsMint.toBase58());
  });
}

main();
