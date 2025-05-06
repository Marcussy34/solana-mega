import React, { useState, useEffect } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import {
    Connection,
    PublicKey,
    SystemProgram,
    Transaction,
    // LAMPORTS_PER_SOL, // No longer needed here perhaps
} from '@solana/web3.js';
import {
    Program,
    AnchorProvider,
    web3,
    BN, // For handling u64 inputs
} from '@coral-xyz/anchor';
import {
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID,
    getAssociatedTokenAddressSync, // Use sync version for simplicity here
    // createAssociatedTokenAccountInstruction, // Likely not needed if ATAs handled by program
    // getAccount, // No longer checking user ATA here
} from '@solana/spl-token';

// Import the IDL from the lib directory
// Make sure this path is correct and the IDL is updated
import idl from '../lib/idl/skillstreak_program.json';

// --- Constants ---
const PROGRAM_ID = new PublicKey('E6WVbAEb6v6ujmunXtMBpkdycZi9giBwCYKZDeHvqPiT'); // Updated Program ID after deploy
const USDC_MINT = new PublicKey('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU'); // Updated Devnet USDC Mint
const TREASURY_WALLET = new PublicKey('6R651eq74BXg8zeQEaGX8Fm25z1N8YDqWodv3S9kUFnn'); // Treasury Wallet for early withdrawal penalty
const USER_SEED = Buffer.from("user");
const VAULT_SEED = Buffer.from("vault");

export default function TestPage() {
    const { connection } = useConnection();
    const { publicKey, sendTransaction, wallet } = useWallet();
    const [program, setProgram] = useState(null);
    // Renamed stake state variables to deposit
    const [depositAmount, setDepositAmount] = useState('0.5'); // Default 0.5 USDC for depositing
    // const [depositLockInDays, setDepositLockInDays] = useState('30'); // REMOVED: Lock-in handled by start_course now
    const [startCourseLockInDays, setStartCourseLockInDays] = useState('30'); // ADDED: State for start_course lock-in input
    const [logs, setLogs] = useState([]);
    const [txSig, setTxSig] = useState('');
    const [isLoading, setIsLoading] = useState(false); // Tracks loading for *any* transaction
    const [isClient, setIsClient] = useState(false);
    const [isUserInitialized, setIsUserInitialized] = useState(null); // null: checking, false: needs creation, true: exists/created
    const [userStatePDA, setUserStatePDA] = useState(null); // Store the PDA for potential future use
    // const [userDepositAmount, setUserDepositAmount] = useState(null); // REMOVED: Replaced by userStateDetails
    const [userStateDetails, setUserStateDetails] = useState(null); // ADDED: State to store the full fetched user state

    // Ensure component only renders UI that depends on client state after mounting
    useEffect(() => {
        setIsClient(true);
    }, []);

    // Log messages
    const log = (...args) => {
        console.log(...args);
        setLogs(prev => [...prev, args.map(arg => JSON.stringify(arg)).join(' ')]);
    };

    // Set up the Anchor program instance when wallet is connected
    useEffect(() => {
        // Add checks to ensure wallet and idl are ready
        if (publicKey && connection && wallet?.adapter && idl) {
            try {
                const provider = new AnchorProvider(connection, wallet.adapter, { commitment: "processed" });
                // Ensure idl is a valid object before creating Program
                if (typeof idl === 'object' && idl !== null) {
                    const prog = new Program(idl, provider);
                    setProgram(prog);
                    log('Program initialized.');
                } else {
                    log('Error: Invalid IDL format detected.');
                    setProgram(null);
                }
            } catch (error) {
                 log('Error initializing program:', error.message);
                 console.error("Program Initialization Error:", error);
                 setProgram(null);
            }
        } else {
            setProgram(null);
        }
    }, [publicKey, connection, wallet]);

    // --- Function to fetch and update user state (deposit amount) ---
    // Accepts an optional PDA override to use instead of the state variable
    const fetchAndUpdateUserState = async (pdaOverride = null) => {
        const pdaToUse = pdaOverride || userStatePDA;
        if (!program || !publicKey || !pdaToUse) {
            log(`Cannot fetch user state: prerequisites missing (program: ${!!program}, publicKey: ${!!publicKey}, pdaToUse: ${!!pdaToUse}).`);
            setUserStateDetails(null); // Ensure display resets if prerequisites lost
            return;
        }
        log(`Fetching user state data using PDA: ${pdaToUse.toBase58()}`);
        try {
             const fetchedState = await program.account.userState.fetch(pdaToUse, 'confirmed');
             log('Fetched User State:', JSON.stringify(fetchedState, (key, value) =>
                 typeof value === 'bigint' ? value.toString() : value // Convert BN/BigInt to string for logging
             , 2));
             // Store the whole state object
             setUserStateDetails(fetchedState);
         } catch (fetchError) {
             log(`Error fetching user state details: ${fetchError.message}`);
             console.error("User State Fetch Error:", fetchError);
             setUserStateDetails(null); // Ensure it's null on error
         }
     };

    // --- Handler to Create User State PDA (if needed) ---
    const handleCreateUserState = async (pdaForCreation) => {
        // Ensure prerequisites are met before attempting creation
        if (!program || !publicKey || !connection || !wallet?.adapter || !pdaForCreation) {
            log('Error: Cannot create user state - prerequisites missing (program, publicKey, connection, wallet, or PDA).');
            setIsLoading(false); // Ensure loading is false if we bail early
            return;
        }

        // Prevent multiple simultaneous creation attempts triggered by effect re-renders
        if (isLoading) {
             log("Creation or another transaction already in progress...");
             return;
        }

        setIsLoading(true);
        setTxSig(''); // Clear previous sig
        log('Attempting to create user profile...');

        try {
            const createUserTx = await program.methods
                .createUserState()
                .accounts({
                    user: publicKey,
                    userState: pdaForCreation, // Use the PDA passed in
                    systemProgram: SystemProgram.programId,
                })
                .transaction();

            const createSig = await sendTransaction(createUserTx, connection);
            log('Create Profile transaction sent:', createSig);

            log('Confirming user profile creation...');
            const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
            const confirmation = await connection.confirmTransaction({
                signature: createSig,
                blockhash,
                lastValidBlockHeight
            }, 'confirmed');

            if (confirmation.value.err) {
                log('Profile creation confirmation failed:', confirmation.value.err);
                 try {
                     const txDetails = await connection.getTransaction(createSig, {maxSupportedTransactionVersion: 0});
                     if (txDetails?.meta?.logMessages) {
                         log("Failed Creation Transaction Logs:", txDetails.meta.logMessages.join('\n'));
                     }
                 } catch (logError) {
                     log("Could not fetch logs for failed creation transaction:", logError);
                 }
                throw new Error(`User state creation failed: ${confirmation.value.err}`);
            }

            log('User profile created successfully.');
            setIsUserInitialized(true); // <-- Set state to true upon success
            fetchAndUpdateUserState(pdaForCreation); // Fetch initial state after creation, passing the newly created PDA

        } catch (error) {
            log('Error during profile creation:', error.message || JSON.stringify(error));
            if (error.logs) {
                log("Program Logs:", error.logs.join('\n'));
            }
            console.error("Create User State Error:", error);
            // Keep isUserInitialized false, allowing the effect to potentially retry on reconnect/refresh
            // Consider setting state to indicate failure: setIsUserInitialized('error');
        } finally {
            setIsLoading(false);
        }
    };


    // --- Check if User State PDA exists and Create if Not ---
    useEffect(() => {
        // Only run if program, publicKey, and connection are available
        if (program && publicKey && connection) {
            setIsUserInitialized(null); // Set to loading state initially
            setUserStateDetails(null); // Reset user details on re-check
            let derivedPDA = null; // Variable to hold derived PDA

            try {
                // Derive the User State PDA
                const [pda, bump] = PublicKey.findProgramAddressSync(
                    [USER_SEED, publicKey.toBuffer()],
                    program.programId
                );
                derivedPDA = pda; // Store derived PDA
                setUserStatePDA(pda); // Store in state for other functions (like deposit)
                log(`Derived User State PDA: ${pda.toBase58()}`);

                // Check if account exists
                log("Checking if user profile exists...");
                connection.getAccountInfo(pda, 'confirmed')
                    .then(accountInfo => {
                        if (!publicKey) return; // Check if publicKey became null during async operation

                        if (accountInfo === null) {
                            log("User profile not found. Creating automatically...");
                            setIsUserInitialized(false); // Mark as needing creation
                            if (derivedPDA) {
                                handleCreateUserState(derivedPDA);
                            } else {
                                log("Error: PDA was not derived before attempting creation.");
                            }
                        } else {
                            log("User profile found.");
                            setIsUserInitialized(true); // Mark as initialized
                            // <-- MODIFIED: Call the reusable fetch function, passing the derived pda -->
                            fetchAndUpdateUserState(pda);
                        }
                    })
                    .catch(error => {
                        log(`Error checking user profile: ${error.message}`);
                        console.error("Account Check Error:", error);
                        setIsUserInitialized(false); // Assume not initialized on error
                    });

            } catch (error) {
                log(`Error deriving user state PDA: ${error.message}`);
                console.error("PDA Derivation Error:", error);
                setIsUserInitialized(false); // Assume not initialized on error
            }
        } else {
            // Reset if disconnected or program not ready
            setIsUserInitialized(null);
            setUserStatePDA(null);
            setUserStateDetails(null); // Reset user details
        }
    // IMPORTANT: Do NOT add handleCreateUserState to dependencies to avoid loops.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [program, publicKey, connection]); // Re-run only when these core dependencies change


    // --- REMOVED handleInitializeUser function ---


    // --- Handler for Depositing Funds (Renamed from handleStake) ---
    const handleDeposit = async () => {
        if (!program || !publicKey || !connection || !wallet?.adapter || !userStatePDA) {
            log('Error: Wallet not connected, program not initialized, or user state PDA missing.');
            return;
        }
        // Basic input validation
        const depositAmountNum = parseFloat(depositAmount);
        // REMOVED: lock-in days validation, no longer part of deposit
        if (isNaN(depositAmountNum) || depositAmountNum <= 0) {
            log('Error: Invalid deposit amount.');
            return;
        }

        setIsLoading(true);
        setTxSig('');
        log(`Attempting to deposit ${depositAmountNum} USDC...`); // Removed lock-in days from log

        try {
            // --- 1. Derive PDAs and ATAs (reuse userStatePDA) ---
            const [vaultPDA, vaultBump] = PublicKey.findProgramAddressSync(
                [VAULT_SEED],
                program.programId
            );
            log(`Vault Authority PDA: ${vaultPDA.toBase58()}`);

            const userUsdcAta = getAssociatedTokenAddressSync(USDC_MINT, publicKey);
            log(`User USDC ATA: ${userUsdcAta.toBase58()}`);

            try {
                await getAccount(connection, userUsdcAta, 'confirmed');
                log("User's USDC ATA verified.");
            } catch (error) {
                if (error.name === 'TokenAccountNotFoundError') {
                     log("Error: Your USDC account doesn't exist. Please acquire some Devnet USDC.");
                } else {
                     log("Error checking user's USDC ATA:", error);
                }
                setIsLoading(false);
                return; // Stop depositing if ATA doesn't exist
            }

            const vaultUsdcAta = getAssociatedTokenAddressSync(USDC_MINT, vaultPDA, true);
            log(`Vault USDC ATA: ${vaultUsdcAta.toBase58()}`);

            // --- 2. Prepare Instruction Arguments ---
            const depositAmountLamports = new BN(depositAmountNum * 1_000_000); // Assuming 6 decimals for USDC
            // REMOVED: depositLockInDaysBN

            log(`Deposit Amount (lamports): ${depositAmountLamports.toString()}`);
            // REMOVED: log(`Deposit Lock-in Days (BN): ${depositLockInDaysBN.toString()}`);

            // --- 3. Build the deposit instruction transaction ---
            log("Building deposit transaction...");
            const depositTransaction = await program.methods
                .deposit(depositAmountLamports) // REMOVED depositLockInDaysBN
                .accounts({
                    user: publicKey,
                    userTokenAccount: userUsdcAta,
                    userState: userStatePDA, // Re-use the PDA derived earlier
                    vaultTokenAccount: vaultUsdcAta,
                    vault: vaultPDA,
                    usdcMint: USDC_MINT,
                    systemProgram: SystemProgram.programId,
                    tokenProgram: TOKEN_PROGRAM_ID,
                    associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
                    rent: web3.SYSVAR_RENT_PUBKEY,
                })
                .transaction();

            // Manually set the fee payer for simulation
            if (!depositTransaction.feePayer) {
                // log("Setting fee payer for simulation..."); // Keep this commented, internal detail
                depositTransaction.feePayer = publicKey;
            }

            // --- 4. Simulate the transaction (New Step) ---
            log('Simulating deposit transaction...');
            try {
                const simulationResult = await connection.simulateTransaction(depositTransaction, undefined, true); // Added simulation
                if (simulationResult.value.err) {
                    log("Simulation Error:", simulationResult.value.err);
                    log("Simulation Logs:", simulationResult.value.logs);
                    throw new Error(`Transaction simulation failed: ${simulationResult.value.err}`);
                }
                log("Transaction simulation successful.");
            } catch (simError) {
                log("Error during simulation:", simError);
                if (simError.simulationLogs) {
                    log("Simulation Logs (from catch):", simError.simulationLogs);
                }
                 setIsLoading(false);
                 return; // Stop if simulation fails
            }

            // --- 5. Send the deposit transaction ---
            log('Sending deposit transaction...');
            // console.log("Deposit Transaction Object:", depositTransaction); // Optionally uncomment this for deep debugging
            const depositSignature = await sendTransaction(depositTransaction, connection);

            log('Deposit Transaction sent:', depositSignature);
            setTxSig(depositSignature);

            // --- 6. Confirm Transaction ---
            log('Confirming deposit transaction...');
            const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
            const confirmation = await connection.confirmTransaction({
                signature: depositSignature,
                blockhash,
                lastValidBlockHeight
            }, 'confirmed');

            if (confirmation.value.err) {
                log('Deposit transaction confirmation failed:', confirmation.value.err);
                try {
                    const txDetails = await connection.getTransaction(depositSignature, {maxSupportedTransactionVersion: 0});
                    if (txDetails?.meta?.logMessages) {
                        log("Failed Deposit Transaction Logs:", txDetails.meta.logMessages.join('\n'));
                    }
                } catch (logError) {
                    log("Could not fetch logs for failed deposit transaction:", logError);
                }
                throw new Error(`Deposit transaction failed: ${confirmation.value.err}`);
            }

            log('Deposit transaction confirmed successfully.');
            // Optional: Could re-fetch user state here to update UI display
            // program.account.userState.fetch(userStatePDA).then(state => {
            //     log("Refreshed User State:", state);
            // });
            fetchAndUpdateUserState(); // <-- ADDED: Refresh user state after successful deposit

        } catch (error) {
            log('Error during deposit:', error.message || JSON.stringify(error));
            console.error("Deposit Error:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // --- Handler for Starting the Course ---
    const handleStartCourse = async () => {
        if (!program || !publicKey || !connection || !wallet?.adapter || !userStatePDA) {
            log('Error: Prerequisites missing for starting course (program, wallet, connection, user PDA).');
            return;
        }
        // Basic input validation
        const lockInDaysNum = parseInt(startCourseLockInDays, 10);
        if (isNaN(lockInDaysNum) || lockInDaysNum <= 0) {
            log('Error: Invalid lock-in days for starting course.');
            return;
        }

        setIsLoading(true);
        setTxSig('');
        log(`Attempting to start course with lock-in of ${lockInDaysNum} days...`);

        try {
            // --- 1. Prepare Instruction Arguments ---
            const lockInDaysBN = new BN(lockInDaysNum);
            log(`Start Course Lock-in Days (BN): ${lockInDaysBN.toString()}`);

            // --- 2. Build the start_course instruction transaction ---
            log("Building start_course transaction...");
            const startCourseTx = await program.methods
                .startCourse(lockInDaysBN)
                .accounts({
                    user: publicKey,
                    userState: userStatePDA, // Requires userState PDA
                })
                .transaction();

            // --- 3. Set Fee Payer and Simulate ---
            if (!startCourseTx.feePayer) {
                startCourseTx.feePayer = publicKey;
            }
            log('Simulating start_course transaction...');
            try {
                const simulationResult = await connection.simulateTransaction(startCourseTx);
                if (simulationResult.value.err) {
                    log("Simulation Error (start_course):", simulationResult.value.err);
                    log("Simulation Logs (start_course):", simulationResult.value.logs);
                    // Attempt to parse program logs for custom errors
                    const errorLogs = simulationResult.value.logs?.filter(l => l.includes('Program log: Error:'));
                    if (errorLogs?.length > 0) {
                        log("Parsed Program Error:", errorLogs.join('\\n'));
                    }
                    throw new Error(`Transaction simulation failed: ${simulationResult.value.err}`);
                }
                log("Transaction simulation successful (start_course).");
            } catch (simError) {
                log("Error during simulation (start_course):", simError);
                if (simError.simulationLogs) {
                    log("Simulation Logs (start_course) (from catch):", simError.simulationLogs);
                }
                 setIsLoading(false);
                 return; // Stop if simulation fails
            }

            // --- 4. Send the transaction ---
            log('Sending start_course transaction...');
            const startCourseSig = await sendTransaction(startCourseTx, connection);
            log('Start Course Transaction sent:', startCourseSig);
            setTxSig(startCourseSig);

            // --- 5. Confirm Transaction ---
            log('Confirming start_course transaction...');
            const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
            const confirmation = await connection.confirmTransaction({
                signature: startCourseSig,
                blockhash,
                lastValidBlockHeight
            }, 'confirmed');

            if (confirmation.value.err) {
                log('Start course transaction confirmation failed:', confirmation.value.err);
                try {
                    const txDetails = await connection.getTransaction(startCourseSig, {maxSupportedTransactionVersion: 0});
                    if (txDetails?.meta?.logMessages) {
                        log("Failed Start Course Transaction Logs:", txDetails.meta.logMessages.join('\\n'));
                    }
                } catch (logError) {
                    log("Could not fetch logs for failed start_course transaction:", logError);
                }
                throw new Error(`Start course transaction failed: ${confirmation.value.err}`);
            }

            log('Start course transaction confirmed successfully.');
            fetchAndUpdateUserState(); // Refresh user state after successful start

        } catch (error) {
            log('Error during start_course:', error.message || JSON.stringify(error));
            console.error("Start Course Error:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // --- Handler for Withdrawing Funds ---
    const handleWithdraw = async () => {
        if (!program || !publicKey || !connection || !wallet?.adapter || !userStatePDA) {
            log('Error: Prerequisites missing for withdrawal (program, wallet, connection, user PDA).');
            return;
        }

        setIsLoading(true);
        setTxSig('');
        log('Attempting to withdraw funds...');

        try {
            // --- 1. Fetch User State and Current Time ---
            log('Fetching user state...');
            const userState = await program.account.userState.fetch(userStatePDA);
            log('User State Fetched:', {
                depositAmount: userState.depositAmount.toString(),
                lockInEndTimestamp: userState.lockInEndTimestamp.toString(),
                accruedYield: userState.accruedYield.toString(),
            });

            log('Fetching current blockchain time...');
            const currentSlot = await connection.getSlot();
            const currentTimestamp = await connection.getBlockTime(currentSlot);
            log(`Current Timestamp: ${currentTimestamp}`);

            const isLocked = currentTimestamp < userState.lockInEndTimestamp.toNumber();
            log(`Is withdrawal period still locked? ${isLocked}`);

            // --- 2. Derive Accounts ---
            log('Deriving necessary accounts for withdrawal...');
            const [vaultPDA, vaultBump] = PublicKey.findProgramAddressSync(
                [VAULT_SEED],
                program.programId
            );
            log(`Vault Authority PDA: ${vaultPDA.toBase58()}`);

            const userUsdcAta = getAssociatedTokenAddressSync(USDC_MINT, publicKey);
            log(`User USDC ATA: ${userUsdcAta.toBase58()}`);

            const vaultUsdcAta = getAssociatedTokenAddressSync(USDC_MINT, vaultPDA, true);
            log(`Vault USDC ATA: ${vaultUsdcAta.toBase58()}`);

            let withdrawalInstruction;
            let instructionName = isLocked ? 'earlyWithdraw' : 'withdraw';

            // --- 3. Build Correct Instruction (Withdraw or Early Withdraw) ---
            log(`Building ${instructionName} transaction...`);

            if (isLocked) {
                // Early Withdraw
                const treasuryTokenAccount = getAssociatedTokenAddressSync(USDC_MINT, TREASURY_WALLET);
                log(`Treasury Token ATA: ${treasuryTokenAccount.toBase58()}`);
                log(`Using Treasury Wallet Pubkey: ${TREASURY_WALLET.toBase58()}`); // Add sanity check log

                withdrawalInstruction = program.methods
                    .earlyWithdraw()
                    .accounts({
                        user: publicKey,
                        userState: userStatePDA,
                        userTokenAccount: userUsdcAta,
                        vault: vaultPDA,
                        vaultTokenAccount: vaultUsdcAta,
                        treasuryTokenAccount: treasuryTokenAccount,
                        treasuryWalletAccount: TREASURY_WALLET,
                        usdcMint: USDC_MINT,
                        tokenProgram: TOKEN_PROGRAM_ID,
                        systemProgram: SystemProgram.programId,
                        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
                        rent: web3.SYSVAR_RENT_PUBKEY,
                    });

                // Log the account metas prepared by Anchor before creating the transaction
                try {
                    // This accesses internal details, might change in future Anchor versions
                    const instruction = await withdrawalInstruction.instruction(); // Get the instruction object
                    log("Raw instruction accounts prepared by Anchor:");
                    instruction.keys.forEach((key, index) => {
                        log(`  [${index}] pubkey: ${key.pubkey.toBase58()}, isSigner: ${key.isSigner}, isWritable: ${key.isWritable}`);
                    });

                    // Find the index expected for treasury_wallet_account based on Rust/IDL order
                    // User(mut,signer), UserState(mut), UserToken(mut), Vault(CHECK), VaultToken(mut), TreasuryToken(mut,init), TreasuryWallet(CHECK,address), Mint(CHECK), TokenProg, SysProg, AssocTokenProg, Rent
                    const expectedTreasuryWalletIndex = 6; // Index 6 based on the above order
                    if (instruction.keys.length > expectedTreasuryWalletIndex) {
                        const keyAtIndex = instruction.keys[expectedTreasuryWalletIndex];
                        log(`Account at expected index ${expectedTreasuryWalletIndex} (treasury_wallet_account): ${keyAtIndex.pubkey.toBase58()}`);
                        if (keyAtIndex.pubkey.toBase58() !== TREASURY_WALLET.toBase58()) {
                            log("!!! Mismatch detected between expected treasury wallet and key at index !!!");
                        }
                    } else {
                        log("Error: Could not find expected index for treasury_wallet_account in instruction keys.");
                    }

                } catch (err) {
                    log("Error inspecting withdrawalInstruction accounts:", err);
                }

            } else {
                // Normal Withdraw
                withdrawalInstruction = program.methods
                    .withdraw()
                    .accounts({
                        user: publicKey,
                        userState: userStatePDA,
                        userTokenAccount: userUsdcAta,
                        vault: vaultPDA,
                        vaultTokenAccount: vaultUsdcAta,
                        usdcMint: USDC_MINT,
                        tokenProgram: TOKEN_PROGRAM_ID,
                    });
            }

            const withdrawalTransaction = await withdrawalInstruction.transaction();

            // --- 4. Set Fee Payer and Simulate ---
            if (!withdrawalTransaction.feePayer) {
                withdrawalTransaction.feePayer = publicKey;
            }
            log(`Simulating ${instructionName} transaction...`);
            try {
                const simulationResult = await connection.simulateTransaction(withdrawalTransaction);
                if (simulationResult.value.err) {
                    log(`Simulation Error (${instructionName}):`, simulationResult.value.err);
                    log(`Simulation Logs (${instructionName}):`, simulationResult.value.logs);
                    throw new Error(`Transaction simulation failed: ${simulationResult.value.err}`);
                }
                log(`Transaction simulation successful (${instructionName}).`);
            } catch (simError) {
                log(`Error during simulation (${instructionName}):`, simError);
                if (simError.simulationLogs) {
                    log(`Simulation Logs (${instructionName}) (from catch):`, simError.simulationLogs);
                }
                setIsLoading(false);
                return;
            }

            // --- 5. Send Transaction ---
            log(`Sending ${instructionName} transaction...`);
            const withdrawalSignature = await sendTransaction(withdrawalTransaction, connection);
            log(`${instructionName.charAt(0).toUpperCase() + instructionName.slice(1)} Transaction sent:`, withdrawalSignature);
            setTxSig(withdrawalSignature);

            // --- 6. Confirm Transaction ---
            log(`Confirming ${instructionName} transaction...`);
            const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
            const confirmation = await connection.confirmTransaction({
                signature: withdrawalSignature,
                blockhash,
                lastValidBlockHeight
            }, 'confirmed');

            if (confirmation.value.err) {
                log(`${instructionName.charAt(0).toUpperCase() + instructionName.slice(1)} transaction confirmation failed:`, confirmation.value.err);
                try {
                    const txDetails = await connection.getTransaction(withdrawalSignature, {maxSupportedTransactionVersion: 0});
                    if (txDetails?.meta?.logMessages) {
                        log(`Failed ${instructionName} Transaction Logs:`, txDetails.meta.logMessages.join('\n'));
                    }
                } catch (logError) {
                    log(`Could not fetch logs for failed ${instructionName} transaction:`, logError);
                }
                throw new Error(`${instructionName} transaction failed: ${confirmation.value.err}`);
            }

            log(`${instructionName.charAt(0).toUpperCase() + instructionName.slice(1)} transaction confirmed successfully.`);
            // Optional: Re-fetch user state here to update UI display about balance etc.
            fetchAndUpdateUserState(); // <-- ADDED: Refresh user state after successful withdrawal

        } catch (error) {
            log('Error during withdrawal:', error.message || JSON.stringify(error));
            console.error("Withdrawal Error:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
            <h1>LockedIn Backend Test Page</h1>

            {/* Wallet Connect Button */}
            <div style={{ marginBottom: '20px', minHeight: '48px' }}>
                {isClient && <WalletMultiButton />}
            </div>

            {/* Display Wallet Pubkey */}
            {isClient && publicKey && (
                <p>Connected Wallet: {publicKey.toBase58()}</p>
            )}

            {/* Interaction Section */}
            {isClient && publicKey && program && (
                <div>
                    {/* Status Messages */}
                    {isUserInitialized === null && <p>Checking user profile...</p>}
                    {isUserInitialized === false && isLoading && <p>Creating user profile automatically...</p>}
                    {/* Optional: Add message for creation failure */}
                    {/* {isUserInitialized === false && !isLoading && <p>Automatic profile creation failed. Please reconnect wallet or refresh.</p>} */}

                    {/* --- Deposit Section (Renamed from Stake) --- */}
                    {isUserInitialized === true && (
                        <div style={{ marginTop: '30px', borderTop: '1px dashed #aaa', paddingTop: '20px' }}>
                             {/* Maybe add a clearer message that profile is ready */}
                             <p style={{ color: 'green', fontWeight: 'bold' }}>User profile initialized.</p>
                             {/* --- MODIFIED: Display detailed user state --- */}
                             {userStateDetails !== null ? (
                                <div style={{ background: '#eee', padding: '10px', marginBottom: '15px', borderRadius: '5px' }}>
                                    <h4>Your Current State:</h4>
                                    <pre style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word', color: '#333' }}>
                                        {`Deposit Amount: ${(userStateDetails.depositAmount.toNumber() / 1_000_000).toFixed(6)} USDC\\n`}
                                        {`Initial Deposit: ${(userStateDetails.initialDepositAmount.toNumber() / 1_000_000).toFixed(6)} USDC\\n`}
                                        {`Current Streak: ${userStateDetails.currentStreak.toString()}\\n`}
                                        {`Miss Count: ${userStateDetails.missCount.toString()}\\n`}
                                        {`Deposit Timestamp: ${userStateDetails.depositTimestamp.toNumber() ? new Date(userStateDetails.depositTimestamp.toNumber() * 1000).toLocaleString() : 'N/A'}\\n`}
                                        {`Last Task Timestamp: ${userStateDetails.lastTaskTimestamp.toNumber() ? new Date(userStateDetails.lastTaskTimestamp.toNumber() * 1000).toLocaleString() : 'N/A'}\\n`}
                                        {`Lock-in Ends: ${userStateDetails.lockInEndTimestamp.toNumber() ? new Date(userStateDetails.lockInEndTimestamp.toNumber() * 1000).toLocaleString() : 'Not Started'}\\n`}
                                        {`Accrued Yield: ${(userStateDetails.accruedYield.toNumber() / 1_000_000).toFixed(6)} USDC`}
                                    </pre>
                                </div>
                             ) : (
                                <p>Fetching user state details...</p>
                             )}

                            {/* --- Deposit Section (Only Deposit Amount) --- */}
                            <h2>Deposit Funds</h2>
                            {/* Deposit Amount Input */}
                            <div style={{ marginBottom: '10px' }}>
                                <label>
                                    Deposit Amount (USDC):{' '}
                                    <input
                                        type="number"
                                        value={depositAmount} // Renamed state variable
                                        onChange={(e) => setDepositAmount(e.target.value)} // Renamed state setter
                                        min="0.000001"
                                        step="0.000001"
                                        disabled={isLoading}
                                        style={{ color: '#000000' }}
                                    />
                                </label>
                            </div>
                            {/* REMOVED: Lock-in Duration Input */}
                            {/* Deposit Button */}
                            <div style={{ marginBottom: '10px' }}>
                                <button onClick={handleDeposit} disabled={isLoading || !publicKey}>
                                    {isLoading ? 'Processing Deposit...' : 'Deposit Funds'}
                                </button>
                            </div>

                            {/* --- Start Course Section (Conditional) --- */}
                            {userStateDetails && userStateDetails.lockInEndTimestamp.toNumber() === 0 && userStateDetails.depositAmount.toNumber() > 0 && (
                                <div style={{ marginTop: '20px', borderTop: '1px dashed #ccc', paddingTop: '15px' }}>
                                    <h2>Start Course</h2>
                                    <p>You have a deposit. Start the course to lock it in and begin tracking your streak.</p>
                                    <div style={{ marginBottom: '10px' }}>
                                        <label>
                                            Lock-in Duration (Days):{' '}
                                            <input
                                                type="number"
                                                value={startCourseLockInDays} // Use new state variable
                                                onChange={(e) => setStartCourseLockInDays(e.target.value)} // Use new state setter
                                                min="1"
                                                step="1"
                                                disabled={isLoading}
                                                style={{ color: '#000000' }}
                                            />
                                        </label>
                                    </div>
                                    <button onClick={handleStartCourse} disabled={isLoading || !publicKey}>
                                        {isLoading ? 'Starting Course...' : 'Start Course'}
                                    </button>
                                </div>
                            )}

                            {/* --- Withdraw Section --- */}
                            <div style={{ marginTop: '20px', borderTop: '1px dashed #ccc', paddingTop: '15px' }}>
                                <h2>Withdraw Funds</h2>
                                <p>Withdraw your funds (including yield) after the lock-in period ends, or withdraw early with a penalty.</p>
                                <button
                                    onClick={handleWithdraw}
                                    disabled={isLoading || !publicKey || !userStateDetails || userStateDetails.depositAmount.toNumber() === 0} // Disable if no deposit
                                >
                                    {isLoading ? 'Processing Withdrawal...' : 'Withdraw / Early Withdraw'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
            {/* Placeholder if wallet not connected */}
            {isClient && !publicKey && (
                <p>Please connect your wallet to interact.</p>
            )}

            {/* Transaction Signature Display */}
            {txSig && (
                <div style={{ marginTop: '20px' }}>
                    <p>Last Transaction Signature:</p>
                    <a
                        href={`https://explorer.solana.com/tx/${txSig}?cluster=devnet`}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        {txSig}
                    </a>
                </div>
            )}

            {/* Logs Display */}
            <div style={{ marginTop: '20px', borderTop: '1px solid #ccc', paddingTop: '10px' }}>
                <h3>Logs:</h3>
                <pre style={{ maxHeight: '300px', overflowY: 'auto', background: '#f0f0f0', padding: '10px', whiteSpace: 'pre-wrap', wordWrap: 'break-word', color: '#000000' }}>
                    {isClient ? logs.join('\n') : ''}
                </pre>
            </div>
        </div>
    );
}
// Added import for getAccount used in handleDeposit
import { getAccount } from '@solana/spl-token';
