import { BN, Program, web3 } from "@coral-xyz/anchor";
import type { OnchainXyberPoints } from "../idl/onchain_xyber_points";
import IDLJson from "../idl/onchain_xyber_points.json";
import { getConstant } from "./utils";

export class TxBuilder {
  private program: Program<OnchainXyberPoints>;
  private seedRoot: Uint8Array;

  constructor(program: Program<OnchainXyberPoints>) {
    this.program = program;
    this.seedRoot = getConstant("SEED_ROOT", IDLJson as any);
  }

  getPda(seeds: (string | BN | Buffer | web3.PublicKey | Uint8Array | number | bigint)[]): [web3.PublicKey, number] {
    const toSeedBuffer = (seed: string | BN | Buffer | web3.PublicKey | Uint8Array | number | bigint): Buffer => {
      if (typeof seed === "string") return Buffer.from(seed);
      if (typeof seed === "number") {
        if (seed <= 255) return Buffer.from([seed]);
        const bn = new BN(seed);
        return Buffer.from(bn.toArray("be", 8));
      }
      if (typeof seed === "bigint") {
        const bn = new BN(seed.toString());
        return Buffer.from(bn.toArray("be", 8));
      }
      if (BN.isBN(seed)) return Buffer.from(seed.toArray("be", 8));
      if (seed && typeof seed === "object" && "toNumber" in seed && typeof (seed as any).toNumber === "function") {
        const bn = new BN((seed as any).toString());
        return Buffer.from(bn.toArray("be", 8));
      }
      if (Buffer.isBuffer(seed)) return seed;
      if (seed instanceof Uint8Array) return Buffer.from(seed);
      if (seed instanceof web3.PublicKey) return seed.toBuffer();
      if (seed && typeof seed === "object" && "toBuffer" in seed && typeof (seed as any).toBuffer === "function") {
        return (seed as any).toBuffer();
      }
      throw new TypeError("Unsupported PDA seed type");
    };

    const seedBuffers = [this.seedRoot, ...seeds.map(toSeedBuffer)];
    return web3.PublicKey.findProgramAddressSync(seedBuffers, this.program.programId);
  }

  getConfigPda(): [web3.PublicKey, number] {
    return this.getPda(["config"]);
  }

  getPointsMintPda(): [web3.PublicKey, number] {
    return this.getPda(["points_mint"]);
  }

  // ========== Initialize ==========

  async initializeIx(args: {
    authority: web3.PublicKey;
    newAdmin: web3.PublicKey;
    newMinter: web3.PublicKey;
  }): Promise<web3.TransactionInstruction> {
    return await this.program.methods
      .initialize(args.newAdmin, args.newMinter)
      .accounts({
        authority: args.authority,
      })
      .instruction();
  }

  async initializeTx(args: {
    authority: web3.PublicKey;
    newAdmin: web3.PublicKey;
    newMinter: web3.PublicKey;
  }): Promise<web3.Transaction> {
    const ix = await this.initializeIx(args);
    return new web3.Transaction().add(ix);
  }

  // ========== Mint Points ==========

  async mintPointsIx(args: {
    authority: web3.PublicKey;
    recipient: web3.PublicKey;
    amount: BN;
  }): Promise<web3.TransactionInstruction> {
    return await this.program.methods
      .mintPoints(args.amount)
      .accounts({
        authority: args.authority,
        recipient: args.recipient,
      })
      .instruction();
  }

  async mintPointsTx(args: {
    authority: web3.PublicKey;
    recipient: web3.PublicKey;
    amount: BN;
  }): Promise<web3.Transaction> {
    const ix = await this.mintPointsIx(args);
    return new web3.Transaction().add(ix);
  }
}
