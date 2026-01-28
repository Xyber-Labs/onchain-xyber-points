use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_2022::mint_to,
    token_interface::{Mint, MintTo, Token2022, TokenAccount},
};

use crate::{
    errors::ErrorCode,
    instructions::initialize::Config,
    state::{Nonce, NONCE_SEED},
    POINTS_MINT_SEED, SEED_ROOT,
};

#[event]
pub struct PointsMinted {
    pub recipient: Pubkey,
    pub amount: u64,
    pub mint: Pubkey,
    pub nonce: u64,
}

#[derive(Accounts)]
#[instruction(amount: u64, nonce: u64)]
pub struct MintPoints<'info> {
    #[account(mut, address = config.minter @ ErrorCode::Unauthorized)]
    pub authority: Signer<'info>,

    #[account(seeds = [SEED_ROOT, b"config"], bump)]
    pub config: Account<'info, Config>,

    #[account(mut, seeds = [SEED_ROOT, NONCE_SEED], bump)]
    pub nonce: Account<'info, Nonce>,

    #[account(
        mut, seeds = [SEED_ROOT, POINTS_MINT_SEED], bump,
        address = config.points_mint @ ErrorCode::InvalidMintAuthority
    )]
    pub points_mint: InterfaceAccount<'info, Mint>,

    /// CHECK: Can be any account that will receive points
    pub recipient: UncheckedAccount<'info>,

    #[account(
        init_if_needed,
        payer = authority,
        associated_token::mint = points_mint,
        associated_token::authority = recipient,
        associated_token::token_program = token_program
    )]
    pub recipient_ata: InterfaceAccount<'info, TokenAccount>,

    pub token_program: Program<'info, Token2022>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

pub fn mint_points(ctx: Context<MintPoints>, amount: u64, nonce: u64) -> Result<()> {
    require!(ctx.accounts.nonce.value == nonce, ErrorCode::InvalidNonce);

    let signer_seeds: &[&[&[u8]]] = &[&[SEED_ROOT, POINTS_MINT_SEED, &[ctx.bumps.points_mint]]];

    mint_to(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            MintTo {
                mint: ctx.accounts.points_mint.to_account_info(),
                to: ctx.accounts.recipient_ata.to_account_info(),
                authority: ctx.accounts.points_mint.to_account_info(),
            },
            signer_seeds,
        ),
        amount,
    )?;

    ctx.accounts.nonce.value += 1;

    emit!(PointsMinted {
        recipient: ctx.accounts.recipient.key(),
        amount,
        mint: ctx.accounts.points_mint.key(),
        nonce,
    });

    Ok(())
}
