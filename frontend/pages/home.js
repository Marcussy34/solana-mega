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

// HeroUI components
import {
  Card,
  CardBody,
  CardHeader,
  CardFooter,
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  Badge,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Tooltip,
  Chip,
  Divider,
  Tabs,
  Tab,
  Progress
} from '@heroui/react';

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
const MARKET_SEED = Buffer.from("market");
const MARKET_ESCROW_VAULT_SEED = Buffer.from("market_escrow_vault");

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

// Add this helper function before the Home component
const calculateAvailableWithdrawal = (userState) => {
  if (!userState) return { available: 0, locked: false };
  
  const currentTime = Math.floor(Date.now() / 1000);
  const isLocked = currentTime < userState.lockInEndTimestamp.toNumber();
  
  const totalBalance = userState.depositAmount.toNumber() + userState.accruedYield.toNumber();
  
  if (isLocked) {
    // If locked, only 50% is available
    return {
      available: totalBalance * 0.5,
      locked: true
    };
  }
  
  // If not locked, full amount is available
  return {
    available: totalBalance,
    locked: false
  };
};

const Home = () => {
  // Router and Wallet hooks
  const router = useRouter();
  const { publicKey, sendTransaction, disconnect, wallet } = useWallet();
  const { connection } = useConnection();

  // State management
  const [mounted, setMounted] = useState(false);
  const [program, setProgram] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [userStatePDA, setUserStatePDA] = useState(null);
  const [userStateDetails, setUserStateDetails] = useState(null);
  const [isUserInitialized, setIsUserInitialized] = useState(null);
  const [depositAmount, setDepositAmount] = useState('0.5');
  const [lockInDays, setLockInDays] = useState('30');
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showStartStreakModal, setShowStartStreakModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [transactionStatus, setTransactionStatus] = useState(null);
  const [notificationVisible, setNotificationVisible] = useState(false);
  const [lockAmount, setLockAmount] = useState('0.5');
  const [showWithdrawUnlockedModal, setShowWithdrawUnlockedModal] = useState(false);
  const [selectedRiskLevel, setSelectedRiskLevel] = useState('low');

  // Add these strategy configurations near other constants
  const strategyConfigs = {
    low: {
      name: "Conservative Strategy",
      apy: "2-3% APY",
      color: "blue",
      description: "Lower returns with minimal risk exposure. Funds are primarily allocated to established lending protocols with battle-tested security.",
      allocation: [
        { name: "Stable Lending", percentage: "80%", color: "blue-500" },
        { name: "Yield Farms", percentage: "20%", color: "green-500" }
      ]
    },
    medium: {
      name: "Balanced Strategy",
      apy: "5-8% APY",
      color: "amber",
      description: "Moderate returns with calculated risk exposure. Balanced allocation across established and emerging protocols.",
      allocation: [
        { name: "Stable Lending", percentage: "50%", color: "blue-500" },
        { name: "AMM Pools", percentage: "30%", color: "amber-500" },
        { name: "Yield Farms", percentage: "20%", color: "green-500" }
      ]
    },
    high: {
      name: "Aggressive Strategy",
      apy: "10-15% APY",
      color: "purple",
      description: "Higher potential returns with increased risk exposure. Significant allocation to emerging protocols and leveraged positions.",
      allocation: [
        { name: "Stable Lending", percentage: "20%", color: "blue-500" },
        { name: "AMM Pools", percentage: "30%", color: "amber-500" },
        { name: "Leveraged Yield", percentage: "40%", color: "purple-500" },
        { name: "New Protocols", percentage: "10%", color: "rose-500" }
      ]
    }
  };

  // Add APY rates configuration
  const apyRates = {
    low: {
      '30': '1%',
      '90': '2%',
      '180': '3.5%',
      '365': '6-8%'
    },
    medium: {
      '30': '2%',
      '90': '4%',
      '180': '7%',
      '365': '10-12%'
    },
    high: {
      '30': '3%',
      '90': '6%',
      '180': '10%',
      '365': '15-20%'
    }
  };

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
          
          // Check if the error is due to insufficient funds
          const isInsufficientFunds = simulationResult.value.logs?.some(log => 
            log.toLowerCase().includes('insufficient funds')
          );
          
          if (isInsufficientFunds) {
            setTransactionStatus({
              type: 'error',
              message: 'Insufficient USDC balance. Please make sure you have enough USDC in your wallet.'
            });
            setShowDepositModal(false);
            throw new Error('Insufficient funds');
          }
          
          throw new Error(`Transaction simulation failed: ${simulationResult.value.err}`);
        }
        console.log("Transaction simulation successful.");
      } catch (simError) {
        console.error("Error during simulation:", simError);
        if (simError.simulationLogs) {
          console.log("Simulation Logs (from catch):", simError.simulationLogs);
          
          // Check for insufficient funds in catch block as well
          const isInsufficientFunds = simError.simulationLogs.some(log => 
            log.toLowerCase().includes('insufficient funds')
          );
          
          if (isInsufficientFunds) {
            setTransactionStatus({
              type: 'error',
              message: 'Insufficient USDC balance. Please make sure you have enough USDC in your wallet.'
            });
            setShowDepositModal(false);
            return;
          }
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
      
      // First close the modal
      setShowDepositModal(false);
      setDepositAmount('0.5'); // Reset deposit amount
      
      // Then update the user state
      await fetchAndUpdateUserState();
      
      // Finally show the success notification
      setTransactionStatus({
        type: 'success',
        message: `Successfully deposited ${depositAmount} USDC`
      });
      
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

      // --- 3. Find and close market state if it exists ---
      const [marketStatePDA] = PublicKey.findProgramAddressSync(
        [MARKET_SEED, publicKey.toBuffer(), userStatePDA.toBuffer()],
        program.programId
      );
      console.log(`Market State PDA: ${marketStatePDA.toBase58()}`);

      // Check if market state exists
      let marketStateExists = false;
      try {
        await program.account.marketState.fetch(marketStatePDA);
        marketStateExists = true;
        console.log('Found existing market state account');
      } catch (err) {
        console.log('No existing market state account found');
      }

      let withdrawalInstruction;
      let instructionName = isLocked ? 'earlyWithdraw' : 'withdraw';

      // --- 4. Build Correct Instruction (Withdraw or Early Withdraw) ---
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

      // If market state exists, add instruction to close it
      if (marketStateExists) {
        console.log('Adding instruction to close market state account');
        const closeMarketInstruction = program.methods
          .closeMarket()
          .accounts({
            user: publicKey,
            marketState: marketStatePDA,
            userState: userStatePDA,
            systemProgram: SystemProgram.programId,
          });
        
        // Add the close market instruction before the withdrawal
        const closeMarketTx = await closeMarketInstruction.transaction();
        withdrawalTransaction.instructions = [...closeMarketTx.instructions, ...withdrawalTransaction.instructions];
      }

      // --- 5. Set Fee Payer and Simulate ---
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
        if (simError.logs) {
          console.log(`Simulation Logs (${instructionName}) (from catch):`, simError.logs);
        }
        setTransactionStatus({
          type: 'error',
          message: 'Transaction simulation failed'
        });
        setIsLoading(false);
        return;
      }

      // --- 6. Send Transaction ---
      console.log(`Sending ${instructionName} transaction...`);
      const withdrawalSignature = await sendTransaction(withdrawalTransaction, connection);
      console.log(`${instructionName.charAt(0).toUpperCase() + instructionName.slice(1)} Transaction sent:`, withdrawalSignature);

      // --- 7. Confirm Transaction ---
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
      
      // First close the modal
      setShowWithdrawModal(false);
      
      // Then update the user state
      await fetchAndUpdateUserState();
      
      // Finally show the success notification
      setTransactionStatus({
        type: 'success',
        message: `Successfully withdrawn funds`
      });
      
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

            createUserTx.feePayer = publicKey;
            const { blockhash } = await connection.getLatestBlockhash();
            createUserTx.recentBlockhash = blockhash;

            // Simulate before sending
            console.log('Simulating create user transaction...');
            const simulation = await connection.simulateTransaction(createUserTx);
            if (simulation.value.err) {
              console.error('Simulation error:', simulation.value.err);
              console.log('Simulation logs:', simulation.value.logs);
              throw new Error(`Transaction simulation failed: ${simulation.value.err}`);
            }

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
            return; // Exit early on error
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

  // Update the useEffect for transaction status
  useEffect(() => {
    if (transactionStatus) {
      // Show notification immediately
      setNotificationVisible(true);
      
      // Set display time to 5 seconds
      const displayTimer = setTimeout(() => {
        // Start fade out
        setNotificationVisible(false);
        
        // Remove from DOM after fade out completes
        const cleanupTimer = setTimeout(() => {
          setTransactionStatus(null);
        }, 500); // Keep 500ms fade out duration
        
        return () => clearTimeout(cleanupTimer);
      }, 5000); // Changed from 8000ms to 5000ms
      
      return () => clearTimeout(displayTimer);
    }
  }, [transactionStatus]);

  // Add start course function
  const handleStartCourse = async () => {
    if (!program || !publicKey || !connection || !userStatePDA) {
        console.error('Error: Prerequisites missing for starting course (program, wallet, connection, user PDA).');
        return;
    }
    
    // Basic input validation
    const lockInDaysNum = parseInt(lockInDays, 10);
    const lockAmountNum = parseFloat(lockAmount);
    if (isNaN(lockInDaysNum) || lockInDaysNum <= 0) {
        console.error('Error: Invalid lock-in days for starting course.');
        return;
    }
    if (isNaN(lockAmountNum) || lockAmountNum <= 0) {
        console.error('Error: Invalid lock amount.');
        return;
    }

    setIsLoading(true);
    setTransactionStatus(null);
    console.log(`Attempting to start course with lock-in of ${lockInDaysNum} days and lock amount of ${lockAmountNum} USDC...`);

    try {
        // First check if user already has an active course
        const userState = await program.account.userState.fetch(userStatePDA);
        const currentTime = Math.floor(Date.now() / 1000);
        const hasActiveCourse = userState.lockInEndTimestamp.toNumber() > currentTime;

        if (hasActiveCourse) {
            setTransactionStatus({
                type: 'error',
                message: 'You already have an active course. Please complete or wait for it to end before starting a new one.'
            });
            setIsLoading(false);
            return;
        }

        // Convert lock amount to lamports (USDC has 6 decimals)
        const lockAmountLamports = new BN(lockAmountNum * 1_000_000);

        // --- 1. Prepare Instruction Arguments ---
        const lockInDaysBN = new BN(lockInDaysNum);
        console.log(`Start Course Lock-in Days (BN): ${lockInDaysBN.toString()}`);
        console.log(`Lock Amount (Lamports): ${lockAmountLamports.toString()}`);

        // --- 2. Derive PDAs for Market Creation ---
        console.log("Deriving PDAs for market creation...");
        
        // Market State PDA - using correct seeds from IDL
        const [marketStatePDA] = PublicKey.findProgramAddressSync(
          [MARKET_SEED, publicKey.toBuffer(), userStatePDA.toBuffer()],
          program.programId
        );
        console.log(`Market State PDA: ${marketStatePDA.toBase58()}`);

        // Market Escrow Vault PDA
        const [marketEscrowVaultPDA] = PublicKey.findProgramAddressSync(
          [MARKET_ESCROW_VAULT_SEED, marketStatePDA.toBuffer()],
          program.programId
        );
        console.log(`Market Escrow Vault PDA: ${marketEscrowVaultPDA.toBase58()}`);

        // Market Escrow Token Account ATA
        const marketEscrowTokenAccount = getAssociatedTokenAddressSync(
          USDC_MINT,
          marketEscrowVaultPDA,
          true
        );
        console.log(`Market Escrow Token Account: ${marketEscrowTokenAccount.toBase58()}`);

        // User's USDC ATA
        const userUsdcAta = getAssociatedTokenAddressSync(USDC_MINT, publicKey);
        console.log(`User USDC ATA: ${userUsdcAta.toBase58()}`);

        // --- 3. Build the start_course instruction transaction ---
        console.log("Building start_course transaction...");
        const startCourseTx = await program.methods
            .startCourse(lockInDaysBN, lockAmountLamports)
            .accounts({
                user: publicKey,
                userState: userStatePDA,
                userTokenAccount: userUsdcAta,
                marketState: marketStatePDA,
                marketEscrowVault: marketEscrowVaultPDA,
                marketEscrowTokenAccount: marketEscrowTokenAccount,
                usdcMint: USDC_MINT,
                systemProgram: SystemProgram.programId,
                tokenProgram: TOKEN_PROGRAM_ID,
                associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
                rent: web3.SYSVAR_RENT_PUBKEY,
            })
            .transaction();

        // --- 4. Set Fee Payer and Recent Blockhash ---
        startCourseTx.feePayer = publicKey;
        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
        startCourseTx.recentBlockhash = blockhash;

        // --- 5. Simulate Transaction ---
        console.log('Simulating transaction...');
        try {
            const simulationResult = await connection.simulateTransaction(startCourseTx);
            
            if (simulationResult.value.err) {
                console.error("Simulation Error:", simulationResult.value.err);
                if (simulationResult.value.logs) {
                    console.log("Simulation Logs:", simulationResult.value.logs);
                    // Check if the error is related to the market state account
                    if (simulationResult.value.logs.some(log => log.includes('already in use'))) {
                        throw new Error('Market state account already exists. Please try again in a moment.');
                    }
                }
                throw new Error(`Transaction simulation failed: ${JSON.stringify(simulationResult.value.err)}`);
            }
            console.log("Transaction simulation successful.");
            
            // Log all accounts for debugging
            console.log("Transaction accounts:", startCourseTx.instructions[0].keys.map(k => ({
                pubkey: k.pubkey.toBase58(),
                isSigner: k.isSigner,
                isWritable: k.isWritable
            })));
        } catch (simError) {
            console.error("Error during simulation:", simError);
            if (simError.logs) {
                console.log("Simulation Logs:", simError.logs);
            }
            throw simError;
        }

        // --- 6. Send Transaction ---
        console.log('Sending transaction...');
        const startCourseSig = await sendTransaction(startCourseTx, connection);
        console.log('Transaction sent:', startCourseSig);

        // --- 7. Confirm Transaction ---
        console.log('Confirming transaction...');
        const confirmation = await connection.confirmTransaction({
            signature: startCourseSig,
            blockhash,
            lastValidBlockHeight
        }, 'confirmed');

        if (confirmation.value.err) {
            throw new Error(`Transaction failed: ${confirmation.value.err}`);
        }

        console.log('Transaction confirmed successfully.');
        
        // Close modal and update state
        setShowStartStreakModal(false);
        setLockInDays('30');
        setLockAmount('0.5'); // Reset lock amount
        await fetchAndUpdateUserState();
        
        setTransactionStatus({
            type: 'success',
            message: `Successfully started course with ${lockInDays} day lock-in and ${lockAmount} USDC locked`
        });
        
    } catch (error) {
        console.error('Error during start_course:', error);
        setTransactionStatus({
            type: 'error',
            message: `Failed to start course: ${error.message}`
        });
    } finally {
        setIsLoading(false);
    }
};

  // Early return for client-side rendering
  if (!mounted) return null;

  // Show connect wallet message if no wallet is connected
  if (!publicKey) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-gray-800/50 backdrop-blur-md border border-gray-700 shadow-xl">
          <CardHeader className="flex flex-col items-center gap-2 pb-6">
            <h1 className="text-4xl font-bold text-white">SkillStreak</h1>
            <p className="text-gray-400">Learn, earn, and grow your crypto</p>
          </CardHeader>
          <CardBody>
            <p className="text-center text-gray-300 mb-8">Please connect a wallet to access your dashboard</p>
            <Button 
              as={Link}
              href="/wallets"
              color="primary" 
              className="w-full py-6"
              size="lg"
            >
              Connect Wallet
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  // Helper function to format dates nicely
  const formatDate = (timestamp) => {
    if (!timestamp) return 'Not Set';
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // Helper function to get status for lock period
  const getLockStatus = () => {
    if (!userStateDetails || !userStateDetails.lockInEndTimestamp.toNumber()) {
      return { label: 'Not Started', color: 'default' };
    }
    
    const currentTime = Math.floor(Date.now() / 1000);
    const lockEndTime = userStateDetails.lockInEndTimestamp.toNumber();
    
    if (currentTime > lockEndTime) {
      return { label: 'Completed', color: 'success' };
    } else {
      return { label: 'Active', color: 'primary' };
    }
  };
  
  // Helper function to get streak status indicator
  const getStreakStatus = () => {
    if (!userStateDetails) return { label: 'No Data', color: 'default' };
    
    const missCount = userStateDetails.missCount.toNumber();
    
    if (missCount === 0) {
      return { label: 'Perfect', color: 'success' };
    } else if (missCount < 3) {
      return { label: 'Good', color: 'warning' };
    } else {
      return { label: 'Penalty Mode', color: 'danger' };
    }
  };

  // Add withdraw unlocked function
  const handleWithdrawUnlocked = async () => {
    if (!program || !publicKey || !connection || !userStatePDA) {
        console.error('Error: Prerequisites missing for withdraw unlocked (program, wallet, connection, user PDA).');
        return;
    }

    setIsLoading(true);
    setTransactionStatus(null);
    console.log('Attempting to withdraw unlocked funds...');

    try {
        // --- 1. Derive Accounts ---
        console.log('Deriving necessary accounts for withdraw unlocked...');
        const [vaultPDA] = PublicKey.findProgramAddressSync(
            [VAULT_SEED],
            program.programId
        );
        console.log(`Vault Authority PDA: ${vaultPDA.toBase58()}`);

        const userUsdcAta = getAssociatedTokenAddressSync(USDC_MINT, publicKey);
        console.log(`User USDC ATA: ${userUsdcAta.toBase58()}`);

        const vaultUsdcAta = getAssociatedTokenAddressSync(USDC_MINT, vaultPDA, true);
        console.log(`Vault USDC ATA: ${vaultUsdcAta.toBase58()}`);

        // --- 2. Build withdraw_unlocked instruction ---
        console.log('Building withdraw_unlocked transaction...');
        const withdrawUnlockedTx = await program.methods
            .withdrawUnlocked()
            .accounts({
                user: publicKey,
                userState: userStatePDA,
                userTokenAccount: userUsdcAta,
                vault: vaultPDA,
                vaultTokenAccount: vaultUsdcAta,
                usdcMint: USDC_MINT,
                tokenProgram: TOKEN_PROGRAM_ID,
            })
            .transaction();

        // --- 3. Set Fee Payer and Simulate ---
        withdrawUnlockedTx.feePayer = publicKey;
        console.log('Simulating withdraw_unlocked transaction...');
        try {
            const simulationResult = await connection.simulateTransaction(withdrawUnlockedTx);
            if (simulationResult.value.err) {
                console.error('Simulation Error:', simulationResult.value.err);
                console.log('Simulation Logs:', simulationResult.value.logs);
                throw new Error(`Transaction simulation failed: ${simulationResult.value.err}`);
            }
            console.log('Transaction simulation successful.');
        } catch (simError) {
            console.error('Error during simulation:', simError);
            if (simError.logs) {
                console.log('Simulation Logs:', simError.logs);
            }
            setTransactionStatus({
                type: 'error',
                message: 'Transaction simulation failed'
            });
            setIsLoading(false);
            return;
        }

        // --- 4. Send Transaction ---
        console.log('Sending withdraw_unlocked transaction...');
        const withdrawSig = await sendTransaction(withdrawUnlockedTx, connection);
        console.log('Transaction sent:', withdrawSig);

        // --- 5. Confirm Transaction ---
        console.log('Confirming transaction...');
        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
        const confirmation = await connection.confirmTransaction({
            signature: withdrawSig,
            blockhash,
            lastValidBlockHeight
        }, 'confirmed');

        if (confirmation.value.err) {
            throw new Error(`Transaction failed: ${confirmation.value.err}`);
        }

        console.log('Transaction confirmed successfully.');
        
        // Close modal and update state
        setShowWithdrawUnlockedModal(false);
        await fetchAndUpdateUserState();
        
        setTransactionStatus({
            type: 'success',
            message: 'Successfully withdrawn unlocked funds to wallet'
        });
        
    } catch (error) {
        console.error('Error during withdraw unlocked:', error);
        setTransactionStatus({
            type: 'error',
            message: `Failed to withdraw: ${error.message}`
        });
    } finally {
        setIsLoading(false);
    }
};

  return (
    <div className="min-h-screen bg-[#0A0B0D] text-white font-inter">
      {/* Navbar */}
      <Navbar 
        className="bg-[#0A0B0D]/95 backdrop-blur-md border-b border-gray-800/50"
        maxWidth="full"
        position="sticky"
      >
        <NavbarBrand>
          <h1 className="font-medium text-xl">SkillStreak</h1>
        </NavbarBrand>
        <NavbarContent justify="end">
          <NavbarItem>
            <Tooltip content={publicKey?.toBase58()}>
              <Chip
                className="bg-gray-800/50 border border-gray-700"
                size="sm"
                variant="flat"
              >
                {publicKey?.toBase58().slice(0, 4)}...{publicKey?.toBase58().slice(-4)}
              </Chip>
            </Tooltip>
          </NavbarItem>
          <NavbarItem>
            <Button 
              className="bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700"
              size="sm"
              onClick={disconnect}
              startContent={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
                </svg>
              }
            >
              Disconnect
            </Button>
          </NavbarItem>
        </NavbarContent>
      </Navbar>
      
      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Loading State */}
        {isUserInitialized === null && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <p className="mt-4 text-gray-400 text-sm">Loading your profile...</p>
          </div>
        )}

        {/* Error State */}
        {isUserInitialized === false && (
          <div className="flex items-center justify-center py-12">
            <Card className="bg-red-500/10 border border-red-500/20">
              <CardBody>
                <p className="text-red-400 text-sm">Failed to initialize your profile. Please try refreshing the page.</p>
              </CardBody>
            </Card>
          </div>
        )}

        {/* Transaction Status */}
        {transactionStatus && (
          <div 
            className="fixed bottom-8 right-8 max-w-sm w-full z-50"
            style={{
              opacity: notificationVisible ? 1 : 0,
              transform: notificationVisible ? 'translateY(0)' : 'translateY(20px)',
              transition: 'all 0.5s ease-in-out',
              pointerEvents: 'none'
            }}
          >
            <Card 
              className={`
                ${transactionStatus.type === 'success' ? 'bg-green-500/10 border-green-500/20' :
                  transactionStatus.type === 'error' ? 'bg-red-500/10 border-red-500/20' :
                  'bg-blue-500/10 border-blue-500/20'} 
                border shadow-lg backdrop-blur-sm
              `}
            >
              <CardBody className="py-4 px-5">
                <div className="flex items-start gap-3"> {/* Changed from items-center to items-start */}
                  {transactionStatus.type === 'success' ? (
                    <div className="rounded-full p-2 bg-green-500/20 mt-0.5"> {/* Added mt-0.5 for better alignment */}
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  ) : transactionStatus.type === 'error' ? (
                    <div className="rounded-full p-2 bg-red-500/20 mt-0.5"> {/* Added mt-0.5 for better alignment */}
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                  ) : (
                    <div className="rounded-full p-2 bg-blue-500/20 mt-0.5"> {/* Added mt-0.5 for better alignment */}
                      <svg className="animate-spin h-5 w-5 text-blue-400" viewBox="0 0 24 24">
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                    </div>
                  )}
                  <div className="flex-1"> {/* Added wrapper div for text content */}
                    <p className={`text-sm font-medium ${
                      transactionStatus.type === 'success' ? 'text-green-400' :
                      transactionStatus.type === 'error' ? 'text-red-400' :
                      'text-blue-400'
                    }`}>
                      {transactionStatus.message}
                    </p>
                    {transactionStatus.type === 'error' && transactionStatus.message.includes('USDC') && (
                      <p className="text-xs text-gray-400 mt-1">
                        Need USDC? Visit the faucet to get some test tokens.
                      </p>
                    )}
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        )}

        {/* Dashboard Content */}
        {userStateDetails && (
          <div className="space-y-6">
            {/* Main Balance Card */}
            <Card className="bg-gradient-to-b from-gray-800/50 to-gray-900/50 border border-gray-700/50 shadow-xl overflow-hidden rounded-2xl">
                <CardBody className="p-8">
                    <div className="space-y-8">
                        {/* Balance Header */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <h2 className="text-2xl font-medium">Your Balance</h2>
                                <Tooltip
                                    content={
                                        <div className="max-w-xs p-2">
                                            <p className="text-sm">
                                                This is your learning account balance. When starting a streak, you can choose how much to lock from this account.
                                            </p>
                                        </div>
                                    }
                                    placement="right"
                                >
                                    <div className="cursor-help">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                </Tooltip>
                            </div>
                            <div className="flex items-center gap-4">
                                <Button
                                    className="bg-green-600/50 hover:bg-green-500/50 border border-green-500/50 rounded-xl px-4 py-2"
                                    onClick={() => setShowDepositModal(true)}
                                    startContent={
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                                        </svg>
                                    }
                                >
                                    Deposit
                                </Button>
                                <Button
                                    className="bg-gray-700/50 hover:bg-gray-600/50 border border-gray-600/50 rounded-xl px-4 py-2"
                                    onClick={() => setShowWithdrawUnlockedModal(true)}
                                    startContent={
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                                        </svg>
                                    }
                                >
                                    Withdraw
                                </Button>
                                <Chip
                                    className={`${userStateDetails.depositAmount.toNumber() > 0 ? 
                                        'bg-green-500/10 border-green-500/20 text-green-400' : 
                                        'bg-gray-500/10 border-gray-500/20 text-gray-400'
                                    } border`}
                                    size="sm"
                                >
                                    {userStateDetails.depositAmount.toNumber() > 0 ? "Active" : "Inactive"}
                                </Chip>
                            </div>
                        </div>

                        {/* Balance Amount */}
                        <div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-medium tracking-tight">
                                    {((userStateDetails.depositAmount.toNumber() - userStateDetails.initialDepositAmount.toNumber()) / 1_000_000).toFixed(2)}
                                </span>
                                <span className="text-gray-400">USDC</span>
                            </div>
                            <div className="mt-4 grid grid-cols-3 gap-6">
                                <div>
                                    <p className="text-sm text-gray-400 mb-1">Locked Amount</p>
                                    <p className="text-lg font-medium">
                                        {(userStateDetails.initialDepositAmount.toNumber() / 1_000_000).toFixed(2)}
                                        <span className="text-sm text-gray-400 ml-1">USDC</span>
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-400 mb-1">Total Balance</p>
                                    <p className="text-lg font-medium">
                                        {(userStateDetails.depositAmount.toNumber() / 1_000_000).toFixed(2)}
                                        <span className="text-sm text-gray-400 ml-1">USDC</span>
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-400 mb-1">Accrued Yield</p>
                                    <p className="text-lg font-medium text-green-400">
                                        +{(userStateDetails.accruedYield.toNumber() / 1_000_000).toFixed(4)}
                                        <span className="text-sm text-gray-400 ml-1">USDC</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardBody>
            </Card>

            {/* Get Started Section - Only show when no deposits */}
            {userStateDetails && userStateDetails.depositAmount.toNumber() === 0 && (
              <Card className="bg-blue-500/10 border-2 border-blue-500/20 shadow-xl overflow-hidden rounded-2xl">
                <CardBody className="p-8">
                  <div className="flex items-center gap-6">
                    <div className="p-4 rounded-full bg-blue-500/20 border border-blue-500/30">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-medium mb-2">Get Started with SkillStreak</h3>
                      <p className="text-gray-400 mb-4">Make your first deposit to start earning while learning. </p>
                      <div className="flex gap-4">
                        <Button
                          className="bg-blue-500 hover:bg-blue-600 text-white rounded-xl"
                          onClick={() => setShowDepositModal(true)}
                          startContent={
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                            </svg>
                          }
                        >
                          Make Your First Deposit
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>
            )}

            {/* Start Your First Streak Section - Show when has deposits but no streak */}
            {userStateDetails && 
              userStateDetails.depositAmount.toNumber() > 0 && (
              <Card className="bg-green-500/10 border-2 border-green-500/20 shadow-xl overflow-hidden rounded-2xl">
                <CardBody className="p-8">
                  <div className="flex items-center gap-6">
                    <div className="p-4 rounded-full bg-green-500/20 border border-green-500/30">
                      {!userStateDetails.lockInEndTimestamp.toNumber() ? (
                        // Show checkmark icon for starting streak
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        // Show fire icon for active streak
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd"/>
                        </svg>
                      )}
                    </div>
                    <div className="flex-1">
                      {!userStateDetails.lockInEndTimestamp.toNumber() ? (
                        // Content for starting streak
                        <>
                          <h3 className="text-xl font-medium mb-2">Start a Streak</h3>
                          <p className="text-gray-400 mb-4">You're ready to begin! Lock your funds, maintain your streak by completing daily tasks, and earn higher yields on your deposit.</p>
                          <div className="flex gap-4">
                            <Button
                              className="bg-green-600 hover:bg-green-700 text-white rounded-xl"
                              onClick={() => setShowStartStreakModal(true)}
                              startContent={
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 011.414-1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
                                </svg>
                              }
                            >
                              Start Your Streak
                            </Button>
                            <Button
                              className="bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl"
                              as={Link}
                              href="/learn"
                              startContent={
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                  <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                                </svg>
                              }
                            >
                              View Tasks
                            </Button>
                          </div>
                        </>
                      ) : (
                        // Content for active streak
                        <>
                          <h3 className="text-xl font-medium mb-2">Your Streak is Active!</h3>
                          <p className="text-gray-400 mb-4">Keep your streak going by completing daily tasks. Your funds are locked and earning yield until {formatDate(userStateDetails.lockInEndTimestamp.toNumber())}.</p>
                          <div className="flex gap-4">
                            <Button
                              className="bg-green-600 hover:bg-green-700 text-white rounded-xl"
                              as={Link}
                              href="/learn"
                              startContent={
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 011.414-1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
                                </svg>
                              }
                            >
                              Continue Streak
                            </Button>
                            <Button
                              className="bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl"
                              as={Link}
                              href="/learn"
                              startContent={
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                  <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                                </svg>
                              }
                            >
                              View Tasks
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </CardBody>
              </Card>
            )}

            {/* Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Lock Period Card */}
              <Card className="bg-gray-800/30 border border-gray-700/50 rounded-2xl">
                <CardBody className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-blue-500/10 border border-blue-500/20">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <h3 className="font-medium">Lock Period</h3>
                    </div>
                    <Chip 
                      className={`${getLockStatus().label === 'Active' ? 
                        'bg-green-500/10 border-green-500/20 text-green-400' : 
                        'bg-gray-500/10 border-gray-500/20 text-gray-400'
                      } border`}
                      size="sm"
                    >
                      {getLockStatus().label}
                    </Chip>
                  </div>

                  {userStateDetails.lockInEndTimestamp.toNumber() ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-400 mb-1">Started</p>
                          <p className="font-mono">{formatDate(userStateDetails.depositTimestamp.toNumber())}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 mb-1">Ends</p>
                          <p className="font-mono">{formatDate(userStateDetails.lockInEndTimestamp.toNumber())}</p>
                        </div>
                      </div>
                      <Progress 
                        value={Math.min(100, Math.max(0, 
                          (Math.floor(Date.now() / 1000) - userStateDetails.depositTimestamp.toNumber()) / 
                          (userStateDetails.lockInEndTimestamp.toNumber() - userStateDetails.depositTimestamp.toNumber()) * 100
                        ))}
                        className="h-1"
                        color="primary"
                      />
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">Start a streak to view your lock period</p>
                  )}
                </CardBody>
              </Card>

              {/* Streak Card */}
              <Card className="bg-gray-800/30 border border-gray-700/50 rounded-2xl">
                <CardBody className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-green-500/10 border border-green-500/20">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <h3 className="font-medium">Learning Streak</h3>
                    </div>
                    <Chip 
                      className={`${getStreakStatus().color === 'success' ? 
                        'bg-green-500/10 border-green-500/20 text-green-400' : 
                        'bg-gray-500/10 border-gray-500/20 text-gray-400'
                      } border`}
                      size="sm"
                    >
                      {getStreakStatus().label}
                    </Chip>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-400 mb-1">Current</p>
                      <p>{userStateDetails.currentStreak.toNumber()} days</p>
                    </div>
                    <div>
                      <p className="text-gray-400 mb-1">Missed</p>
                      <p>{userStateDetails.missCount.toNumber()} sessions</p>
                    </div>
                    <div>
                      <p className="text-gray-400 mb-1">Last Activity</p>
                      <p>{userStateDetails.lastTaskTimestamp.toNumber() ? 
                        formatDate(userStateDetails.lastTaskTimestamp.toNumber()) : 
                        'No activity'}</p>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </div>

            {/* Action Buttons */}
            {userStateDetails && userStateDetails.initialDepositAmount.toNumber() > 0 && (
                <div className="fixed bottom-0 left-0 right-0 bg-[#0A0B0D]/95 backdrop-blur-md border-t border-gray-800/50 p-4">
                    <div className="max-w-4xl mx-auto flex gap-4">
                        <Button
                            className="flex-1 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl"
                            size="lg"
                            onClick={() => setShowWithdrawModal(true)}
                            disabled={userStateDetails.initialDepositAmount.toNumber() === 0}
                            startContent={
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                                </svg>
                            }
                        >
                            Withdraw Locked Funds ({(userStateDetails.initialDepositAmount.toNumber() / 1_000_000).toFixed(2)} USDC)
                        </Button>
                    </div>
                </div>
            )}
          </div>
        )}

        {/* Deposit Modal */}
        <Modal 
          isOpen={showDepositModal} 
          onClose={() => setShowDepositModal(false)}
          backdrop="blur"
          placement="center"
          classNames={{
            backdrop: "bg-black/60",
            base: "bg-[#0A0B0D] border border-gray-800/50 shadow-xl text-white rounded-2xl",
            header: "border-b border-gray-800/50",
            body: "py-6",
            footer: "border-t border-gray-800/50"
          }}
          size="sm"
        >
          <ModalContent>
            <ModalHeader className="flex flex-col gap-1">
              <h3 className="text-xl font-medium">Deposit USDC</h3>
              <p className="text-sm text-gray-400">Add funds to your learning wallet</p>
            </ModalHeader>
            <ModalBody>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-sm text-gray-400">Amount</label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      min="0"
                      step="0.1"
                      placeholder="0.00"
                      variant="flat"
                      className="w-full"
                      startContent={
                        <div className="pointer-events-none flex items-center">
                          <span className="text-gray-400">$</span>
                        </div>
                      }
                      endContent={
                        <div className="flex items-center">
                          <span className="text-gray-400">USDC</span>
                        </div>
                      }
                      classNames={{
                        input: [
                          "text-lg",
                          "font-medium",
                          "bg-transparent",
                          "pl-1"
                        ],
                        inputWrapper: [
                          "h-12",
                          "bg-gray-800/50",
                          "hover:bg-gray-800",
                          "group-data-[focused=true]:bg-gray-800",
                          "!border-0",
                          "shadow-none",
                          "rounded-xl"
                        ]
                      }}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 px-3 py-2 bg-gray-800/50 rounded-xl">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <p className="text-xs text-gray-400">
                    Funds can be withdrawn anytime unless locked in a streak
                  </p>
                </div>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button 
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-white border border-gray-700 rounded-xl"
                onClick={() => setShowDepositModal(false)}
              >
                Cancel
              </Button>
              <Button 
                className={`flex-1 rounded-xl flex items-center justify-center gap-2 ${
                  isLoading 
                    ? 'bg-blue-500 cursor-not-allowed' 
                    : 'bg-blue-500 hover:bg-blue-600'
                } text-white`}
                onClick={handleDeposit}
                disabled={isLoading || !depositAmount || parseFloat(depositAmount) <= 0}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    <span>Processing...</span>
                  </>
                ) : (
                  'Confirm Deposit'
                )}
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Start Streak Modal */}
        <Modal 
          isOpen={showStartStreakModal} 
          onClose={() => setShowStartStreakModal(false)}
          backdrop="blur"
          placement="center"
          classNames={{
            backdrop: "bg-black/60",
            base: "bg-[#0A0B0D] border border-gray-800/50 shadow-xl text-white rounded-2xl w-[480px] max-w-[90vw] max-h-[85vh]",
            header: "border-b border-gray-800/50 py-3",
            body: "py-4 overflow-y-auto max-h-[calc(85vh-120px)]",
            footer: "border-t border-gray-800/50 py-3"
          }}
          size="md"
        >
          <style jsx global>{`
            /* Hide number input spinners */
            input[type=number]::-webkit-inner-spin-button,
            input[type=number]::-webkit-outer-spin-button {
              -webkit-appearance: none;
              margin: 0;
            }
            input[type=number] {
              -moz-appearance: textfield;
            }
          `}</style>
          <ModalContent>
            <ModalHeader className="flex flex-col gap-1">
              <h3 className="text-lg font-medium">Start Your Learning Streak</h3>
              <p className="text-sm text-gray-400">Choose a lock-in period and amount to begin</p>
            </ModalHeader>
            <ModalBody>
              <div className="space-y-4 px-1">
                {/* Lock Amount Input - At the very top */}
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Lock Amount (USDC)</label>
                  <Input
                    type="number"
                    value={lockAmount}
                    onChange={(e) => setLockAmount(e.target.value)}
                    min="0.1"
                    step="0.1"
                    variant="flat"
                    className="w-full"
                    startContent={
                      <div className="pointer-events-none flex items-center">
                        <span className="text-gray-400">$</span>
                      </div>
                    }
                    endContent={
                      <div className="flex items-center">
                        <span className="text-gray-400">USDC</span>
                      </div>
                    }
                    classNames={{
                      input: [
                        "text-lg",
                        "font-medium",
                        "bg-transparent",
                        "pl-1"
                      ],
                      inputWrapper: [
                        "h-12",
                        "bg-gray-800/50",
                        "hover:bg-gray-800",
                        "group-data-[focused=true]:bg-gray-800",
                        "!border-0",
                        "shadow-none",
                        "rounded-xl"
                      ]
                    }}
                  />
                </div>

                {/* Risk Level & Strategy Section */}
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm text-gray-400 mb-3">Risk Level & Strategy</h4>
                    <div className="flex gap-2 mb-4">
                      <Button
                        className={`flex-1 ${selectedRiskLevel === 'low' ? 
                          'bg-blue-500 hover:bg-blue-600' : 
                          'bg-gray-800/50 hover:bg-gray-700/50'} text-white rounded-xl`}
                        onClick={() => setSelectedRiskLevel('low')}
                      >
                        Low Risk
                      </Button>
                      <Button
                        className={`flex-1 ${selectedRiskLevel === 'medium' ? 
                          'bg-amber-500 hover:bg-amber-600' : 
                          'bg-gray-800/50 hover:bg-gray-700/50'} text-white rounded-xl`}
                        onClick={() => setSelectedRiskLevel('medium')}
                      >
                        Medium Risk
                      </Button>
                      <Button
                        className={`flex-1 ${selectedRiskLevel === 'high' ? 
                          'bg-purple-500 hover:bg-purple-600' : 
                          'bg-gray-800/50 hover:bg-gray-700/50'} text-white rounded-xl`}
                        onClick={() => setSelectedRiskLevel('high')}
                      >
                        High Risk
                      </Button>
                    </div>

                    {selectedRiskLevel === 'high' && (
                      <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 mb-4">
                        <div className="flex items-center gap-2 text-purple-400">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                          <p className="text-xs">
                            Higher risk exposure significantly increases potential for losses. Only allocate funds you can afford to lose.
                          </p>
                        </div>
                      </div>
                    )}

                    <div className={`p-4 rounded-xl ${
                      selectedRiskLevel === 'low' ? 'bg-blue-500/10 border-blue-500/20' :
                      selectedRiskLevel === 'medium' ? 'bg-amber-500/10 border-amber-500/20' :
                      'bg-purple-500/10 border-purple-500/20'
                    } border`}>
                      <div className="flex justify-between items-center mb-2">
                        <h3 className={`text-lg ${
                          selectedRiskLevel === 'low' ? 'text-blue-400' :
                          selectedRiskLevel === 'medium' ? 'text-amber-400' :
                          'text-purple-400'
                        }`}>
                          {strategyConfigs[selectedRiskLevel].name}
                        </h3>
                        <span className={
                          selectedRiskLevel === 'low' ? 'text-blue-400' :
                          selectedRiskLevel === 'medium' ? 'text-amber-400' :
                          'text-purple-400'
                        }>
                          {strategyConfigs[selectedRiskLevel].apy}
                        </span>
                      </div>
                      <p className="text-gray-400 text-sm mb-4">
                        {strategyConfigs[selectedRiskLevel].description}
                      </p>
                      
                      <div className="space-y-2">
                        <h4 className="text-sm text-gray-400">Asset Allocation</h4>
                        <div className="flex flex-wrap items-center gap-3">
                          {strategyConfigs[selectedRiskLevel].allocation.map((asset, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-full bg-${asset.color}`}></div>
                              <span className="text-sm text-gray-300">{asset.percentage} {asset.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Lock-in Period Section */}
                <div>
                  <h4 className="text-sm text-gray-400 mb-3">Lock-in Period</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      className={`h-[52px] ${lockInDays === '30' ? 
                        'bg-blue-500/20 border-blue-500/30 text-blue-400' : 
                        'bg-gray-800/50 border-gray-700/50 hover:bg-gray-700/50'} border rounded-xl flex flex-col items-start justify-center px-4`}
                      onClick={() => setLockInDays('30')}
                    >
                      <div className="font-medium">1 Month</div>
                      <div className="text-xs text-gray-400">{apyRates[selectedRiskLevel]['30']}</div>
                    </Button>
                    <Button
                      className={`h-[52px] ${lockInDays === '90' ? 
                        'bg-blue-500/20 border-blue-500/30 text-blue-400' : 
                        'bg-gray-800/50 border-gray-700/50 hover:bg-gray-700/50'} border rounded-xl flex flex-col items-start justify-center px-4`}
                      onClick={() => setLockInDays('90')}
                    >
                      <div className="font-medium">3 Months</div>
                      <div className="text-xs text-gray-400">{apyRates[selectedRiskLevel]['90']}</div>
                    </Button>
                    <Button
                      className={`h-[52px] ${lockInDays === '180' ? 
                        'bg-blue-500/20 border-blue-500/30 text-blue-400' : 
                        'bg-gray-800/50 border-gray-700/50 hover:bg-gray-700/50'} border rounded-xl flex flex-col items-start justify-center px-4`}
                      onClick={() => setLockInDays('180')}
                    >
                      <div className="font-medium">6 Months</div>
                      <div className="text-xs text-gray-400">{apyRates[selectedRiskLevel]['180']}</div>
                    </Button>
                    <Button
                      className={`h-[52px] ${lockInDays === '365' ? 
                        'bg-blue-500/20 border-blue-500/30 text-blue-400' : 
                        'bg-gray-800/50 border-gray-700/50 hover:bg-gray-700/50'} border rounded-xl flex flex-col items-start justify-center px-4`}
                      onClick={() => setLockInDays('365')}
                    >
                      <div className="font-medium">1 Year</div>
                      <div className="text-xs text-gray-400">{apyRates[selectedRiskLevel]['365']}</div>
                    </Button>
                  </div>

                  <div className="mt-3">
                    <Input
                      type="number"
                      value={lockInDays}
                      onChange={(e) => setLockInDays(e.target.value)}
                      min="1"
                      step="1"
                      variant="flat"
                      className="w-full"
                      endContent={
                        <div className="flex items-center">
                          <span className="text-gray-400">days</span>
                        </div>
                      }
                      classNames={{
                        input: [
                          "text-lg",
                          "font-medium",
                          "bg-transparent",
                          "text-center" // Center the text
                        ],
                        inputWrapper: [
                          "h-12",
                          "bg-gray-800/50",
                          "hover:bg-gray-800",
                          "group-data-[focused=true]:bg-gray-800",
                          "!border-0",
                          "shadow-none",
                          "rounded-xl"
                        ]
                      }}
                    />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-gray-800/50 border border-gray-700/50">
                  <div className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-400 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <p className="text-xs text-gray-400">
                      The specified amount will be locked for the duration of your learning streak. Complete daily tasks to earn yield.
                    </p>
                  </div>
                </div>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button 
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-white border border-gray-700 rounded-xl"
                onClick={() => setShowStartStreakModal(false)}
              >
                Cancel
              </Button>
              <Button 
                className={`flex-1 rounded-xl flex items-center justify-center gap-2 ${
                  isLoading 
                    ? 'bg-green-600 cursor-not-allowed' 
                    : 'bg-green-600 hover:bg-green-700'
                } text-white`}
                onClick={handleStartCourse}
                disabled={isLoading || !lockInDays || parseInt(lockInDays) <= 0 || !lockAmount || parseFloat(lockAmount) <= 0}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    <span>Processing...</span>
                  </>
                ) : (
                  'Start Learning Streak'
                )}
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Withdraw Modal */}
        <Modal 
          isOpen={showWithdrawModal} 
          onClose={() => setShowWithdrawModal(false)}
          backdrop="blur"
          placement="center"
          classNames={{
            backdrop: "bg-black/60",
            base: "bg-[#0A0B0D] border border-gray-800/50 shadow-xl text-white rounded-2xl",
            header: "border-b border-gray-800/50",
            body: "py-6",
            footer: "border-t border-gray-800/50"
          }}
          size="sm"
        >
          <ModalContent>
            <ModalHeader className="flex flex-col gap-1">
              <h3 className="text-xl font-medium">Withdraw Locked Funds</h3>
              <p className="text-sm text-gray-400">Withdraw from your active streak</p>
            </ModalHeader>
            <ModalBody>
              {userStateDetails && (
                <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-gray-800/50">
                        <div className="flex justify-between mb-2">
                            <span className="text-gray-400">Locked Balance:</span>
                            <span className="font-medium">{(userStateDetails.initialDepositAmount.toNumber() / 1_000_000).toFixed(4)} USDC</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-400">Accrued Yield:</span>
                            <span className="font-medium text-green-400">+{(userStateDetails.accruedYield.toNumber() / 1_000_000).toFixed(4)} USDC</span>
                        </div>
                    </div>

                    {/* Available amount card */}
                    <div className="p-4 rounded-xl bg-gray-700/30 border border-gray-600/50">
                        <div className="flex justify-between items-center">
                            <span className="text-lg font-medium text-white">Available to Withdraw:</span>
                            <span className="text-xl font-semibold text-white">
                                {(userStateDetails.initialDepositAmount.toNumber() * 0.5 / 1_000_000).toFixed(4)} USDC
                            </span>
                        </div>
                    </div>
                    
                    <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                        <p className="text-sm text-blue-400">
                            <strong>Note:</strong> Your funds are currently locked in an active streak. You can withdraw up to 50% of your locked balance during the lock period.
                        </p>
                    </div>
                </div>
            )}
            </ModalBody>
            <ModalFooter>
              <Button 
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-white border border-gray-700 rounded-xl"
                onClick={() => setShowWithdrawModal(false)}
              >
                Cancel
              </Button>
              <Button 
                className={`flex-1 rounded-xl flex items-center justify-center gap-2 ${
                    isLoading 
                        ? 'bg-blue-500 cursor-not-allowed' 
                        : 'bg-blue-500 hover:bg-blue-600'
                } text-white`}
                onClick={handleWithdraw}
                disabled={isLoading || !userStateDetails || userStateDetails.initialDepositAmount.toNumber() === 0}
              >
                {isLoading ? (
                    <>
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                            <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                        </svg>
                        <span>Processing...</span>
                    </>
                ) : (
                    'Confirm Withdrawal'
                )}
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Add Withdraw Unlocked Modal */}
        <Modal 
          isOpen={showWithdrawUnlockedModal} 
          onClose={() => setShowWithdrawUnlockedModal(false)}
          backdrop="blur"
          placement="center"
          classNames={{
            backdrop: "bg-black/60",
            base: "bg-[#0A0B0D] border border-gray-800/50 shadow-xl text-white rounded-2xl min-w-[400px]",
            header: "border-b border-gray-800/50",
            body: "py-6",
            footer: "border-t border-gray-800/50"
          }}
          // Remove size="sm" to allow custom width
        >
          <ModalContent>
            <ModalHeader className="flex flex-col gap-1">
              <h3 className="text-xl font-medium">Withdraw Unlocked Balance</h3>
              <p className="text-sm text-gray-400">Withdraw your available unlocked funds</p>
            </ModalHeader>
            <ModalBody>
              {userStateDetails ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-gray-800/50">
                    {/* Total Balance */}
                    <div className="flex justify-between mb-3">
                      <span className="text-gray-400">Total Balance:</span>
                      <span className="font-medium">
                        {(userStateDetails.depositAmount.toNumber() / 1_000_000).toFixed(4)} USDC
                      </span>
                    </div>

                    {/* Accrued Yield */}
                    <div className="flex justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">Accrued Yield:</span>
                        <span className="text-xs text-gray-500">(cannot be withdrawn)</span>
                      </div>
                      <span className="font-medium text-green-400">
                        {(userStateDetails.accruedYield.toNumber() / 1_000_000).toFixed(4)} USDC
                      </span>
                    </div>

                    {/* Available to Withdraw - Made Prominent */}
                    <div className="mt-4 p-4 rounded-lg bg-gray-700/50 border border-gray-600/50">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-medium text-white">Available to Withdraw:</span>
                        <span className="text-xl font-semibold text-white">
                          {(Math.max(0, userStateDetails.depositAmount.toNumber() - userStateDetails.initialDepositAmount.toNumber()) / 1_000_000).toFixed(4)} USDC
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                    <div className="flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-400 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      <p className="text-xs text-blue-400">
                        This will withdraw your available unlocked balance to your wallet. Locked funds and accrued yield will remain in the program.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 text-center text-gray-400">
                  Loading balance information...
                </div>
              )}
            </ModalBody>
            <ModalFooter>
              <Button 
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-white border border-gray-700 rounded-xl"
                onClick={() => setShowWithdrawUnlockedModal(false)}
              >
                Cancel
              </Button>
              <Button 
                className={`flex-1 rounded-xl flex items-center justify-center gap-2 ${
                  isLoading 
                    ? 'bg-blue-500 cursor-not-allowed' 
                    : 'bg-blue-500 hover:bg-blue-600'
                } text-white`}
                onClick={handleWithdrawUnlocked}
                disabled={isLoading || !userStateDetails || (userStateDetails?.depositAmount.toNumber() - userStateDetails?.initialDepositAmount.toNumber()) <= 0}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    <span>Processing...</span>
                  </>
                ) : (
                  'Confirm Withdrawal'
                )}
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </div>
    </div>
  );
};

export default Home;