import * as anchor from "@coral-xyz/anchor";
import { BN } from "@coral-xyz/anchor";
import { Command } from "commander";
import { getExplorerUrl, getAccountUrl, loadKeypair, runWithSdk } from "./utils";

async function main() {
  const program = new Command();

  program
    .requiredOption("--recipient <pubkey>", "Recipient public key")
    .requiredOption("--amount <number>", "Amount of points to mint")
    .requiredOption("--minter-keypair <path>", "Path to minter keypair")
    .parse(process.argv);

  const opts = program.opts();

  const recipient = new anchor.web3.PublicKey(opts.recipient);
  const amount = new BN(opts.amount);
  const minterKeypair = loadKeypair(opts.minterKeypair);

  await runWithSdk(async ({ provider, sdk }) => {
    console.log("Minting points:");
    console.log("  Recipient:", recipient.toBase58());
    console.log("  Amount:", amount.toString());
    console.log("  Minter:", minterKeypair.publicKey.toBase58());

    const [configPda] = sdk.getConfigPda();
    const [pointsMintPda] = sdk.getPointsMintPda();

    console.log("  Config PDA:", configPda.toBase58());
    console.log("  Points Mint PDA:", pointsMintPda.toBase58());

    console.log("\nSending transaction...");

    const tx = await sdk.mintPointsTx({
      authority: minterKeypair.publicKey,
      recipient,
      amount,
    });

    const signature = await provider.sendAndConfirm(tx, [minterKeypair]);

    console.log("\n✅ Success!");
    console.log("Transaction signature:", signature);
    console.log("Explorer:", getExplorerUrl(provider, signature));
  });
}

main();
