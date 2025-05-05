import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import WelcomeHeader from '@/components/WelcomeHeader';
import SubjectCard from '@/components/SubjectCard';
import Link from 'next/link';

// Remove the duplicate SubjectCard definition since we're already importing it
// This was causing a conflict in the component name

const Homepage = () => {
  const [showModal, setShowModal] = useState(false);
  const [selectedLockPeriod, setSelectedLockPeriod] = useState(null);
  const [amount, setAmount] = useState('');
  const [estimates, setEstimates] = useState({});

  const subjects = [
    {
      title: "Solana 101",
      description: "Learn the fundamentals of Solana blockchain, its architecture, and ecosystem",
      progress: 0,
      iconBg: "bg-blue-500/20",
      iconColor: "text-blue-400",
      accentColor: "bg-blue-500",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
          <path d="M11 17a1 1 0 001.447.894l4-2A1 1 0 0017 15V9.236a1 1 0 00-1.447-.894l-4 2a1 1 0 00-.553.894V17zM15.211 6.276a1 1 0 000-1.788l-4.764-2.382a1 1 0 00-.894 0L4.789 4.488a1 1 0 000 1.788l4.764 2.382a1 1 0 00.894 0l4.764-2.382zM4.447 8.342A1 1 0 003 9.236V15a1 1 0 00.553.894l4 2A1 1 0 009 17v-5.764a1 1 0 00-.553-.894l-4-2z" />
        </svg>
      ),
    },
    {
      title: "Smart Contract 101",
      description: "Explore the fundamentals of smart contracts and blockchain programming",
      progress: 0,
      iconBg: "bg-green-500/20",
      iconColor: "text-green-400",
      accentColor: "bg-green-500",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-400" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      ),
    }
  ];

  const lockPeriods = [
    { id: '1month', label: '1 Month', rate: 0.01, displayRate: '1%' },
    { id: '3months', label: '3 Months', rate: 0.02, displayRate: '2%' },
    { id: '6months', label: '6 Months', rate: 0.035, displayRate: '3.5%' },
    { id: '1year', label: '1 Year', rate: 0.07, displayRate: '6-8%' },
  ];

  // Calculate estimated gains when amount changes
  useEffect(() => {
    if (amount && !isNaN(parseFloat(amount))) {
      const amountValue = parseFloat(amount);
      const newEstimates = {};
      
      lockPeriods.forEach(period => {
        // Calculate estimated gain based on the period's rate
        const gain = amountValue * period.rate;
        newEstimates[period.id] = gain.toFixed(2);
      });
      
      setEstimates(newEstimates);
    } else {
      setEstimates({});
    }
  }, [amount]);

  const handleCardClick = (title) => {
    if (title === "Solana 101") {
      setShowModal(true);
    } else {
      console.log(`Clicked on ${title}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white px-4 py-12">
      <div className="max-w-6xl mx-auto">
        <WelcomeHeader username="Alex" />
        
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {subjects.map((subject, index) => (
            <motion.div
              key={subject.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
            >
              <SubjectCard
                title={subject.title}
                description={subject.description}
                icon={subject.icon}
                progress={subject.progress}
                iconBg={subject.iconBg}
                iconColor={subject.iconColor}
                accentColor={subject.accentColor}
                onClick={() => handleCardClick(subject.title)}
              />
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div 
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowModal(false)}
          >
            <motion.div 
              className="bg-gray-800 rounded-xl w-full max-w-md p-6 relative"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
            >
              {/* Close button */}
              <button 
                className="absolute top-4 right-4 text-gray-400 hover:text-white"
                onClick={() => setShowModal(false)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Modal Content */}
              <h2 className="text-2xl font-bold mb-6 text-center text-white">Ready to lock-in?</h2>
              
              {/* Coin Selection */}
              <div className="mb-6">
                <div className="bg-gray-700/50 p-4 rounded-lg flex items-center cursor-pointer hover:bg-gray-700/70 transition-colors">
                  <div className="w-12 h-12 bg-blue-500/30 rounded-full flex items-center justify-center mr-4">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-blue-400">
                      <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="1.5" />
                      <path d="M7.5 13.5H14.5C15.6046 13.5 16.5 12.6046 16.5 11.5V10.5C16.5 9.39543 15.6046 8.5 14.5 8.5H9.5C8.39543 8.5 7.5 7.60457 7.5 6.5V5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      <path d="M12 17V13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      <path d="M9.5 17H14.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-medium text-white">USDC</div>
                    <div className="text-sm text-gray-400">USD Coin</div>
                  </div>
                </div>
              </div>
              
              {/* Amount Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Amount
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="w-full bg-gray-700/50 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 pl-10"
                  />
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">$</div>
                </div>
              </div>
              
              {/* Lock Period Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Lock-in Period
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {lockPeriods.map(period => (
                    <div
                      key={period.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-all ${
                        selectedLockPeriod === period.id 
                          ? 'border-blue-500 bg-blue-500/20 text-white' 
                          : 'border-gray-600 bg-gray-700/30 text-gray-300 hover:bg-gray-700/50'
                      }`}
                      onClick={() => setSelectedLockPeriod(period.id)}
                    >
                      <div className="font-medium">{period.label}</div>
                      <div className={`text-sm ${selectedLockPeriod === period.id ? 'text-blue-300' : 'text-gray-400'}`}>
                        {period.displayRate}
                      </div>
                      {amount && !isNaN(parseFloat(amount)) && (
                        <div className="mt-2 text-xs text-emerald-400">
                          Estimated gains: ${estimates[period.id]}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Confirm Button */}
              <button 
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                onClick={() => {
                  console.log("Selected:", {
                    coin: "USDC",
                    amount,
                    lockPeriod: selectedLockPeriod,
                    estimatedGain: selectedLockPeriod ? estimates[selectedLockPeriod] : null
                  });
                  setShowModal(false);
                }}
              >
                Confirm & Lock Funds
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Homepage;