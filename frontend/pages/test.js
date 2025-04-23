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
const PROGRAM_ID = new PublicKey(idl.address); // Use updated IDL address
const USDC_MINT = new PublicKey('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU'); // Updated Devnet USDC Mint
const USER_SEED = Buffer.from("user");
const VAULT_SEED = Buffer.from("vault");

export default function TestPage() {
    const { connection } = useConnection();
    const { publicKey, sendTransaction, wallet } = useWallet();
    const [program, setProgram] = useState(null);
    // Removed depositAmount, lockInDays state
    const [stakeAmount, setStakeAmount] = useState('0.5'); // Default 0.5 USDC for staking
    const [stakeLockInDays, setStakeLockInDays] = useState('30'); // Default 30 days for staking
    const [logs, setLogs] = useState([]);
    const [txSig, setTxSig] = useState('');
    const [isLoading, setIsLoading] = useState(false); // Tracks loading for *any* transaction
    const [isClient, setIsClient] = useState(false);
    const [isUserInitialized, setIsUserInitialized] = useState(null); // null: checking, false: needs creation, true: exists/created
    const [userStatePDA, setUserStatePDA] = useState(null); // Store the PDA for potential future use

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
        log('Attempting to create user state PDA automatically...');

        try {
            log("Building createUserState transaction...");
            const createUserTx = await program.methods
                .createUserState()
                .accounts({
                    user: publicKey,
                    userState: pdaForCreation, // Use the PDA passed in
                    systemProgram: SystemProgram.programId,
                })
                .transaction();

            log('Sending createUserState transaction...');
            const createSig = await sendTransaction(createUserTx, connection);
            log('Create User State transaction sent:', createSig);
            // Optionally update txSig state to show this temporary signature
            // setTxSig(createSig);

            log('Confirming user state creation...');
            const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
            const confirmation = await connection.confirmTransaction({
                signature: createSig,
                blockhash,
                lastValidBlockHeight
            }, 'confirmed');

            if (confirmation.value.err) {
                log('User state creation transaction confirmation failed:', confirmation.value.err);
                 // Try getting logs
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

            log('User state created and confirmed successfully.');
            setIsUserInitialized(true); // <-- Set state to true upon success

        } catch (error) {
            log('Error during automatic user state creation:', error.message || JSON.stringify(error));
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
            let derivedPDA = null; // Variable to hold derived PDA

            try {
                // Derive the User State PDA
                const [pda, bump] = PublicKey.findProgramAddressSync(
                    [USER_SEED, publicKey.toBuffer()],
                    program.programId
                );
                derivedPDA = pda; // Store derived PDA
                setUserStatePDA(pda); // Store in state for other functions (like stake)
                log(`Derived User State PDA for check: ${pda.toBase58()}`);

                // Check if account exists
                log("Checking if user state exists...");
                connection.getAccountInfo(pda, 'confirmed')
                    .then(accountInfo => {
                        if (!publicKey) return; // Check if publicKey became null during async operation

                        if (accountInfo === null) {
                            // Account does not exist, user is not initialized
                            log("User state account not found. Triggering automatic creation...");
                            setIsUserInitialized(false); // Mark as needing creation
                            // Call creation function, passing the derived PDA
                            if (derivedPDA) {
                                handleCreateUserState(derivedPDA);
                            } else {
                                log("Error: PDA was not derived before attempting creation.");
                            }
                        } else {
                            // Account exists, user is already initialized
                            log("User state account found. User is initialized.");
                            setIsUserInitialized(true); // Mark as initialized
                        }
                    })
                    .catch(error => {
                        log(`Error checking user state account: ${error.message}`);
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
        }
    // IMPORTANT: Do NOT add handleCreateUserState to dependencies to avoid loops.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [program, publicKey, connection]); // Re-run only when these core dependencies change


    // --- REMOVED handleInitializeUser function ---


    // --- Handler for Staking Funds (for initialized users) ---
    // (Keep existing handleStake function as is)
    const handleStake = async () => {
        if (!program || !publicKey || !connection || !wallet?.adapter || !userStatePDA) {
            log('Error: Wallet not connected, program not initialized, or user state PDA missing.');
            return;
        }
        // Basic input validation
        const stakeAmountNum = parseFloat(stakeAmount);
        const stakeLockInDaysNum = parseInt(stakeLockInDays, 10);
        if (isNaN(stakeAmountNum) || stakeAmountNum <= 0 || isNaN(stakeLockInDaysNum) || stakeLockInDaysNum <= 0) {
            log('Error: Invalid stake amount or lock-in days.');
            return;
        }

        setIsLoading(true);
        setTxSig('');
        log(`Attempting to stake ${stakeAmountNum} USDC for ${stakeLockInDaysNum} days...`);

        try {
            // --- 1. Derive PDAs and ATAs (reuse userStatePDA) ---
            const [vaultPDA, vaultBump] = PublicKey.findProgramAddressSync(
                [VAULT_SEED],
                program.programId
            );
            log(`Vault Authority PDA: ${vaultPDA.toBase58()}`);

            const userUsdcAta = getAssociatedTokenAddressSync(USDC_MINT, publicKey);
            log(`User USDC ATA: ${userUsdcAta.toBase58()}`);

            // Check if user's USDC ATA exists before staking
            try {
                await getAccount(connection, userUsdcAta, 'confirmed');
                log("User's USDC ATA verified for staking.");
            } catch (error) {
                if (error.name === 'TokenAccountNotFoundError') {
                     log("Error: User's USDC ATA does not exist. Cannot stake. Please acquire some USDC first.");
                     // Potentially add logic here to create the ATA if desired, similar to the old initializeUser
                } else {
                     log("Error checking user's USDC ATA:", error);
                }
                setIsLoading(false);
                return; // Stop staking if ATA doesn't exist
            }


            const vaultUsdcAta = getAssociatedTokenAddressSync(USDC_MINT, vaultPDA, true);
            log(`Vault USDC ATA: ${vaultUsdcAta.toBase58()}`);

            // --- 2. Prepare Instruction Arguments ---
            const stakeAmountLamports = new BN(stakeAmountNum * 1_000_000); // Assuming 6 decimals for USDC
            const stakeLockInDaysBN = new BN(stakeLockInDaysNum);

            log(`Stake Amount (lamports): ${stakeAmountLamports.toString()}`);
            log(`Stake Lock-in Days: ${stakeLockInDaysBN.toString()}`);

            // --- 3. Build the stake instruction transaction ---
            log("Building stake transaction...");
            const stakeTransaction = await program.methods
                .stake(stakeAmountLamports, stakeLockInDaysBN)
                .accounts({
                    user: publicKey,
                    userTokenAccount: userUsdcAta,
                    userState: userStatePDA, // Re-use the PDA derived earlier
                    vaultTokenAccount: vaultUsdcAta,
                    vault: vaultPDA,
                    usdcMint: USDC_MINT,
                    systemProgram: SystemProgram.programId, // Keep for consistency, though maybe not strictly needed by stake
                    tokenProgram: TOKEN_PROGRAM_ID,
                    associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
                })
                .transaction();

            // --- 4. Send the stake transaction ---
            log('Sending stake transaction...');
            console.log("Stake Transaction:", stakeTransaction);
            const stakeSignature = await sendTransaction(stakeTransaction, connection);

            log('Stake Transaction sent:', stakeSignature);
            setTxSig(stakeSignature); // Set the final signature

            // --- 5. Confirm Transaction ---
            log('Confirming stake transaction...');
            const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
            const confirmation = await connection.confirmTransaction({
                signature: stakeSignature,
                blockhash,
                lastValidBlockHeight
            }, 'confirmed');

            if (confirmation.value.err) {
                log('Stake transaction confirmation failed:', confirmation.value.err);
                try {
                    const txDetails = await connection.getTransaction(stakeSignature, {maxSupportedTransactionVersion: 0});
                    if (txDetails?.meta?.logMessages) {
                        log("Failed Stake Transaction Logs:", txDetails.meta.logMessages.join('\n'));
                    }
                } catch (logError) {
                    log("Could not fetch logs for failed stake transaction:", logError);
                }
                throw new Error(`Stake transaction failed: ${confirmation.value.err}`);
            }

            log('Stake transaction confirmed successfully.');
            // Optional: Could re-fetch user state here to update UI display
            // program.account.userState.fetch(userStatePDA).then(state => {
            //     log("Refreshed User State:", state);
            // });

        } catch (error) {
            log('Error during stake:', error.message || JSON.stringify(error));
            if (error.logs) {
                log("Program Logs:", error.logs.join('\n'));
            }
            console.error("Stake Error:", error);
        } finally {
            setIsLoading(false);
        }
    };


    return (
        <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
            <h1>SkillStreak Backend Test Page</h1>

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

                    {/* --- Stake Section (Only when user state exists/is created) --- */}
                    {isUserInitialized === true && (
                        <div style={{ marginTop: '30px', borderTop: '1px dashed #aaa', paddingTop: '20px' }}> {/* Corrected style string */}
                             {/* Maybe add a clearer message that profile is ready */}
                             <p style={{ color: 'green', fontWeight: 'bold' }}>User profile ready.</p>
                            <h2>Stake Funds</h2>
                            {/* Stake Amount Input */}
                            <div style={{ marginBottom: '10px' }}>
                                <label>
                                    Stake Amount (USDC):{' '}
                                    <input
                                        type="number"
                                        value={stakeAmount}
                                        onChange={(e) => setStakeAmount(e.target.value)}
                                        min="0.000001"
                                        step="0.000001"
                                        disabled={isLoading}
                                        style={{ color: '#000000' }}
                                    />
                                </label>
                            </div>
                            {/* Lock-in Duration Input */}
                            <div style={{ marginBottom: '10px' }}>
                                <label>
                                    Lock-in Duration (Days):{' '}
                                    <input
                                        type="number"
                                        value={stakeLockInDays}
                                        onChange={(e) => setStakeLockInDays(e.target.value)}
                                        min="1" // Assuming minimum 1 day lock for stake too
                                        step="1"
                                        disabled={isLoading}
                                        style={{ color: '#000000' }}
                                    />
                                </label>
                            </div>
                            {/* Stake Button */}
                            <button onClick={handleStake} disabled={isLoading || !publicKey}>
                                {isLoading ? 'Processing Stake...' : 'Stake Funds'}
                            </button>
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
// Added import for getAccount used in handleStake
import { getAccount } from '@solana/spl-token'; 