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
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [transactionStatus, setTransactionStatus] = useState(null);
  const [notificationVisible, setNotificationVisible] = useState(false);

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
      year: 'numeric'
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
              transition: 'all 0.5s ease-in-out', // Slower, smoother transition
              pointerEvents: 'none' // Prevent notification from blocking interactions
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
              <CardBody className="py-4 px-5"> {/* Slightly larger padding */}
                <div className="flex items-center gap-3">
                  {transactionStatus.type === 'success' ? (
                    <div className="rounded-full p-2 bg-green-500/20"> {/* Larger icon padding */}
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  ) : transactionStatus.type === 'error' ? (
                    <div className="rounded-full p-2 bg-red-500/20"> {/* Larger icon padding */}
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                  ) : (
                    <div className="rounded-full p-2 bg-blue-500/20"> {/* Larger icon padding */}
                      <svg className="animate-spin h-6 w-6 text-blue-400" viewBox="0 0 24 24">
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                    </div>
                  )}
                  <p className={`text-sm font-medium ${
                    transactionStatus.type === 'success' ? 'text-green-400' :
                    transactionStatus.type === 'error' ? 'text-red-400' :
                    'text-blue-400'
                  }`}>
                    {transactionStatus.message}
                  </p>
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
                  <div className="flex items-start justify-between">
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

                  {/* Balance Amount */}
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-medium tracking-tight">
                        {(userStateDetails.depositAmount.toNumber() / 1_000_000).toFixed(2)}
                      </span>
                      <span className="text-gray-400">USDC</span>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-8">
                      <div>
                        <p className="text-sm text-gray-400 mb-1">Initial Deposit</p>
                        <p className="text-lg font-medium">
                          {(userStateDetails.initialDepositAmount.toNumber() / 1_000_000).toFixed(2)}
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
                      className={`${getLockStatus().color === 'success' ? 
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
                          <p>{formatDate(userStateDetails.depositTimestamp.toNumber())}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 mb-1">Ends</p>
                          <p>{formatDate(userStateDetails.lockInEndTimestamp.toNumber())}</p>
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
            <div className="fixed bottom-0 left-0 right-0 bg-[#0A0B0D]/95 backdrop-blur-md border-t border-gray-800/50 p-4">
              <div className="max-w-4xl mx-auto flex gap-4">
                <Button
                  className={`flex-1 rounded-xl flex items-center justify-center gap-2 ${
                    isLoading 
                      ? 'bg-blue-500 cursor-not-allowed' 
                      : 'bg-blue-500 hover:bg-blue-600'
                  } text-white`}
                  onClick={() => setShowDepositModal(true)}
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
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                      </svg>
                      <span>Deposit</span>
                    </>
                  )}
                </Button>
                <Button
                  className="flex-1 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl"
                  size="lg"
                  onClick={() => setShowWithdrawModal(true)}
                  disabled={userStateDetails.depositAmount.toNumber() === 0}
                  startContent={
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                    </svg>
                  }
                >
                  Withdraw
                </Button>
              </div>
            </div>
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
              <h3 className="text-xl font-medium">Withdraw Funds</h3>
            </ModalHeader>
            <ModalBody>
              {userStateDetails && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-gray-800/50">
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-400">Available Balance:</span>
                      <span className="font-medium">{(userStateDetails.depositAmount.toNumber() / 1_000_000).toFixed(4)} USDC</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Accrued Yield:</span>
                      <span className="font-medium text-green-400">+{(userStateDetails.accruedYield.toNumber() / 1_000_000).toFixed(4)} USDC</span>
                    </div>
                  </div>
                  
                  {userStateDetails.lockInEndTimestamp.toNumber() > Math.floor(Date.now() / 1000) && (
                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                      <p className="text-sm text-red-400">
                        <strong>Note:</strong> Some funds are locked in an active streak and cannot be withdrawn.
                      </p>
                    </div>
                  )}
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
                disabled={isLoading || !userStateDetails || userStateDetails.depositAmount.toNumber() === 0}
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