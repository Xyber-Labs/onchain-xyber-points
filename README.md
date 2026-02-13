# Onchain Xyber Points

![oxp reoi header](https://opamto4dwx6rqznrovzer5f27gh3nvcvn65l54bdyjfvjmkicbta.arweave.net/c8DJu4O1_RhlsXVySPS6-Y-21FVvur7wI8JLVLFIEGY)

<p align="center">
  <a href="https://explorer.solana.com/address/oxp5daG6BinG1AL2W83RQmmN8tcXJqrqy3bYprLMRV8"><img src="https://img.shields.io/badge/Solana-Mainnet-brightgreen?logo=solana" alt="Solana Mainnet"></a>
  <a href="https://www.anchor-lang.com/"><img src="https://img.shields.io/badge/Anchor-0.31.1-blue?logo=anchor" alt="Anchor"></a>
  <a href="https://www.npmjs.com/package/@xyber-labs/xyber-points"><img src="https://img.shields.io/npm/v/@xyber-labs/xyber-points?logo=npm" alt="npm"></a>
  <a href="https://github.com/RichardLitt/standard-readme"><img src="https://img.shields.io/badge/readme%20style-standard-brightgreen.svg" alt="standard-readme compliant"></a>
</p>




TypeScript SDK and CLI for onchain-xyber-points Solana program.

Onchain Xyber Points is the on-chain backbone of Xyber's Engagement Hub — a gated community platform where users connect a wallet, pass an invite-code whitelist check and earn XP by completing quests (social follows, retweets, Discord joins, referrals). The Solana program (Token-2022) mints non-transferable XP tokens to recipient wallets, with a nonce-based replay protection per recipient. A designated minter backend credits XP instantly after quest validation, while an admin role controls program configuration. The points drive a live leaderboard, tiered access levels (Ghost / Fractal / Archivist) and a referral system where inviters receive a share of their invitees' XP.

## Dependencies

Install [Solana toolchain](https://solana.com/docs/intro/installation):

```bash
curl --proto '=https' --tlsv1.2 -sSfL https://solana-install.solana.workers.dev | bash
```

Switch to Anchor 0.31.1:

```bash
avm use 0.31.1
```

Install CLI & SDK:

```bash
npm install @xyber-labs/xyber-points
```

- Solana CLI 2.0+
- Anchor CLI 0.31.1
- Node.js 18+
- [Squads](https://squads.so/) multisig for mainnet program authority

## Install

### Localnet

See [LOCAL_FLOW.md](LOCAL_FLOW.md) for the full local validator setup, build, deploy and test flow.

### Mainnet

Build and upload the program buffer:

```bash
solana-verify build
solana-keygen new -o buffer.json --no-bip39-passphrase
solana program write-buffer --buffer buffer.json target/deploy/onchain_xyber_points.so
solana program set-buffer-authority $(solana address -k buffer.json) --new-buffer-authority ySdMgXww2coTrgD5Y9d595mAF2MrSzZY9unPTftgdkP
```

[Upgrade the program via Squads multisig](https://app.squads.so/squads/ySdMgXww2coTrgD5Y9d595mAF2MrSzZY9unPTftgdkP/developer/programs/oxp5daG6BinG1AL2W83RQmmN8tcXJqrqy3bYprLMRV8)

Verify the build on-chain with [solana-verify](https://github.com/Ellipsis-Labs/solana-verifiable-build):

```bash
solana-verify export-pda-tx https://github.com/Xyber-Labs/onchain-xyber-points -um \
  --program-id oxp5daG6BinG1AL2W83RQmmN8tcXJqrqy3bYprLMRV8 \
  --uploader ySdMgXww2coTrgD5Y9d595mAF2MrSzZY9unPTftgdkP \
  --encoding base58 --compute-unit-price 0
```

Execute the exported transaction through Squads (import base58 tx), then submit the verification job:

```bash
solana-verify remote submit-job -u https://api.mainnet.solana.com \
  --program-id oxp5daG6BinG1AL2W83RQmmN8tcXJqrqy3bYprLMRV8 \
  --uploader ySdMgXww2coTrgD5Y9d595mAF2MrSzZY9unPTftgdkP
```

Update the IDL (temporarily transfer upgrade authority from Squads, upgrade IDL, transfer back):

```bash
# 1. Transfer upgrade authority from Squads to deployer (execute through Squads)
# 2. Upgrade IDL
anchor idl upgrade --filepath target/idl/onchain_xyber_points.json --provider.cluster mainnet oxp5daG6BinG1AL2W83RQmmN8tcXJqrqy3bYprLMRV8
# 3. Transfer upgrade authority back to Squads (execute through Squads)
```

> A proper IDL update flow without authority transfer will be implemented later.

Close old buffers to reclaim rent — program buffer is closed through Squads multisig.

## Usage

### Initialize

Sets admin and minter roles for the program. In production this instruction is typically executed through [Squads TX Builder](https://app.squads.so/squads/ySdMgXww2coTrgD5Y9d595mAF2MrSzZY9unPTftgdkP/developer/tx-builder/nJlPIEmJ5g6K3NH79uSdUgtWFxoNBrHeDsJCNDhDWnCE) since the admin is a multisig, but can also be called directly:

```bash
npx @xyber-labs/xyber-points@latest --rpc-url https://api.mainnet-beta.solana.com initialize \
  --new-admin $(solana address -k mainnet/deployer.json) \
  --new-minter $(solana address -k mainnet/minter.json) \
  --signer-keypair mainnet/keeper.json
```

### Mint Points

In production, minting is triggered by the backend after quest validation on the frontend. For testing or manual operations:

```bash
npx @xyber-labs/xyber-points@latest --rpc-url https://api.mainnet-beta.solana.com mint-points \
  --recipient-keypair mainnet/user.json \
  --amount 100 \
  --minter-keypair mainnet/minter.json
```

### SDK

The SDK is a factory — call `OnchainXyberPointsSDK.create(provider, program)` with an Anchor `AnchorProvider` and `Program` instance. The caller is responsible for constructing both (from IDL JSON and an RPC connection).

Every instruction follows a three-level pattern: `methodIx()` returns a raw `TransactionInstruction`, `methodTx()` wraps it into a `Transaction`, and `method()` sends and confirms in one call. Use the level that fits your integration — compose custom transactions with `Ix`, or fire-and-forget with the top-level wrapper.

Signers are always passed explicitly — there are no implicit wallets or fallbacks. For `initialize`, the deployer signs the first call; subsequent calls require the current admin. For `mintPoints`, both the minter (authority) and the recipient must sign, since the recipient pays rent for their nonce and ATA accounts.

```typescript
import { OnchainXyberPointsSDK } from "@xyber-labs/xyber-points";

const sdk = OnchainXyberPointsSDK.create(provider, program);

const [configPda] = sdk.getConfigPda();
const [pointsMintPda] = sdk.getPointsMintPda();
const nonce = await sdk.getNonce(recipientPublicKey);

const sig = await sdk.initialize({ authority, newAdmin, newMinter, signers: [keypair] });
const sig = await sdk.mintPoints({ authority, recipient, amount, nonce, signers: [minterKeypair, recipientKeypair] });
```

## Maintainers

[@XyKeeper](https://github.com/XyKeeper) [`PGP: 19A3D3B094F4AD25`](https://keys.openpgp.org/vks/v1/by-fingerprint/3D98A0A1465491FAFC2047F719A3D3B094F4AD25)

## License

[MIT](LICENSE)
