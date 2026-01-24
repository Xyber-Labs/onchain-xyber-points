use anchor_lang::prelude::*;
use anchor_spl::token_interface::{Mint, Token2022};

use crate::{
    errors::ErrorCode,
    state::{Nonce, NONCE_SEED},
    DEPLOYER, POINTS_MINT_SEED, SEED_ROOT,
};

#[constant]
pub const CONFIG_SEED: &[u8] = b"config";

const POINTS_MINT_DECIMALS: u8 = 0;

#[account]
#[derive(InitSpace)]
pub struct Config {
    pub admin: Pubkey,
    pub minter: Pubkey,
    pub points_mint: Pubkey,
}

#[event]
pub struct Initialized {
    pub admin: Pubkey,
    pub minter: Pubkey,
    pub points_mint: Pubkey,
}

#[derive(Accounts)]
#[instruction(new_admin: Pubkey, new_minter: Pubkey)]
pub struct Initialize<'info> {
    #[account(
        mut,
        constraint = config.admin == Pubkey::default() && authority.key() == DEPLOYER ||
                     config.admin == authority.key() @ ErrorCode::Unauthorized,
        constraint = new_admin != Pubkey::default() @ ErrorCode::InvalidAdmin,
        constraint = new_minter != Pubkey::default() @ ErrorCode::InvalidAdmin
    )]
    pub authority: Signer<'info>,

    #[account(
        init_if_needed, payer = authority, space = 8 + Config::INIT_SPACE,
        seeds = [SEED_ROOT, CONFIG_SEED], bump
    )]
    pub config: Account<'info, Config>,

    #[account(
        init_if_needed, payer = authority, space = 8 + Nonce::INIT_SPACE,
        seeds = [SEED_ROOT, NONCE_SEED], bump
    )]
    pub nonce: Account<'info, Nonce>,

    #[account(
        init_if_needed, payer = authority,
        seeds = [SEED_ROOT, POINTS_MINT_SEED], bump,
        mint::decimals = POINTS_MINT_DECIMALS,
        mint::authority = points_mint,
        mint::freeze_authority = points_mint,
        mint::token_program = token_program,
    )]
    pub points_mint: InterfaceAccount<'info, Mint>,

    pub token_program: Program<'info, Token2022>,
    pub system_program: Program<'info, System>,
}

pub fn initialize(ctx: Context<Initialize>, new_admin: Pubkey, new_minter: Pubkey) -> Result<()> {
    ctx.accounts.config.admin = new_admin;
    ctx.accounts.config.minter = new_minter;
    ctx.accounts.config.points_mint = ctx.accounts.points_mint.key();
    let config = &ctx.accounts.config;
    emit!(Initialized {
        admin: config.admin,
        minter: config.minter,
        points_mint: config.points_mint,
    });
    Ok(())
}
