# SkillStreak Anchor Program - Next Development Steps

This document outlines the planned implementation phases for the core SkillStreak Solana program (`skillstreak_program`).

---

## Phase 1: Core Deposit & Withdrawal Functionality

**Goal:** Allow users to deposit funds into the platform, and later withdraw them according to maturity rules.

1. **Implement `deposit` Instruction (Already Done):**
   * Allows users to deposit tokens without starting the lock-in or streak yet.
   * Initializes `user_state.deposit_amount`, but leaves `lock_in_end_timestamp = 0` and `initial_deposit_amount = 0`.

2. **Add `start_course` Instruction:**
   * **Instruction:** `fn start_course(ctx: Context<StartCourse>, lock_in_duration_days: u64) -> Result<()>`
   * **Accounts (`StartCourse` struct):**
     * `user: Signer<'info>`
     * `user_state: Account<'info, UserState>` (mut)
   * **Logic:**
     * Only allowed if `lock_in_end_timestamp == 0` (i.e., lock-in hasn't started yet).
     * Set `initial_deposit_amount = deposit_amount`
     * Set `deposit_timestamp = now`
     * Set `lock_in_end_timestamp = now + lock_in_duration_days * seconds`
     * Set `last_task_timestamp = now` (starts streak timer)
     * Reset `current_streak` and `miss_count` to 0

3. **Implement `withdraw` Instruction:**
   * **Instruction:** `fn withdraw(ctx: Context<Withdraw>) -> Result<()>`
   * **Accounts:** `user`, `user_state`, `vault_token_account`, etc.
   * **Logic:**
     * Validate lock-in has ended (`now >= lock_in_end_timestamp`)
     * Transfer `deposit_amount + accrued_yield` back to user
     * Reset or close user state

4. **Implement `early_withdraw` Instruction:**
   * **Instruction:** `fn early_withdraw(ctx: Context<EarlyWithdraw>) -> Result<()>`
   * **Accounts:** Same as `withdraw`, plus `treasury_token_account`
   * **Logic:**
     * Enforce lock-in is still active
     * Transfer 50% penalty to treasury, rest to user
     * Reset or close user state
     * Emit `EarlyWithdrawEvent`

5. **Add `accrued_yield` Field:**
   * Track earned yield in `UserState`. Initially 0.

---

## Phase 2: Streak & Task Tracking

**Goal:** Track user task completion streaks once a course has started.

1. **Implement `record_task` Instruction:**
   * **Instruction:** `fn record_task(ctx: Context<RecordTask>) -> Result<()>`
   * **Accounts:** `user`, `user_state`
   * **Logic:**
     * Use `Clock::get()?.unix_timestamp`
     * If `last_task_timestamp != 0`, validate window (e.g., 24–36 hours)
     * If valid: update `last_task_timestamp`, increment `current_streak`
     * If missed window: return error or let `record_miss` handle it

---

## Phase 3: Penalty Buffer & Miss Handling

**Goal:** Penalize users for missing tasks based on their miss count and deposit size.

1. **Refine `UserState` to Support Penalties:**
   * Optionally add `penalty_buffer: u64`
   * Set `initial_deposit_amount` in `start_course`
   * Track streak-dependent deductions without draining full deposit immediately

2. **Implement `record_miss` Instruction:**
   * **Instruction:** `fn record_miss(ctx: Context<RecordMiss>) -> Result<()>`
   * **Accounts:** `authority`, `user_state`, possibly treasury/vault
   * **Logic:**
     * Increment `miss_count`, reset `current_streak`
     * For miss counts 1–3:
       * Deduct 10/20/30% of `initial_deposit_amount`
       * Use `penalty_buffer` first, then fallback to `deposit_amount`
       * Transfer penalty portion to `treasury_token_account`
     * For 4+:
       * Heavier deduction (20–30%)
       * Possibly reduce APR by updating `apr_multiplier` field

---

## Phase 4: Yield Generation & Simulation

**Goal:** Support basic yield accumulation and simulate future DeFi integration.

1. **Simulate Yield via `distribute_yield` Instruction:**
   * Called by authority
   * Adds a fixed amount to `user_state.accrued_yield` for testing

2. **Prepare for DeFi Integration (Future):**
   * Scaffold instructions for:
     * `deposit_to_kamino`
     * `withdraw_from_kamino`
     * `harvest_kamino_yield`
   * Create `VaultState` to hold external position metadata

---

## Phase 5: Off-Chain Automation & Cron Jobs

**Goal:** Enable time-based checks and penalty enforcement via off-chain triggers.

1. **Implement `daily_check`:**
   * Callable by Cron/Snowflake
   * Verifies whether user missed their streak window
   * Calls `record_miss` if applicable

2. **Implement `harvest_and_distribute`:**
   * Periodically harvests yield from DeFi protocols
   * Updates internal accounting or distributes yield proportionally

---

## Phase 6: Final Refinements & Testing

**Goal:** Harden the program for safety, clarity, and maintainability.

1. **Safe Math Everywhere:**
   * Use `checked_add`, `checked_sub`, `checked_mul` to avoid overflows

2. **Define Detailed Error Codes:**
   * Add custom `ErrorCode` variants:
     * `CourseAlreadyStarted`
     * `TaskTooEarly`
     * `TaskTooLate`
     * `InsufficientPenaltyBuffer`, etc.

3. **Improve Documentation:**
   * Add inline comments explaining each field and logic path

4. **Write Integration Tests:**
   * Validate all major flows: deposit, start, streak, miss, early withdraw, full withdraw

---

✅ With this revised structure, your protocol supports:
- Delayed course start
- True streak-based accountability
- Time-window enforcement
- Financial penalties for inconsistency
