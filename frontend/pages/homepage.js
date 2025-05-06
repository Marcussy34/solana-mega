import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import WelcomeHeader from '@/components/WelcomeHeader';
import SubjectCard from '@/components/SubjectCard';
import Link from 'next/link';

// Remove the duplicate SubjectCard definition since we're already importing it
// This was causing a conflict in the component name

const Homepage = () => {
  const [showModal, setShowModal] = useState(false);
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [showExtendLockModal, setShowExtendLockModal] = useState(false); // New state for extend lock modal
  const [selectedLockPeriod, setSelectedLockPeriod] = useState(null);
  const [amount, setAmount] = useState('');
  const [estimates, setEstimates] = useState({});
  const [selectedRiskLevel, setSelectedRiskLevel] = useState('low');
  const [hasLockedFunds, setHasLockedFunds] = useState(false);
  const [lockedAmount, setLockedAmount] = useState(0);
  const [lockedRiskLevel, setLockedRiskLevel] = useState(null);
  const [lockedPeriod, setLockedPeriod] = useState(null);
  const [animateCard, setAnimateCard] = useState(false);
  const [showSmartContractProgress, setShowSmartContractProgress] = useState(true); // For Smart Contract card
  const [showRiskTooltip, setShowRiskTooltip] = useState(false); // For risk tooltip

  // Add state for collapsible custom cards
  const [solanaTileCollapsed, setSolanaTileCollapsed] = useState(false);
  const [smartContractTileCollapsed, setSmartContractTileCollapsed] = useState(true);
  
  const toggleSolanaTile = (e) => {
    e.stopPropagation(); // Prevent onClick from firing when clicking the toggle button
    setSolanaTileCollapsed(!solanaTileCollapsed);
  };
  
  const toggleSmartContractTile = (e) => {
    e.stopPropagation();
    setSmartContractTileCollapsed(!smartContractTileCollapsed);
  };

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
      showLockInLabel: true,
      learningCategories: [
        { title: "Blockchain Fundamentals", completion: "4 modules" },
        { title: "Solana Architecture", completion: "5 modules" },
        { title: "Token Economics", completion: "3 modules" },
        { title: "Wallet Management", completion: "2 modules" },
        { title: "DeFi Applications", completion: "6 modules" }
      ]
    },
    {
      title: "Smart Contract 101",
      description: "Explore the fundamentals of smart contracts and blockchain programming",
      progress: 48,
      iconBg: "bg-purple-500/20",
      iconColor: "text-purple-400",
      accentColor: "bg-purple-500",
      riskLevel: "high",
      showRiskLevel: true,
      showProgress: true,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-400" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      ),
      learningCategories: [
        { title: "Smart Contract Basics", completion: "3 modules" },
        { title: "Rust Programming", completion: "7 modules" },
        { title: "Solana Program Model", completion: "4 modules" },
        { title: "Security Fundamentals", completion: "5 modules" },
        { title: "Deployment & Testing", completion: "3 modules" }
      ]
    }
  ];

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
      description: "Lower returns with minimal risk exposure. Funds are primarily allocated to established lending protocols with battle-tested security.",
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
      description: "Moderate returns with calculated risk exposure. Portfolio includes a mix of established protocols and newer opportunities with higher yield potential.",
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
      description: "Higher potential returns with increased risk exposure. Significant allocation to emerging protocols, new DeFi strategies, and leveraged positions.",
      allocation: [
        { name: "Stable Lending", percentage: "20%", color: "blue" },
        { name: "AMM Pools", percentage: "30%", color: "amber" },
        { name: "Leveraged Yield", percentage: "40%", color: "purple" },
        { name: "New Protocols", percentage: "10%", color: "rose" }
      ],
      annualRate: 0.12
    }
  ];

  // Get the selected risk level object
  const selectedRisk = riskLevels.find(r => r.id === selectedRiskLevel) || riskLevels[0];

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

  // Calculate return based on risk level, amount and lock period
  const calculateEstimatedReturn = () => {
    if (!amount || !selectedLockPeriod || !selectedRisk) return "0.00";
    
    const amountValue = parseFloat(amount);
    if (isNaN(amountValue)) return "0.00";
    
    const periodFactor = 
      selectedLockPeriod === '1month' ? 1/12 : 
      selectedLockPeriod === '3months' ? 1/4 : 
      selectedLockPeriod === '6months' ? 1/2 : 1;
    
    return (amountValue * selectedRisk.annualRate * periodFactor).toFixed(2);
  };

  const handleCardClick = (title) => {
    if (title === "Solana 101") {
      setShowModal(true);
    } else if (title === "Smart Contract 101") {
      setShowResumeModal(true);
    } else {
      console.log(`Clicked on ${title}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white px-4 py-12">
      <div className="max-w-6xl mx-auto">
        <WelcomeHeader username="Alex" />
        
        {/* Locked Funds Summary - Only visible when funds are locked */}
        {hasLockedFunds && (
          <motion.div 
            className="mb-8 bg-gray-800/50 border border-blue-500/30 rounded-xl p-5"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-white mb-1">Total Locked Funds</h3>
                <p className="text-gray-400 text-sm">Committed to learning on LockedIn</p>
              </div>
              <div className="mt-4 sm:mt-0">
                <div className="text-3xl font-bold text-white">${lockedAmount.toFixed(2)}</div>
                <div className="text-sm text-gray-400">USDC</div>
              </div>
            </div>
          </motion.div>
        )}
        
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
              {subject.title === "Solana 101" && hasLockedFunds ? (
                // Custom card for Solana 101 after locking
                <AnimatePresence>
                  <div 
                    className={`bg-gray-800 rounded-xl p-6 shadow-lg border ${
                      lockedRiskLevel === 'low' ? 'border-blue-500/50 hover:border-blue-500' : 
                      lockedRiskLevel === 'medium' ? 'border-amber-500/50 hover:border-amber-500' : 
                      'border-purple-500/50 hover:border-purple-500'
                    } transition-colors cursor-pointer`}
                    onClick={() => setSolanaTileCollapsed(!solanaTileCollapsed)}
                  >
                    {/* Header Row with Logo, Title, Badge and Expand/Collapse Button */}
                    <div className="flex justify-between mb-4">
                      {/* Left side: Logo and Title */}
                      <motion.div 
                        className="flex items-center"
                        initial={animateCard ? { opacity: 0, x: -20 } : { opacity: 1, x: 0 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4 }}
                      >
                        <motion.div 
                          className={`flex-shrink-0 w-12 h-12 ${
                            lockedRiskLevel === 'low' ? 'bg-blue-500/20' : 
                            lockedRiskLevel === 'medium' ? 'bg-amber-500/20' : 
                            'bg-purple-500/20'
                          } rounded-full flex items-center justify-center mr-3`}
                          initial={animateCard ? { scale: 0, opacity: 0 } : { scale: 1, opacity: 1 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ 
                            type: "spring",
                            stiffness: 260,
                            damping: 20,
                            delay: 0.1
                          }}
                        >
                          {subject.icon}
                        </motion.div>
                        <div>
                          <motion.h3 
                            className="text-lg font-medium text-white"
                            initial={animateCard ? { opacity: 0 } : { opacity: 1 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 }}
                          >
                            {subject.title}
                          </motion.h3>
                          
                          {/* Risk level badge - only show in expanded view or moved to right in collapsed view */}
                          {!solanaTileCollapsed && (
                            <motion.div 
                              className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                                lockedRiskLevel === 'low' ? 'bg-blue-500/20 text-blue-300' : 
                                lockedRiskLevel === 'medium' ? 'bg-amber-500/20 text-amber-300' : 
                                'bg-purple-500/20 text-purple-300'
                              }`}
                              initial={animateCard ? { opacity: 0, scale: 0.8 } : { opacity: 1, scale: 1 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: 0.4 }}
                            >
                              Funds Locked
                            </motion.div>
                          )}
                        </div>
                      </motion.div>
                      
                      {/* Right side: Risk level in collapsed mode or Donut Chart in expanded mode */}
                      <div className="flex items-center">
                        {solanaTileCollapsed ? (
                          /* Risk level badge moved to right when collapsed */
                          <motion.div 
                            className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                              lockedRiskLevel === 'low' ? 'bg-blue-500/20 text-blue-300' : 
                              lockedRiskLevel === 'medium' ? 'bg-amber-500/20 text-amber-300' : 
                              'bg-purple-500/20 text-purple-300'
                            } mr-2`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.3 }}
                          >
                            {lockedRiskLevel === 'low' ? 'Low Risk' : 
                             lockedRiskLevel === 'medium' ? 'Medium Risk' : 'High Risk'}
                          </motion.div>
                        ) : (
                          /* Donut Chart - only visible when expanded */
                          <motion.div 
                            className="flex-shrink-0 w-20 h-20 relative"
                            initial={animateCard ? { opacity: 0, scale: 0.5 } : { opacity: 1, scale: 1 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ 
                              type: "spring",
                              stiffness: 200,
                              damping: 20,
                              delay: 0.5
                            }}
                          >
                            {/* SVG Donut Chart */}
                            <svg viewBox="0 0 36 36" className="w-full h-full">
                              <circle cx="18" cy="18" r="15.91549430918954" fill="transparent" stroke="#1e293b" strokeWidth="3"></circle>
                              
                              {/* Donut segments based on selected risk level */}
                              {lockedRiskLevel === 'low' ? (
                                <>
                                  {/* 80% Stable Lending */}
                                  <circle 
                                    cx="18" cy="18" r="15.91549430918954" fill="transparent"
                                    stroke="#3b82f6" 
                                    strokeWidth="3"
                                    strokeDasharray="80 20"
                                    strokeDashoffset="25" 
                                    className="transition-all duration-1000"
                                    style={{ 
                                      animation: animateCard ? 'donut-chart-fill 1.5s ease-in-out forwards' : 'none',
                                    }}
                                  ></circle>
                                  {/* 20% Yield Farms */}
                                  <circle 
                                    cx="18" cy="18" r="15.91549430918954" fill="transparent"
                                    stroke="#10b981" 
                                    strokeWidth="3"
                                    strokeDasharray="20 80"
                                    strokeDashoffset="-55" 
                                    className="transition-all duration-1000"
                                    style={{ 
                                      animation: animateCard ? 'donut-chart-fill 1.5s ease-in-out forwards' : 'none',
                                    }}
                                  ></circle>
                                </>
                              ) : lockedRiskLevel === 'medium' ? (
                                <>
                                  {/* 50% Stable Lending */}
                                  <circle 
                                    cx="18" cy="18" r="15.91549430918954" fill="transparent"
                                    stroke="#3b82f6" 
                                    strokeWidth="3"
                                    strokeDasharray="50 50"
                                    strokeDashoffset="25" 
                                    className="transition-all duration-1000"
                                    style={{ 
                                      animation: animateCard ? 'donut-chart-fill 1.5s ease-in-out forwards' : 'none',
                                    }}
                                  ></circle>
                                  {/* 30% AMM Pools */}
                                  <circle 
                                    cx="18" cy="18" r="15.91549430918954" fill="transparent"
                                    stroke="#f59e0b" 
                                    strokeWidth="3"
                                    strokeDasharray="30 70"
                                    strokeDashoffset="-25" 
                                    className="transition-all duration-1000"
                                    style={{ 
                                      animation: animateCard ? 'donut-chart-fill 1.5s ease-in-out forwards' : 'none',
                                    }}
                                  ></circle>
                                  {/* 20% Yield Farms */}
                                  <circle 
                                    cx="18" cy="18" r="15.91549430918954" fill="transparent"
                                    stroke="#10b981" 
                                    strokeWidth="3"
                                    strokeDasharray="20 80"
                                    strokeDashoffset="-55" 
                                    className="transition-all duration-1000"
                                    style={{ 
                                      animation: animateCard ? 'donut-chart-fill 1.5s ease-in-out forwards' : 'none',
                                    }}
                                  ></circle>
                                </>
                              ) : (
                                <>
                                  {/* 20% Stable Lending */}
                                  <circle 
                                    cx="18" cy="18" r="15.91549430918954" fill="transparent"
                                    stroke="#3b82f6" 
                                    strokeWidth="3"
                                    strokeDasharray="20 80"
                                    strokeDashoffset="25" 
                                    className="transition-all duration-1000"
                                    style={{ 
                                      animation: animateCard ? 'donut-chart-fill 1.5s ease-in-out forwards' : 'none',
                                    }}
                                  ></circle>
                                  {/* 30% AMM Pools */}
                                  <circle 
                                    cx="18" cy="18" r="15.91549430918954" fill="transparent"
                                    stroke="#f59e0b" 
                                    strokeWidth="3"
                                    strokeDasharray="30 70"
                                    strokeDashoffset="5" 
                                    className="transition-all duration-1000"
                                    style={{ 
                                      animation: animateCard ? 'donut-chart-fill 1.5s ease-in-out forwards' : 'none',
                                    }}
                                  ></circle>
                                  {/* 40% Leveraged Yield */}
                                  <circle 
                                    cx="18" cy="18" r="15.91549430918954" fill="transparent"
                                    stroke="#8b5cf6" 
                                    strokeWidth="3"
                                    strokeDasharray="40 60"
                                    strokeDashoffset="-25" 
                                    className="transition-all duration-1000"
                                    style={{ 
                                      animation: animateCard ? 'donut-chart-fill 1.5s ease-in-out forwards' : 'none',
                                    }}
                                  ></circle>
                                  {/* 10% New Protocols */}
                                  <circle 
                                    cx="18" cy="18" r="15.91549430918954" fill="transparent"
                                    stroke="#f43f5e" 
                                    strokeWidth="3"
                                    strokeDasharray="10 90"
                                    strokeDashoffset="-65" 
                                    className="transition-all duration-1000"
                                    style={{ 
                                      animation: animateCard ? 'donut-chart-fill 1.5s ease-in-out forwards' : 'none',
                                    }}
                                  ></circle>
                                </>
                              )}

                              {/* Inner text showing risk level */}
                              <text x="18" y="18" fill="white" textAnchor="middle" dominantBaseline="central" className="text-[0.25rem] font-medium">
                                {lockedRiskLevel === 'low' ? 'LOW' : 
                                 lockedRiskLevel === 'medium' ? 'MED' : 'HIGH'}
                              </text>
                            </svg>
                          </motion.div>
                        )}
                        
                        {/* Collapse/Expand button - small version that doesn't propagate click */}
                        <button 
                          className="text-gray-400 hover:text-white transition-colors p-1"
                          onClick={toggleSolanaTile}
                        >
                          {solanaTileCollapsed ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                    
                    {/* Collapsible Content */}
                    <AnimatePresence>
                      {!solanaTileCollapsed && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          {/* Progress Bar */}
                          <motion.div 
                            className="mb-4"
                            initial={animateCard ? { opacity: 0, y: 20 } : { opacity: 1, y: 0 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 }}
                          >
                            <div className="flex justify-between items-center text-sm mb-1">
                              <span className="text-gray-400">Lock Period Progress</span>
                              <span className={`font-medium ${
                                lockedRiskLevel === 'low' ? 'text-blue-300' : 
                                lockedRiskLevel === 'medium' ? 'text-amber-300' : 
                                'text-purple-300'
                              }`}>0%</span>
                            </div>
                            <motion.div 
                              className="h-2 bg-gray-700/60 rounded-full overflow-hidden"
                              initial={animateCard ? { width: 0 } : { width: "100%" }}
                              animate={{ width: "100%" }}
                              transition={{ delay: 0.7, duration: 0.5 }}
                            >
                              <motion.div 
                                className={`h-full rounded-full ${
                                  lockedRiskLevel === 'low' ? 'bg-blue-500' :
                                  lockedRiskLevel === 'medium' ? 'bg-amber-500' :
                                  'bg-purple-500'
                                }`}
                                style={{ width: '0%' }}
                                initial={animateCard ? { width: "0%" } : { width: "0%" }}
                                animate={{ width: "0%" }}
                                transition={{ delay: 0.9, duration: 0.7 }}
                              />
                            </motion.div>
                          </motion.div>
                          
                          {/* Time Left */}
                          <motion.div 
                            className="mb-4 bg-gray-700/30 rounded-lg p-2.5 flex justify-between items-center"
                            initial={animateCard ? { opacity: 0, x: -20 } : { opacity: 1, x: 0 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 1.1 }}
                          >
                            <div className="text-sm text-gray-400">Time Remaining</div>
                            <div className={`text-sm font-medium ${
                              lockedRiskLevel === 'low' ? 'text-blue-300' : 
                              lockedRiskLevel === 'medium' ? 'text-amber-300' : 
                              'text-purple-300'
                            }`}>
                              {lockedPeriod === '1month' ? '30 days' : 
                               lockedPeriod === '3months' ? '90 days' : 
                               lockedPeriod === '6months' ? '180 days' : '365 days'}
                            </div>
                          </motion.div>
                          
                          {/* Grid layout for fund details and asset allocation */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Left column: Amount, Risk Level, Lock Period */}
                            <motion.div
                              initial={animateCard ? { opacity: 0, y: 20 } : { opacity: 1, y: 0 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 1.3 }}
                            >
                              <div className="mb-4">
                                <div className="text-sm text-gray-400 mb-1">Locked Amount</div>
                                <div className="text-xl font-bold text-white">${lockedAmount}</div>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <div className="text-sm text-gray-400 mb-1">Risk Level</div>
                                  <div className={`text-sm font-medium ${
                                    lockedRiskLevel === 'low' ? 'text-blue-300' : 
                                    lockedRiskLevel === 'medium' ? 'text-amber-300' : 'text-purple-300'
                                  }`}>
                                    {lockedRiskLevel === 'low' ? 'Low Risk' : 
                                    lockedRiskLevel === 'medium' ? 'Medium Risk' : 'High Risk'}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-sm text-gray-400 mb-1">Lock Period</div>
                                  <div className="text-sm font-medium text-white">
                                    {lockedPeriod === '1month' ? '1 Month' : 
                                    lockedPeriod === '3months' ? '3 Months' : 
                                    lockedPeriod === '6months' ? '6 Months' : '1 Year'}
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                            
                            {/* Right column: Asset Allocation */}
                            <motion.div
                              initial={animateCard ? { opacity: 0, y: 20 } : { opacity: 1, y: 0 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 1.5 }}
                              className="bg-gray-700/30 rounded-lg p-3"
                            >
                              <div className="text-sm font-medium mb-2 text-gray-300">Asset Allocation</div>
                              <div className="space-y-2">
                                {riskLevels.find(r => r.id === lockedRiskLevel)?.allocation.map((asset, index) => (
                                  <motion.div 
                                    key={index} 
                                    className="flex items-center justify-between"
                                    initial={animateCard ? { opacity: 0, x: -5 } : { opacity: 1, x: 0 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 1.5 + (index * 0.1) }}
                                  >
                                    <div className="flex items-center">
                                      <div className={`w-2.5 h-2.5 rounded-full mr-2 ${
                                        asset.color === 'blue' ? 'bg-blue-500' :
                                        asset.color === 'emerald' ? 'bg-emerald-500' :
                                        asset.color === 'amber' ? 'bg-amber-500' :
                                        asset.color === 'purple' ? 'bg-purple-500' : 'bg-rose-500'
                                      }`}></div>
                                      <span className="text-xs text-gray-400">{asset.name}</span>
                                    </div>
                                    <span className="text-xs text-white font-medium">{asset.percentage}</span>
                                  </motion.div>
                                ))}
                              </div>
                            </motion.div>
                          </div>
                          
                          {/* Estimated Returns */}
                          <motion.div 
                            className={`rounded-lg p-3 border my-4 ${
                              lockedRiskLevel === 'low' ? 'bg-blue-500/10 border border-blue-500/30' : 
                              lockedRiskLevel === 'medium' ? 'bg-amber-500/10 border border-amber-500/30' : 
                              'bg-purple-500/10 border-purple-500/30'
                            }`}
                            initial={animateCard ? { opacity: 0, scale: 0.9 } : { opacity: 1, scale: 1 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 1.7 }}
                          >
                            <div className="flex justify-between">
                              <div className="text-sm text-gray-400">Estimated Return</div>
                              <div className="text-white font-medium">
                                ${calculateEstimatedReturn()}
                              </div>
                            </div>
                          </motion.div>
                          
                          {/* Action Buttons */}
                          <motion.div
                            className="grid grid-cols-2 gap-3"
                            initial={animateCard ? { opacity: 0, y: 20 } : { opacity: 1, y: 0 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 1.9 }}
                            onAnimationComplete={() => {
                              // Reset animation flag after all animations complete
                              setTimeout(() => setAnimateCard(false), 500);
                            }}
                          >
                            {/* Extend Lock Button */}
                            <motion.button 
                              className={`py-2.5 px-4 rounded-lg font-medium transition-colors ${
                                lockedRiskLevel === 'low' 
                                  ? 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 border border-blue-500/30' 
                                  : lockedRiskLevel === 'medium'
                                    ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/30'
                                    : 'bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 border border-purple-500/30'
                              }`}
                              onClick={(e) => {
                                e.stopPropagation();
                                console.log("Extend lock clicked");
                                setShowExtendLockModal(true);
                              }}
                              whileHover={{ scale: 1.03 }}
                              whileTap={{ scale: 0.97 }}
                            >
                              <div className="flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                                </svg>
                                Extend Lock
                              </div>
                            </motion.button>

                            {/* Resume Course Button */}
                            <motion.button 
                              className="py-2.5 px-4 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                console.log("Resume course clicked");
                                setShowResumeModal(true);
                              }}
                              whileHover={{ scale: 1.03 }}
                              whileTap={{ scale: 0.97 }}
                            >
                              <div className="flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                </svg>
                                Resume Course
                              </div>
                            </motion.button>
                          </motion.div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </AnimatePresence>
              ) : subject.title === "Smart Contract 101" && showSmartContractProgress ? (
                // Custom card for Smart Contract 101
                <AnimatePresence>
                  <div 
                    className="bg-gray-800 rounded-xl p-6 shadow-lg border border-purple-500/50 hover:border-purple-500 transition-colors cursor-pointer"
                    onClick={() => setSmartContractTileCollapsed(!smartContractTileCollapsed)}
                  >
                    {/* Header Row with Logo, Title, Badge and Expand/Collapse Button */}
                    <div className="flex justify-between mb-4">
                      {/* Left side: Logo and Title */}
                      <motion.div 
                        className="flex items-center"
                        initial={animateCard ? { opacity: 0, x: -20 } : { opacity: 1, x: 0 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4 }}
                      >
                        <motion.div 
                          className="flex-shrink-0 w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mr-3"
                          initial={animateCard ? { scale: 0, opacity: 0 } : { scale: 1, opacity: 1 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ 
                            type: "spring",
                            stiffness: 260,
                            damping: 20,
                            delay: 0.1
                          }}
                        >
                          {subject.icon}
                        </motion.div>
                        <div>
                          <motion.h3 
                            className="text-lg font-medium text-white"
                            initial={animateCard ? { opacity: 0 } : { opacity: 1 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 }}
                          >
                            {subject.title}
                          </motion.h3>
                          
                          {/* Risk level badge - only show in expanded view or moved to right in collapsed view */}
                          {!smartContractTileCollapsed && (
                            <motion.div 
                              className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-purple-500/20 text-purple-300"
                              initial={animateCard ? { opacity: 0, scale: 0.8 } : { opacity: 1, scale: 1 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: 0.4 }}
                              onMouseEnter={() => setShowRiskTooltip(true)}
                              onMouseLeave={() => setShowRiskTooltip(false)}
                            >
                              Funds Locked
                              
                              {/* Risk Tooltip */}
                              {showRiskTooltip && (
                                <div className="absolute left-0 bottom-full mb-2 w-64 p-2 bg-gray-900 text-xs text-purple-300 rounded shadow-lg z-10">
                                  <div className="flex items-start">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clipRule="evenodd" />
                                    </svg>
                                    Higher risk exposure significantly increases potential for losses. Only allocate funds you can afford to lose.
                                  </div>
                                  <div className="w-3 h-3 bg-gray-900 absolute -bottom-1.5 left-4 transform rotate-45"></div>
                                </div>
                              )}
                            </motion.div>
                          )}
                        </div>
                      </motion.div>
                      
                      {/* Right side: Risk level in collapsed mode or Donut Chart in expanded mode */}
                      <div className="flex items-center">
                        {smartContractTileCollapsed ? (
                          /* Risk level badge moved to right when collapsed */
                          <motion.div 
                            className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-purple-500/20 text-purple-300 mr-2"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.3 }}
                          >
                            High Risk
                          </motion.div>
                        ) : (
                          /* Donut Chart - only visible when expanded */
                          <motion.div 
                            className="flex-shrink-0 w-20 h-20 relative"
                            initial={animateCard ? { opacity: 0, scale: 0.5 } : { opacity: 1, scale: 1 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ 
                              type: "spring",
                              stiffness: 200,
                              damping: 20,
                              delay: 0.5
                            }}
                          >
                            {/* SVG Donut Chart */}
                            <svg viewBox="0 0 36 36" className="w-full h-full">
                              <circle cx="18" cy="18" r="15.91549430918954" fill="transparent" stroke="#1e293b" strokeWidth="3"></circle>
                              
                              {/* High Risk Allocation */}
                              <>
                                {/* 20% Stable Lending */}
                                <circle 
                                  cx="18" cy="18" r="15.91549430918954" fill="transparent"
                                  stroke="#3b82f6" 
                                  strokeWidth="3"
                                  strokeDasharray="20 80"
                                  strokeDashoffset="25" 
                                  className="transition-all duration-1000"
                                  style={{ 
                                    animation: animateCard ? 'donut-chart-fill 1.5s ease-in-out forwards' : 'none',
                                  }}
                                ></circle>
                                {/* 30% AMM Pools */}
                                <circle 
                                  cx="18" cy="18" r="15.91549430918954" fill="transparent"
                                  stroke="#f59e0b" 
                                  strokeWidth="3"
                                  strokeDasharray="30 70"
                                  strokeDashoffset="5" 
                                  className="transition-all duration-1000"
                                  style={{ 
                                    animation: animateCard ? 'donut-chart-fill 1.5s ease-in-out forwards' : 'none',
                                  }}
                                ></circle>
                                {/* 40% Leveraged Yield */}
                                <circle 
                                  cx="18" cy="18" r="15.91549430918954" fill="transparent"
                                  stroke="#8b5cf6" 
                                  strokeWidth="3"
                                  strokeDasharray="40 60"
                                  strokeDashoffset="-25" 
                                  className="transition-all duration-1000"
                                  style={{ 
                                    animation: animateCard ? 'donut-chart-fill 1.5s ease-in-out forwards' : 'none',
                                  }}
                                ></circle>
                                {/* 10% New Protocols */}
                                <circle 
                                  cx="18" cy="18" r="15.91549430918954" fill="transparent"
                                  stroke="#f43f5e" 
                                  strokeWidth="3"
                                  strokeDasharray="10 90"
                                  strokeDashoffset="-65" 
                                  className="transition-all duration-1000"
                                  style={{ 
                                    animation: animateCard ? 'donut-chart-fill 1.5s ease-in-out forwards' : 'none',
                                  }}
                                ></circle>
                              </>

                              {/* Inner text showing risk level */}
                              <text x="18" y="18" fill="white" textAnchor="middle" dominantBaseline="central" className="text-[0.25rem] font-medium">
                                HIGH
                              </text>
                            </svg>
                          </motion.div>
                        )}
                        
                        {/* Collapse/Expand button - small version that doesn't propagate click */}
                        <button 
                          className="text-gray-400 hover:text-white transition-colors p-1"
                          onClick={toggleSmartContractTile}
                        >
                          {smartContractTileCollapsed ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                    
                    {/* Collapsible Content */}
                    <AnimatePresence>
                      {!smartContractTileCollapsed && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          {/* Progress Bar */}
                          <motion.div 
                            className="mb-4"
                            initial={animateCard ? { opacity: 0, y: 20 } : { opacity: 1, y: 0 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 }}
                          >
                            <div className="flex justify-between items-center text-sm mb-1">
                              <span className="text-gray-400">Course Progress</span>
                              <span className="font-medium text-purple-300">48%</span>
                            </div>
                            <motion.div 
                              className="h-2 bg-gray-700/60 rounded-full overflow-hidden"
                              initial={animateCard ? { width: 0 } : { width: "100%" }}
                              animate={{ width: "100%" }}
                              transition={{ delay: 0.7, duration: 0.5 }}
                            >
                              <motion.div 
                                className="h-full rounded-full bg-purple-500"
                                style={{ width: '48%' }}
                                initial={animateCard ? { width: "0%" } : { width: "48%" }}
                                animate={{ width: "48%" }}
                                transition={{ delay: 0.9, duration: 0.7 }}
                              />
                            </motion.div>
                          </motion.div>
                          
                          {/* Time Left */}
                          <motion.div 
                            className="mb-4 bg-gray-700/30 rounded-lg p-2.5 flex justify-between items-center"
                            initial={animateCard ? { opacity: 0, y: 20 } : { opacity: 1, y: 0 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.7 }}
                          >
                            <div className="text-sm text-gray-400">Time Remaining</div>
                            <div className="text-sm font-medium text-purple-300">
                              45 days
                            </div>
                          </motion.div>
                          
                          {/* Grid layout for fund details and asset allocation */}
                          <motion.div 
                            className="grid grid-cols-1 md:grid-cols-2 gap-4"
                            initial={animateCard ? { opacity: 0, y: 20 } : { opacity: 1, y: 0 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.8 }}
                          >
                            {/* Left column: Amount, Risk Level, Lock Period */}
                            <div>
                              <div className="mb-4">
                                <div className="text-sm text-gray-400 mb-1">Locked Amount</div>
                                <div className="text-xl font-bold text-white">$500</div>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <div className="text-sm text-gray-400 mb-1">Risk Level</div>
                                  <div className="text-sm font-medium text-purple-300">
                                    High Risk
                                  </div>
                                </div>
                                <div>
                                  <div className="text-sm text-gray-400 mb-1">Lock Period</div>
                                  <div className="text-sm font-medium text-white">
                                    3 Months
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            {/* Right column: Asset Allocation */}
                            <div className="bg-gray-700/30 rounded-lg p-3">
                              <div className="text-sm font-medium mb-2 text-gray-300">Asset Allocation</div>
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center">
                                    <div className="w-2.5 h-2.5 rounded-full mr-2 bg-blue-500"></div>
                                    <span className="text-xs text-gray-400">Stable Lending</span>
                                  </div>
                                  <span className="text-xs text-white font-medium">20%</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center">
                                    <div className="w-2.5 h-2.5 rounded-full mr-2 bg-amber-500"></div>
                                    <span className="text-xs text-gray-400">AMM Pools</span>
                                  </div>
                                  <span className="text-xs text-white font-medium">30%</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center">
                                    <div className="w-2.5 h-2.5 rounded-full mr-2 bg-purple-500"></div>
                                    <span className="text-xs text-gray-400">Leveraged Yield</span>
                                  </div>
                                  <span className="text-xs text-white font-medium">40%</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center">
                                    <div className="w-2.5 h-2.5 rounded-full mr-2 bg-rose-500"></div>
                                    <span className="text-xs text-gray-400">New Protocols</span>
                                  </div>
                                  <span className="text-xs text-white font-medium">10%</span>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                          
                          {/* Estimated Returns */}
                          <motion.div 
                            className="rounded-lg p-3 border my-4 bg-purple-500/10 border-purple-500/30"
                            initial={animateCard ? { opacity: 0, y: 20 } : { opacity: 1, y: 0 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.9 }}
                          >
                            <div className="flex justify-between">
                              <div className="text-sm text-gray-400">Estimated Return</div>
                              <div className="text-white font-medium">
                                $15.00
                              </div>
                            </div>
                          </motion.div>
                          
                          {/* Action Buttons */}
                          <motion.div 
                            className="grid grid-cols-2 gap-3"
                            initial={animateCard ? { opacity: 0, y: 20 } : { opacity: 1, y: 0 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 1 }}
                          >
                            {/* Extend Lock Button */}
                            <motion.button 
                              className="py-2.5 px-4 rounded-lg font-medium transition-colors bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 border border-purple-500/30"
                              onClick={(e) => {
                                e.stopPropagation();
                                console.log("Extend lock clicked");
                                setShowExtendLockModal(true);
                              }}
                              whileHover={{ scale: 1.03 }}
                              whileTap={{ scale: 0.97 }}
                            >
                              <div className="flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                                </svg>
                                Extend Lock
                              </div>
                            </motion.button>

                            {/* Continue Button */}
                            <motion.button 
                              className="py-2.5 px-4 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                console.log("Resume course clicked");
                                setShowResumeModal(true);
                              }}
                              whileHover={{ scale: 1.03 }}
                              whileTap={{ scale: 0.97 }}
                            >
                              <div className="flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                </svg>
                                Resume Course
                              </div>
                            </motion.button>
                          </motion.div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </AnimatePresence>
              ) : (
                // Regular SubjectCard for other subjects or Solana 101 before locking
                <SubjectCard
                  title={subject.title}
                  description={subject.description}
                  icon={subject.icon}
                  progress={subject.progress}
                  iconBg={subject.iconBg}
                  iconColor={subject.iconColor}
                  accentColor={subject.accentColor}
                  onClick={() => handleCardClick(subject.title)}
                  showLockInLabel={subject.showLockInLabel && !hasLockedFunds}
                  showProgress={subject.showProgress}
                  showRiskLevel={subject.showRiskLevel}
                  riskLevel={subject.riskLevel}
                  learningCategories={subject.learningCategories}
                />
              )}
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
              className="bg-gray-800 rounded-xl w-full max-w-lg p-6 relative"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              onClick={e => e.stopPropagation()}
            >
              {/* Close button */}
              <button 
                className="absolute top-4 right-4 text-gray-400 hover:text-white z-10"
                onClick={() => setShowModal(false)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Modal Content - Added max-height and overflow-y-auto for scrolling */}
              <div className="max-h-[80vh] overflow-y-auto pr-2">
                <motion.div 
                  className="bg-gradient-to-r from-blue-600 via-purple-600 to-emerald-600 bg-clip-text text-transparent"
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  <h2 className="text-2xl font-bold mb-2 text-center">Ready to lock-in?</h2>
                  <p className="text-center text-sm mb-6">Choose your risk level and lock-in period</p>
                </motion.div>
                
                {/* Key Learning Features */}
                <motion.div 
                  className="mb-6"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.15 }}
                >
                  <div className="bg-gray-700/50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-white mb-2">What You'll Learn</h3>
                    <div className="space-y-2">
                      {subjects.find(s => s.title === "Solana 101").learningCategories.map((category, index) => (
                        <div key={index} className="flex justify-between items-center">
                          <div className="flex items-center">
                            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-2"></div>
                            <span className="text-sm text-white">{category.title}</span>
                          </div>
                          <span className="text-xs text-blue-300">{category.completion}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 text-xs text-gray-400 border-t border-gray-600 pt-2">
                      Lock in funds to unlock all {subjects.find(s => s.title === "Solana 101").learningCategories.reduce((total, cat) => {
                        const modules = parseInt(cat.completion.split(" ")[0]);
                        return isNaN(modules) ? total : total + modules;
                      }, 0)} learning modules
                    </div>
                  </div>
                </motion.div>
                
                {/* Coin Selection */}
                <motion.div 
                  className="mb-6"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <motion.div 
                    className="bg-gray-700/50 p-4 rounded-lg flex items-center cursor-pointer hover:bg-gray-700/70 transition-colors"
                    whileHover={{ scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
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
                  </motion.div>
                </motion.div>
                
                {/* Amount Input */}
                <motion.div 
                  className="mb-6"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Amount
                  </label>
                  <div className="relative ml-[1.9px]">
                    <input
                      type="text"
                      value={amount}
                      onChange={(e) => {
                        // Only allow numbers and decimal point
                        const value = e.target.value;
                        if (value === '' || /^\d*\.?\d*$/.test(value)) {
                          setAmount(value);
                        }
                      }}
                      placeholder="Enter amount"
                      className="w-full bg-gray-700/50 rounded-lg py-2.5 px-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 pl-12"
                    />
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">$</div>
                  </div>
                </motion.div>
                
                {/* Risk Level Selection */}
                <motion.div 
                  className="mb-6"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Risk Level & Strategy
                  </label>
                  <motion.div 
                    className="flex bg-gray-700/30 p-1 rounded-full mb-4"
                    initial={{ scale: 0.95 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5, type: "spring" }}
                  >
                    <motion.button
                      className={`flex-1 text-xs font-medium px-3 py-1.5 rounded-full transition-all ${
                        selectedRiskLevel === 'low'
                          ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white'
                          : 'text-gray-300 hover:text-white'
                      }`}
                      onClick={() => setSelectedRiskLevel('low')}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Low Risk
                    </motion.button>
                    <motion.button
                      className={`flex-1 text-xs font-medium px-3 py-1.5 rounded-full transition-all ${
                        selectedRiskLevel === 'medium'
                          ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-white'
                          : 'text-gray-300 hover:text-white'
                      }`}
                      onClick={() => setSelectedRiskLevel('medium')}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Medium Risk
                    </motion.button>
                    <motion.button
                      className={`flex-1 text-xs font-medium px-3 py-1.5 rounded-full transition-all ${
                        selectedRiskLevel === 'high'
                          ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white'
                          : 'text-gray-300 hover:text-white'
                      }`}
                      onClick={() => setSelectedRiskLevel('high')}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      High Risk
                    </motion.button>
                  </motion.div>
                  
                  {/* Risk warning tooltip */}
                  {(selectedRiskLevel === 'medium' || selectedRiskLevel === 'high') && (
                    <motion.div 
                      className={`text-xs px-3 py-2 mb-3 rounded-lg ${
                        selectedRiskLevel === 'medium' ? 'bg-amber-500/10 text-amber-300' : 'bg-purple-500/10 text-purple-300'
                      }`}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="flex items-start">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clipRule="evenodd" />
                        </svg>
                        <p>
                          {selectedRiskLevel === 'medium' 
                            ? 'Medium risk strategies may experience temporary drawdowns and volatility. Your principal is not guaranteed.'
                            : 'Higher risk exposure significantly increases potential for losses. Only allocate funds you can afford to lose.'
                          }
                        </p>
                      </div>
                    </motion.div>
                  )}
                  
                  {/* Risk Level Content */}
                  <AnimatePresence mode="wait">
                    <motion.div 
                      key={selectedRiskLevel}
                      className="space-y-3"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="flex justify-between items-center">
                        <h3 className={`text-lg font-medium ${
                          selectedRiskLevel === 'low' ? 'text-blue-400' : 
                          selectedRiskLevel === 'medium' ? 'text-amber-400' : 'text-purple-400'
                        }`}>{selectedRisk.strategy}</h3>
                        <div className={`px-2 py-1 rounded text-sm ${
                          selectedRiskLevel === 'low' ? 'bg-blue-500/20 text-blue-300' : 
                          selectedRiskLevel === 'medium' ? 'bg-amber-500/20 text-amber-300' : 'bg-purple-500/20 text-purple-300'
                        }`}>{selectedRisk.apy}</div>
                      </div>
                      
                      <p className="text-gray-300 text-sm">
                        {selectedRisk.description}
                      </p>
                      
                      <motion.div 
                        className="bg-gray-700/30 rounded-lg p-3 mt-3"
                        initial={{ scale: 0.98 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.1 }}
                      >
                        <div className="text-sm font-medium mb-2 text-gray-300">Asset Allocation</div>
                        <div className="grid grid-cols-2 gap-2">
                          {selectedRisk.allocation.map((asset, index) => (
                            <motion.div 
                              key={index} 
                              className="flex items-center"
                              initial={{ opacity: 0, x: -5 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.1 * index }}
                            >
                              <div className={`w-3 h-3 rounded-full mr-2 ${
                                asset.color === 'blue' ? 'bg-blue-500' :
                                asset.color === 'emerald' ? 'bg-emerald-500' :
                                asset.color === 'amber' ? 'bg-amber-500' :
                                asset.color === 'purple' ? 'bg-purple-500' : 'bg-rose-500'
                              }`}></div>
                              <span className="text-xs text-gray-400">{asset.percentage} {asset.name}</span>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                      
                      {amount && !isNaN(parseFloat(amount)) && selectedLockPeriod && (
                        <motion.div 
                          className={`rounded-lg p-3 mt-2 ${
                            selectedRiskLevel === 'low' ? 'bg-blue-500/10 border border-blue-500/30' : 
                            selectedRiskLevel === 'medium' ? 'bg-amber-500/10 border border-amber-500/30' : 'bg-purple-500/10 border border-purple-500/30'
                          }`}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ type: "spring", stiffness: 500, damping: 25 }}
                        >
                          <div className={`text-sm font-medium mb-1 ${
                            selectedRiskLevel === 'low' ? 'text-blue-300' : 
                            selectedRiskLevel === 'medium' ? 'text-amber-300' : 'text-purple-300'
                          }`}>Estimated Returns</div>
                          <div className="text-lg font-bold text-white">
                            ${calculateEstimatedReturn()}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            Based on {(selectedRisk.annualRate * 100).toFixed(1)}% annual yield
                          </div>
                        </motion.div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </motion.div>
                
                {/* Lock Period Selection */}
                <motion.div 
                  className="mb-6"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Lock-in Period
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {lockPeriods.map((period, index) => (
                      <motion.div
                        key={period.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-all ${
                          selectedLockPeriod === period.id 
                            ? selectedRiskLevel === 'low' 
                              ? 'border-blue-500 bg-blue-500/20 text-white' 
                              : selectedRiskLevel === 'medium'
                                ? 'border-amber-500 bg-amber-500/20 text-white'
                                : 'border-purple-500 bg-purple-500/20 text-white'
                            : 'border-gray-600 bg-gray-700/30 text-gray-300 hover:bg-gray-700/50'
                        }`}
                        onClick={() => setSelectedLockPeriod(period.id)}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 + (index * 0.1) }}
                      >
                        <div className="font-medium">{period.label}</div>
                        <div className={`text-sm ${
                          selectedLockPeriod === period.id 
                            ? selectedRiskLevel === 'low'
                              ? 'text-blue-300'
                              : selectedRiskLevel === 'medium'
                                ? 'text-amber-300'
                                : 'text-purple-300'
                            : 'text-gray-400'
                        }`}>
                          {period.displayRate}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
                
                {/* Confirm Button */}
                <motion.button 
                  className={`w-full py-3 px-4 text-white font-medium rounded-lg transition-colors hover:opacity-90 ${
                    selectedRiskLevel === 'low'
                      ? 'bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600'
                      : selectedRiskLevel === 'medium'
                        ? 'bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600'
                        : 'bg-gradient-to-r from-purple-600 via-purple-500 to-purple-600'
                  }`}
                  onClick={() => {
                    if (amount && selectedLockPeriod) {
                      // Save locked funds info
                      setLockedAmount(parseFloat(amount));
                      setLockedRiskLevel(selectedRiskLevel);
                      setLockedPeriod(selectedLockPeriod);
                      setHasLockedFunds(true);
                      setAnimateCard(true);
                      
                      console.log("Locked funds:", {
                        coin: "USDC",
                        amount,
                        riskLevel: selectedRiskLevel,
                        lockPeriod: selectedLockPeriod,
                        estimatedReturn: calculateEstimatedReturn()
                      });
                      setShowModal(false);
                    }
                  }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  Confirm & Lock Funds
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Resume Course Modal */}
      <AnimatePresence>
        {showResumeModal && (
          <motion.div 
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowResumeModal(false)}
          >
            <motion.div 
              className="bg-gray-800 rounded-xl w-full max-w-md p-6 relative"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              onClick={e => e.stopPropagation()}
            >
              {/* Close button */}
              <button 
                className="absolute top-4 right-4 text-gray-400 hover:text-white z-10"
                onClick={() => setShowResumeModal(false)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <motion.div 
                className="text-center"
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                <div className="bg-green-500/20 rounded-full w-16 h-16 mx-auto flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3 3a1 1 0 01-1.414 0L10 10.586l3.293-3.293a1 1 0 011.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
                
                <h2 className="text-2xl font-bold mb-2 text-white">Ready to continue?</h2>
                <div className="mb-6">
                  <div className="w-full bg-gray-700 rounded-full h-2.5 mb-3">
                    <div className="bg-green-500 h-2.5 rounded-full" style={{ width: '48%' }}></div>
                  </div>
                  <p className="text-gray-300 text-sm">You're 48% through Smart Contract 101</p>
                </div>
                
                <p className="text-gray-400 mb-8">
                  Continue your learning journey on smart contract development on the Solana blockchain.
                </p>
                
                <motion.button 
                  className="w-full py-3 px-4 bg-gradient-to-r from-green-600 to-green-500 text-white font-medium rounded-lg transition-colors hover:opacity-90"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    console.log("Resuming Smart Contract 101 course");
                    setShowResumeModal(false);
                  }}
                >
                  Resume Course
                </motion.button>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Extend Lock Modal */}
      <AnimatePresence>
        {showExtendLockModal && (
          <motion.div 
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowExtendLockModal(false)}
          >
            <motion.div 
              className="bg-gray-800 rounded-xl w-full max-w-md p-6 relative"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              onClick={e => e.stopPropagation()}
            >
              {/* Close button */}
              <button 
                className="absolute top-4 right-4 text-gray-400 hover:text-white z-10"
                onClick={() => setShowExtendLockModal(false)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <motion.div 
                className={`text-center ${
                  lockedRiskLevel === 'low' ? 'text-blue-400' : 
                  lockedRiskLevel === 'medium' ? 'text-amber-400' : 
                  'text-purple-400'
                }`}
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                <div className={`${
                  lockedRiskLevel === 'low' ? 'bg-blue-500/20' : 
                  lockedRiskLevel === 'medium' ? 'bg-amber-500/20' : 
                  'bg-purple-500/20'
                } rounded-full w-16 h-16 mx-auto flex items-center justify-center mb-4`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>
                </div>
                
                <h2 className="text-2xl font-bold mb-2 text-white">Extend Your Lock Period</h2>
                <p className="text-gray-300 mb-6">Choose how long you want to extend your commitment</p>
              </motion.div>
              
              {/* Current Status */}
              <motion.div 
                className={`p-3 mb-6 rounded-lg ${
                  lockedRiskLevel === 'low' ? 'bg-blue-500/10 border border-blue-500/30' : 
                  lockedRiskLevel === 'medium' ? 'bg-amber-500/10 border border-amber-500/30' : 
                  'bg-purple-500/10 border-purple-500/30'
                }`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-400">Current Lock Period</span>
                  <span className="text-sm font-medium text-white">
                    {lockedPeriod === '1month' ? '1 Month' : 
                     lockedPeriod === '3months' ? '3 Months' : 
                     lockedPeriod === '6months' ? '6 Months' : '1 Year'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-400">Time Remaining</span>
                  <span className={`text-sm font-medium ${
                    lockedRiskLevel === 'low' ? 'text-blue-300' : 
                    lockedRiskLevel === 'medium' ? 'text-amber-300' : 
                    'text-purple-300'
                  }`}>
                    {lockedPeriod === '1month' ? '30 days' : 
                     lockedPeriod === '3months' ? '90 days' : 
                     lockedPeriod === '6months' ? '180 days' : '365 days'}
                  </span>
                </div>
              </motion.div>
              
              {/* Extension Options */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Choose Extension Period
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {lockPeriods.map((period, index) => (
                    <motion.div
                      key={period.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-all ${
                        selectedLockPeriod === period.id 
                          ? lockedRiskLevel === 'low' 
                            ? 'border-blue-500 bg-blue-500/20 text-white' 
                            : lockedRiskLevel === 'medium'
                              ? 'border-amber-500 bg-amber-500/20 text-white'
                              : 'border-purple-500 bg-purple-500/20 text-white'
                          : 'border-gray-600 bg-gray-700/30 text-gray-300 hover:bg-gray-700/50'
                      }`}
                      onClick={() => setSelectedLockPeriod(period.id)}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + (index * 0.1) }}
                    >
                      <div className="font-medium">{period.label}</div>
                      <div className={`text-sm ${
                        selectedLockPeriod === period.id 
                          ? lockedRiskLevel === 'low'
                            ? 'text-blue-300'
                            : lockedRiskLevel === 'medium'
                              ? 'text-amber-300'
                              : 'text-purple-300'
                          : 'text-gray-400'
                      }`}>
                        {period.displayRate}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
              
              {/* Estimated Future Returns */}
              {selectedLockPeriod && (
                <motion.div 
                  className={`rounded-lg p-3 mb-6 ${
                    lockedRiskLevel === 'low' ? 'bg-blue-500/10 border border-blue-500/30' : 
                    lockedRiskLevel === 'medium' ? 'bg-amber-500/10 border border-amber-500/30' : 
                    'bg-purple-500/10 border-purple-500/30'
                  }`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <div className="text-center">
                    <div className="text-sm text-gray-400 mb-1">Total New Duration</div>
                    <div className="text-xl font-bold text-white">
                      {(lockedPeriod === '1month' && selectedLockPeriod === '1month') ? '2 Months' :
                       (lockedPeriod === '1month' && selectedLockPeriod === '3months') ? '4 Months' :
                       (lockedPeriod === '1month' && selectedLockPeriod === '6months') ? '7 Months' :
                       (lockedPeriod === '1month' && selectedLockPeriod === '1year') ? '13 Months' :
                       (lockedPeriod === '3months' && selectedLockPeriod === '1month') ? '4 Months' :
                       (lockedPeriod === '3months' && selectedLockPeriod === '3months') ? '6 Months' :
                       (lockedPeriod === '3months' && selectedLockPeriod === '6months') ? '9 Months' :
                       (lockedPeriod === '3months' && selectedLockPeriod === '1year') ? '15 Months' :
                       (lockedPeriod === '6months' && selectedLockPeriod === '1month') ? '7 Months' :
                       (lockedPeriod === '6months' && selectedLockPeriod === '3months') ? '9 Months' :
                       (lockedPeriod === '6months' && selectedLockPeriod === '6months') ? '12 Months' :
                       (lockedPeriod === '6months' && selectedLockPeriod === '1year') ? '18 Months' :
                       (lockedPeriod === '1year' && selectedLockPeriod === '1month') ? '13 Months' :
                       (lockedPeriod === '1year' && selectedLockPeriod === '3months') ? '15 Months' :
                       (lockedPeriod === '1year' && selectedLockPeriod === '6months') ? '18 Months' :
                       '24 Months'}
                    </div>
                  </div>
                </motion.div>
              )}
              
              {/* Confirm Button */}
              <motion.button 
                className={`w-full py-3 px-4 text-white font-medium rounded-lg transition-colors hover:opacity-90 ${
                  selectedLockPeriod ? (
                    lockedRiskLevel === 'low'
                      ? 'bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600'
                      : lockedRiskLevel === 'medium'
                        ? 'bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600'
                        : 'bg-gradient-to-r from-purple-600 via-purple-500 to-purple-600'
                  ) : 'bg-gray-700 cursor-not-allowed'
                }`}
                onClick={() => {
                  if (selectedLockPeriod) {
                    // Update locked period
                    setLockedPeriod(selectedLockPeriod);
                    console.log("Extended lock period to:", selectedLockPeriod);
                    setShowExtendLockModal(false);
                  }
                }}
                disabled={!selectedLockPeriod}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                whileHover={selectedLockPeriod ? { scale: 1.03 } : {}}
                whileTap={selectedLockPeriod ? { scale: 0.97 } : {}}
              >
                Confirm Extension
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Homepage;