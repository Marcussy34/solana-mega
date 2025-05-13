import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { PublicKey, SystemProgram } from '@solana/web3.js';
import { Program, AnchorProvider } from '@coral-xyz/anchor';
import idl from '../../../lib/idl/skillstreak_program.json';

// Default styles that can be overridden by your app
require('@solana/wallet-adapter-react-ui/styles.css');

// Constants
console.log("Imported IDL:", idl);

let PROGRAM_ID_STRING;
if (idl && idl.address) {
    PROGRAM_ID_STRING = idl.address;
    console.log("Using Program ID from idl.address:", PROGRAM_ID_STRING);
} else {
    console.error("CRITICAL: IDL file is missing the main 'address' field. Please check your IDL file and build process.");
    // Fallback to our known program ID
    PROGRAM_ID_STRING = '7LeARRwbauXQ1W4Cr22ZEyPUVP5wHqYijXvkvPaVpguP';
}

const PROGRAM_ID = new PublicKey(PROGRAM_ID_STRING);

const CongratsPage = () => {
  const router = useRouter();
  const { connection } = useConnection();
  const { publicKey, wallet } = useWallet();
  const [program, setProgram] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPopup, setShowPopup] = useState(false);

  // Initialize program
  useEffect(() => {
    const initializeProgram = async () => {
      if (!publicKey || !connection || !wallet?.adapter || !idl) {
        setProgram(null);
        return;
      }

      try {
        // Validate IDL structure
        if (!idl.accounts || !idl.instructions) {
          console.error("Invalid IDL structure - missing required fields");
          setProgram(null);
          return;
        }

        const provider = new AnchorProvider(connection, wallet.adapter, { commitment: "processed" });
        const prog = new Program(idl, provider);
        
        // Test if program is properly initialized
        if (!prog.programId) {
          throw new Error("Program ID not properly initialized");
        }
        
        setProgram(prog);
        console.log('Program initialized successfully with ID:', prog.programId.toString());
      } catch (error) {
        console.log('Error initializing program:', error.message);
        console.error("Program Initialization Error:", error);
        setProgram(null);
      }
    };

    initializeProgram();
  }, [publicKey, connection, wallet, idl]);

  const handleContinue = async () => {
    if (!program || !publicKey) {
      console.error("Program or wallet not connected");
      return;
    }
    
    setIsLoading(true);
    try {
      // Derive user state PDA
      const [userStatePDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("user"), publicKey.toBuffer()],
        program.programId
      );

      console.log("Attempting to record task with:", {
        userPDA: userStatePDA.toString(),
        userPublicKey: publicKey.toString(),
        programId: program.programId.toString()
      });

      // Call record_task instruction
      const tx = await program.methods
        .recordTask()
        .accounts({
          user: publicKey,
          userState: userStatePDA,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log("Task completed successfully!");
      console.log("Transaction signature:", tx);
      
      // Show success popup
      setShowPopup(true);
      
      // Wait for 2 seconds before redirecting
      setTimeout(() => {
        router.push('/course/english?lesson1=complete');
      }, 2000);

    } catch (error) {
      console.error("Error completing task:", error);
      alert("Failed to record task completion. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-[#0A192F] via-[#112240] to-[#1A365D] text-white p-8 relative overflow-hidden">
      {/* Background glow effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 via-blue-500/10 to-purple-500/10 animate-gradient-shift" />
      
      {/* Wallet connect button */}
      <div className="absolute top-4 right-4 z-50">
        <WalletMultiButton />
      </div>

      {/* Content container */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 text-center"
      >
        {/* Trophy icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
          className="mb-8"
        >
          <div className="w-24 h-24 mx-auto bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center shadow-lg shadow-yellow-500/50">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-14 w-14 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zM7 10h10v2H7zm0 4h10v2H7z"/>
            </svg>
          </div>
        </motion.div>

        {/* Main text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-green-400 to-blue-500 text-transparent bg-clip-text">
            Congratulations!
          </h2>
          <div className="space-y-4">
            <p className="text-xl text-zinc-300">
              You've completed Unit 1!
            </p>
            <p className="text-zinc-400">
              You're making great progress in your learning journey.
            </p>
            <motion.div 
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6, type: "spring", stiffness: 200 }}
              className="flex items-center justify-center gap-2 text-zinc-300"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span>+50 XP Earned</span>
            </motion.div>
          </div>
        </motion.div>

        {/* Continue button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-8"
        >
          <button 
            onClick={handleContinue}
            disabled={isLoading || !publicKey || !program}
            className={`px-8 py-4 rounded-xl bg-gradient-to-r from-green-500 to-blue-500 text-white font-medium 
                     hover:from-green-600 hover:to-blue-600 transform hover:scale-105 transition-all duration-200
                     shadow-lg shadow-blue-500/25 hover:shadow-blue-500/50 ${(isLoading || !publicKey || !program) ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isLoading ? 'Recording Progress...' : 'Mark your progress'}
          </button>
          {!publicKey && (
            <p className="mt-4 text-sm text-zinc-400">Please connect your wallet to mark progress</p>
          )}
          {publicKey && !program && (
            <p className="mt-4 text-sm text-zinc-400">Initializing program...</p>
          )}
        </motion.div>
      </motion.div>

      {/* Enhanced Success Popup with Blurred Background */}
      <AnimatePresence>
        {showPopup && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              className="bg-gradient-to-br from-green-500 via-teal-500 to-blue-600 text-white px-10 py-6 rounded-xl shadow-2xl flex flex-col items-center space-y-4 text-center"
              initial={{ opacity: 0, scale: 0.7, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.7, y: 50 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              {/* Checkmark Icon */}
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-2xl font-semibold">Progress Marked!</p>
              <p className="text-sm opacity-90">Your achievement has been recorded.</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Animated circles in background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className={`absolute w-[500px] h-[500px] rounded-full bg-gradient-to-r opacity-30
                       ${i === 0 ? 'from-green-500/10 to-blue-500/10' :
                         i === 1 ? 'from-blue-500/10 to-purple-500/10' :
                                  'from-purple-500/10 to-green-500/10'}`}
            style={{
              left: `${i * 30 - 20}%`,
              top: `${i * 20 - 10}%`,
            }}
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear",
              delay: i * 2,
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default CongratsPage; 