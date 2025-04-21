import React, { useState, useEffect } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import {
    Connection,
    PublicKey,
    SystemProgram,
    Transaction,
    LAMPORTS_PER_SOL, // For potential future use
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
    createAssociatedTokenAccountInstruction, // Import instruction to create ATA
    getAccount, // Import function to check if account exists
} from '@solana/spl-token';

// Import the IDL from the lib directory
import idl from '../lib/idl/skillstreak_program.json';

// --- Constants ---
// Use the program ID from your deployment
const PROGRAM_ID = new PublicKey(idl.address);
// Devnet USDC Mint Address
const USDC_MINT = new PublicKey('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU'); // Updated Devnet USDC Mint from Circle docs
const USER_SEED = Buffer.from("user");
const VAULT_SEED = Buffer.from("vault");

export default function TestPage() {
    const { connection } = useConnection();
    const { publicKey, sendTransaction, wallet } = useWallet();
    const [program, setProgram] = useState(null);
    const [depositAmount, setDepositAmount] = useState('1'); // Default 1 USDC
    const [lockInDays, setLockInDays] = useState('7'); // Default 7 days
    const [logs, setLogs] = useState([]);
    const [txSig, setTxSig] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isClient, setIsClient] = useState(false); // State for client-side rendering

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
                    // Correct constructor arguments: (idl, provider)
                    // Program ID is usually derived from the IDL address
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
            // Avoid logging during initial server render or when disconnected
            // log('Wallet not connected or program not initialized.');
        }
    }, [publicKey, connection, wallet]);


    // --- Main Interaction Logic ---
    const handleInitializeUser = async () => {
        if (!program || !publicKey || !connection || !wallet?.adapter) { // Added connection/adapter checks
            log('Error: Wallet not connected or program not initialized.');
            return;
        }
        setIsLoading(true);
        setTxSig('');
        log('Attempting to initialize user...');

        try {
            // --- 1. Derive PDAs ---
            const [userStatePDA, userStateBump] = PublicKey.findProgramAddressSync(
                [USER_SEED, publicKey.toBuffer()],
                program.programId
            );
            log(`User State PDA: ${userStatePDA.toBase58()}`);

            const [vaultPDA, vaultBump] = PublicKey.findProgramAddressSync(
                [VAULT_SEED],
                program.programId
            );
            log(`Vault Authority PDA: ${vaultPDA.toBase58()}`);

            // --- 2. Get Associated Token Addresses (ATAs) ---
            const userUsdcAta = getAssociatedTokenAddressSync(
                USDC_MINT,
                publicKey // User is the owner
            );
            log(`User USDC ATA: ${userUsdcAta.toBase58()}`);

            const vaultUsdcAta = getAssociatedTokenAddressSync(
                USDC_MINT,
                vaultPDA, // Vault PDA is the owner/authority
                true // Allow owner off curve
            );
            log(`Vault USDC ATA: ${vaultUsdcAta.toBase58()}`);

            // --- 3. Check if User's USDC ATA exists and create if not ---
            let transaction = new Transaction();
            let userAtaExists = true; // Assume it exists initially
            let createAtaSignature = null; // To store signature if ATA is created

            try {
                await getAccount(connection, userUsdcAta, 'confirmed'); // Check if ATA exists
                log("User's USDC ATA already exists.");
            } catch (error) {
                // Error means account doesn't exist
                if (error.name === 'TokenAccountNotFoundError') {
                    log("User's USDC ATA not found. Trying to create it...");
                    userAtaExists = false;
                    const createAtaInstruction = createAssociatedTokenAccountInstruction(
                        publicKey,      // Payer
                        userUsdcAta,    // ATA address
                        publicKey,      // Owner
                        USDC_MINT       // Mint
                    );

                    // Create a separate transaction for ATA creation
                    const createAtaTransaction = new Transaction().add(createAtaInstruction);

                    // Manually prepare, sign, and send the ATA transaction
                    createAtaTransaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
                    createAtaTransaction.feePayer = publicKey;

                    log('Sending transaction to create ATA...');
                    console.log("Create ATA Transaction:", createAtaTransaction);

                    try {
                        log('Requesting signature for ATA creation from wallet...');
                        const signedTx = await wallet.adapter.signTransaction(createAtaTransaction);
                        log('Signature received. Sending raw transaction...');
                        createAtaSignature = await connection.sendRawTransaction(signedTx.serialize());
                        log('Raw transaction sent:', createAtaSignature);
                    } catch (signSendError) {
                         log('Error during manual sign/send for ATA:', signSendError);
                         console.error("Manual Sign/Send Error:", signSendError);
                        throw signSendError; // Re-throw to stop execution
                    }

                    log('Create ATA Transaction sent:', createAtaSignature);

                    // Confirm the ATA creation
                    log('Confirming ATA creation...');
                    const { blockhash: ataBlockhash, lastValidBlockHeight: ataLVBH } = await connection.getLatestBlockhash(); // Get fresh blockhash
                    const confirmation = await connection.confirmTransaction({
                        signature: createAtaSignature,
                        blockhash: ataBlockhash,
                        lastValidBlockHeight: ataLVBH
                    }, 'confirmed');

                    if (confirmation.value.err) {
                        log('ATA creation transaction confirmation failed:', confirmation.value.err);
                        throw new Error(`ATA creation failed: ${confirmation.value.err}`);
                    }
                    log('ATA created and confirmed successfully.');

                } else {
                    // Rethrow other errors (e.g., network issues)
                    throw error;
                }
            }

            // --- 4. Prepare Instruction Arguments ---
            const depositAmountLamports = new BN(parseFloat(depositAmount) * 1_000_000);
            const lockInDurationDaysBN = new BN(parseInt(lockInDays, 10));

            log(`Deposit Amount (lamports): ${depositAmountLamports.toString()}`);
            log(`Lock-in Days: ${lockInDurationDaysBN.toString()}`);

            // --- 5. Build the initialize_user instruction ---
            // Use Anchor's .transaction() builder
            log("Building initializeUser transaction...");
            const initializeUserTransaction = await program.methods
                .initializeUser(depositAmountLamports, lockInDurationDaysBN)
                .accounts({
                    user: publicKey,
                    userTokenAccount: userUsdcAta,
                    userState: userStatePDA,
                    vaultTokenAccount: vaultUsdcAta,
                    vault: vaultPDA,
                    usdcMint: USDC_MINT,
                    systemProgram: SystemProgram.programId,
                    tokenProgram: TOKEN_PROGRAM_ID,
                    associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
                })
                .transaction(); // Get the Transaction object directly

            // Let sendTransaction handle feePayer and recentBlockhash

            // --- 6. Send the initializeUser transaction ---
            log('Sending initializeUser transaction...');
            // Use the wallet adapter's sendTransaction
            console.log("Initialize User Transaction:", initializeUserTransaction);
            const initializeUserSignature = await sendTransaction(initializeUserTransaction, connection); // Simplified call

            log('Initialize User Transaction sent:', initializeUserSignature);
            setTxSig(initializeUserSignature); // Set the final signature

            // --- 7. Confirm Transaction ---
            log('Confirming initializeUser transaction...');
            const { blockhash: initBlockhash, lastValidBlockHeight: initLVBH } = await connection.getLatestBlockhash(); // Get fresh blockhash
            const confirmation = await connection.confirmTransaction({
                signature: initializeUserSignature,
                blockhash: initBlockhash,
                lastValidBlockHeight: initLVBH
            }, 'confirmed'); // Use 'confirmed' for better reliability

            if (confirmation.value.err) {
                 // Log the error from the confirmation result
                log('initializeUser transaction confirmation failed:', confirmation.value.err);
                // Attempt to fetch transaction logs if confirmation failed
                try {
                    const txDetails = await connection.getTransaction(initializeUserSignature, {maxSupportedTransactionVersion: 0});
                    if (txDetails?.meta?.logMessages) {
                        log("Failed Transaction Logs:", txDetails.meta.logMessages.join('\n'));
                    }
                } catch (logError) {
                    log("Could not fetch logs for failed transaction:", logError);
                }
                 throw new Error(`Transaction failed: ${confirmation.value.err}`);
            }

            log('Transaction confirmed successfully.');

            // Optional: Fetch state after successful confirmation
            // const fetchedState = await program.account.userState.fetch(userStatePDA);
            // log('Fetched User State:', fetchedState);

        } catch (error) {
            log('Error during initialization:', error.message || JSON.stringify(error));
            // Attempt to extract logs if available in the error object
            if (error.logs) {
                 log("Program Logs:", error.logs.join('\n'));
            }
            console.error("Initialization Error:", error); // Log the full error object
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
            <h1>SkillStreak Backend Test Page</h1>

            {/* Wallet Connect Button - Render only on client */}
            <div style={{ marginBottom: '20px', minHeight: '48px' }}> {/* Added minHeight to prevent layout shift */}
                {isClient && <WalletMultiButton />}
            </div>

            {/* Display Wallet Pubkey - Render only on client */}
            {isClient && publicKey && (
                <p>Connected Wallet: {publicKey.toBase58()}</p>
            )}

            {/* Interaction Section - Render only on client and when ready */}
            {isClient && publicKey && program && (
                <div>
                    <h2>Initialize User</h2>
                    <div style={{ marginBottom: '10px' }}>
                        <label>
                            Deposit Amount (USDC):{' '}
                            <input
                                type="number"
                                value={depositAmount}
                                onChange={(e) => setDepositAmount(e.target.value)}
                                min="0.000001" // Smallest unit based on decimals
                                step="0.000001"
                                disabled={isLoading}
                            />
                        </label>
                    </div>
                    <div style={{ marginBottom: '10px' }}>
                        <label>
                            Lock-in Duration (Days):{' '}
                            <input
                                type="number"
                                value={lockInDays}
                                onChange={(e) => setLockInDays(e.target.value)}
                                min="1"
                                step="1"
                                disabled={isLoading}
                            />
                        </label>
                    </div>
                    <button onClick={handleInitializeUser} disabled={isLoading || !publicKey}>
                        {isLoading ? 'Processing...' : 'Initialize User'}
                    </button>
                </div>
            )}
            {/* Render placeholder or message if not ready */}
            {isClient && (!publicKey || !program) && (
                <p>Please connect your wallet to interact.</p>
            )}

            {/* Transaction Signature */}
            {txSig && (
                <div style={{ marginTop: '20px' }}>
                    <p>Transaction Signature:</p>
                    <a
                        href={`https://explorer.solana.com/tx/${txSig}?cluster=devnet`}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        {txSig}
                    </a>
                </div>
            )}

            {/* Logs */}
            <div style={{ marginTop: '20px', borderTop: '1px solid #ccc', paddingTop: '10px' }}>
                <h3>Logs:</h3>
                <pre style={{ maxHeight: '300px', overflowY: 'auto', background: '#f0f0f0', padding: '10px', whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>
                    {/* Render logs only on client */}
                    {isClient ? logs.join('\n') : ''}
                </pre>
            </div>
        </div>
    );
}

// Basic styling for the button if needed
// Add CSS import in _app.js or use Tailwind/Styled Components as per your project setup 