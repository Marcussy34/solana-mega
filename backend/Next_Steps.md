# SkillStreak Anchor Program - Next Development Steps

This document outlines the planned implementation phases for the core SkillStreak Solana program (`skillstreak_program`).

## Phase 1: Core Withdrawal Functionality

**Goal:** Allow users to retrieve their deposited funds according to the rules (maturity or early exit).

1.  **Define `TreasuryState` Account:**
    *   Create a simple state account (likely a PDA using a `TREASURY_SEED`) to hold collected fees. Initially, it might just store the authority or be an empty account associated with a token account.
    *   Define a corresponding `TreasuryTokenAccount` (ATA) associated with the `Treasury` PDA to hold USDC fees.

2.  **Implement `withdraw` Instruction:**
    *   **Instruction:** `fn withdraw(ctx: Context<Withdraw>) -> Result<()>`
    *   **Accounts (`Withdraw` struct):**
        *   `user: Signer<'info>`
        *   `user_state: Account<'info, UserState>` (mut)
        *   `user_token_account: Account<'info, TokenAccount>` (mut)
        *   `vault: AccountInfo<'info>` (vault PDA, needed for signing)
        *   `vault_token_account: Account<'info, TokenAccount>` (mut)
        *   `usdc_mint: Account<'info, Mint>`
        *   `token_program: Program<'info, Token>`
    *   **Logic:**
        *   Check `user_state.lock_in_end_timestamp` against `Clock::get()?.unix_timestamp`. Fail if not matured.
        *   Calculate amount to return (`user_state.deposit_amount` + `user_state.accrued_yield` - initially yield is 0).
        *   Perform CPI `token::transfer` from `vault_token_account` to `user_token_account`. Requires PDA signer seeds (`VAULT_SEED`).
        *   Optionally: Close the `user_state` account (`close = user`) or reset its values.

3.  **Implement `early_withdraw` Instruction:**
    *   **Instruction:** `fn early_withdraw(ctx: Context<EarlyWithdraw>) -> Result<()>`
    *   **Accounts (`EarlyWithdraw` struct):** Similar to `Withdraw`, but add:
        *   `treasury_pda: AccountInfo<'info>` (Treasury PDA)
        *   `treasury_token_account: Account<'info, TokenAccount>` (mut, Treasury's ATA)
    *   **Logic:**
        *   Check if the lock-in period *hasn't* ended. Fail if it has (user should use `withdraw`).
        *   Calculate the 5% early exit fee based on `user_state.deposit_amount`.
        *   Perform CPI `token::transfer` for the fee amount from `vault_token_account` to `treasury_token_account` (using Vault PDA signer).
        *   Calculate remaining amount (`deposit_amount` + `accrued_yield` - fee).
        *   Perform CPI `token::transfer` for the remaining amount from `vault_token_account` to `user_token_account` (using Vault PDA signer).
        *   Optionally: Close or reset `user_state`.

4.  **Add `accrued_yield` Field:**
    *   Add `pub accrued_yield: u64` to the `UserState` struct. Initialize to 0 in `create_user_state`.

## Phase 2: Streak & Task Tracking

**Goal:** Implement the core mechanism for users to maintain their streaks.

1.  **Implement `record_task` Instruction:**
    *   **Instruction:** `fn record_task(ctx: Context<RecordTask>) -> Result<()>`
    *   **Accounts (`RecordTask` struct):**
        *   `user: Signer<'info>`
        *   `user_state: Account<'info, UserState>` (mut)
    *   **Logic:**
        *   Get `current_timestamp = Clock::get()?.unix_timestamp`.
        *   Check if `current_timestamp` is within the allowed window since `user_state.last_task_timestamp` (e.g., within 24-36 hours, depending on exact rules). Fail if too early or too late.
        *   Update `user_state.last_task_timestamp = current_timestamp`.
        *   Increment `user_state.current_streak`.
        *   Optional: Reset `user_state.miss_count` if rules dictate.

## Phase 3: Penalty Buffer & Application

**Goal:** Implement the penalty mechanism for missing tasks.

1.  **Refine `UserState` for Penalties:**
    *   Decide how to track the penalty buffer. Options:
        *   Add `pub penalty_buffer: u64` to `UserState`. Requires adjusting `deposit` to split funds.
        *   Calculate buffer availability dynamically based on `deposit_amount` and `miss_count` when a penalty occurs. (Simpler state, more complex logic).
    *   Ensure `initial_deposit_amount` is set correctly during the *first* deposit, perhaps by adding a check in `deposit` or a separate `initialize_deposit` instruction. This is needed for percentage calculations.

2.  **Implement `record_miss` Instruction (or integrate into daily check):**
    *   **Instruction:** `fn record_miss(ctx: Context<RecordMiss>) -> Result<()>` (Could be invoked by an off-chain service).
    *   **Accounts (`RecordMiss` struct):**
        *   `authority: Signer<'info>` (Could be a trusted off-chain service key or the user themselves if self-reporting)
        *   `user_state: Account<'info, UserState>` (mut)
        *   Maybe `treasury_pda`, `treasury_token_account` if penalties involve immediate transfers.
        *   Maybe `vault`, `vault_token_account` if deducting principal.
    *   **Logic:**
        *   Increment `user_state.miss_count`.
        *   Reset `user_state.current_streak` to 0.
        *   Based on the new `miss_count`:
            *   **Misses 1-3:** Calculate top-up percentage (10%, 20%, 30%) of `initial_deposit_amount`. Determine if buffer is sufficient or if principal deduction is needed. Update `deposit_amount` (decrease for penalty, increase for user's share). Transfer treasury share (requires vault signing).
            *   **Misses 4+:** Calculate principal deduction (20-30%). Decrease `user_state.deposit_amount`. Transfer deduction to treasury (requires vault signing). Implement logic to halve APR multiplier (add `apr_multiplier: u64` field to `UserState`?).

## Phase 4: Yield Generation & Distribution (Simulation First)

**Goal:** Simulate or integrate actual yield generation.

1.  **Simulated Yield:**
    *   Implement a simple `distribute_yield` instruction (callable by an authority).
    *   Logic: Iterate through users (difficult on-chain) or have users claim yield. For MVP, maybe just add a fixed amount to `user_state.accrued_yield` for testing `withdraw`.

2.  **DeFi Integration (Future):**
    *   Add placeholder instructions/accounts for CPI calls (`deposit_to_kamino`, `withdraw_from_kamino`, `harvest_kamino_yield`).
    *   Integrate external SDKs/structs for target protocols.
    *   Implement logic to manage pooled funds and track protocol-specific positions/LP tokens within the vault's state (requires adding fields to a `VaultState` account).

## Phase 5: Off-Chain Integration Points

**Goal:** Define instructions specifically designed to be triggered by external schedulers.

1.  **`daily_check` Instruction:**
    *   Potentially combine task validation and miss recording.
    *   Called by Cron/Clockwork/Snowflake per user.
    *   Checks if `last_task_timestamp` is recent enough. If yes, do nothing or update state. If no, call `record_miss` logic internally.

2.  **`harvest_and_distribute` Instruction:**
    *   Called periodically by Cron/etc. (USE node-cron)
    *   Performs CPI calls to `harvest()` on integrated DeFi protocols.
    *   Updates internal `accrued_yield` tracking (maybe pool-based before distribution).

## Phase 6: Refinements & Error Handling

**Goal:** Improve robustness and clarity.

1.  **Robust Arithmetic:** Use `checked_add`, `checked_sub`, `checked_mul` consistently for all calculations involving user funds, timestamps, etc., returning custom errors on overflow.
2.  **Comprehensive Error Codes:** Define more specific `ErrorCode` variants for different failure conditions (e.g., `LockInNotEnded`, `InsufficientFundsForPenalty`, `TimestampError`, `ArithmeticOverflow`).
3.  **Code Comments:** Add detailed comments explaining the logic within instructions and the purpose of state fields.
4.  **Testing:** Write thorough integration tests (`tests/skillstreak_program.ts`) covering all instructions and edge cases.
