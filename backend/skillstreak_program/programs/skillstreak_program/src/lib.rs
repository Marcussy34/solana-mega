use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{self, Mint, Token, TokenAccount, Transfer},
};

// Update with the actual deployed Program ID
declare_id!("yGBcgEFAAjnmNN479KeCk939BDTE1kuLAdbbWdpHMvp");

pub const USER_SEED: &[u8] = b"user";
pub const VAULT_SEED: &[u8] = b"vault";

#[program]
pub mod skillstreak_program {
    use super::*;

    // --- Create User State Instruction ---
    // Initializes the user state account with default values.
    // This does NOT handle deposits, that's done via the 'deposit' instruction.
    pub fn create_user_state(ctx: Context<CreateUserState>) -> Result<()> {
        msg!("Creating user state account for: {}", ctx.accounts.user.key());

        let user_state = &mut ctx.accounts.user_state;
        user_state.user = ctx.accounts.user.key();
        user_state.deposit_amount = 0;
        user_state.initial_deposit_amount = 0; // Set to 0 initially
        user_state.current_streak = 0;
        user_state.miss_count = 0;
        user_state.deposit_timestamp = 0; // No deposit yet
        user_state.last_task_timestamp = 0;
        user_state.lock_in_end_timestamp = 0; // No lock-in yet

        msg!("User state account created.");
        msg!(" User: {}", user_state.user);

        Ok(())
    }

    // --- Deposit Instruction (Renamed from Stake) ---
    pub fn deposit(
        ctx: Context<Deposit>,
        deposit_amount: u64,
        lock_in_duration_days: u64,
    ) -> Result<()> {
        msg!("Depositing funds for user: {}", ctx.accounts.user.key());
        msg!("Amount to deposit: {}", deposit_amount);
        msg!("New lock-in duration (days): {}", lock_in_duration_days);

        // Ensure deposit amount is greater than zero
        if deposit_amount == 0 {
            return err!(ErrorCode::ZeroDepositAmount);
        }

        // --- 1. Transfer Tokens --- 
        let cpi_accounts = Transfer {
            from: ctx.accounts.user_token_account.to_account_info(),
            to: ctx.accounts.vault_token_account.to_account_info(),
            authority: ctx.accounts.user.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::transfer(cpi_ctx, deposit_amount)?;
        msg!("Transferred {} USDC to vault.", deposit_amount);

        // --- 2. Update User State --- 
        let user_state = &mut ctx.accounts.user_state;
        let clock = Clock::get()?;
        let current_timestamp = clock.unix_timestamp;

        // Add to the existing deposit amount
        user_state.deposit_amount = user_state.deposit_amount.checked_add(deposit_amount).unwrap(); // Consider error handling for overflow

        // Update deposit timestamp
        user_state.deposit_timestamp = current_timestamp;

        // Calculate new lock-in end time based on current time + new duration
        let lock_in_seconds = lock_in_duration_days.checked_mul(24 * 60 * 60).unwrap(); // Consider error handling
        user_state.lock_in_end_timestamp = current_timestamp.checked_add(lock_in_seconds as i64).unwrap(); // Consider error handling

        // We don't update initial_deposit_amount, current_streak, miss_count, or last_task_timestamp here

        msg!("Updated User State:");
        msg!("  New Total Deposit: {}", user_state.deposit_amount);
        msg!("  New Lock-in Ends At: {}", user_state.lock_in_end_timestamp);

        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(deposit_amount: u64, lock_in_duration_days: u64)]
pub struct Deposit<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut, // User's token account balance will decrease
        constraint = user_token_account.mint == usdc_mint.key(),
        constraint = user_token_account.owner == user.key()
    )]
    pub user_token_account: Account<'info, TokenAccount>,

    #[account(
        mut, // We need to update the user's state
        seeds = [USER_SEED, user.key().as_ref()], // Ensure it matches the user signer
        bump, // Anchor will auto-find the bump
        // Optional: Add constraint to ensure user_state.user == user.key() if not implicitly covered by seeds
        // constraint = user_state.user == user.key(),
    )]
    pub user_state: Account<'info, UserState>,

    #[account(
        mut, // Vault's token account balance will increase
        associated_token::mint = usdc_mint,
        associated_token::authority = vault, // Ensure vault PDA is authority
    )]
    pub vault_token_account: Account<'info, TokenAccount>,

    /// CHECK: Vault PDA authority, seeds checked implicitly by ATA derivation + constraints
    #[account(
        seeds = [VAULT_SEED],
        bump
    )]
    pub vault: AccountInfo<'info>,

    // We need the mint account to validate the token accounts
    pub usdc_mint: Account<'info, Mint>,

    // Required programs
    pub system_program: Program<'info, System>, // Not strictly needed unless creating accounts, but good practice
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>, // Needed if ATAs might be created (though less likely here)
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

// --- Create User State Accounts Struct ---
// Defines accounts needed ONLY to create the UserState PDA.
#[derive(Accounts)]
pub struct CreateUserState<'info> {
    // The user who is initializing their state.
    #[account(mut)]
    pub user: Signer<'info>,

    // The UserState account being created.
    #[account(
        init, // This instruction initializes the account
        payer = user, // The user pays for the account creation
        space = 8 + UserState::INIT_SPACE, // Calculate space automatically
        seeds = [USER_SEED, user.key().as_ref()], // Derive PDA using user seed and user pubkey
        bump // Store the bump seed
    )]
    pub user_state: Account<'info, UserState>,

    // The Solana system program, required for account creation.
    pub system_program: Program<'info, System>,
}

// Optional: Define Custom Errors
#[error_code]
pub enum ErrorCode {
    #[msg("Deposit amount cannot be zero.")]
    ZeroDepositAmount,
    // Add other potential errors here
}
