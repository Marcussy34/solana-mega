"use client";
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import WelcomeHeader from '@/components/WelcomeHeader';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useWallet } from '@solana/wallet-adapter-react';
import dynamic from 'next/dynamic';
import { AnchorProvider, Program } from '@coral-xyz/anchor';
import { PublicKey, SystemProgram } from '@solana/web3.js';
import { sendTransaction } from '@solana/wallet-adapter-base';
import { useConnection } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import {
  Connection,
  Transaction,
} from '@solana/web3.js';
import {
  web3,
  BN,
} from '@coral-xyz/anchor';
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
  getAccount,
} from '@solana/spl-token';
import idl from '../lib/idl/skillstreak_program.json';

// Constants
console.log("Imported IDL:", idl);

let PROGRAM_ID_STRING;
if (idl && idl.address) {
    PROGRAM_ID_STRING = idl.address;
    console.log("Using Program ID from idl.address:", PROGRAM_ID_STRING);
} else {
    console.error("CRITICAL: IDL file is missing the main 'address' field. Please check your IDL file and build process.");
    // Fallback to our known program ID
    PROGRAM_ID_STRING = 'E6WVbAEb6v6ujmunXtMBpkdycZi9giBwCYKZDeHvqPiT';
}

const PROGRAM_ID = new PublicKey(PROGRAM_ID_STRING);
const USDC_MINT = new PublicKey('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU');
const TREASURY_WALLET = new PublicKey('6R651eq74BXg8zeQEaGX8Fm25z1N8YDqWodv3S9kUFnn');
const USER_SEED = Buffer.from("user");
const VAULT_SEED = Buffer.from("vault");

  const lockPeriods = [
    { id: '1month', label: '1 Month', rate: 0.01, displayRate: '1%' },
    { id: '3months', label: '3 Months', rate: 0.02, displayRate: '2%' },
    { id: '6months', label: '6 Months', rate: 0.035, displayRate: '3.5%' },
    { id: '1year', label: '1 Year', rate: 0.07, displayRate: '6-8%' },
  ];

  const riskLevels = [
    {
      id: 'low',
      title: "Low Risk",
      apy: "2-3% APY",
      color: "blue",
      strategy: "Conservative Strategy",
    description: "Lower returns with minimal risk exposure.",
      allocation: [
        { name: "Stable Lending", percentage: "80%", color: "blue" },
        { name: "Yield Farms", percentage: "20%", color: "emerald" }
      ],
      annualRate: 0.025
    },
    {
      id: 'medium',
      title: "Medium Risk",
      apy: "5-8% APY",
      color: "amber",
      strategy: "Balanced Strategy",
    description: "Moderate returns with calculated risk exposure.",
      allocation: [
        { name: "Stable Lending", percentage: "50%", color: "blue" },
        { name: "AMM Pools", percentage: "30%", color: "amber" },
        { name: "Yield Farms", percentage: "20%", color: "emerald" }
      ],
      annualRate: 0.065
    },
    {
      id: 'high',
      title: "High Risk",
      apy: "10-15% APY",
      color: "purple",
      strategy: "Aggressive Strategy",
    description: "Higher potential returns with increased risk exposure.",
      allocation: [
        { name: "Stable Lending", percentage: "20%", color: "blue" },
        { name: "AMM Pools", percentage: "30%", color: "amber" },
        { name: "Leveraged Yield", percentage: "40%", color: "purple" },
        { name: "New Protocols", percentage: "10%", color: "rose" }
      ],
      annualRate: 0.12
    }
  ];

const Home = () => {
  // Router and Wallet hooks (always first)
  const router = useRouter();
  const { publicKey, sendTransaction, disconnect, wallet } = useWallet();
  const { connection } = useConnection();

  // All useState hooks (grouped together)
  const [mounted, setMounted] = useState(false);
  const [program, setProgram] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [userStatePDA, setUserStatePDA] = useState(null);
  const [userStateDetails, setUserStateDetails] = useState(null);
  const [isUserInitialized, setIsUserInitialized] = useState(null);
  const [depositAmount, setDepositAmount] = useState('0.5');
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [transactionStatus, setTransactionStatus] = useState(null);

  // Add deposit function
  const handleDeposit = async () => {
    if (!program || !publicKey || !connection || !userStatePDA) {
      console.error('Error: Wallet not connected, program not initialized, or user state PDA missing.');
      return;
    }
    
    // Basic input validation
    const depositAmountNum = parseFloat(depositAmount);
    if (isNaN(depositAmountNum) || depositAmountNum <= 0) {
      console.error('Error: Invalid deposit amount.');
      return;
    }

    setIsLoading(true);
    setTransactionStatus(null);

    try {
      // --- 1. Derive PDAs and ATAs ---
      const [vaultPDA] = PublicKey.findProgramAddressSync(
        [VAULT_SEED],
        program.programId
      );
      console.log(`Vault Authority PDA: ${vaultPDA.toBase58()}`);

      const userUsdcAta = getAssociatedTokenAddressSync(USDC_MINT, publicKey);
      console.log(`User USDC ATA: ${userUsdcAta.toBase58()}`);

      // Verify user's USDC ATA exists
      try {
        await getAccount(connection, userUsdcAta, 'confirmed');
        console.log("User's USDC ATA verified.");
      } catch (error) {
        if (error.name === 'TokenAccountNotFoundError') {
          setTransactionStatus({
            type: 'error',
            message: "Error: Your USDC account doesn't exist. Please acquire some Devnet USDC."
          });
    } else {
          console.error("Error checking user's USDC ATA:", error);
          setTransactionStatus({
            type: 'error',
            message: "Error checking USDC account"
          });
        }
        setIsLoading(false);
        return;
      }

      const vaultUsdcAta = getAssociatedTokenAddressSync(USDC_MINT, vaultPDA, true);
      console.log(`Vault USDC ATA: ${vaultUsdcAta.toBase58()}`);

      // --- 2. Prepare Instruction Arguments ---
      const depositAmountLamports = new BN(depositAmountNum * 1_000_000);
      console.log(`Deposit Amount (lamports): ${depositAmountLamports.toString()}`);

      // --- 3. Build the deposit instruction transaction ---
      console.log("Building deposit transaction...");
      const depositTransaction = await program.methods
        .deposit(depositAmountLamports)
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
          rent: web3.SYSVAR_RENT_PUBKEY,
        })
        .transaction();

      // Set fee payer
      depositTransaction.feePayer = publicKey;

      // --- 4. Simulate the transaction ---
      console.log('Simulating deposit transaction...');
      try {
        const simulationResult = await connection.simulateTransaction(depositTransaction, undefined, true);
        if (simulationResult.value.err) {
          console.error("Simulation Error:", simulationResult.value.err);
          console.log("Simulation Logs:", simulationResult.value.logs);
          throw new Error(`Transaction simulation failed: ${simulationResult.value.err}`);
        }
        console.log("Transaction simulation successful.");
      } catch (simError) {
        console.error("Error during simulation:", simError);
        if (simError.simulationLogs) {
          console.log("Simulation Logs (from catch):", simError.simulationLogs);
        }
        setTransactionStatus({
          type: 'error',
          message: 'Transaction simulation failed'
        });
        setIsLoading(false);
        return;
      }

      // --- 5. Send the deposit transaction ---
      console.log('Sending deposit transaction...');
      const depositSignature = await sendTransaction(depositTransaction, connection);
      console.log('Deposit Transaction sent:', depositSignature);

      // --- 6. Confirm Transaction ---
      console.log('Confirming deposit transaction...');
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
      const confirmation = await connection.confirmTransaction({
        signature: depositSignature,
        blockhash,
        lastValidBlockHeight
      }, 'confirmed');

      if (confirmation.value.err) {
        console.error('Deposit transaction confirmation failed:', confirmation.value.err);
        try {
          const txDetails = await connection.getTransaction(depositSignature, {maxSupportedTransactionVersion: 0});
          if (txDetails?.meta?.logMessages) {
            console.log("Failed Deposit Transaction Logs:", txDetails.meta.logMessages.join('\n'));
          }
        } catch (logError) {
          console.error("Could not fetch logs for failed deposit transaction:", logError);
        }
        throw new Error(`Deposit transaction failed: ${confirmation.value.err}`);
      }

      console.log('Deposit transaction confirmed successfully.');
      setTransactionStatus({
        type: 'success',
        message: `Successfully deposited ${depositAmount} USDC`
      });
      
      // Refresh user state
      await fetchAndUpdateUserState();
      setShowDepositModal(false);
    } catch (error) {
      console.error('Deposit error:', error);
      setTransactionStatus({
        type: 'error',
        message: `Failed to deposit: ${error.message}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Add withdraw function
  const handleWithdraw = async () => {
    if (!program || !publicKey || !connection || !userStatePDA) {
      console.error('Error: Prerequisites missing for withdrawal (program, wallet, connection, user PDA).');
      return;
    }

    setIsLoading(true);
    setTransactionStatus(null);
    console.log('Attempting to withdraw funds...');

    try {
      // --- 1. Fetch User State and Current Time ---
      console.log('Fetching user state...');
      const userState = await program.account.userState.fetch(userStatePDA);
      console.log('User State Fetched:', {
        depositAmount: userState.depositAmount.toString(),
        lockInEndTimestamp: userState.lockInEndTimestamp.toString(),
        accruedYield: userState.accruedYield.toString(),
      });

      console.log('Fetching current blockchain time...');
      const currentSlot = await connection.getSlot();
      const currentTimestamp = await connection.getBlockTime(currentSlot);
      console.log(`Current Timestamp: ${currentTimestamp}`);

      const isLocked = currentTimestamp < userState.lockInEndTimestamp.toNumber();
      console.log(`Is withdrawal period still locked? ${isLocked}`);

      // --- 2. Derive Accounts ---
      console.log('Deriving necessary accounts for withdrawal...');
      const [vaultPDA] = PublicKey.findProgramAddressSync(
        [VAULT_SEED],
        program.programId
      );
      console.log(`Vault Authority PDA: ${vaultPDA.toBase58()}`);

      const userUsdcAta = getAssociatedTokenAddressSync(USDC_MINT, publicKey);
      console.log(`User USDC ATA: ${userUsdcAta.toBase58()}`);

      const vaultUsdcAta = getAssociatedTokenAddressSync(USDC_MINT, vaultPDA, true);
      console.log(`Vault USDC ATA: ${vaultUsdcAta.toBase58()}`);

      let withdrawalInstruction;
      let instructionName = isLocked ? 'earlyWithdraw' : 'withdraw';

      // --- 3. Build Correct Instruction (Withdraw or Early Withdraw) ---
      console.log(`Building ${instructionName} transaction...`);

      if (isLocked) {
        // Early Withdraw
        const treasuryTokenAccount = getAssociatedTokenAddressSync(USDC_MINT, TREASURY_WALLET);
        console.log(`Treasury Token ATA: ${treasuryTokenAccount.toBase58()}`);
        console.log(`Using Treasury Wallet Pubkey: ${TREASURY_WALLET.toBase58()}`);

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

        // Log the account metas for debugging
        try {
          const instruction = await withdrawalInstruction.instruction();
          console.log("Raw instruction accounts prepared by Anchor:");
          instruction.keys.forEach((key, index) => {
            console.log(`  [${index}] pubkey: ${key.pubkey.toBase58()}, isSigner: ${key.isSigner}, isWritable: ${key.isWritable}`);
          });

          const expectedTreasuryWalletIndex = 6;
          if (instruction.keys.length > expectedTreasuryWalletIndex) {
            const keyAtIndex = instruction.keys[expectedTreasuryWalletIndex];
            console.log(`Account at expected index ${expectedTreasuryWalletIndex} (treasury_wallet_account): ${keyAtIndex.pubkey.toBase58()}`);
            if (keyAtIndex.pubkey.toBase58() !== TREASURY_WALLET.toBase58()) {
              console.log("!!! Mismatch detected between expected treasury wallet and key at index !!!");
            }
          } else {
            console.log("Error: Could not find expected index for treasury_wallet_account in instruction keys.");
          }
        } catch (err) {
          console.log("Error inspecting withdrawalInstruction accounts:", err);
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
      withdrawalTransaction.feePayer = publicKey;
      console.log(`Simulating ${instructionName} transaction...`);
      try {
        const simulationResult = await connection.simulateTransaction(withdrawalTransaction);
        if (simulationResult.value.err) {
          console.error(`Simulation Error (${instructionName}):`, simulationResult.value.err);
          console.log(`Simulation Logs (${instructionName}):`, simulationResult.value.logs);
          throw new Error(`Transaction simulation failed: ${simulationResult.value.err}`);
        }
        console.log(`Transaction simulation successful (${instructionName}).`);
      } catch (simError) {
        console.error(`Error during simulation (${instructionName}):`, simError);
        if (simError.simulationLogs) {
          console.log(`Simulation Logs (${instructionName}) (from catch):`, simError.simulationLogs);
        }
        setTransactionStatus({
          type: 'error',
          message: 'Transaction simulation failed'
        });
        setIsLoading(false);
        return;
      }

      // --- 5. Send Transaction ---
      console.log(`Sending ${instructionName} transaction...`);
      const withdrawalSignature = await sendTransaction(withdrawalTransaction, connection);
      console.log(`${instructionName.charAt(0).toUpperCase() + instructionName.slice(1)} Transaction sent:`, withdrawalSignature);

      // --- 6. Confirm Transaction ---
      console.log(`Confirming ${instructionName} transaction...`);
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
      const confirmation = await connection.confirmTransaction({
        signature: withdrawalSignature,
        blockhash,
        lastValidBlockHeight
      }, 'confirmed');

      if (confirmation.value.err) {
        console.error(`${instructionName} transaction confirmation failed:`, confirmation.value.err);
        try {
          const txDetails = await connection.getTransaction(withdrawalSignature, {maxSupportedTransactionVersion: 0});
          if (txDetails?.meta?.logMessages) {
            console.log(`Failed ${instructionName} Transaction Logs:`, txDetails.meta.logMessages.join('\n'));
          }
        } catch (logError) {
          console.error(`Could not fetch logs for failed ${instructionName} transaction:`, logError);
        }
        throw new Error(`${instructionName} transaction failed: ${confirmation.value.err}`);
      }

      console.log(`${instructionName.charAt(0).toUpperCase() + instructionName.slice(1)} transaction confirmed successfully.`);
      setTransactionStatus({
        type: 'success',
        message: `Successfully withdrawn funds`
      });
      
      // Refresh user state
      await fetchAndUpdateUserState();
      setShowWithdrawModal(false);
    } catch (error) {
      console.error('Error during withdrawal:', error);
      setTransactionStatus({
        type: 'error',
        message: `Failed to withdraw: ${error.message}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch and update user state function (defined before useEffect)
  const fetchAndUpdateUserState = async (pdaOverride = null) => {
    const pdaToUse = pdaOverride || userStatePDA;
    if (!program || !publicKey || !pdaToUse) {
      setUserStateDetails(null);
      return;
    }
    
    try {
      const fetchedState = await program.account.userState.fetch(pdaToUse, 'confirmed');
      console.log('Fetched user state:', fetchedState);
      setUserStateDetails(fetchedState);
      setTransactionStatus(null);
    } catch (error) {
      console.error('Error fetching user state:', error);
      setUserStateDetails(null);
      setTransactionStatus({ 
        type: 'error', 
        message: 'Failed to fetch user state. Please refresh the page.' 
      });
    }
  };

  // Mount effect (always first useEffect)
  useEffect(() => {
    setMounted(true);
  }, []);

  // Protection effect (second useEffect)
  useEffect(() => {
    if (mounted && !publicKey) {
      router.push('/wallets');
    }
  }, [mounted, publicKey, router]);

  // Program initialization effect (third useEffect)
  useEffect(() => {
    if (publicKey && connection && wallet?.adapter && idl) {
      try {
        const provider = new AnchorProvider(connection, wallet.adapter, { commitment: "processed" });
        if (typeof idl === 'object' && idl !== null) {
          const prog = new Program(idl, provider);
          setProgram(prog);
          console.log('Program initialized');
        } else {
          console.error('Error: Invalid IDL format detected.');
          setProgram(null);
        }
      } catch (error) {
        console.error("Program Initialization Error:", error);
        setProgram(null);
      }
    } else {
      setProgram(null);
    }
  }, [publicKey, connection, wallet]);

  // User state initialization effect (fourth useEffect)
  useEffect(() => {
    const initializeUserState = async () => {
      if (!program || !publicKey || !connection) {
        setIsUserInitialized(null);
        setUserStateDetails(null);
        return;
      }

      try {
        const [pda] = PublicKey.findProgramAddressSync(
          [USER_SEED, publicKey.toBuffer()],
          program.programId
        );
        setUserStatePDA(pda);
        console.log('Derived User State PDA:', pda.toBase58());

        const accountInfo = await connection.getAccountInfo(pda, 'confirmed');
        
        if (accountInfo === null) {
          console.log('User profile not found. Creating...');
          setIsUserInitialized(false);
          
          try {
            const createUserTx = await program.methods
              .createUserState()
              .accounts({
                user: publicKey,
                userState: pda,
                systemProgram: SystemProgram.programId,
              })
              .transaction();

            const sig = await sendTransaction(createUserTx, connection);
            console.log('Create Profile transaction sent:', sig);

            const confirmation = await connection.confirmTransaction({
              signature: sig,
              ...(await connection.getLatestBlockhash()),
            }, 'confirmed');

            if (confirmation.value.err) {
              throw new Error(`User state creation failed: ${confirmation.value.err}`);
            }

            console.log('User profile created successfully');
            setIsUserInitialized(true);
            await fetchAndUpdateUserState(pda);
          } catch (error) {
            console.error('Error creating user profile:', error);
            setTransactionStatus({ 
              type: 'error', 
              message: 'Failed to create profile. Please try again.' 
            });
          }
        } else {
          console.log('User profile found');
          setIsUserInitialized(true);
          await fetchAndUpdateUserState(pda);
        }
      } catch (error) {
        console.error('Error in user state initialization:', error);
        setIsUserInitialized(false);
        setTransactionStatus({ 
          type: 'error', 
          message: 'Failed to initialize profile. Please try again.' 
        });
      }
    };

    initializeUserState();
  }, [program, publicKey, connection]);

  // Early return for client-side rendering
  if (!mounted) return null;

  // Show connect wallet message if no wallet is connected
  if (!publicKey) {
    return (
      <div className="min-h-screen bg-gray-950 text-white px-4 py-12 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Welcome to LockedIn</h1>
          <p className="text-gray-400 mb-8">Please connect a wallet to continue</p>
          <Link 
            href="/wallets"
            className="inline-flex items-center px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors"
          >
            Connect Wallet
          </Link>
                              </div>
                  </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Main Dashboard Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section with Welcome and Disconnect */}
        <div className="flex justify-between items-center mb-8">
          <WelcomeHeader walletAddress={publicKey?.toBase58()} />
                        <button 
            onClick={disconnect}
            className="px-4 py-2 bg-transparent hover:bg-gray-800 text-gray-400 hover:text-white rounded-lg transition-colors flex items-center space-x-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
                            </svg>
            <span>Disconnect</span>
                        </button>
                    </div>
                    
        {/* Loading State */}
        {isUserInitialized === null && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <p className="ml-3 text-gray-400">Initializing your profile...</p>
                            </div>
        )}

        {/* Error State */}
        {isUserInitialized === false && (
          <div className="flex items-center justify-center py-12">
            <div className="bg-red-500/10 text-red-400 px-6 py-4 rounded-lg">
              <p>Failed to initialize your profile. Please try refreshing the page.</p>
                            </div>
                              </div>
        )}

        {/* Transaction Status */}
        {transactionStatus && (
          <div className={`mb-8 p-4 rounded-lg ${
            transactionStatus.type === 'success' ? 'bg-green-500/20 text-green-400' :
            transactionStatus.type === 'error' ? 'bg-red-500/20 text-red-400' :
            'bg-blue-500/20 text-blue-400'
          }`}>
            {transactionStatus.message}
                              </div>
        )}

        {/* User State Overview */}
        {userStateDetails && (
          <div className="grid grid-cols-1 gap-6 mb-8">
            <div className="bg-gray-900 rounded-xl p-6">
                    <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Deposit Amount:</span>
                  <span className="font-mono">{(userStateDetails.depositAmount.toNumber() / 1_000_000).toFixed(6)} USDC</span>
                          </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Initial Deposit:</span>
                  <span className="font-mono">{(userStateDetails.initialDepositAmount.toNumber() / 1_000_000).toFixed(6)} USDC</span>
                        </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Current Streak:</span>
                  <span className="font-mono">{userStateDetails.currentStreak.toString()}</span>
                    </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Miss Count:</span>
                  <span className="font-mono">{userStateDetails.missCount.toString()}</span>
                    </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Deposit Timestamp:</span>
                  <span className="font-mono">
                    {userStateDetails.depositTimestamp.toNumber() ? 
                      new Date(userStateDetails.depositTimestamp.toNumber() * 1000).toLocaleString() : 
                      'N/A'}
                  </span>
                  </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Last Task Timestamp:</span>
                  <span className="font-mono">
                    {userStateDetails.lastTaskTimestamp.toNumber() ? 
                      new Date(userStateDetails.lastTaskTimestamp.toNumber() * 1000).toLocaleString() : 
                      'N/A'}
                  </span>
                    </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Lock-in Ends:</span>
                  <span className="font-mono">
                    {userStateDetails.lockInEndTimestamp.toNumber() ? 
                      new Date(userStateDetails.lockInEndTimestamp.toNumber() * 1000).toLocaleString() : 
                      'Not Started'}
                  </span>
                    </div>
                      <div className="flex justify-between items-center">
                  <span className="text-gray-400">Accrued Yield:</span>
                  <span className="font-mono text-green-400">{(userStateDetails.accruedYield.toNumber() / 1_000_000).toFixed(6)} USDC</span>
                      </div>
                        </div>
                          </div>
                          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-4 mb-8">
              <button 
            onClick={() => setShowDepositModal(true)}
            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 rounded-lg font-medium transition-colors flex items-center"
            disabled={isLoading}
              >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
            Deposit USDC
              </button>
              <button 
            onClick={() => setShowWithdrawModal(true)}
            className="px-6 py-3 bg-purple-500 hover:bg-purple-600 rounded-lg font-medium transition-colors flex items-center"
            disabled={isLoading || !userStateDetails || userStateDetails.depositAmount.toNumber() === 0}
              >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
            Withdraw
              </button>
                </div>
                
        {/* Deposit Modal */}
        {showDepositModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-gray-900 rounded-xl p-6 max-w-md w-full">
              <h3 className="text-xl font-bold mb-4">Deposit USDC</h3>
              <div className="mb-4">
                <label className="block text-gray-400 mb-2">Amount (USDC)</label>
                <input
                  type="number"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="w-full bg-gray-800 rounded-lg px-4 py-2 text-white"
                  placeholder="0.00"
                  min="0"
                  step="0.1"
                />
                </div>
              <div className="flex space-x-4">
              <button 
                  onClick={handleDeposit}
                  disabled={isLoading || !depositAmount || parseFloat(depositAmount) <= 0}
                  className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                  {isLoading ? 'Processing...' : 'Confirm Deposit'}
              </button>
                      <button 
                  onClick={() => setShowDepositModal(false)}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg"
                >
                  Cancel
                      </button>
                  </div>
                      </div>
                    </div>
                  )}

        {/* Withdraw Modal */}
        {showWithdrawModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-gray-900 rounded-xl p-6 max-w-md w-full">
              <h3 className="text-xl font-bold mb-4">Withdraw Funds</h3>
              <div className="flex space-x-4">
                <button 
                  onClick={handleWithdraw}
                  className="flex-1 px-4 py-2 bg-purple-500 hover:bg-purple-600 rounded-lg font-medium"
                  disabled={isLoading || !userStateDetails || userStateDetails.depositAmount.toNumber() === 0}
                >
                  {isLoading ? 'Processing...' : 'Confirm Withdrawal'}
                </button>
                <button 
                  onClick={() => setShowWithdrawModal(false)}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
                              </div>
    </div>
  );
};

export default Home;