# @xyber-labs/xyber-points

TypeScript SDK and CLI for the [onchain-xyber-points](https://github.com/Xyber-Labs/onchain-xyber-points) Solana program.

Program address: `oxp5daG6BinG1AL2W83RQmmN8tcXJqrqy3bYprLMRV8`

## Installation

```bash
npm install @xyber-labs/xyber-points
```

## CLI

```bash
npx @xyber-labs/xyber-points@latest --help
npx @xyber-labs/xyber-points@latest initialize --help
npx @xyber-labs/xyber-points@latest mint-points --help
```

### Initialize

Creates the program config and points mint accounts.

```bash
npx @xyber-labs/xyber-points@latest --rpc-url <RPC_URL> initialize \
  --new-admin <ADMIN_PUBKEY> \
  --new-minter <MINTER_PUBKEY> \
  --signer-keypair <PATH_TO_KEYPAIR>
```

### Mint Points

Mints points tokens to a recipient.

```bash
npx @xyber-labs/xyber-points@latest --rpc-url <RPC_URL> mint-points \
  --recipient-keypair <PATH_TO_RECIPIENT_KEYPAIR> \
  --amount <AMOUNT> \
  --minter-keypair <PATH_TO_MINTER_KEYPAIR>
```

The `--rpc-url` flag can be replaced by the `ANCHOR_PROVIDER_URL` environment variable.

## SDK Usage

```typescript
import { OnchainXyberPointsSDK } from "@xyber-labs/xyber-points";
import { AnchorProvider, Program, BN } from "@coral-xyz/anchor";

const sdk = OnchainXyberPointsSDK.create(provider, program);

// PDA helpers
const [configPda] = sdk.getConfigPda();
const [pointsMintPda] = sdk.getPointsMintPda();
const [noncePda] = sdk.getNoncePda(recipientPublicKey);

// Get current nonce for a recipient
const nonce = await sdk.getNonce(recipientPublicKey);

// Initialize (Ix / Tx / send)
const ix = await sdk.initializeIx({ authority, newAdmin, newMinter });
const tx = await sdk.initializeTx({ authority, newAdmin, newMinter });
const sig = await sdk.initialize({ authority, newAdmin, newMinter, signers: [keypair] });

// Mint points (Ix / Tx / send)
const ix = await sdk.mintPointsIx({ authority, recipient, amount, nonce });
const tx = await sdk.mintPointsTx({ authority, recipient, amount, nonce });
const sig = await sdk.mintPoints({ authority, recipient, amount, nonce, signers: [keypair] });
```

Each instruction follows the pattern:
- `<method>Ix()` — returns `TransactionInstruction`
- `<method>Tx()` — returns `Transaction`
- `<method>()` — sends the transaction and returns the signature
