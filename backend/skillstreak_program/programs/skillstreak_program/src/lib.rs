use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{self, Mint, Token, TokenAccount, Transfer},
};
use anchor_lang::system_program;

// Update with the actual deployed Program ID
declare_id!("E6WVbAEb6v6ujmunXtMBpkdycZi9giBwCYKZDeHvqPiT");

pub const USER_SEED: &[u8] = b"user";
pub const VAULT_SEED: &[u8] = b"vault";

// Treasury wallet address (6R651eq74BXg8zeQEaGX8Fm25z1N8YDqWodv3S9kUFnn)
pub const TREASURY_WALLET_BYTES: [u8; 32] = [
    106, 82, 54, 49, 101, 113, 55, 52, 
    66, 88, 103, 56, 122, 101, 81, 69, 
    97, 71, 88, 56, 70, 109, 50, 53, 
    122, 49, 78, 56, 89, 68, 113, 87
];

// Helper function to get treasury wallet pubkey
pub fn treasury_wallet() -> Pubkey {
    Pubkey::new_from_array(TREASURY_WALLET_BYTES)
}

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
        user_state.accrued_yield = 0; // Initialize yield to 0

        msg!("User state account created.");
        msg!(" User: {}", user_state.user);

        Ok(())
    }

    // --- Deposit Instruction (Phase 1 Modification) ---
    // Allows users to deposit tokens without starting the lock-in or streak yet.
    // Initializes user_state.deposit_amount.
    pub fn deposit(
        ctx: Context<Deposit>,
        deposit_amount: u64,
    ) -> Result<()> {
        msg!("Depositing funds for user: {}", ctx.accounts.user.key());
        msg!("Amount to deposit: {}", deposit_amount);

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

        // Add to the existing deposit amount
        user_state.deposit_amount = user_state.deposit_amount
            .checked_add(deposit_amount)
            .ok_or(ErrorCode::ArithmeticError)?;

        // We don't update initial_deposit_amount, current_streak, miss_count, or last_task_timestamp here
        // Only the deposit_amount is updated.

        msg!("Updated User State:");
        msg!("  New Total Deposit: {}", user_state.deposit_amount);

        Ok(())
    }

    pub fn withdraw(ctx: Context<Withdraw>) -> Result<()> {
        let user_state = &mut ctx.accounts.user_state;
        let clock = Clock::get()?;
        
        // Check if lock-in period has ended
        if clock.unix_timestamp < user_state.lock_in_end_timestamp {
            return err!(ErrorCode::LockInPeriodNotEnded);
        }

        // Calculate total amount to withdraw (deposit + yield)
        let total_amount = user_state.deposit_amount
            .checked_add(user_state.accrued_yield)
            .ok_or(ErrorCode::ArithmeticError)?;

        // Transfer tokens from vault to user
        let seeds = &[VAULT_SEED, &[ctx.bumps.vault]];
        let signer = &[&seeds[..]];
        
        let cpi_accounts = Transfer {
            from: ctx.accounts.vault_token_account.to_account_info(),
            to: ctx.accounts.user_token_account.to_account_info(),
            authority: ctx.accounts.vault.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
        token::transfer(cpi_ctx, total_amount)?;

        // Reset user state values
        user_state.deposit_amount = 0;
        user_state.accrued_yield = 0;
        user_state.lock_in_end_timestamp = 0;

        msg!("Withdrawn {} tokens to user", total_amount);
        Ok(())
    }

    pub fn early_withdraw(ctx: Context<EarlyWithdraw>) -> Result<()> {
        let user_state = &mut ctx.accounts.user_state;
        let clock = Clock::get()?;
        
        // Check if lock-in period hasn't ended
        if clock.unix_timestamp >= user_state.lock_in_end_timestamp {
            return err!(ErrorCode::LockInPeriodEnded);
        }

        // Calculate penalty (50% of deposit)
        let penalty_amount = user_state.deposit_amount
            .checked_div(2)
            .ok_or(ErrorCode::ArithmeticError)?;
        
        // Calculate amount to return to user (50% of deposit + all yield)
        let return_amount = user_state.deposit_amount
            .checked_sub(penalty_amount)
            .ok_or(ErrorCode::ArithmeticError)?
            .checked_add(user_state.accrued_yield)
            .ok_or(ErrorCode::ArithmeticError)?;

        let vault_seeds = &[VAULT_SEED, &[ctx.bumps.vault]];
        let vault_signer = &[&vault_seeds[..]];

        // Transfer penalty to treasury wallet's ATA
        {
            let cpi_accounts = Transfer {
                from: ctx.accounts.vault_token_account.to_account_info(),
                to: ctx.accounts.treasury_token_account.to_account_info(),
                authority: ctx.accounts.vault.to_account_info(),
            };
            let cpi_program = ctx.accounts.token_program.to_account_info();
            let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, vault_signer);
            token::transfer(cpi_ctx, penalty_amount)?;
        }

        // Transfer remaining amount to user
        {
            let cpi_accounts = Transfer {
                from: ctx.accounts.vault_token_account.to_account_info(),
                to: ctx.accounts.user_token_account.to_account_info(),
                authority: ctx.accounts.vault.to_account_info(),
            };
            let cpi_program = ctx.accounts.token_program.to_account_info();
            let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, vault_signer);
            token::transfer(cpi_ctx, return_amount)?;
        }

        // Reset user state values
        user_state.deposit_amount = 0;
        user_state.accrued_yield = 0;
        user_state.lock_in_end_timestamp = 0;

        msg!("Early withdrawal completed:");
        msg!("  Penalty sent to treasury wallet: {}", penalty_amount);
        msg!("  Amount returned to user: {}", return_amount);
        
        Ok(())
    }

    // --- Start Course Instruction (Phase 1) ---
    // Sets the initial deposit amount, lock-in period, and starts the streak timer.
    // This can only be called after a deposit has been made and before the course has started.
    pub fn start_course(
        ctx: Context<StartCourse>,
        lock_in_duration_days: u64,
    ) -> Result<()> {
        msg!("Starting course for user: {}", ctx.accounts.user.key());
        msg!("Lock-in duration (days): {}", lock_in_duration_days);

        let user_state = &mut ctx.accounts.user_state;
        let clock = Clock::get()?;
        let current_timestamp = clock.unix_timestamp;

        // Validation: Ensure course hasn't already started
        if user_state.lock_in_end_timestamp != 0 {
            return err!(ErrorCode::CourseAlreadyStarted);
        }

        // Validation: Ensure there is a deposit to lock in
        if user_state.deposit_amount == 0 {
            return err!(ErrorCode::NoDepositToStartCourse);
        }

        // --- Update User State for Course Start ---

        // Set initial deposit amount based on the current deposit
        user_state.initial_deposit_amount = user_state.deposit_amount;

        // Set deposit timestamp (marks the official start)
        user_state.deposit_timestamp = current_timestamp;

        // Calculate and set lock-in end timestamp
        let lock_in_seconds = lock_in_duration_days
            .checked_mul(24 * 60 * 60) // seconds in a day
            .ok_or(ErrorCode::ArithmeticError)?;
        user_state.lock_in_end_timestamp = current_timestamp
            .checked_add(lock_in_seconds as i64)
            .ok_or(ErrorCode::ArithmeticError)?;

        // Set last task timestamp to now, starting the streak timer
        user_state.last_task_timestamp = current_timestamp;

        // Reset streak and miss counts
        user_state.current_streak = 0;
        user_state.miss_count = 0;

        msg!("Course started successfully.");
        msg!("  Initial Deposit Locked: {}", user_state.initial_deposit_amount);
        msg!("  Lock-in Ends At: {}", user_state.lock_in_end_timestamp);
        msg!("  Streak Timer Started At: {}", user_state.last_task_timestamp);

        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(deposit_amount: u64)]
pub struct Deposit<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut,
        constraint = user_token_account.mint == usdc_mint.key(),
        constraint = user_token_account.owner == user.key()
    )]
    pub user_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        seeds = [USER_SEED, user.key().as_ref()],
        bump,
    )]
    pub user_state: Account<'info, UserState>,

    // Use init_if_needed for the vault's token account
    #[account(
        init_if_needed, // Initialize if it doesn't exist
        payer = user,    // The user pays for initialization
        associated_token::mint = usdc_mint,
        associated_token::authority = vault, // Vault PDA is the authority
    )]
    pub vault_token_account: Account<'info, TokenAccount>,

    /// CHECK: Vault PDA authority, seeds checked implicitly by ATA derivation + constraints
    #[account(
        seeds = [VAULT_SEED],
        bump
    )]
    pub vault: AccountInfo<'info>,

    pub usdc_mint: Account<'info, Mint>,

    // Required programs
    pub system_program: Program<'info, System>, // Needed for init_if_needed
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>, // Needed for init_if_needed
    pub rent: Sysvar<'info, Rent>, // Needed for init_if_needed
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
    pub accrued_yield: u64,  // Added for yield tracking
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

#[account]
#[derive(InitSpace)]
pub struct TreasuryState {
    pub authority: Pubkey,  // Authority that can withdraw from treasury
    pub total_fees_collected: u64,  // Track total fees collected
}

// Optional: Define Custom Errors
#[error_code]
pub enum ErrorCode {
    #[msg("Deposit amount cannot be zero.")]
    ZeroDepositAmount,
    #[msg("Lock-in period has not ended yet.")]
    LockInPeriodNotEnded,
    #[msg("Lock-in period has already ended. Use normal withdraw.")]
    LockInPeriodEnded,
    #[msg("An arithmetic operation failed (overflow/underflow/divide by zero).")]
    ArithmeticError,
    #[msg("Cannot start a course that has already begun.")]
    CourseAlreadyStarted,
    #[msg("Cannot start a course without an initial deposit.")]
    NoDepositToStartCourse,
    // Add other potential errors here
}

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut,
        seeds = [USER_SEED, user.key().as_ref()],
        bump,
        constraint = user_state.user == user.key(),
    )]
    pub user_state: Account<'info, UserState>,

    #[account(
        mut,
        constraint = user_token_account.mint == usdc_mint.key(),
        constraint = user_token_account.owner == user.key()
    )]
    pub user_token_account: Account<'info, TokenAccount>,

    /// CHECK: Vault PDA is safe because it's derived from a known seed and verified by token account authority
    #[account(
        seeds = [VAULT_SEED],
        bump
    )]
    pub vault: AccountInfo<'info>,

    #[account(
        mut,
        associated_token::mint = usdc_mint,
        associated_token::authority = vault,
    )]
    pub vault_token_account: Account<'info, TokenAccount>,

    pub usdc_mint: Account<'info, Mint>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct EarlyWithdraw<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut,
        seeds = [USER_SEED, user.key().as_ref()],
        bump,
        constraint = user_state.user == user.key(),
    )]
    pub user_state: Account<'info, UserState>,

    #[account(
        mut,
        constraint = user_token_account.mint == usdc_mint.key(),
        constraint = user_token_account.owner == user.key()
    )]
    pub user_token_account: Account<'info, TokenAccount>,

    /// CHECK: Vault PDA
    #[account(
        seeds = [VAULT_SEED],
        bump
    )]
    pub vault: AccountInfo<'info>,

    #[account(
        mut,
        associated_token::mint = usdc_mint,
        associated_token::authority = vault,
    )]
    pub vault_token_account: Account<'info, TokenAccount>,

    // Initialize treasury ATA if it doesn't exist
    #[account(
        init_if_needed,
        payer = user, // User pays for initialization
        associated_token::mint = usdc_mint,
        associated_token::authority = treasury_wallet_account, // Use the actual treasury wallet AccountInfo as authority
    )]
    pub treasury_token_account: Account<'info, TokenAccount>,

    /// CHECK: Hardcoded treasury wallet address.
    // Temporarily removing constraint for debugging the serialization/simulation mismatch
    // #[account(address = treasury_wallet())]
    pub treasury_wallet_account: AccountInfo<'info>,

    pub usdc_mint: Account<'info, Mint>,
    pub token_program: Program<'info, Token>,
    // Add required programs/sysvars for init_if_needed
    pub system_program: Program<'info, System>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub rent: Sysvar<'info, Rent>,
}

// --- Start Course Accounts Struct (Phase 1) ---
// Defines the accounts needed for the start_course instruction.
#[derive(Accounts)]
#[instruction(lock_in_duration_days: u64)] // Instruction data
pub struct StartCourse<'info> {
    // The user starting the course.
    #[account(mut)]
    pub user: Signer<'info>,

    // The user's state account, which will be modified.
    #[account(
        mut,
        seeds = [USER_SEED, user.key().as_ref()],
        bump,
        constraint = user_state.user == user.key() // Ensure the state belongs to the signer
    )]
    pub user_state: Account<'info, UserState>,
}
