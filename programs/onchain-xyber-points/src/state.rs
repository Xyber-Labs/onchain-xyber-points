use anchor_lang::prelude::*;

#[constant]
pub const NONCE_SEED: &[u8] = b"nonce";

#[account]
#[derive(InitSpace)]
pub struct Nonce {
    pub value: u64,
}
