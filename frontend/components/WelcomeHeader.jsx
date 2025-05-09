import React from 'react';
import { motion } from 'framer-motion';

const WelcomeHeader = ({ 
  username = "Learner", 
  solanaAmount = 0, 
  smartContractAmount = 0, 
  totalFunds = 0 
}) => {
  const solanaPercentage = totalFunds > 0 ? (solanaAmount / totalFunds) * 100 : 0;
  const smartContractPercentage = totalFunds > 0 ? (smartContractAmount / totalFunds) * 100 : 0;

  // Define colors for the chart segments
  const solanaColor = "#3b82f6"; // Blue for Solana
  const smartContractColor = "#8b5cf6"; // Purple for Smart Contract
  const emptyColor = "#374151"; // Darker gray for empty space if one fund is 0

  return (
    <div className="py-8 px-6 md:px-10 bg-gray-900 rounded-xl relative overflow-hidden mb-10">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/30 to-purple-900/30 opacity-70"></div>
      
      {/* Animated dots */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-emerald-400/30"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
            }}
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.3, 0.8, 0.3],
            }}
            transition={{
              duration: 3 + i,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.5,
            }}
          />
        ))}
      </div>
      
      <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center">
        {/* Left side: Welcome Text */}
        <div className="mb-6 md:mb-0 md:mr-6">
          <motion.h1 
            className="text-3xl md:text-4xl font-bold text-white mb-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            Welcome back, {username}!
          </motion.h1>
          
          <motion.p 
            className="text-gray-300 text-lg max-w-2xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Continue your learning journey and earn rewards as you master new skills.
          </motion.p>
        </div>

        {/* Right side: Donut Chart and Legend */}
        {totalFunds > 0 && (
          <motion.div 
            className="flex-shrink-0 flex flex-col items-center md:items-end"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <div className="w-32 h-32 md:w-36 md:h-36 relative mb-3">
              <svg viewBox="0 0 36 36" className="w-full h-full">
                <circle cx="18" cy="18" r="15.91549430918954" fill="transparent" stroke="#1e293b" strokeWidth="3.8"></circle>
                
                {/* Solana 101 Segment */}
                {solanaPercentage > 0 && (
                  <circle 
                    cx="18" cy="18" r="15.91549430918954" fill="transparent"
                    stroke={solanaColor}
                    strokeWidth="3.8"
                    strokeDasharray={`${solanaPercentage} ${100 - solanaPercentage}`}
                    strokeDashoffset="25"
                    transform="rotate(-90 18 18)"
                  ></circle>
                )}
                
                {/* Smart Contract 101 Segment */}
                {smartContractPercentage > 0 && (
                  <circle 
                    cx="18" cy="18" r="15.91549430918954" fill="transparent"
                    stroke={smartContractColor}
                    strokeWidth="3.8"
                    strokeDasharray={`${smartContractPercentage} ${100 - smartContractPercentage}`}
                    strokeDashoffset={`${25 - solanaPercentage}`} // Offset by Solana's percentage
                    transform="rotate(-90 18 18)"
                  ></circle>
                )}

                {/* Fallback for when one is 0 but not the other, to make it a full circle */}
                {solanaPercentage === 100 && smartContractPercentage === 0 && (
                     <circle cx="18" cy="18" r="15.91549430918954" fill="transparent" stroke={solanaColor} strokeWidth="3.8" strokeDasharray="100 0" strokeDashoffset="25" transform="rotate(-90 18 18)"></circle>
                )}
                {smartContractPercentage === 100 && solanaPercentage === 0 && (
                     <circle cx="18" cy="18" r="15.91549430918954" fill="transparent" stroke={smartContractColor} strokeWidth="3.8" strokeDasharray="100 0" strokeDashoffset="25" transform="rotate(-90 18 18)"></circle>
                )}


                <text x="18" y="18" fill="white" textAnchor="middle" dominantBaseline="central" className="text-[0.25rem] font-semibold">
                  Allocated Funds
                </text>
              </svg>
            </div>
            <div className="flex flex-col items-center md:items-end text-xs">
              {solanaAmount > 0 && (
                <div className="flex items-center mb-1">
                  <span className="w-2.5 h-2.5 rounded-full mr-1.5" style={{ backgroundColor: solanaColor }}></span>
                  <span className="text-gray-300">Solana 101:</span>
                  <span className="text-white font-medium ml-1">{solanaPercentage.toFixed(0)}%</span>
                </div>
              )}
              {smartContractAmount > 0 && (
                <div className="flex items-center">
                  <span className="w-2.5 h-2.5 rounded-full mr-1.5" style={{ backgroundColor: smartContractColor }}></span>
                  <span className="text-gray-300">Smart Contract:</span>
                  <span className="text-white font-medium ml-1">{smartContractPercentage.toFixed(0)}%</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
      
      {/* Existing Stats (Streak, Points) - wrapped in a new div for layout control if needed */}
      <div className="mt-8"> {/* Added margin top to separate from chart/text */}
        <motion.div 
          className="flex flex-wrap gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div className="bg-gray-800/50 px-4 py-2 rounded-lg flex items-center">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-400">Current Streak</p>
              <p className="text-xl font-bold text-white">7 Days</p>
            </div>
          </div>
          
          <div className="bg-gray-800/50 px-4 py-2 rounded-lg flex items-center">
            <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-400" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-400">Total Points</p>
              <p className="text-xl font-bold text-white">1,250</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default WelcomeHeader; 