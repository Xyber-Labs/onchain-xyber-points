# Deployment and Setup Guide

This document contains the complete deployment flow for the onchain-xyber-points program.

## Prerequisites

- Solana CLI configured with the deployer wallet
- Anchor CLI installed
- Node.js and Yarn installed

## Local Validator Setup

```bash
export CLUSTER=localnet

if [[ "$CLUSTER" == "localnet" ]]; then
    export SCLUSTER=localhost
else
    export SCLUSTER=$CLUSTER
fi
```

### 0. Start Local Validator

Start the local validator:

```bash
solana-test-validator --reset
```

Keep this terminal open.

## Deployment Steps

### 1. Build the Program

Build the program:

```bash
anchor build -- --features localnet
```

### 2. Deploy the Program

Deploy the onchain-xyber-points program:

```bash
anchor deploy --provider.wallet ${CLUSTER}/deployer.json --provider.cluster ${CLUSTER} --program-name onchain_xyber_points --program-keypair ${CLUSTER}/xyber-points.json
```

### 3. Setup: Airdrop SOL to Wallets

Before initializing the program, ensure all wallets have sufficient SOL:

```bash
solana airdrop 100 $(solana address -k ${CLUSTER}/deployer.json) --url ${SCLUSTER}
solana airdrop 100 $(solana address -k ${CLUSTER}/admin.json) --url ${SCLUSTER}
solana airdrop 100 $(solana address -k ${CLUSTER}/minter.json) --url ${SCLUSTER}
solana airdrop 10 $(solana address -k ${CLUSTER}/user1.json) --url ${SCLUSTER}
solana airdrop 10 $(solana address -k ${CLUSTER}/user2.json) --url ${SCLUSTER}
```

**Important:** The `${CLUSTER}/deployer.json` keypair is required for the first initialization.
The deployer public key must match the `DEPLOYER` constant in the contract.

### 4. Initialize Program

Initialize the program configuration. First run must be signed by deployer:

```bash
anchor run initialize --provider.cluster ${CLUSTER} -- \
  --new-admin $(solana address -k ${CLUSTER}/admin.json) \
  --new-minter $(solana address -k ${CLUSTER}/minter.json) \
  --signer-keypair ${CLUSTER}/deployer.json
```

For subsequent updates, use the stored admin as signer:

```bash
anchor run initialize --provider.cluster ${CLUSTER} -- \
  --new-admin $(solana address -k ${CLUSTER}/admin.json) \
  --new-minter $(solana address -k ${CLUSTER}/minter.json) \
  --signer-keypair ${CLUSTER}/admin.json
```

View the Config account to verify initialization:

```bash
export CONFIG_PDA=$(solana find-program-derived-address $(solana address -k ${CLUSTER}/xyber-points.json) string:xyber-points-0 string:config)
anchor account --provider.cluster ${CLUSTER} onchain_xyber_points.Config $CONFIG_PDA  | jq -c
```
View the Points Mint (Token-2022):

```bash
export POINTS_MINT_PDA=$(solana find-program-derived-address $(solana address -k ${CLUSTER}/xyber-points.json) string:xyber-points-0 string:points_mint)
spl-token display $POINTS_MINT_PDA --url ${SCLUSTER}
```

The mint should show:
- Decimals: 0
- Mint authority: Points Mint PDA

### 5. Mint Points to Users

Mint points to user accounts. Only the configured minter can perform this operation:

```bash
# Mint 1000 points to user1
anchor run mint-points --provider.cluster ${CLUSTER} -- \
  --recipient $(solana address -k ${CLUSTER}/user1.json) \
  --amount 1000 \
  --minter-keypair ${CLUSTER}/minter.json

# Mint 500 points to user2
anchor run mint-points --provider.cluster ${CLUSTER} -- \
  --recipient $(solana address -k ${CLUSTER}/user2.json) \
  --amount 500 \
  --minter-keypair ${CLUSTER}/minter.json
```

View user's points balance:

```bash
export POINTS_MINT_PDA=$(solana find-program-derived-address $(solana address -k ${CLUSTER}/xyber-points.json) string:xyber-points-0 string:points_mint)

# Check user1 balance
spl-token balance $POINTS_MINT_PDA --owner $(solana address -k ${CLUSTER}/user1.json) --url ${SCLUSTER}

# Check user2 balance
spl-token balance $POINTS_MINT_PDA --owner $(solana address -k ${CLUSTER}/user2.json) --url ${SCLUSTER}
```

**Note:** Points can be transferred between users using standard SPL token transfer instructions.
