import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar, SidebarBody, SidebarLink } from '@/components/ui/sidebar'; // Assuming @ resolves to frontend
import { BentoGrid, BentoGridItem } from '@/components/ui/bento-grid';
import { IconClipboardCheck, IconBook, IconBrandReact, IconAward, IconLogout, IconLayoutGrid } from '@tabler/icons-react'; // Example icons

// --- Solana/Anchor Imports ---
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'; // To show connection status
import { PublicKey } from '@solana/web3.js';
import { Program, AnchorProvider, BN } from '@coral-xyz/anchor';
import idl from '../lib/idl/skillstreak_program.json'; // Import the IDL
import { getAssociatedTokenAddressSync, getAccount, ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { SystemProgram, TOKEN_PROGRAM_ID } from '@solana/web3.js';
// import { sendTransaction } from '@solana/web3.js'; // sendTransaction comes from useWallet, not web3.js directly

// --- Constants ---
let PROGRAM_ID_STRING;
// Basic check for IDL structure
if (idl && idl.address) {
    PROGRAM_ID_STRING = idl.address;
} else {
    console.error("IDL file is missing the 'address' field or is not loaded correctly.");
    // Provide a fallback or handle the error appropriately
    PROGRAM_ID_STRING = '7LeARRwbauXQ1W4Cr22ZEyPUVP5wHqYijXvkvPaVpguP'; // Replace with your actual default Program ID if needed
}
const PROGRAM_ID = new PublicKey(PROGRAM_ID_STRING);
const USDC_MINT = new PublicKey('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU'); // Define Devnet USDC Mint

// Helper to format address for display
const formatAddress = (address) => {
    if (!address) return 'N/A';
    const addrStr = typeof address === 'string' ? address : address.toBase58();
    return `${addrStr.substring(0, 4)}...${addrStr.substring(addrStr.length - 4)}`;
};

// Helper to format timestamp
const formatTimestamp = (timestampBN) => {
    if (!timestampBN || !(timestampBN instanceof BN) || timestampBN.isZero()) return 'N/A'; // Added BN check
    try {
        return new Date(timestampBN.toNumber() * 1000).toLocaleString();
    } catch (e) {
        console.error("Error formatting timestamp:", e, "Value:", timestampBN);
        return 'Invalid Date';
    }
};

// Updated Header component with specific image path
const ImageHeader = ({ imagePath }) => (
  <div className="flex flex-1 w-full h-full min-h-[10rem] rounded-xl overflow-hidden"> {/* Increased min-h */} 
    <img 
      src={imagePath} // Use the provided imagePath
      alt="Subject Image"
      className="object-cover w-full h-full transition-all duration-300" // Removed grayscale filter
    />
  </div>
);

const learnPageSubjects = [
  {
    title: "English",
    description: "by Duolingo",
    header: <ImageHeader imagePath="/image/english.png" />, // Pass specific image path
    icon: <IconBook className="h-4 w-4 text-neutral-500" />,
    className: "md:col-span-1",
    href: "/course/english"
  },
  {
    title: "Solana 101",
    description: "Introduction to Solana Development",
    header: <ImageHeader imagePath="/image/solana.jpeg" />, // Updated image path to use .jpeg
    icon: <IconBrandReact className="h-4 w-4 text-neutral-500" />,
    className: "md:col-span-1",
    href: "/course/solana-101"
  },
  // Remove the generation of 7 random subjects
  // ...Array.from({ length: 7 }, (_, i) => ({
  //   title: `Subject ${i + 3}`,
  //   description: `Learn about random topic ${i + 3}`,
  //   header: <ImageHeader imagePath={`https://picsum.photos/seed/random${i}/400/200`} />, // Fallback or different logic if uncommented
  //   icon: <IconClipboardCheck className="h-4 w-4 text-neutral-500" />,
  //   className: "md:col-span-1",
  // })),
];

const LearnPage = () => {
  // --- Wallet and Connection Hooks ---
  const { connection } = useConnection();
  const { publicKey, wallet, sendTransaction } = useWallet();

  // --- Program State ---
  const [program, setProgram] = useState(null);
  const [isLoadingMarkets, setIsLoadingMarkets] = useState(false);
  const [openMarkets, setOpenMarkets] = useState([]);
  const [fetchError, setFetchError] = useState(null); // To display errors

  // Links for the sidebar within the Learn page context
  const sidebarLinks = [
    { label: "Explore", page: 'explore', icon: <IconLayoutGrid size={20} /> }, // Added Explore link
    { label: "Leaderboard", page: 'leaderboard', icon: <IconAward size={20} /> },
    // Keep external Dashboard link separate if needed, or integrate fully
    // { label: "Dashboard", href: "/home", icon: <IconClipboardCheck size={20} /> }, 
  ];

  // State for sidebar visibility
  const [open, setOpen] = React.useState(false);
  // State for search term
  const [searchTerm, setSearchTerm] = React.useState("");
  // State for the current view ('explore' or 'leaderboard')
  const [currentPage, setCurrentPage] = React.useState('explore'); // Default to explore
  const [isMounted, setIsMounted] = useState(false); // New state for client-side rendering

  // --- Bet Modal State ---
  const [showBetModal, setShowBetModal] = useState(false);
  const [selectedMarketForBet, setSelectedMarketForBet] = useState(null);
  const [betAmount, setBetAmount] = useState('0.1'); // Default bet amount
  const [betPositionIsLong, setBetPositionIsLong] = useState(true); // Default to Long
  const [isPlacingBet, setIsPlacingBet] = useState(false); // For loading state on bet button
  // --- End Bet Modal State ---

  // --- Effect to mark component as mounted ---
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // --- Initialize Anchor Program ---
  useEffect(() => {
    if (publicKey && connection && wallet?.adapter && idl) {
      try {
        // Ensure the provider uses the connected wallet adapter
        const provider = new AnchorProvider(connection, wallet.adapter, { commitment: "processed" });
        if (typeof idl === 'object' && idl !== null) {
          const prog = new Program(idl, provider);
          setProgram(prog);
          console.log('Program initialized for Learn page.');
        } else {
          console.error('Error: Invalid IDL format for Learn page.');
          setProgram(null);
          setFetchError("Failed to load program definition (IDL).");
        }
      } catch (error) {
         console.error('Error initializing program:', error.message);
         setFetchError(`Error initializing program: ${error.message}`);
         setProgram(null);
      }
    } else {
      setProgram(null); // Clear program if wallet disconnects or connection changes
      setOpenMarkets([]); // Clear markets if wallet disconnects
      if (!publicKey) {
          setFetchError("Please connect your wallet to view the leaderboard.");
      }
    }
  }, [publicKey, connection, wallet]); // Rerun when connection or wallet changes

  // --- Fetch Open Markets Logic ---
  const fetchOpenMarkets = useCallback(async () => {
    if (!program) {
        console.log("Program not initialized. Cannot fetch markets.");
        setFetchError("Program not ready. Connect wallet?");
        return;
    }
    if (!publicKey) {
        console.log("Wallet not connected. Cannot fetch markets.");
        setFetchError("Please connect wallet to fetch markets.");
        return;
    }

    setIsLoadingMarkets(true);
    setFetchError(null); // Clear previous errors
    console.log("Fetching open markets...");
    try {
        const allMarketAccounts = await program.account.marketState.all();
        console.log(`Found ${allMarketAccounts.length} market accounts in total.`);
        
        const openMarketPromises = allMarketAccounts
            .filter(marketAcct => { 
                 const isOpen = marketAcct.account.status && typeof marketAcct.account.status.open !== 'undefined';
                 return isOpen;
            })
            .map(async (marketAcct) => { 
                const userStateAddress = marketAcct.account.userStateAccountForBet;
                
                try {
                   if (!(userStateAddress instanceof PublicKey)) {
                       throw new Error(`Invalid or missing address type for userStateAccountForBet: ${typeof userStateAddress}`);
                    }
                    const userStateAccount = await program.account.userState.fetch(userStateAddress);
                    
                    // --- START NEW DEBUG LOG ---
                    console.log(`RAW Fetched UserState Object for market ${marketAcct.publicKey.toBase58()}:`, JSON.stringify(userStateAccount, (key, value) =>
                        typeof value === 'bigint'
                            ? value.toString()
                            : value // return everything else unchanged
                    , 2));
                    // --- END NEW DEBUG LOG ---

                    // --- DEBUGGING: Log fetched UserState and timestamps ---
                    console.log(`Fetched UserState for market ${marketAcct.publicKey.toBase58()}:`, userStateAccount);
                    console.log(`  Market ${marketAcct.publicKey.toBase58()} - Deposit Timestamp: ${userStateAccount.depositTimestamp?.toString()}`);
                    console.log(`  Market ${marketAcct.publicKey.toBase58()} - Lock-in End Timestamp: ${userStateAccount.lockInEndTimestamp?.toString()}`);
                    // --- END DEBUGGING ---

                    let lockInDurationDays = 'N/A';
                    const depositTimestamp = userStateAccount.depositTimestamp;
                    const lockInEndTimestamp = userStateAccount.lockInEndTimestamp;

                    // --- UPDATED CHECK ---
                    // First check if the properties exist and are BN objects
                    if (depositTimestamp && BN.isBN(depositTimestamp) &&
                        lockInEndTimestamp && BN.isBN(lockInEndTimestamp) &&
                        !depositTimestamp.isZero() && 
                        !lockInEndTimestamp.isZero() &&
                        lockInEndTimestamp.gt(depositTimestamp)) {
                        
                        const durationSeconds = lockInEndTimestamp.sub(depositTimestamp).toNumber();
                        lockInDurationDays = Math.round(durationSeconds / (24 * 60 * 60)); 
                    } else {
                         // --- DEBUGGING: Log why calculation failed ---
                         console.log(`Calculation failed for market ${marketAcct.publicKey.toBase58()}: depositTs defined=${!!depositTimestamp}, depositTsIsBN=${BN.isBN(depositTimestamp)}, depositTsZero=${depositTimestamp && BN.isBN(depositTimestamp) ? depositTimestamp.isZero() : 'N/A'}, endTsDefined=${!!lockInEndTimestamp}, endTsIsBN=${BN.isBN(lockInEndTimestamp)}, endTsZero=${lockInEndTimestamp && BN.isBN(lockInEndTimestamp) ? lockInEndTimestamp.isZero() : 'N/A'}, endGtDeposit=${depositTimestamp && lockInEndTimestamp && BN.isBN(depositTimestamp) && BN.isBN(lockInEndTimestamp) ? lockInEndTimestamp.gt(depositTimestamp) : 'N/A'}`);
                         // --- END DEBUGGING ---
                    }
                    // --- END UPDATED CHECK ---
                    
                    // Extract depositTimestamp for sorting
                    const creationTsNum = depositTimestamp && BN.isBN(depositTimestamp) ? depositTimestamp.toNumber() : 0;

                    return {
                        publicKey: marketAcct.publicKey,
                        ...marketAcct.account,
                        lockInDurationDays: lockInDurationDays,
                        creationTimestamp: creationTsNum, // Added for sorting
                    };
                } catch (e) {
                    console.error(`Failed to fetch/process UserState for market ${marketAcct.publicKey.toBase58()} using address from userStateAccountForBet (${userStateAddress?.toBase58 ? userStateAddress.toBase58() : userStateAddress}):`, e);
                    return {
                        publicKey: marketAcct.publicKey,
                        ...marketAcct.account,
                        lockInDurationDays: 'Error', 
                    };
                }
            });

        const resolvedOpenMarkets = await Promise.all(openMarketPromises);
        console.log(`Found ${resolvedOpenMarkets.length} open markets with user state data.`);

        // Sort markets by creationTimestamp in descending order (most recent first)
        resolvedOpenMarkets.sort((a, b) => {
          const tsA = a.creationTimestamp || 0; // Use the new property
          const tsB = b.creationTimestamp || 0; // Use the new property
          return tsB - tsA; // Sort descending
        });
        
        setOpenMarkets(resolvedOpenMarkets);

    } catch (error) {
        console.error("Error fetching markets:", error);
        setFetchError(`Error fetching markets: ${error.message}`);
        setOpenMarkets([]); // Clear markets on error
    } finally {
        setIsLoadingMarkets(false);
    }
  }, [program, publicKey]); // Dependencies: program instance and user's public key

  // --- Trigger Market Fetch ---
  // Fetch markets when the program is initialized AND the leaderboard page is active
  useEffect(() => {
    if (program && publicKey && currentPage === 'leaderboard') {
      fetchOpenMarkets();
    }
  }, [program, publicKey, currentPage, fetchOpenMarkets]); // Add currentPage and fetchOpenMarkets

  // Filtered subjects based on search term (only relevant for 'explore' view)
  const filteredSubjects = learnPageSubjects.filter(subject => {
    const term = searchTerm.toLowerCase();
    return (
      subject.title.toLowerCase().includes(term) ||
      subject.description.toLowerCase().includes(term)
    );
  });

  // Handler for sidebar link clicks
  const handleNavigate = (page) => {
    setCurrentPage(page);
    setOpen(false); // Close mobile sidebar on navigation
    setFetchError(null); // Clear errors when navigating
  };

  // --- Function to open Bet Modal ---
  const handleOpenBetModal = (market) => {
    setSelectedMarketForBet(market);
    setBetAmount('0.1'); // Reset to default
    setBetPositionIsLong(true); // Reset to default (Long)
    setShowBetModal(true);
    setFetchError(null); // Clear any previous errors
  };
  // --- End Function to open Bet Modal ---

  // --- Function to Handle Placing a Bet ---
  const handlePlaceBet = async () => {
    if (!program || !publicKey || !selectedMarketForBet) {
      setFetchError("Program, wallet, or selected market not available.");
      console.error("Place bet prerequisites not met");
      return;
    }
    const amountNum = parseFloat(betAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setFetchError("Invalid bet amount.");
      console.error("Invalid bet amount entered");
      return;
    }

    setIsPlacingBet(true);
    setFetchError(null); // Clear previous errors
    console.log(`Placing bet: ${amountNum} USDC, Long: ${betPositionIsLong}, Market: ${selectedMarketForBet.publicKey.toBase58()}`);

    try {
      const marketStatePDA = selectedMarketForBet.publicKey;
      const amountLamports = new BN(amountNum * 1_000_000); // Assuming 6 decimals

      // Derive PDAs
      const [marketEscrowVaultPDA, ] = PublicKey.findProgramAddressSync(
        [Buffer.from("market_escrow_vault"), marketStatePDA.toBuffer()],
        program.programId
      );
      const [betStatePDA, ] = PublicKey.findProgramAddressSync(
        [Buffer.from("bet"), marketStatePDA.toBuffer(), publicKey.toBuffer()],
        program.programId
      );

      // Get ATAs
      const marketEscrowTokenAccount = getAssociatedTokenAddressSync(
          USDC_MINT,
          marketEscrowVaultPDA,
          true // allowOwnerOffCurve
      );
      const bettorTokenAccount = getAssociatedTokenAddressSync(USDC_MINT, publicKey);

      // Check if bettor has USDC account
      try {
          await getAccount(connection, bettorTokenAccount, 'confirmed');
          console.log("Bettor's USDC ATA verified.");
      } catch (error) {
          if (error.name === 'TokenAccountNotFoundError') {
               setFetchError("Error: Your USDC account doesn't exist. Please acquire some Devnet USDC.");
          } else {
               console.error("Error checking bettor's USDC ATA:", error);
               setFetchError("Error checking your USDC account.");
          }
          setIsPlacingBet(false);
          return; 
      }

      // Build Transaction
      console.log("Building placeBet transaction...");
      const placeBetTx = await program.methods
          .placeBet(amountLamports, betPositionIsLong)
          .accounts({
              bettor: publicKey,
              marketState: marketStatePDA,
              marketEscrowVault: marketEscrowVaultPDA,
              marketEscrowTokenAccount: marketEscrowTokenAccount,
              bettorTokenAccount: bettorTokenAccount,
              betState: betStatePDA,
              usdcMint: USDC_MINT, // Ensure USDC_MINT is defined correctly at the top
              systemProgram: SystemProgram.programId,
              tokenProgram: TOKEN_PROGRAM_ID,
          })
          .transaction();

      // Simulate Transaction
      console.log('Simulating place_bet transaction...');
      placeBetTx.feePayer = publicKey;
      // Recent blockhash will be automatically added by sendTransaction from wallet adapter
      // const { blockhash } = await connection.getLatestBlockhash();
      // placeBetTx.recentBlockhash = blockhash;

      const simulationResult = await connection.simulateTransaction(placeBetTx);
      if (simulationResult.value.err) {
          console.error("Simulation Error (place_bet):", simulationResult.value.err);
          console.log("Simulation Logs (place_bet):", simulationResult.value.logs);
          // Try to provide a user-friendly error
          let userMessage = `Transaction simulation failed: ${JSON.stringify(simulationResult.value.err)}`;
          if (simulationResult.value.logs?.some(log => log.includes("InsufficientFunds"))) {
            userMessage = "Insufficient USDC balance to place this bet.";
          } else if (simulationResult.value.logs?.some(log => log.includes("custom program error: 0x177b"))) { // ErrorCode::BettingWindowClosed
            userMessage = "The betting window for this market has closed.";
          } else if (simulationResult.value.logs?.some(log => log.includes("custom program error: 0x1779"))) { // ErrorCode::MarketNotOpenForBets
            userMessage = "This market is not currently open for betting.";
          }
          setFetchError(userMessage);
          throw new Error(userMessage); // Throw to prevent further execution
      }
      console.log("Transaction simulation successful (place_bet).");

      // Send Transaction
      console.log("Sending placeBet transaction...");
      const signature = await sendTransaction(placeBetTx, connection);
      console.log("Place Bet transaction sent:", signature);
      setFetchError(`Transaction Sent: ${signature.substring(0,10)}...`); // Show pending tx

      // Confirm Transaction
      console.log("Confirming placeBet transaction...");
      const confirmation = await connection.confirmTransaction(signature, 'confirmed');
      console.log("Place Bet transaction confirmed.", confirmation);

      if (confirmation.value.err) {
        throw new Error(`Transaction confirmation failed: ${confirmation.value.err}`);
      }

      // Handle Success
      setFetchError(null); // Clear pending message
      console.log('Bet placed successfully!');
      // Optional: Add success notification here if desired
      setShowBetModal(false);
      // Refresh the market list after a short delay to allow data propagation
      setTimeout(() => { 
        fetchOpenMarkets();
      }, 1000); 

    } catch (error) {
        console.error("Error placing bet:", error);
        // Ensure fetchError is updated even if it was set during simulation
        if (!fetchError || !fetchError.startsWith("Transaction Sent")) { 
           setFetchError(`Error placing bet: ${error.message || 'Unknown error'}`);
        }
    } finally {
        setIsPlacingBet(false);
    }
  };
  // --- End Function to Handle Placing a Bet ---

  return (
    <div className="flex h-screen w-full bg-neutral-900 dark:bg-neutral-50 text-neutral-200 dark:text-neutral-800">
      <Sidebar open={open} setOpen={setOpen}>
        <SidebarBody className="justify-between gap-10">
          <div className="flex flex-col flex-1 overflow-y-auto">
            {open ? <Logo /> : <LogoIcon />}
            <div className="mt-8 flex flex-col gap-2">
              {sidebarLinks.map((link, idx) => (
                <SidebarLink 
                  key={idx} 
                  link={link} 
                  onClick={() => handleNavigate(link.page)}
                  isActive={currentPage === link.page} 
                />
              ))}
              <SidebarLink 
                link={{ label: "Dashboard", href: "/home", icon: <IconClipboardCheck size={20} /> }}
                onClick={() => window.location.href = '/home'} 
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <SidebarLink 
              link={{ label: "Logout", href: "#", icon: <IconLogout size={20} /> }} 
              onClick={() => console.log("Logout clicked")} 
            />
          </div>
        </SidebarBody>
      </Sidebar>

      <main className="flex-1 p-4 md:p-8 overflow-y-auto flex flex-col">
        <div className="w-full flex justify-end items-center gap-4 mb-4">
          {currentPage === 'leaderboard' && (
            <button 
                onClick={fetchOpenMarkets} 
                disabled={isLoadingMarkets || !program || !publicKey} 
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors h-10"
            >
                {isLoadingMarkets ? 'Refreshing...' : 'Refresh'}
            </button>
          )}
          {isMounted && <WalletMultiButton style={{ background: '#512da8', color: 'white', height: '40px' }} />}
        </div>

        <div className="flex-grow">
          {currentPage === 'explore' && (
            <>
              <h1 className="text-2xl md:text-3xl font-bold mb-4 text-white">Explore Subjects</h1>
              <div className="mb-6 flex justify-center">
                <input
                  type="text"
                  placeholder="Search subjects..."
                  className="w-full md:w-1/2 lg:w-1/3 p-2 rounded-md bg-neutral-800 text-neutral-200 border border-neutral-700 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-colors"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {filteredSubjects.length > 0 ? (
                <BentoGrid className="md:grid-cols-3 lg:grid-cols-3">
                  {filteredSubjects.map((item, i) => (
                    <BentoGridItem
                      key={i}
                      title={item.title}
                      description={item.description}
                      header={item.header}
                      icon={item.icon}
                      className={`${item.className} bg-neutral-800 border-neutral-700 hover:border-purple-500`}
                      href={item.href}
                    />
                  ))}
                </BentoGrid>
              ) : (
                <p className="text-center text-neutral-500">
                  No subjects found matching your search criteria.
                </p>
              )}
            </>
          )}
          {currentPage === 'leaderboard' && (
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-4 text-white">Leaderboard (Open Markets)</h1>
              
              {isLoadingMarkets && <p className="text-neutral-400">Loading markets...</p>}
              {fetchError && <p className="text-red-500">Error: {fetchError}</p>}

              {!isLoadingMarkets && !fetchError && (
                  <>
                      {openMarkets.length > 0 ? (
                          <div className="space-y-4"> {/* Increased spacing */}
                              {openMarkets.map((market) => {
                                  // Determine if betting is closed based on timestamp
                                  const nowSec = Date.now() / 1000;
                                  const isBettingClosedClientSide = market.bettingEndsTimestamp.toNumber() < nowSec;
                                  // Check if the current user is the one being bet on
                                  const isSelfBet = publicKey && market.userBeingBetOn.equals(publicKey);

                                  return (
                                      <div 
                                          key={market.publicKey.toBase58()} 
                                          className="p-5 bg-neutral-800 rounded-lg border border-neutral-700 shadow transition-colors duration-200 hover:border-purple-600/50"
                                      >
                                          <div className="flex flex-col md:flex-row justify-between md:items-center mb-3">
                                              <p className="text-sm font-mono text-neutral-400 mb-2 md:mb-0">
                                                  Market ID: <span className="text-purple-400 break-all">{market.publicKey.toBase58()}</span>
                                              </p>
                                              <p className="text-sm text-neutral-400">
                                                  User: <span className="text-teal-400 font-mono">{formatAddress(market.userBeingBetOn)}</span>
                                              </p>
                                          </div>
                                          
                                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 text-sm">
                                              <div className="bg-neutral-700/40 p-3 rounded-md">
                                                  <p className="text-neutral-400 mb-1">Long Pool (Success)</p>
                                                  <p className="font-medium text-green-400">
                                                      {(market.totalLongAmount.toNumber() / 1_000_000).toFixed(2)} USDC
                                                  </p>
                                              </div>
                                              <div className="bg-neutral-700/40 p-3 rounded-md">
                                                  <p className="text-neutral-400 mb-1">Short Pool (Fail)</p>
                                                  <p className="font-medium text-red-400">
                                                      {(market.totalShortAmount.toNumber() / 1_000_000).toFixed(2)} USDC
                                                  </p>
                                              </div>
                                              <div className="bg-neutral-700/40 p-3 rounded-md">
                                                  <p className="text-neutral-400 mb-1">Lock-in</p>
                                                  <p className="font-medium text-blue-400">
                                                      {market.lockInDurationDays} days
                                                  </p>
                                              </div>
                                          </div>

                                          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mt-3 pt-3 border-t border-neutral-700/50">
                                              <p className="text-xs text-neutral-500 mb-2 md:mb-0">
                                                  Betting Ends: {formatTimestamp(market.bettingEndsTimestamp)}
                                              </p>
                                              <button 
                                                  onClick={() => handleOpenBetModal(market)} 
                                                  disabled={isBettingClosedClientSide || isLoadingMarkets || isSelfBet} 
                                                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ease-in-out h-9 ${ 
                                                      isBettingClosedClientSide
                                                      ? 'bg-neutral-600 text-neutral-400 cursor-not-allowed' 
                                                      : isSelfBet 
                                                      ? 'bg-neutral-600 text-neutral-400 cursor-not-allowed'
                                                      : 'bg-purple-600 hover:bg-purple-700 text-white cursor-pointer'
                                                  } disabled:opacity-60`}
                                              >
                                                  {isBettingClosedClientSide ? 'Betting Closed' : (isSelfBet ? 'Cannot Bet (Self)' : 'Bet')}
                                              </button>
                                          </div>
                                      </div>
                                  );
                              })}
                          </div>
                      ) : (
                          <p className="text-neutral-500">No open markets found.</p>
                      )}
                  </>
              )}
            </div>
          )}
        </div>

        {/* --- Basic Bet Modal --- */}
        {showBetModal && selectedMarketForBet && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-neutral-800 p-6 rounded-lg shadow-xl w-full max-w-md text-white border border-neutral-700">
              <h2 className="text-xl font-semibold mb-4 text-purple-400">Bet on Market</h2>
              <p className="text-sm mb-1 text-neutral-400">Market ID: <span className="font-mono text-neutral-300">{selectedMarketForBet.publicKey.toBase58()}</span></p>
              <p className="text-sm mb-3 text-neutral-400">Betting on User: <span className="font-mono text-teal-400">{formatAddress(selectedMarketForBet.userBeingBetOn)}</span></p>
              
              <div className="mb-4">
                <label htmlFor="betAmountInput" className="block text-sm font-medium text-neutral-300 mb-1">Bet Amount (USDC)</label>
                <input 
                  id="betAmountInput"
                  type="number"
                  value={betAmount}
                  onChange={(e) => setBetAmount(e.target.value)}
                  min="0.000001"
                  step="0.000001"
                  className="w-full p-2 rounded-md bg-neutral-700 text-white border border-neutral-600 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  disabled={isPlacingBet}
                />
              </div>

              <div className="mb-6">
                <p className="block text-sm font-medium text-neutral-300 mb-2">Choose Position</p>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setBetPositionIsLong(true)}
                    disabled={isPlacingBet}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${betPositionIsLong ? 'bg-green-500 text-white' : 'bg-neutral-600 hover:bg-neutral-500 text-neutral-300'}`}
                  >
                    Long (Streak Continues)
                  </button>
                  <button 
                    onClick={() => setBetPositionIsLong(false)}
                    disabled={isPlacingBet}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${!betPositionIsLong ? 'bg-red-500 text-white' : 'bg-neutral-600 hover:bg-neutral-500 text-neutral-300'}`}
                  >
                    Short (Streak Breaks)
                  </button>
                </div>
              </div>

              {fetchError && <p className="text-red-500 text-sm mb-3">Error: {fetchError}</p>} 

              <div className="flex justify-end gap-3">
                <button 
                  onClick={() => setShowBetModal(false)} 
                  disabled={isPlacingBet}
                  className="px-4 py-2 rounded-md text-neutral-300 bg-neutral-600 hover:bg-neutral-500 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handlePlaceBet}
                  disabled={isPlacingBet || !parseFloat(betAmount) || parseFloat(betAmount) <= 0}
                  className="px-4 py-2 rounded-md bg-purple-600 hover:bg-purple-700 text-white transition-colors flex items-center justify-center disabled:opacity-50"
                >
                  {isPlacingBet ? (
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : 'Confirm Bet'}
                </button>
              </div>
            </div>
          </div>
        )}
        {/* --- End Basic Bet Modal --- */}

      </main>
    </div>
  );
};

// Placeholder Logo components (customize or remove)
export const Logo = () => {
  return (
    <div
      className="font-normal flex items-center text-sm text-white py-1 relative z-20"
    >
      <div className="h-5 w-5 bg-gradient-to-br from-white to-neutral-300 rounded-full mr-2" />
      Your Learning Hub
    </div>
  );
};
export const LogoIcon = () => {
  return (
    <div
      className="font-normal flex items-center text-sm text-white py-1 relative z-20"
    >
      <div className="h-5 w-5 bg-gradient-to-br from-white to-neutral-300 rounded-full" />
    </div>
  );
};

export default LearnPage;
