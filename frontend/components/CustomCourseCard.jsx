import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const CustomCourseCard = ({
  title,
  icon,
  riskLevel = 'low', // 'low', 'medium', 'high'
  progress = 0,
  timeRemaining = '30 days',
  lockedAmount = 0,
  lockPeriod = '3 Months',
  assetAllocation = [],
  estimatedReturn = 0,
  accentColor = 'blue', // 'blue', 'amber', 'purple', 'green'
  isLocked = true,
  onExtendLock,
  onResumeCourse,
  onClick,
  animateCard = false,
  borderColor = 'border-blue-500/50',
  hoverBorderColor = 'hover:border-blue-500',
  bgIconColor = 'bg-blue-500/20'
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showRiskTooltip, setShowRiskTooltip] = useState(false);

  // Map riskLevel to colors and text
  const riskColorMap = {
    low: {
      bgColor: 'bg-blue-500/20',
      textColor: 'text-blue-300',
      borderColor: 'border-blue-500/30',
      accentBg: 'bg-blue-500',
      hoverBg: 'hover:bg-blue-500/30',
      fillColor: '#3b82f6' // blue-500
    },
    medium: {
      bgColor: 'bg-amber-500/20',
      textColor: 'text-amber-300',
      borderColor: 'border-amber-500/30',
      accentBg: 'bg-amber-500',
      hoverBg: 'hover:bg-amber-500/30',
      fillColor: '#f59e0b' // amber-500
    },
    high: {
      bgColor: 'bg-purple-500/20',
      textColor: 'text-purple-300',
      borderColor: 'border-purple-500/30',
      accentBg: 'bg-purple-500',
      hoverBg: 'hover:bg-purple-500/30',
      fillColor: '#8b5cf6' // purple-500
    },
    green: {
      bgColor: 'bg-green-500/20',
      textColor: 'text-green-300',
      borderColor: 'border-green-500/30',
      accentBg: 'bg-green-500',
      hoverBg: 'hover:bg-green-500/30',
      fillColor: '#10b981' // green-500
    }
  };

  // Get colors based on risk level
  const colors = riskColorMap[riskLevel] || riskColorMap.low;
  
  // Toggle card expansion
  const toggleCollapse = (e) => {
    e.stopPropagation(); // Prevent onClick from firing
    setIsCollapsed(!isCollapsed);
  };

  // Handle card click
  const handleCardClick = (e) => {
    if (onClick) {
      onClick(e);
    } else {
      setIsCollapsed(!isCollapsed);
    }
  };

  return (
    <div
      className={`bg-gray-800 rounded-xl p-6 shadow-lg border ${borderColor} ${hoverBorderColor} transition-colors cursor-pointer`}
      onClick={handleCardClick}
    >
      {/* Header Row */}
      <div className="flex justify-between mb-4">
        {/* Left side: Logo and Title */}
        <motion.div 
          className="flex items-center"
          initial={animateCard ? { opacity: 0, x: -20 } : { opacity: 1, x: 0 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
        >
          <motion.div 
            className={`flex-shrink-0 w-12 h-12 ${bgIconColor} rounded-full flex items-center justify-center mr-3`}
            initial={animateCard ? { scale: 0, opacity: 0 } : { scale: 1, opacity: 1 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ 
              type: "spring",
              stiffness: 260,
              damping: 20,
              delay: 0.1
            }}
          >
            {icon}
          </motion.div>
          <div>
            <motion.h3 
              className="text-lg font-medium text-white"
              initial={animateCard ? { opacity: 0 } : { opacity: 1 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {title}
            </motion.h3>
            
            {/* Risk level badge - only show in expanded view */}
            {!isCollapsed && (
              <motion.div 
                className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${colors.bgColor} ${colors.textColor}`}
                initial={animateCard ? { opacity: 0, scale: 0.8 } : { opacity: 1, scale: 1 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
                onMouseEnter={() => riskLevel === 'high' && setShowRiskTooltip(true)}
                onMouseLeave={() => setShowRiskTooltip(false)}
              >
                {isLocked ? 'Funds Locked' : (
                  riskLevel === 'low' ? 'Low Risk' : 
                  riskLevel === 'medium' ? 'Medium Risk' : 'High Risk'
                )}
              </motion.div>
            )}
            
            {/* Risk Tooltip */}
            {!isCollapsed && showRiskTooltip && riskLevel === 'high' && (
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
          </div>
        </motion.div>
        
        {/* Right side: Risk level in collapsed mode or Donut Chart in expanded mode */}
        <div className="flex items-center">
          {isCollapsed ? (
            /* Risk level badge moved to right when collapsed */
            <motion.div 
              className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${colors.bgColor} ${colors.textColor} mr-2`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {riskLevel === 'low' ? 'Low Risk' : 
               riskLevel === 'medium' ? 'Medium Risk' : 'High Risk'}
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
                
                {/* Donut segments - dynamically rendered based on assetAllocation */}
                {assetAllocation.map((asset, index) => {
                  // Calculate offset based on previous segments
                  const prevSegmentsTotal = assetAllocation
                    .slice(0, index)
                    .reduce((acc, curr) => acc + curr.percentage, 0);
                  
                  const offset = 25 - (prevSegmentsTotal * 3.6); // 3.6 = 360 / 100
                  
                  return (
                    <circle 
                      key={index}
                      cx="18" 
                      cy="18" 
                      r="15.91549430918954" 
                      fill="transparent"
                      stroke={asset.color} 
                      strokeWidth="3"
                      strokeDasharray={`${asset.percentage} ${100 - asset.percentage}`}
                      strokeDashoffset={offset} 
                      className="transition-all duration-1000"
                      style={{ 
                        animation: animateCard ? 'donut-chart-fill 1.5s ease-in-out forwards' : 'none',
                      }}
                    />
                  );
                })}

                {/* Inner text showing risk level */}
                <text x="18" y="18" fill="white" textAnchor="middle" dominantBaseline="central" className="text-[0.25rem] font-medium">
                  {riskLevel === 'low' ? 'LOW' : 
                   riskLevel === 'medium' ? 'MED' : 'HIGH'}
                </text>
              </svg>
            </motion.div>
          )}
          
          {/* Collapse/Expand button */}
          <button 
            className="text-gray-400 hover:text-white transition-colors p-1"
            onClick={toggleCollapse}
          >
            {isCollapsed ? (
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
        {!isCollapsed && (
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
                <span className="text-gray-400">Progress</span>
                <span className={`font-medium ${colors.textColor}`}>{progress}%</span>
              </div>
              <motion.div 
                className="h-2 bg-gray-700/60 rounded-full overflow-hidden"
                initial={animateCard ? { width: 0 } : { width: "100%" }}
                animate={{ width: "100%" }}
                transition={{ delay: 0.7, duration: 0.5 }}
              >
                <motion.div 
                  className={`h-full ${colors.accentBg} rounded-full`}
                  style={{ width: `${progress}%` }}
                  initial={animateCard ? { width: "0%" } : { width: `${progress}%` }}
                  animate={{ width: `${progress}%` }}
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
              <div className={`text-sm font-medium ${colors.textColor}`}>
                {timeRemaining}
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
                    <div className={`text-sm font-medium ${colors.textColor}`}>
                      {riskLevel === 'low' ? 'Low Risk' : 
                      riskLevel === 'medium' ? 'Medium Risk' : 'High Risk'}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Lock Period</div>
                    <div className="text-sm font-medium text-white">
                      {lockPeriod}
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
                  {assetAllocation.map((asset, index) => (
                    <motion.div 
                      key={index} 
                      className="flex items-center justify-between"
                      initial={animateCard ? { opacity: 0, x: -5 } : { opacity: 1, x: 0 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 1.5 + (index * 0.1) }}
                    >
                      <div className="flex items-center">
                        <div className={`w-2.5 h-2.5 rounded-full mr-2 ${asset.bgColor}`}></div>
                        <span className="text-xs text-gray-400">{asset.name}</span>
                      </div>
                      <span className="text-xs text-white font-medium">{asset.percentage}%</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
            
            {/* Estimated Returns */}
            <motion.div 
              className={`rounded-lg p-3 border my-4 ${colors.bgColor} border-${colors.borderColor}`}
              initial={animateCard ? { opacity: 0, scale: 0.9 } : { opacity: 1, scale: 1 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.7 }}
            >
              <div className="flex justify-between">
                <div className="text-sm text-gray-400">Estimated Return</div>
                <div className="text-white font-medium">
                  ${estimatedReturn}
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
              }}
            >
              {/* Extend Lock Button */}
              <motion.button 
                className={`py-2.5 px-4 rounded-lg font-medium transition-colors ${colors.bgColor} ${colors.textColor} ${colors.hoverBg} border ${colors.borderColor}`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (onExtendLock) onExtendLock();
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
                className="py-2.5 px-4 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onResumeCourse) onResumeCourse();
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
  );
};

export default CustomCourseCard; 