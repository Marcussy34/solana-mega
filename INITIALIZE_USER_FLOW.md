# SkillStreak `initialize_user` Flow: High-Level Overview

This document explains what happens when a user clicks "Initialize User" on the frontend, interacting with the SkillStreak smart contract.

## Purpose

The main goals are to:
1.  Officially register the user's wallet with the SkillStreak protocol.
2.  Securely receive the user's initial USDC deposit.
3.  Set up the agreed-upon lock-in period for that deposit.
4.  Create a personalized on-chain record (`UserState`) for the user to track their deposit and progress.

## What the Frontend Does

1.  **Gets User Choices:** Asks the user how much USDC they want to deposit and for how many days they want to lock it in.
2.  **Identifies Accounts:** Figures out the necessary addresses on the blockchain:
    *   The unique address where this user's SkillStreak data will be stored.
    *   The address of the program's central vault for holding deposits.
    *   The user's own USDC token account.
    *   The program's vault token account.
3.  **Checks User's Token Account:** Makes sure the user actually has a USDC token account set up. If not, it creates one first.
4.  **Prepares the Request:** Bundles the user's choices (deposit amount, lock-in days) and the necessary account addresses into a request for the smart contract.
5.  **Sends the Request:** Asks the user's connected wallet (e.g., Phantom) to approve and send the request (as a transaction) to the SkillStreak smart contract on the Solana blockchain.
6.  **Waits for Confirmation:** Listens for the Solana network to confirm that the transaction was successfully processed.
7.  **Shows Result:** Updates the logs and displays the transaction signature.

## What the Smart Contract Does

1.  **Receives Request:** Gets the transaction sent by the frontend.
2.  **Verifies Request:** Checks that the request comes from the correct user and involves the right accounts (user's token account, program vault, etc.). Anchor framework helps automate much of this verification.
3.  **Creates User Record:** Creates the dedicated `UserState` account on the blockchain, linked to the user's wallet address. This uses a program-controlled address (PDA) derived from the user's public key.
4.  **Initializes Vault Account (if needed):** If this is the first deposit ever, it sets up the program's main USDC vault token account.
5.  **Stores User Data:** Saves the key information into the new `UserState` record:
    *   The user's wallet address.
    *   The amount of USDC deposited.
    *   The timestamp when the deposit was made.
    *   The timestamp when the lock-in period ends.
    *   Initial values for tracking progress (like streak count = 0).
6.  **Transfers Deposit:** Securely moves the specified USDC amount from the user's token account directly into the program's vault token account.
7.  **Confirms Success:** Signals back that the initialization process completed successfully.

## End Result

After this flow finishes successfully:
*   The user is officially registered within the SkillStreak protocol.
*   Their initial USDC deposit is safely held in the program's vault.
*   An on-chain `UserState` account exists, tracking their specific deposit details and lock-in time.
*   The user is ready to use other SkillStreak features. 