use anchor_lang::error_code;

#[error_code]
pub enum ErrorCode {
    #[msg("Unauthorized: signer is not authorized")]
    Unauthorized,
    #[msg("Invalid admin: cannot set admin to default pubkey")]
    InvalidAdmin,
    #[msg("Invalid mint authority: mint_authority does not own the mint")]
    InvalidMintAuthority,
    #[msg("Invalid decimals: mint decimals do not match expected")]
    InvalidDecimals,
}
