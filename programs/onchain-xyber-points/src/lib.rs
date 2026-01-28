use anchor_lang::prelude::*;

use instructions::{initialize::*, mint_points::*};

pub mod errors;
pub mod instructions;
pub mod state;

#[cfg(feature = "localnet")]
#[constant]
pub const DEPLOYER: Pubkey = pubkey!("8dabTUxUZCoH42Gq8r9jTyeAzjqVtj2PVS3yvPQLrueS");

#[cfg(not(feature = "localnet"))]
#[constant]
pub const DEPLOYER: Pubkey = pubkey!("keeppCujRWx7HW8AgCL3F9CfaAM2hRKvWvNVo6iGToE");

#[constant]
pub const SEED_ROOT: &[u8] = b"xyber-points-0";

#[constant]
pub const POINTS_MINT_SEED: &[u8] = b"points_mint";

#[cfg(feature = "localnet")]
declare_id!("DYNpaq7XujscK29FYuQD5h8rGtxPAwNPYiB8vbuQe4R7");

#[cfg(not(feature = "localnet"))]
declare_id!("oxp5daG6BinG1AL2W83RQmmN8tcXJqrqy3bYprLMRV8");

#[cfg(not(feature = "no-entrypoint"))]
solana_security_txt::security_txt! {
    name: "Onchain Xyber XP",
    source_code: "https://github.com/Xyber-Labs/onchain-xyber-points",
    project_url: "https://app.xyber.inc/watchtower",
    contacts: "email:xykeeper@xyber.inc",
    policy: "Please contact us if you've discovered a bug"
}

#[program]
pub mod onchain_xyber_points {
    use super::*;

    pub fn initialize(
        ctx: Context<Initialize>,
        new_admin: Pubkey,
        new_minter: Pubkey,
    ) -> Result<()> {
        instructions::initialize(ctx, new_admin, new_minter)
    }

    pub fn mint_points(ctx: Context<MintPoints>, amount: u64, nonce: u64) -> Result<()> {
        instructions::mint_points(ctx, amount, nonce)
    }
}
