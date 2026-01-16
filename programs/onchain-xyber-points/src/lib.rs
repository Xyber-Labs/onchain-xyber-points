use anchor_lang::prelude::*;

use instructions::initialize::*;
use instructions::mint_points::*;

pub mod errors;
pub mod instructions;
pub mod state;

#[cfg(feature = "localnet")]
#[constant]
pub const DEPLOYER: Pubkey = pubkey!("8dabTUxUZCoH42Gq8r9jTyeAzjqVtj2PVS3yvPQLrueS");

#[cfg(not(feature = "localnet"))]
#[constant]
pub const DEPLOYER: Pubkey = pubkey!("2PQFnL3737LG5qhFEu3G379TSfr3rYhWGVgVvmch1XTG");

#[constant]
pub const SEED_ROOT: &[u8] = b"xyber-points-0";

#[constant]
pub const POINTS_MINT_SEED: &[u8] = b"points_mint";

#[cfg(feature = "localnet")]
declare_id!("DYNpaq7XujscK29FYuQD5h8rGtxPAwNPYiB8vbuQe4R7");

#[cfg(not(feature = "localnet"))]
declare_id!("ALY2aGdTPNKLn3SnMgQsznyuYHFV7NFnZt6vHHqQhYd8");

#[program]
pub mod onchain_xyber_points {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, new_admin: Pubkey, new_minter: Pubkey) -> Result<()> {
        instructions::initialize(ctx, new_admin, new_minter)
    }

    pub fn mint_points(ctx: Context<MintPoints>, amount: u64) -> Result<()> {
        instructions::mint_points(ctx, amount)
    }
}
