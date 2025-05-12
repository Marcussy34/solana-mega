use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{self, Mint, Token, TokenAccount, Transfer},
};
use anchor_lang::system_program;

// Update with the actual deployed Program ID
declare_id!("7LeARRwbauXQ1W4Cr22ZEyPUVP5wHqYijXvkvPaVpguP");

pub const USER_SEED: &[u8] = b"user";
pub const VAULT_SEED: &[u8] = b"vault";
// New constants for betting markets
pub const MARKET_SEED: &[u8] = b"market";
pub const BET_SEED: &[u8] = b"bet";
pub const MARKET_ESCROW_VAULT_SEED: &[u8] = b"market_escrow_vault";
pub const DAILY_TASK_CYCLE_SECONDS: i64 = 24 * 60 * 60; // 24 hours
pub const RESOLUTION_GRACE_PERIOD_SECONDS: i64 = 5 * 60; // 5 minutes after task deadline
pub const DEFAULT_PLATFORM_FEE_BASIS_POINTS: u16 = 200; // 2.00%
// New constant for automatic market creation betting window
pub const DEFAULT_AUTO_MARKET_BETTING_WINDOW_SECONDS: u64 = 12 * 60 * 60; // 12 hours

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

    // --- Start Course Instruction (Phase 1) ---
    // Sets the initial deposit amount, lock-in period, and starts the streak timer.
    // This can only be called after a deposit has been made and before the course has started.
    // Also automatically creates a betting market for the user's first task.
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

        // --- 1. Update User State for Course Start ---
        user_state.initial_deposit_amount = user_state.deposit_amount;
        user_state.deposit_timestamp = current_timestamp;
        let lock_in_seconds = lock_in_duration_days
            .checked_mul(24 * 60 * 60) // seconds in a day
            .ok_or(ErrorCode::ArithmeticError)?;
        user_state.lock_in_end_timestamp = current_timestamp
            .checked_add(lock_in_seconds as i64)
            .ok_or(ErrorCode::ArithmeticError)?;
        // Set last task timestamp to now, starting the streak timer.
        // This is crucial for the first market's task_deadline.
        user_state.last_task_timestamp = current_timestamp;
        user_state.current_streak = 0; // Streak starts at 0, first task completion increments it
        user_state.miss_count = 0;

        msg!("Course started successfully for user state.");
        msg!("  Initial Deposit Locked: {}", user_state.initial_deposit_amount);
        msg!("  Lock-in Ends At: {}", user_state.lock_in_end_timestamp);
        msg!("  Streak Timer Started At (Last Task Timestamp): {}", user_state.last_task_timestamp);

        // --- 2. Automatically Create Betting Market ---
        msg!("Automatically creating betting market for user: {}", ctx.accounts.user.key());

        let market_state = &mut ctx.accounts.market_state;
        market_state.market_creator = ctx.accounts.user.key(); // User starting course is the creator
        market_state.user_being_bet_on = ctx.accounts.user.key(); // Bet on the user starting course
        market_state.user_state_account_for_bet = user_state.key(); // Use the existing user_state borrow to get the key
        market_state.total_long_amount = 0;
        market_state.total_short_amount = 0;
        market_state.market_creation_timestamp = current_timestamp;

        // Task deadline for the *first* task.
        // user_state.last_task_timestamp was just set to current_timestamp.
        // So, the first task cycle ends 24 hours from this point.
        let first_task_deadline_timestamp = user_state.last_task_timestamp
            .checked_add(DAILY_TASK_CYCLE_SECONDS)
            .ok_or(ErrorCode::ArithmeticError)?;
        market_state.task_deadline_timestamp = first_task_deadline_timestamp;

        // Calculate betting ends timestamp
        let proposed_betting_ends_timestamp = current_timestamp
            .checked_add(DEFAULT_AUTO_MARKET_BETTING_WINDOW_SECONDS as i64)
            .ok_or(ErrorCode::ArithmeticError)?;

        // Ensure betting ends strictly before the first task deadline
        if proposed_betting_ends_timestamp >= first_task_deadline_timestamp {
            // This means DEFAULT_AUTO_MARKET_BETTING_WINDOW_SECONDS is too long.
            return err!(ErrorCode::BettingWindowTooLong);
        }
        market_state.betting_ends_timestamp = proposed_betting_ends_timestamp;
        
        market_state.resolution_timestamp = market_state.task_deadline_timestamp
            .checked_add(RESOLUTION_GRACE_PERIOD_SECONDS)
            .ok_or(ErrorCode::ArithmeticError)?;
        
        market_state.status = MarketStatus::Open;
        market_state.platform_fee_basis_points = DEFAULT_PLATFORM_FEE_BASIS_POINTS;
        market_state.platform_fee_claimed = false;
        market_state.bump = ctx.bumps.market_state; // Anchor handles assigning this from PDA derivation

        // Initialize market_escrow_vault state
        let market_escrow_vault = &mut ctx.accounts.market_escrow_vault;
        market_escrow_vault.market = market_state.key();
        market_escrow_vault.bump = ctx.bumps.market_escrow_vault; // Anchor handles assigning this

        emit!(MarketCreated {
            market: market_state.key(),
            user_being_bet_on: market_state.user_being_bet_on,
            task_deadline_timestamp: market_state.task_deadline_timestamp,
            betting_ends_timestamp: market_state.betting_ends_timestamp,
        });

        msg!("Market {} automatically created for user {}.", market_state.key(), market_state.user_being_bet_on);
        msg!(" Betting ends at: {}", market_state.betting_ends_timestamp);
        msg!(" Task deadline (first task) at: {}", market_state.task_deadline_timestamp);
        msg!(" Resolution possible from: {}", market_state.resolution_timestamp);

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

        // Close market accounts
        let dest_starting_lamports = ctx.accounts.user.lamports();
        let market_state_lamports = ctx.accounts.market_state.to_account_info().lamports();
        let market_escrow_lamports = ctx.accounts.market_escrow_vault.to_account_info().lamports();
        
        **ctx.accounts.user.lamports.borrow_mut() = dest_starting_lamports
            .checked_add(market_state_lamports)
            .ok_or(ErrorCode::ArithmeticError)?
            .checked_add(market_escrow_lamports)
            .ok_or(ErrorCode::ArithmeticError)?;

        // Zero out both accounts' lamports and data
        **ctx.accounts.market_state.to_account_info().lamports.borrow_mut() = 0;
        **ctx.accounts.market_escrow_vault.to_account_info().lamports.borrow_mut() = 0;
        ctx.accounts.market_state.to_account_info().data.borrow_mut().fill(0);
        ctx.accounts.market_escrow_vault.to_account_info().data.borrow_mut().fill(0);

        msg!("Early withdrawal completed:");
        msg!("  Penalty sent to treasury wallet: {}", penalty_amount);
        msg!("  Amount returned to user: {}", return_amount);
        msg!("  Market accounts closed successfully");
        
        Ok(())
    }

    // Add new close_market instruction
    pub fn close_market(ctx: Context<CloseMarket>) -> Result<()> {
        // Verify the market belongs to the user
        if ctx.accounts.market_state.user_being_bet_on != ctx.accounts.user.key() {
            return err!(ErrorCode::MarketBelongsToAnotherUser);
        }

        // Transfer lamports from market state back to the user
        let dest_starting_lamports = ctx.accounts.user.lamports();
        let market_state_lamports = ctx.accounts.market_state.to_account_info().lamports();
        let market_escrow_lamports = ctx.accounts.market_escrow_vault.to_account_info().lamports();
        
        **ctx.accounts.user.lamports.borrow_mut() = dest_starting_lamports
            .checked_add(market_state_lamports)
            .ok_or(ErrorCode::ArithmeticError)?
            .checked_add(market_escrow_lamports)
            .ok_or(ErrorCode::ArithmeticError)?;

        // Zero out both accounts' lamports and data
        **ctx.accounts.market_state.to_account_info().lamports.borrow_mut() = 0;
        **ctx.accounts.market_escrow_vault.to_account_info().lamports.borrow_mut() = 0;
        ctx.accounts.market_state.to_account_info().data.borrow_mut().fill(0);
        ctx.accounts.market_escrow_vault.to_account_info().data.borrow_mut().fill(0);

        msg!("Market state and escrow vault accounts closed successfully");
        Ok(())
    }

    // --- Long/Short Streak Betting System ---

    pub fn create_market(
        ctx: Context<CreateMarket>,
        betting_window_duration_seconds: u64,
        // platform_fee_basis_points: u16, // Using default for now
    ) -> Result<()> {
        let clock = Clock::get()?;
        let market_creator = ctx.accounts.market_creator.key();
        let user_being_bet_on = ctx.accounts.user_being_bet_on.key();
        let user_state_for_bet = &ctx.accounts.user_state_for_bet;

        msg!("Creating market for user: {}", user_being_bet_on);
        msg!("Market creator: {}", market_creator);

        // Validate user_state_for_bet actually belongs to user_being_bet_on
        if user_state_for_bet.user != user_being_bet_on {
            return err!(ErrorCode::UserStateMismatch);
        }
        // Validate user has started the course
        if user_state_for_bet.lock_in_end_timestamp == 0 || user_state_for_bet.deposit_timestamp == 0 {
            return err!(ErrorCode::UserCourseNotStarted);
        }

        let market_state = &mut ctx.accounts.market_state;
        market_state.market_creator = market_creator;
        market_state.user_being_bet_on = user_being_bet_on;
        market_state.user_state_account_for_bet = user_state_for_bet.key();
        market_state.total_long_amount = 0;
        market_state.total_short_amount = 0;
        market_state.market_creation_timestamp = clock.unix_timestamp;
        market_state.betting_ends_timestamp = clock.unix_timestamp
            .checked_add(betting_window_duration_seconds as i64)
            .ok_or(ErrorCode::ArithmeticError)?;
        
        // Market is for the current task cycle. Deadline is last_task_timestamp + 24h.
        // If last_task_timestamp is deposit_timestamp (first task), this is correct.
        market_state.task_deadline_timestamp = user_state_for_bet.last_task_timestamp
            .checked_add(DAILY_TASK_CYCLE_SECONDS)
            .ok_or(ErrorCode::ArithmeticError)?;

        // Ensure betting ends before task deadline
        if market_state.betting_ends_timestamp >= market_state.task_deadline_timestamp {
            return err!(ErrorCode::BettingWindowTooLong);
        }

        market_state.resolution_timestamp = market_state.task_deadline_timestamp
            .checked_add(RESOLUTION_GRACE_PERIOD_SECONDS)
            .ok_or(ErrorCode::ArithmeticError)?;
        
        market_state.status = MarketStatus::Open;
        market_state.platform_fee_basis_points = DEFAULT_PLATFORM_FEE_BASIS_POINTS;
        market_state.platform_fee_claimed = false;
        market_state.bump = ctx.bumps.market_state;

        let market_escrow_vault = &mut ctx.accounts.market_escrow_vault;
        market_escrow_vault.market = market_state.key();
        market_escrow_vault.bump = ctx.bumps.market_escrow_vault;
        
        emit!(MarketCreated {
            market: market_state.key(),
            user_being_bet_on,
            task_deadline_timestamp: market_state.task_deadline_timestamp,
            betting_ends_timestamp: market_state.betting_ends_timestamp,
        });

        msg!("Market {} created for user {}.", market_state.key(), user_being_bet_on);
        msg!(" Betting ends at: {}", market_state.betting_ends_timestamp);
        msg!(" Task deadline at: {}", market_state.task_deadline_timestamp);
        msg!(" Resolution possible from: {}", market_state.resolution_timestamp);
        Ok(())
    }

    pub fn place_bet(
        ctx: Context<PlaceBet>,
        amount: u64,
        position_is_long: bool,
    ) -> Result<()> {
        let clock = Clock::get()?;
        let market_state = &mut ctx.accounts.market_state;
        let bettor = ctx.accounts.bettor.key();

        msg!("Placing bet for market: {}", market_state.key());
        msg!(" Bettor: {}, Amount: {}, IsLong: {}", bettor, amount, position_is_long);

        // Validations
        if market_state.status != MarketStatus::Open {
            return err!(ErrorCode::MarketNotOpenForBets);
        }
        if clock.unix_timestamp >= market_state.betting_ends_timestamp {
            return err!(ErrorCode::BettingWindowClosed);
        }
        if amount == 0 {
            return err!(ErrorCode::ZeroBetAmount);
        }
        // Prevent user from betting on their own streak (optional, can be removed)
        if bettor == market_state.user_being_bet_on {
            return err!(ErrorCode::CannotBetOnSelf);
        }

        // Transfer funds
        let cpi_accounts = Transfer {
            from: ctx.accounts.bettor_token_account.to_account_info(),
            to: ctx.accounts.market_escrow_token_account.to_account_info(),
            authority: ctx.accounts.bettor.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        token::transfer(CpiContext::new(cpi_program, cpi_accounts), amount)?;

        // Update market state
        if position_is_long {
            market_state.total_long_amount = market_state.total_long_amount
                .checked_add(amount)
                .ok_or(ErrorCode::ArithmeticError)?;
        } else {
            market_state.total_short_amount = market_state.total_short_amount
                .checked_add(amount)
                .ok_or(ErrorCode::ArithmeticError)?;
        }

        // Initialize bet state
        let bet_state = &mut ctx.accounts.bet_state;
        bet_state.market = market_state.key();
        bet_state.bettor = bettor;
        bet_state.amount = amount;
        bet_state.position_is_long = position_is_long;
        bet_state.winnings_claimed = false;
        bet_state.bump = ctx.bumps.bet_state;

        emit!(BetPlaced {
            market: market_state.key(),
            bettor,
            amount,
            position_is_long,
        });
        msg!("Bet placed successfully.");
        Ok(())
    }

    pub fn trigger_market_resolution(ctx: Context<TriggerMarketResolution>) -> Result<()> {
        let clock = Clock::get()?;
        let market_state = &mut ctx.accounts.market_state;
        let user_state_for_bet = &ctx.accounts.user_state_for_bet;
        
        msg!("Attempting to resolve market: {}", market_state.key());

        // Ensure user state account matches the one set at market creation
        if user_state_for_bet.key() != market_state.user_state_account_for_bet {
            return err!(ErrorCode::UserStateMismatch);
        }
         // Ensure user_state_for_bet.user is the one being bet on
        if user_state_for_bet.user != market_state.user_being_bet_on {
            return err!(ErrorCode::UserStateMismatch);
        }


        if market_state.status == MarketStatus::Open && clock.unix_timestamp >= market_state.betting_ends_timestamp {
            // Betting window has just closed, but resolution not yet possible
            market_state.status = MarketStatus::AwaitingResolution;
            msg!("Market status changed to AwaitingResolution.");
            // No further action until resolution_timestamp is reached
            return Ok(()); 
        }
        
        if market_state.status != MarketStatus::AwaitingResolution {
            if market_state.status == MarketStatus::ResolvedLongsWin || market_state.status == MarketStatus::ResolvedShortsWin {
                 return err!(ErrorCode::MarketAlreadyResolved);
            }
             // If still Open but betting window not closed, or some other state
            return err!(ErrorCode::MarketNotReadyForResolution);
        }

        // Now, status must be AwaitingResolution
        if clock.unix_timestamp < market_state.resolution_timestamp {
            return err!(ErrorCode::ResolutionGracePeriodNotOver);
        }
        
        // Determine outcome
        // The task was for the cycle ending at market_state.task_deadline_timestamp.
        // The user needed to complete a task with timestamp:
        // (task_deadline - 24h) < last_task_timestamp <= task_deadline
        let relevant_task_window_start = market_state.task_deadline_timestamp
            .checked_sub(DAILY_TASK_CYCLE_SECONDS)
            .ok_or(ErrorCode::ArithmeticError)?;

        let user_completed_task_in_time = user_state_for_bet.last_task_timestamp > relevant_task_window_start &&
                                          user_state_for_bet.last_task_timestamp <= market_state.task_deadline_timestamp;

        if user_completed_task_in_time {
            market_state.status = MarketStatus::ResolvedLongsWin;
            msg!("Market resolved: Longs Win.");
        } else {
            market_state.status = MarketStatus::ResolvedShortsWin;
            msg!("Market resolved: Shorts Win.");
        }

        // Platform Fee Transfer (only if not already claimed and there's a pool)
        if !market_state.platform_fee_claimed {
            let total_pool = market_state.total_long_amount
                .checked_add(market_state.total_short_amount)
                .ok_or(ErrorCode::ArithmeticError)?;

            if total_pool > 0 {
                let platform_fee = total_pool
                    .checked_mul(market_state.platform_fee_basis_points as u64)
                    .ok_or(ErrorCode::ArithmeticError)?
                    .checked_div(10000)
                    .ok_or(ErrorCode::ArithmeticError)?;

                if platform_fee > 0 {
                    msg!("Transferring platform fee: {}", platform_fee);
                    let market_key = market_state.key();
                    let seeds = &[
                        MARKET_ESCROW_VAULT_SEED,
                        market_key.as_ref(),
                        &[ctx.accounts.market_escrow_vault.bump],
                    ];
                    let signer = &[&seeds[..]];

                    let cpi_accounts = Transfer {
                        from: ctx.accounts.market_escrow_token_account.to_account_info(),
                        to: ctx.accounts.treasury_token_account.to_account_info(),
                        authority: ctx.accounts.market_escrow_vault.to_account_info(),
                    };
                    let cpi_program = ctx.accounts.token_program.to_account_info();
                    let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
                    token::transfer(cpi_ctx, platform_fee)?;
                    msg!("Platform fee {} transferred to treasury.", platform_fee);
                }
            }
            market_state.platform_fee_claimed = true;
        }
        
        emit!(MarketResolved {
            market: market_state.key(),
            status: market_state.status.clone(),
            total_long_amount: market_state.total_long_amount,
            total_short_amount: market_state.total_short_amount,
        });

        Ok(())
    }

    pub fn claim_winnings(ctx: Context<ClaimWinnings>) -> Result<()> {
        let market_state = &ctx.accounts.market_state;
        let bet_state = &mut ctx.accounts.bet_state;
        let bettor = ctx.accounts.bettor.key();

        msg!("Attempting to claim winnings for bettor {} on market {}", bettor, market_state.key());

        // Validations
        if bet_state.bettor != bettor {
            return err!(ErrorCode::BetBelongsToAnotherUser);
        }
        if bet_state.winnings_claimed {
            return err!(ErrorCode::WinningsAlreadyClaimed);
        }
        if !market_state.platform_fee_claimed {
             // Safety check, should be claimed during resolution
            return err!(ErrorCode::PlatformFeeNotClaimed);
        }

        let mut payout_amount: u64 = 0;
        let total_pool = market_state.total_long_amount
            .checked_add(market_state.total_short_amount)
            .ok_or(ErrorCode::ArithmeticError)?;
        
        // Recalculate platform fee taken to find net pool (as it might be 0 if total_pool was small)
        let platform_fee_actually_taken = if total_pool > 0 {
            total_pool
                .checked_mul(market_state.platform_fee_basis_points as u64)
                .ok_or(ErrorCode::ArithmeticError)?
                .checked_div(10000)
                .ok_or(ErrorCode::ArithmeticError)?
        } else {
            0
        };

        let net_pool_for_distribution = total_pool
            .checked_sub(platform_fee_actually_taken)
            .ok_or(ErrorCode::ArithmeticError)?;

        if market_state.status == MarketStatus::ResolvedLongsWin && bet_state.position_is_long {
            if market_state.total_long_amount > 0 {
                payout_amount = bet_state.amount
                    .checked_mul(net_pool_for_distribution)
                    .ok_or(ErrorCode::ArithmeticError)?
                    .checked_div(market_state.total_long_amount)
                    .ok_or(ErrorCode::ArithmeticError)?;
                msg!("Longs won. Payout calculated: {}", payout_amount);
            } else {
                msg!("Longs won, but no longs placed. No payout for this bet.");
            }
        } else if market_state.status == MarketStatus::ResolvedShortsWin && !bet_state.position_is_long {
            if market_state.total_short_amount > 0 {
                payout_amount = bet_state.amount
                    .checked_mul(net_pool_for_distribution)
                    .ok_or(ErrorCode::ArithmeticError)?
                    .checked_div(market_state.total_short_amount)
                    .ok_or(ErrorCode::ArithmeticError)?;
                msg!("Shorts won. Payout calculated: {}", payout_amount);
            } else {
                 msg!("Shorts won, but no shorts placed. No payout for this bet.");
            }
        } else {
            // Bet did not win
            msg!("Bet did not win. No payout.");
            // Mark as claimed even if no payout to prevent re-attempts
            bet_state.winnings_claimed = true; 
            return Ok(());
        }

        if payout_amount > 0 {
            msg!("Transferring winnings: {}", payout_amount);
            let market_key = market_state.key();
            let seeds = &[
                MARKET_ESCROW_VAULT_SEED,
                market_key.as_ref(),
                &[ctx.accounts.market_escrow_vault.bump],
            ];
            let signer = &[&seeds[..]];

            let cpi_accounts = Transfer {
                from: ctx.accounts.market_escrow_token_account.to_account_info(),
                to: ctx.accounts.bettor_token_account.to_account_info(),
                authority: ctx.accounts.market_escrow_vault.to_account_info(),
            };
            let cpi_program = ctx.accounts.token_program.to_account_info();
            let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
            token::transfer(cpi_ctx, payout_amount)?;
            msg!("Winnings {} transferred to bettor.", payout_amount);
        } else {
            msg!("Calculated payout is zero.");
        }
        
        bet_state.winnings_claimed = true;

        emit!(WinningsClaimed {
            market: market_state.key(),
            bettor,
            amount_claimed: payout_amount,
        });
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

    // Betting System Errors
    #[msg("Market is not open for betting.")]
    MarketNotOpenForBets,
    #[msg("Betting window for this market has closed.")]
    BettingWindowClosed,
    #[msg("Bet amount cannot be zero.")]
    ZeroBetAmount,
    #[msg("User cannot bet on their own streak.")]
    CannotBetOnSelf,
    #[msg("Market is not ready for resolution.")]
    MarketNotReadyForResolution,
    #[msg("Resolution grace period for this market is not over yet.")]
    ResolutionGracePeriodNotOver,
    #[msg("Market has already been resolved.")]
    MarketAlreadyResolved,
    #[msg("This bet belongs to another user.")]
    BetBelongsToAnotherUser,
    #[msg("Winnings for this bet have already been claimed.")]
    WinningsAlreadyClaimed,
    #[msg("Platform fee has not been claimed yet; market resolution might be incomplete.")]
    PlatformFeeNotClaimed,
    #[msg("The UserState account provided does not match the one associated with the market or user.")]
    UserStateMismatch,
    #[msg("The user being bet on has not started their course yet.")]
    UserCourseNotStarted,
    #[msg("The betting window duration extends beyond or too close to the task deadline.")]
    BettingWindowTooLong,
    #[msg("This market belongs to another user.")]
    MarketBelongsToAnotherUser,
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
    pub treasury_wallet_account: AccountInfo<'info>,

    // Add market accounts for closing
    #[account(
        mut,
        seeds = [
            MARKET_SEED,
            user.key().as_ref(),
            user_state.key().as_ref()
        ],
        bump,
        constraint = market_state.user_being_bet_on == user.key()
    )]
    pub market_state: Account<'info, MarketState>,

    #[account(
        mut,
        seeds = [MARKET_ESCROW_VAULT_SEED, market_state.key().as_ref()],
        bump
    )]
    pub market_escrow_vault: Account<'info, MarketEscrowVault>,

    pub usdc_mint: Account<'info, Mint>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub rent: Sysvar<'info, Rent>,
}

// --- Start Course Accounts Struct (Phase 1) ---
// Defines the accounts needed for the start_course instruction.
// This now also includes accounts for automatic market creation.
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

    // --- Accounts for automatic market creation ---
    #[account(
        init_if_needed,
        payer = user, // User pays for market state creation
        space = 8 + MarketState::INIT_SPACE,
        seeds = [
            MARKET_SEED,
            user.key().as_ref(),      // user_being_bet_on is the one starting the course (user)
            user_state.key().as_ref() // user_state_account_for_bet is their user_state
        ],
        bump
    )]
    pub market_state: Account<'info, MarketState>,

    #[account(
        init_if_needed,
        payer = user, // User pays for market escrow vault creation
        space = 8 + MarketEscrowVault::INIT_SPACE,
        seeds = [MARKET_ESCROW_VAULT_SEED, market_state.key().as_ref()], // market_state.key() is now available
        bump
    )]
    pub market_escrow_vault: Account<'info, MarketEscrowVault>,

    #[account(
        init_if_needed,
        payer = user, // User pays for ATA creation
        associated_token::mint = usdc_mint,
        associated_token::authority = market_escrow_vault, // market_escrow_vault PDA is the authority
    )]
    pub market_escrow_token_account: Account<'info, TokenAccount>,

    // Common accounts needed for initialization of market-related accounts
    #[account(mut)] // Marked as mut for consistency with CreateMarket, ATA init might require it.
    pub usdc_mint: Account<'info, Mint>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub rent: Sysvar<'info, Rent>,
}

// --- Betting System Structs and Enums ---

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, InitSpace)]
pub enum MarketStatus {
    Open,              // Betting is active
    AwaitingResolution,// Betting closed, outcome not yet determined by contract
    ResolvedLongsWin,  // User maintained streak, longs win
    ResolvedShortsWin, // User broke streak, shorts win
    Cancelled,         // Optional: If market needs to be voided for some reason
}

impl Default for MarketStatus {
    fn default() -> Self {
        MarketStatus::Open
    }
}

#[account]
#[derive(InitSpace)]
pub struct MarketState {
    pub market_creator: Pubkey,          // Who initiated this market
    pub user_being_bet_on: Pubkey,       // The user whose streak is the subject of the bet
    pub user_state_account_for_bet: Pubkey, // PDA of UserState for user_being_bet_on (to check outcome)
    
    pub total_long_amount: u64,          // Total USDC staked on "long"
    pub total_short_amount: u64,         // Total USDC staked on "short"
    
    pub market_creation_timestamp: i64,  // When this market was created
    pub betting_ends_timestamp: i64,     // Betting stops
    pub task_deadline_timestamp: i64,    // The specific task deadline for the user_being_bet_on this market refers to
    pub resolution_timestamp: i64,       // When outcome can be checked (task_deadline_timestamp + grace period)
    
    pub status: MarketStatus,
    pub platform_fee_basis_points: u16,  // e.g., 500 for 5.00% (500 / 10000)
    pub platform_fee_claimed: bool,      // Has the platform fee been transferred to treasury?

    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct BetState {
    pub market: Pubkey,             // PDA of the MarketState this bet belongs to
    pub bettor: Pubkey,             // User who placed the bet
    pub amount: u64,                // Amount of USDC bet
    pub position_is_long: bool,     // True if "long", false if "short"
    pub winnings_claimed: bool,     // True if winnings (if any) have been claimed
    pub bump: u8,
}

// PDA to act as authority for the market's escrow token account
#[account]
#[derive(InitSpace)]
pub struct MarketEscrowVault {
    pub market: Pubkey, // Links vault to the MarketState PDA
    pub bump: u8,
}


// --- Betting System Account Contexts ---

#[derive(Accounts)]
#[instruction(betting_window_duration_seconds: u64)]
pub struct CreateMarket<'info> {
    #[account(mut)]
    pub market_creator: Signer<'info>,

    /// CHECK: No sensitive ops, just storing its key and using for PDA derivation if needed.
    pub user_being_bet_on: AccountInfo<'info>, 
    
    pub user_state_for_bet: Account<'info, UserState>,

    #[account(
        init,
        payer = market_creator,
        space = 8 + MarketState::INIT_SPACE,
        seeds = [
            MARKET_SEED, 
            user_being_bet_on.key().as_ref(), 
            user_state_for_bet.key().as_ref() // Use UserState PDA key as part of the seed
        ],
        bump
    )]
    pub market_state: Account<'info, MarketState>,

    #[account(
        init,
        payer = market_creator,
        space = 8 + MarketEscrowVault::INIT_SPACE,
        seeds = [MARKET_ESCROW_VAULT_SEED, market_state.key().as_ref()],
        bump
    )]
    pub market_escrow_vault: Account<'info, MarketEscrowVault>,

    #[account(
        init,
        payer = market_creator,
        associated_token::mint = usdc_mint,
        associated_token::authority = market_escrow_vault, // market_escrow_vault PDA is the authority for this ATA
    )]
    pub market_escrow_token_account: Account<'info, TokenAccount>,
    
    #[account(mut)] // For ATA initialization potentially
    pub usdc_mint: Account<'info, Mint>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
#[instruction(amount: u64, position_is_long: bool)]
pub struct PlaceBet<'info> {
    #[account(mut)]
    pub bettor: Signer<'info>,

    #[account(
        mut,
        // Validate market_state PDA using its own stored fields that were used as seeds
        seeds = [
            MARKET_SEED, 
            market_state.user_being_bet_on.as_ref(),
            market_state.user_state_account_for_bet.as_ref()
        ],
        bump = market_state.bump
    )]
    pub market_state: Account<'info, MarketState>,

    #[account(
        mut,
        seeds = [MARKET_ESCROW_VAULT_SEED, market_state.key().as_ref()],
        bump = market_escrow_vault.bump, // market_escrow_vault stores its own bump
    )]
    pub market_escrow_vault: Account<'info, MarketEscrowVault>,

    #[account(
        mut,
        associated_token::mint = usdc_mint,
        associated_token::authority = market_escrow_vault,
    )]
    pub market_escrow_token_account: Account<'info, TokenAccount>,

    #[account(mut)] // Bettor's USDC account
    pub bettor_token_account: Account<'info, TokenAccount>,

    #[account(
        init,
        payer = bettor,
        space = 8 + BetState::INIT_SPACE,
        seeds = [BET_SEED, market_state.key().as_ref(), bettor.key().as_ref()],
        bump
    )]
    pub bet_state: Account<'info, BetState>,
    
    #[account(mut)]
    pub usdc_mint: Account<'info, Mint>, // Though mint itself isn't mutated, ATA init might need it.
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    // No AssociatedToken program needed here as market_escrow_token_account already exists.
}

#[derive(Accounts)]
pub struct TriggerMarketResolution<'info> {
    #[account(mut)] // Caller needs to be mutable if paying for treasury_token_account init
    pub caller: Signer<'info>,

    #[account(
        mut,
        seeds = [
            MARKET_SEED,
            market_state.user_being_bet_on.as_ref(),
            market_state.user_state_account_for_bet.as_ref()
        ],
        bump = market_state.bump
    )]
    pub market_state: Account<'info, MarketState>,

    // UserState account of the user whose streak was bet on.
    // Used to determine the outcome.
    #[account(
        // Constraint: user_state_for_bet.key() == market_state.user_state_account_for_bet (checked in logic)
        // Constraint: user_state_for_bet.user == market_state.user_being_bet_on (checked in logic)
    )]
    pub user_state_for_bet: Account<'info, UserState>,

    #[account(
        mut, // For transferring fee out
        seeds = [MARKET_ESCROW_VAULT_SEED, market_state.key().as_ref()],
        bump = market_escrow_vault.bump,
    )]
    pub market_escrow_vault: Account<'info, MarketEscrowVault>,

    #[account(
        mut,
        associated_token::mint = usdc_mint,
        associated_token::authority = market_escrow_vault,
    )]
    pub market_escrow_token_account: Account<'info, TokenAccount>,

    // Treasury's token account to receive platform fees
    #[account(
        init_if_needed, // Treasury ATA might not exist yet
        payer = caller, // Caller pays for init if needed
        associated_token::mint = usdc_mint,
        associated_token::authority = treasury_wallet_account, // Treasury wallet is authority
    )]
    pub treasury_token_account: Account<'info, TokenAccount>,
    
    /// CHECK: Treasury wallet pubkey, constrained by treasury_wallet()
    #[account(address = treasury_wallet())]
    pub treasury_wallet_account: AccountInfo<'info>,

    #[account(mut)]
    pub usdc_mint: Account<'info, Mint>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>, // For init_if_needed
    pub associated_token_program: Program<'info, AssociatedToken>, // For init_if_needed
    pub rent: Sysvar<'info, Rent>, // For init_if_needed
}

#[derive(Accounts)]
pub struct ClaimWinnings<'info> {
    #[account(mut)]
    pub bettor: Signer<'info>,

    #[account(
        seeds = [
            MARKET_SEED,
            market_state.user_being_bet_on.as_ref(),
            market_state.user_state_account_for_bet.as_ref()
        ],
        bump = market_state.bump
    )]
    pub market_state: Account<'info, MarketState>,

    #[account(
        mut,
        seeds = [BET_SEED, market_state.key().as_ref(), bettor.key().as_ref()],
        bump = bet_state.bump, // bet_state stores its own bump
        constraint = bet_state.bettor == bettor.key(), // Ensure bettor owns this bet_state
        constraint = bet_state.market == market_state.key(), // Ensure bet_state is for this market
    )]
    pub bet_state: Account<'info, BetState>,

    #[account(
        mut,
        seeds = [MARKET_ESCROW_VAULT_SEED, market_state.key().as_ref()],
        bump = market_escrow_vault.bump,
    )]
    pub market_escrow_vault: Account<'info, MarketEscrowVault>,

    #[account(
        mut,
        associated_token::mint = usdc_mint,
        associated_token::authority = market_escrow_vault,
    )]
    pub market_escrow_token_account: Account<'info, TokenAccount>,

    #[account(
        mut, // To receive winnings
        constraint = bettor_token_account.mint == usdc_mint.key(),
        constraint = bettor_token_account.owner == bettor.key()
    )]
    pub bettor_token_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub usdc_mint: Account<'info, Mint>,
    pub token_program: Program<'info, Token>,
}


// --- Event Structs for Betting ---

#[event]
pub struct MarketCreated {
    pub market: Pubkey,
    pub user_being_bet_on: Pubkey,
    pub task_deadline_timestamp: i64,
    pub betting_ends_timestamp: i64,
}

#[event]
pub struct BetPlaced {
    pub market: Pubkey,
    pub bettor: Pubkey,
    pub amount: u64,
    pub position_is_long: bool,
}

#[event]
pub struct MarketResolved {
    pub market: Pubkey,
    pub status: MarketStatus, // So off-chain can see outcome
    pub total_long_amount: u64,
    pub total_short_amount: u64,
}

#[event]
pub struct WinningsClaimed {
    pub market: Pubkey,
    pub bettor: Pubkey,
    pub amount_claimed: u64,
}

// Add new CloseMarket context
#[derive(Accounts)]
pub struct CloseMarket<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut,
        seeds = [
            MARKET_SEED,
            user.key().as_ref(),
            user_state.key().as_ref()
        ],
        bump = market_state.bump,
        constraint = market_state.user_being_bet_on == user.key()
    )]
    pub market_state: Account<'info, MarketState>,

    #[account(
        mut,
        seeds = [MARKET_ESCROW_VAULT_SEED, market_state.key().as_ref()],
        bump
    )]
    pub market_escrow_vault: Account<'info, MarketEscrowVault>,

    #[account(
        seeds = [USER_SEED, user.key().as_ref()],
        bump,
        constraint = user_state.user == user.key()
    )]
    pub user_state: Account<'info, UserState>,

    pub system_program: Program<'info, System>,
}
