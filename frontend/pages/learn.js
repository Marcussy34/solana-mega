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

// Helper to format address for display
const formatAddress = (address) => {
    if (!address) return 'N/A';
    const addrStr = typeof address === 'string' ? address : address.toBase58();
    return `${addrStr.substring(0, 4)}...${addrStr.substring(addrStr.length - 4)}`;
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
  const { publicKey, wallet } = useWallet();

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
                    
                    return {
                        publicKey: marketAcct.publicKey,
                        ...marketAcct.account,
                        lockInDurationDays: lockInDurationDays,
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
                          <div className="space-y-3">
                              {openMarkets.map((market) => (
                                  <div key={market.publicKey.toBase58()} className="p-4 bg-neutral-800 rounded-lg border border-neutral-700 shadow flex justify-between items-center">
                                      <p className="text-sm font-mono text-neutral-300">
                                          Market ID: <span className="text-purple-400">{market.publicKey.toBase58()}</span>
                                      </p>
                                      <p className="text-sm font-mono text-neutral-300">
                                          Lock-in duration: <span className="text-green-400">{market.lockInDurationDays} days</span>
                                      </p>
                                  </div>
                              ))}
                          </div>
                      ) : (
                          <p className="text-neutral-500">No open markets found.</p>
                      )}
                  </>
              )}
            </div>
          )}
        </div>
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
