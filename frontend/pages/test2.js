import React, { useState, useEffect, useCallback } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import {
    PublicKey,
    SystemProgram,
    // Transaction, // Likely not needed for direct transaction construction here
} from '@solana/web3.js';
import {
    Program,
    AnchorProvider,
    web3,
    BN,
} from '@coral-xyz/anchor';
import {
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID,
    getAssociatedTokenAddressSync,
    getAccount, // To check if user's USDC ATA exists
} from '@solana/spl-token';

// Import the IDL
import idl from '../lib/idl/skillstreak_program.json';

// --- Constants ---
console.log("Imported IDL:", idl); // Log the IDL object to inspect it

let PROGRAM_ID_STRING;
if (idl && idl.address) {
    PROGRAM_ID_STRING = idl.address;
    console.log("Using Program ID from idl.address:", PROGRAM_ID_STRING);
} else {
    console.error("CRITICAL: IDL file is missing the main 'address' field. Please check your IDL file and build process.");
    // Fallback or throw an error - For now, let's use a placeholder that will likely fail if not replaced.
    // You should replace this with your actual Program ID if the IDL is consistently problematic.
    PROGRAM_ID_STRING = 'YOUR_PROGRAM_ID_PLACEHOLDER'; 
}

const PROGRAM_ID = new PublicKey(PROGRAM_ID_STRING);
const USDC_MINT = new PublicKey('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU'); // Devnet USDC
const MARKET_SEED = Buffer.from("market");
const BET_SEED = Buffer.from("bet");
const MARKET_ESCROW_VAULT_SEED = Buffer.from("market_escrow_vault");

// Helper to format address for display
const formatAddress = (address) => {
    const addrStr = typeof address === 'string' ? address : address.toBase58();
    return `${addrStr.substring(0, 4)}...${addrStr.substring(addrStr.length - 4)}`;
};

// Helper to format timestamp
const formatTimestamp = (timestampBN) => {
    if (!timestampBN || timestampBN.isZero()) return 'N/A';
    try {
        return new Date(timestampBN.toNumber() * 1000).toLocaleString();
    } catch (e) {
        return 'Invalid Date';
    }
};

export default function BettingPage() {
    const { connection } = useConnection();
    const { publicKey, sendTransaction, wallet } = useWallet();
    const [program, setProgram] = useState(null);
    const [logs, setLogs] = useState([]);
    const [txSig, setTxSig] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isClient, setIsClient] = useState(false);

    const [openMarkets, setOpenMarkets] = useState([]);
    const [selectedMarket, setSelectedMarket] = useState(null); // Store the whole market object
    const [betAmount, setBetAmount] = useState('0.1'); // Default 0.1 USDC
    const [betPositionIsLong, setBetPositionIsLong] = useState(true); // true for Long, false for Short

    useEffect(() => {
        setIsClient(true);
    }, []);

    const log = useCallback((...args) => {
        console.log(...args);
        setLogs(prev => [...prev, args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg, (key, value) =>
                typeof value === 'bigint' ? value.toString() : value
            , 2) : arg
        ).join(' ')]);
    }, []);

    useEffect(() => {
        if (publicKey && connection && wallet?.adapter && idl) {
            try {
                const provider = new AnchorProvider(connection, wallet.adapter, { commitment: "processed" });
                if (typeof idl === 'object' && idl !== null) {
                    const prog = new Program(idl, provider);
                    setProgram(prog);
                    log('Betting Program initialized.');
                } else {
                    log('Error: Invalid IDL format for betting page.');
                    setProgram(null);
                }
            } catch (error) {
                 log('Error initializing betting program:', error.message);
                 console.error("Betting Program Initialization Error:", error);
                 setProgram(null);
            }
        } else {
            setProgram(null);
        }
    }, [publicKey, connection, wallet, log]);

    const fetchOpenMarkets = useCallback(async () => {
        if (!program) {
            log("Program not initialized. Cannot fetch markets.");
            return;
        }
        setIsLoading(true);
        log("Fetching all markets...");
        try {
            const allMarketAccounts = await program.account.marketState.all();
            log(`Found ${allMarketAccounts.length} market accounts in total.`);
            
            const open = allMarketAccounts.filter(market => {
                // Assuming MarketStatus.Open is represented by an object like { open: {} }
                // Adjust this based on how your IDL represents the enum variant
                return market.account.status && typeof market.account.status.open !== 'undefined';
            });

            log(`Found ${open.length} open markets.`);
            setOpenMarkets(open.map(m => ({ publicKey: m.publicKey, ...m.account }))); // Store publicKey along with account data
        } catch (error) {
            log("Error fetching markets:", error.message);
            console.error("Fetch Markets Error:", error);
            setOpenMarkets([]);
        } finally {
            setIsLoading(false);
        }
    }, [program, log]);

    useEffect(() => {
        if (program && publicKey) { // Fetch markets when program is ready and user connected
            fetchOpenMarkets();
        }
    }, [program, publicKey, fetchOpenMarkets]);

    const handlePlaceBet = async () => {
        if (!program || !publicKey || !selectedMarket) {
            log("Prerequisites for placing bet not met: Program, Wallet, or Selected Market missing.");
            return;
        }
        const amountNum = parseFloat(betAmount);
        if (isNaN(amountNum) || amountNum <= 0) {
            log("Invalid bet amount.");
            return;
        }

        setIsLoading(true);
        setTxSig('');
        log(`Attempting to place bet: Amount=${amountNum} USDC, Position=${betPositionIsLong ? 'Long' : 'Short'} on market ${selectedMarket.publicKey.toBase58()}`);

        try {
            // 1. Derive/Get necessary accounts
            const marketStatePDA = selectedMarket.publicKey; // This is the Pubkey of the market account itself

            const [marketEscrowVaultPDA, ] = PublicKey.findProgramAddressSync(
                [MARKET_ESCROW_VAULT_SEED, marketStatePDA.toBuffer()],
                program.programId
            );
            log(`Market Escrow Vault PDA: ${marketEscrowVaultPDA.toBase58()}`);

            const marketEscrowTokenAccount = getAssociatedTokenAddressSync(
                USDC_MINT,
                marketEscrowVaultPDA,
                true // allowOwnerOffCurve
            );
            log(`Market Escrow Token Account: ${marketEscrowTokenAccount.toBase58()}`);

            const bettorTokenAccount = getAssociatedTokenAddressSync(USDC_MINT, publicKey);
            log(`Bettor (User) USDC ATA: ${bettorTokenAccount.toBase58()}`);
            
            // Check if bettor has USDC account
            try {
                await getAccount(connection, bettorTokenAccount, 'confirmed');
                log("Bettor's USDC ATA verified.");
            } catch (error) {
                if (error.name === 'TokenAccountNotFoundError') {
                     log("Error: Your USDC account doesn't exist. Please acquire some Devnet USDC.");
                } else {
                     log("Error checking bettor's USDC ATA:", error);
                }
                setIsLoading(false);
                return; 
            }


            const [betStatePDA, ] = PublicKey.findProgramAddressSync(
                [BET_SEED, marketStatePDA.toBuffer(), publicKey.toBuffer()],
                program.programId
            );
            log(`Bet State PDA: ${betStatePDA.toBase58()}`);

            const amountLamports = new BN(amountNum * 1_000_000); // Assuming 6 decimals for USDC

            // 2. Build Transaction
            const placeBetTx = await program.methods
                .placeBet(amountLamports, betPositionIsLong)
                .accounts({
                    bettor: publicKey,
                    marketState: marketStatePDA,
                    marketEscrowVault: marketEscrowVaultPDA,
                    marketEscrowTokenAccount: marketEscrowTokenAccount,
                    bettorTokenAccount: bettorTokenAccount,
                    betState: betStatePDA,
                    usdcMint: USDC_MINT,
                    systemProgram: SystemProgram.programId,
                    tokenProgram: TOKEN_PROGRAM_ID,
                    // associatedTokenProgram is not explicitly needed here if ATAs are already created or handled by init_if_needed in program
                })
                .transaction();
            
            // 3. Simulate Transaction
            log('Simulating place_bet transaction...');
            placeBetTx.feePayer = publicKey; // Ensure fee payer is set
            const simulationResult = await connection.simulateTransaction(placeBetTx);
            if (simulationResult.value.err) {
                log("Simulation Error (place_bet):", simulationResult.value.err);
                log("Simulation Logs (place_bet):", simulationResult.value.logs);
                throw new Error(`Transaction simulation failed: ${simulationResult.value.err}`);
            }
            log("Transaction simulation successful (place_bet).");

            // 4. Send Transaction
            const signature = await sendTransaction(placeBetTx, connection);
            setTxSig(signature);
            log("Place Bet transaction sent:", signature);

            // 5. Confirm Transaction
            await connection.confirmTransaction(signature, 'confirmed');
            log("Place Bet transaction confirmed.");

            // Refresh markets or update selected market state
            fetchOpenMarkets(); 
            setSelectedMarket(null); // Deselect market after betting

        } catch (error) {
            log("Error placing bet:", error.message || JSON.stringify(error));
            if (error.logs) log("Program Logs:", error.logs.join('\n'));
            console.error("Place Bet Error:", error);
        } finally {
            setIsLoading(false);
        }
    };


    if (!isClient) {
        return null; // Or a loading spinner
    }

    return (
        <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', maxWidth: '1000px', margin: '0 auto' }}>
            <h1 style={{ textAlign: 'center', color: '#333' }}>SkillStreak Betting Markets</h1>

            <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                <WalletMultiButton />
            </div>

            {publicKey && program ? (
                <div>
                    <button onClick={fetchOpenMarkets} disabled={isLoading} style={{ padding: '10px', marginBottom: '20px', cursor: 'pointer' }}>
                        {isLoading ? 'Refreshing Markets...' : 'Refresh Open Markets'}
                    </button>

                    <h2 style={{ borderBottom: '2px solid #eee', paddingBottom: '10px' }}>Open Markets ({openMarkets.length})</h2>
                    {isLoading && openMarkets.length === 0 && <p>Loading markets...</p>}
                    {!isLoading && openMarkets.length === 0 && <p>No open markets found. Check back later or start a new course on the test page!</p>}
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                        {openMarkets.map((market) => (
                            <div key={market.publicKey.toBase58()} style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '15px', background: selectedMarket?.publicKey.equals(market.publicKey) ? '#e6f7ff' : '#fff' }}>
                                <h3>Market: {formatAddress(market.publicKey)}</h3>
                                <p><strong>User to Bet On:</strong> {formatAddress(market.userBeingBetOn)}</p>
                                <p><strong>Market Creator:</strong> {formatAddress(market.marketCreator)}</p>
                                <p><strong>Betting Ends:</strong> {formatTimestamp(market.bettingEndsTimestamp)}</p>
                                <p><strong>Task Deadline:</strong> {formatTimestamp(market.taskDeadlineTimestamp)}</p>
                                <p><strong>Pool (Long):</strong> {(market.totalLongAmount.toNumber() / 1_000_000).toFixed(2)} USDC</p>
                                <p><strong>Pool (Short):</strong> {(market.totalShortAmount.toNumber() / 1_000_000).toFixed(2)} USDC</p>
                                <p><strong>Platform Fee:</strong> {(market.platformFeeBasisPoints / 100).toFixed(2)}%</p>
                                <button onClick={() => setSelectedMarket(market)} style={{ padding: '8px 12px', marginTop: '10px', width: '100%' }} disabled={isLoading}>
                                    {selectedMarket?.publicKey.equals(market.publicKey) ? 'Selected' : 'Select to Bet'}
                                </button>
                            </div>
                        ))}
                    </div>

                    {selectedMarket && (
                        <div style={{ marginTop: '30px', padding: '20px', border: '1px solid #007bff', borderRadius: '8px', background: '#f8f9fa' }}>
                            <h2>Bet on Market: {formatAddress(selectedMarket.publicKey)}</h2>
                            <p><strong>Betting on User:</strong> {formatAddress(selectedMarket.userBeingBetOn)}</p>
                            <div style={{ margin: '10px 0' }}>
                                <label htmlFor="betAmount" style={{ marginRight: '10px' }}>Amount (USDC):</label>
                                <input
                                    type="number"
                                    id="betAmount"
                                    value={betAmount}
                                    onChange={(e) => setBetAmount(e.target.value)}
                                    min="0.000001"
                                    step="0.000001"
                                    disabled={isLoading}
                                    style={{ padding: '8px', color: '#000' }}
                                />
                            </div>
                            <div style={{ margin: '10px 0' }}>
                                <label style={{ marginRight: '10px' }}>Position:</label>
                                <button 
                                    onClick={() => setBetPositionIsLong(true)} 
                                    disabled={isLoading}
                                    style={{ padding: '8px 12px', marginRight: '10px', background: betPositionIsLong ? '#28a745' : '#f0f0f0', color: betPositionIsLong ? '#fff' : '#000'}}
                                >
                                    Long (Streak Continues)
                                </button>
                                <button 
                                    onClick={() => setBetPositionIsLong(false)} 
                                    disabled={isLoading}
                                    style={{ padding: '8px 12px', background: !betPositionIsLong ? '#dc3545' : '#f0f0f0', color: !betPositionIsLong ? '#fff' : '#000'}}
                                >
                                    Short (Streak Breaks)
                                </button>
                            </div>
                            <button onClick={handlePlaceBet} disabled={isLoading || !publicKey} style={{ padding: '10px 15px', marginTop: '10px', background: '#007bff', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
                                {isLoading ? 'Placing Bet...' : 'Place Bet'}
                            </button>
                        </div>
                    )}

                </div>
            ) : (
                <p>Please connect your wallet to view and participate in betting markets.</p>
            )}

            {txSig && (
                <div style={{ marginTop: '20px', paddingTop: '10px', borderTop: '1px solid #eee' }}>
                    <p><strong>Last Transaction Signature:</strong></p>
                    <a
                        href={`https://explorer.solana.com/tx/${txSig}?cluster=devnet`} // Assuming devnet
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#007bff' }}
                    >
                        {txSig}
                    </a>
                </div>
            )}

            <div style={{ marginTop: '30px', borderTop: '1px solid #ccc', paddingTop: '10px' }}>
                <h3>Activity Logs:</h3>
                <pre style={{ maxHeight: '300px', overflowY: 'auto', background: '#f8f9fa', padding: '10px', borderRadius: '5px', whiteSpace: 'pre-wrap', wordWrap: 'break-word', color: '#333', fontSize: '0.9em' }}>
                    {logs.join('\n')}
                </pre>
            </div>
        </div>
    );
}
