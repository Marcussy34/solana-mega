the plan for the Solana backend (Anchor program) functions for SkillStreak. We'll build this incrementally:
Phase 1: Core User Account & Deposits
Goal: Allow users to create an account, deposit USDC, and set a lock-in period.
Accounts Needed:
UserState (PDA seeded by user's wallet): Stores user-specific data like deposit amount, streak info, lock-in time, etc.
Vault (PDA): Holds an Associated Token Account (ATA) for USDC to store all user deposits securely.
Instructions:
initialize_user(ctx, deposit_amount, lock_in_duration):
Creates the UserState account for the caller.
Initializes the account fields (streak=0, miss\count=0, timestamps, etc.).
Transfers the deposit_amount of USDC from the user's wallet to the program's Vault.
Phase 2: Streak Tracking & Task Completion
Goal: Allow users to mark a daily task as complete and update their streak accordingly.
Instructions:
complete_task(ctx):
Checks the user's UserState and the time since their last_task_timestamp.
If valid completion (within ~24-48 hours): Increments current_streak, updates last_task_timestamp.
If missed day (over ~48 hours): Resets current_streak to 0, increments miss_count, updates last_task_timestamp.
If first completion: Sets current_streak to 1, updates last_task_timestamp.
Phase 3: Penalty & Withdrawal System (MVP)
Goal: Handle penalties for missed days and allow users to withdraw funds.
Accounts Needed:
TreasuryVault (PDA): Holds an ATA for USDC to collect app fees/penalties.
Instructions:
handle_miss_topup(ctx, topup_amount):
Verifies the user has missed days (miss_count > 0).
Calculates the required penalty top-up based on miss_count.
Checks if topup_amount matches the requirement.
Transfers topup_amount USDC from the user to the program.
Splits the transferred amount: 50% added back to the user's deposit_amount in UserState, 50% transferred to the TreasuryVault.
Updates miss_count (e.g., decrements it or resets based on rules).
withdraw(ctx):
Checks if the lock-in period (lock_in_end_timestamp) has passed.
If finished: Transfers the full deposit_amount (plus any earned interest - TBD for MVP) from the Vault back to the user. Closes the UserState account.
If early: Calculates the 5% exit fee. Transfers 95% of deposit_amount to the user from the Vault. Transfers 5% fee to the TreasuryVault. Closes the UserState account.