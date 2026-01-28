import * as anchor from "@coral-xyz/anchor";
import { BN, Program, web3 } from "@coral-xyz/anchor";
import type { OnchainXyberPoints } from "../idl/onchain_xyber_points";
import { TxBuilder } from "./txBuilder";

export const OnchainXyberPointsSDK = {
  create(
    provider: anchor.AnchorProvider,
    program: Program<OnchainXyberPoints>
  ) {
    const txBuilder = new TxBuilder(program);

    async function initialize(args: {
      authority: web3.PublicKey;
      newAdmin: web3.PublicKey;
      newMinter: web3.PublicKey;
      signers: web3.Keypair[];
    }): Promise<string> {
      const tx = await txBuilder.initializeTx(args);
      return await provider.sendAndConfirm(tx, args.signers);
    }

    async function mintPoints(args: {
      authority: web3.PublicKey;
      recipient: web3.PublicKey;
      amount: BN;
      nonce: BN;
      signers: web3.Keypair[];
    }): Promise<string> {
      const tx = await txBuilder.mintPointsTx(args);
      return await provider.sendAndConfirm(tx, args.signers);
    }

    return {
      // PDA Helpers
      getConfigPda: txBuilder.getConfigPda.bind(txBuilder),
      getPointsMintPda: txBuilder.getPointsMintPda.bind(txBuilder),
      getNoncePda: txBuilder.getNoncePda.bind(txBuilder),
      getNonce: txBuilder.getNonce.bind(txBuilder),

      // Initialize
      initializeIx: txBuilder.initializeIx.bind(txBuilder),
      initializeTx: txBuilder.initializeTx.bind(txBuilder),
      initialize,

      // Mint Points
      mintPointsIx: txBuilder.mintPointsIx.bind(txBuilder),
      mintPointsTx: txBuilder.mintPointsTx.bind(txBuilder),
      mintPoints,
    };
  },
};
