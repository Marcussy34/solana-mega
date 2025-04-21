use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{self, Mint, Token, TokenAccount, Transfer},
};

// Update with the actual deployed Program ID
declare_id!("7LeARRwbauXQ1W4Cr22ZEyPUVP5wHqYijXvkvPaVpguP");

pub const USER_SEED: &[u8] = b"user";
pub const VAULT_SEED: &[u8] = b"vault";

#[program]
pub mod skillstreak_program {
    use super::*;

    pub fn initialize_user(
        ctx: Context<InitializeUser>,
        deposit_amount: u64,
        lock_in_duration_days: u64,
    ) -> Result<()> {
        msg!("Initializing user account for: {}", ctx.accounts.user.key());

        let user_state = &mut ctx.accounts.user_state;
        user_state.user = ctx.accounts.user.key();
        user_state.deposit_amount = deposit_amount;
        user_state.initial_deposit_amount = deposit_amount;
        user_state.current_streak = 0;
        user_state.miss_count = 0;
        user_state.last_task_timestamp = 0;

        let clock = Clock::get()?;
        let current_timestamp = clock.unix_timestamp;
        user_state.deposit_timestamp = current_timestamp;
        let lock_in_seconds = lock_in_duration_days.checked_mul(24 * 60 * 60).unwrap();
        user_state.lock_in_end_timestamp = current_timestamp.checked_add(lock_in_seconds as i64).unwrap();

        msg!("User: {}", user_state.user);
        msg!("Deposit Amount: {}", user_state.deposit_amount);
        msg!("Lock-in Duration (days): {}", lock_in_duration_days);
        msg!("Lock-in Ends At: {}", user_state.lock_in_end_timestamp);

        let cpi_accounts = Transfer {
            from: ctx.accounts.user_token_account.to_account_info(),
            to: ctx.accounts.vault_token_account.to_account_info(),
            authority: ctx.accounts.user.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::transfer(cpi_ctx, deposit_amount)?;

        msg!("Deposited {} USDC.", deposit_amount);
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(deposit_amount: u64, lock_in_duration_days: u64)]
pub struct InitializeUser<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut,
        constraint = user_token_account.mint == usdc_mint.key(),
        constraint = user_token_account.owner == user.key()
    )]
    pub user_token_account: Account<'info, TokenAccount>,

    #[account(
        init,
        payer = user,
        space = 8 + UserState::INIT_SPACE,
        seeds = [USER_SEED, user.key().as_ref()],
        bump
    )]
    pub user_state: Account<'info, UserState>,

    #[account(
        init_if_needed,
        payer = user,
        associated_token::mint = usdc_mint,
        associated_token::authority = vault
    )]
    pub vault_token_account: Account<'info, TokenAccount>,

    /// CHECK: This PDA is safe because it's only used as a signing authority
    /// for the vault token account ATA. We don't read/write data from it.
    #[account(
        seeds = [VAULT_SEED],
        bump
    )]
    pub vault: AccountInfo<'info>,

    pub usdc_mint: Account<'info, Mint>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}

#[account]
#[derive(InitSpace)]
pub struct UserState {
    pub user: Pubkey,
    pub deposit_amount: u64,
    pub initial_deposit_amount: u64,
    pub current_streak: u64,
    pub miss_count: u64,
    pub deposit_timestamp: i64,
    pub last_task_timestamp: i64,
    pub lock_in_end_timestamp: i64,
}
