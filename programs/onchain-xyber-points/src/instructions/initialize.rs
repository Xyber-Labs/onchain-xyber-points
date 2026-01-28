use anchor_lang::{
    prelude::*,
    system_program::{transfer, Transfer},
};
use anchor_spl::token_interface::{
    token_metadata_initialize, Mint, Token2022, TokenMetadataInitialize,
};
use spl_token_metadata_interface::state::TokenMetadata;

use crate::{errors::ErrorCode, DEPLOYER, POINTS_MINT_SEED, SEED_ROOT};

#[constant]
pub const CONFIG_SEED: &[u8] = b"config";

const POINTS_MINT_DECIMALS: u8 = 0;
const TOKEN_NAME: &str = "Onchain Xyber Points";
const TOKEN_SYMBOL: &str = "OXP";
const TOKEN_URI: &str = "https://app.xyber.inc/watchtower";

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
        init_if_needed, payer = authority,
        seeds = [SEED_ROOT, POINTS_MINT_SEED], bump,
        mint::decimals = POINTS_MINT_DECIMALS,
        mint::authority = points_mint,
        mint::freeze_authority = points_mint,
        mint::token_program = token_program,
        extensions::metadata_pointer::authority = points_mint,
        extensions::metadata_pointer::metadata_address = points_mint,
    )]
    pub points_mint: InterfaceAccount<'info, Mint>,

    pub token_program: Program<'info, Token2022>,
    pub system_program: Program<'info, System>,
}

pub fn initialize(ctx: Context<Initialize>, new_admin: Pubkey, new_minter: Pubkey) -> Result<()> {
    let is_first_init = ctx.accounts.config.admin == Pubkey::default();

    ctx.accounts.config.admin = new_admin;
    ctx.accounts.config.minter = new_minter;
    ctx.accounts.config.points_mint = ctx.accounts.points_mint.key();

    if is_first_init {
        initialize_token_metadata(&ctx)?;
    }

    let config = &ctx.accounts.config;
    emit!(Initialized {
        admin: config.admin,
        minter: config.minter,
        points_mint: config.points_mint,
    });
    Ok(())
}

fn initialize_token_metadata(ctx: &Context<Initialize>) -> Result<()> {
    let token_metadata = TokenMetadata {
        name: TOKEN_NAME.to_string(),
        symbol: TOKEN_SYMBOL.to_string(),
        uri: TOKEN_URI.to_string(),
        ..Default::default()
    };

    let data_len = token_metadata.tlv_size_of()?;
    let lamports = Rent::get()?.minimum_balance(data_len);

    transfer(
        CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            Transfer {
                from: ctx.accounts.authority.to_account_info(),
                to: ctx.accounts.points_mint.to_account_info(),
            },
        ),
        lamports,
    )?;

    let bump = ctx.bumps.points_mint;
    let signer_seeds: &[&[&[u8]]] = &[&[SEED_ROOT, POINTS_MINT_SEED, &[bump]]];

    token_metadata_initialize(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            TokenMetadataInitialize {
                program_id: ctx.accounts.token_program.to_account_info(),
                mint: ctx.accounts.points_mint.to_account_info(),
                metadata: ctx.accounts.points_mint.to_account_info(),
                mint_authority: ctx.accounts.points_mint.to_account_info(),
                update_authority: ctx.accounts.points_mint.to_account_info(),
            },
            signer_seeds,
        ),
        TOKEN_NAME.to_string(),
        TOKEN_SYMBOL.to_string(),
        TOKEN_URI.to_string(),
    )?;

    Ok(())
}
