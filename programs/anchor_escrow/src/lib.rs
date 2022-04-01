use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{Mint, Token, TokenAccount},
};

declare_id!("iFdCVennyFeugXVSAnMRqCddURkiGGdSZj5kbh4frJE");

#[program]
pub mod anchor_escrow {
    use super::*;

    pub fn init_escrow(_ctx: Context<InitializeEscrow>) -> ProgramResult {
        Ok(())
    }

    pub fn submit(ctx: Context<Submit>, coin_amount: u64) -> ProgramResult {
        // Transfer FooCoin's from maker's/From FooCoin ATA to escrow.
        msg!("Submit Starting...");
        anchor_spl::token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                anchor_spl::token::Transfer {
                    from: ctx.accounts.from_assoc_token_acct.to_account_info(),
                    to: ctx.accounts.escrow_account.to_account_info(),
                    authority: ctx.accounts.from_account.to_account_info(),
                },
            ),
            coin_amount,
        )?;

        // If Coin amount is 65 then its ok otherwise return error
        if coin_amount != 65 {
            return Err(ErrorCode::AmountError.into());
        }

        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeEscrow<'info> {
    pub kaiju_coin_mint: Account<'info, Mint>,
    #[account(
        init,
        payer = payer,
        seeds = ["Kaiju1".as_ref()],
        bump,
        token::mint = kaiju_coin_mint,
        token::authority = escrow_account
    )]
    pub escrow_account: Account<'info, TokenAccount>,
    pub payer: Signer<'info>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct Submit<'info> {
    #[account(mut)]
    pub from_assoc_token_acct: Account<'info, TokenAccount>,
    #[account(mut)]
    pub escrow_account: Account<'info, TokenAccount>,
    pub from_account: Signer<'info>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[error]
pub enum ErrorCode {
    #[msg("Amount should be 65")]
    AmountError,
}
