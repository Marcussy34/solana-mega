import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SubjectCard = ({ 
  title, 
  description, 
  icon, 
  progress = 0, 
  bgColor = 'bg-gray-800',
  accentColor = 'bg-emerald-500',
  iconBg = 'bg-emerald-500/20',
  iconColor = 'text-emerald-400',
  onClick,
  showLockInLabel = false,
  showProgress = false,
  showRiskLevel = false,
  riskLevel = 'low'
}) => {
  const [showRiskTooltip, setShowRiskTooltip] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleCollapse = (e) => {
    e.stopPropagation();
    setIsCollapsed(!isCollapsed);
  };

  const handleCardClick = (e) => {
    if (onClick) {
      onClick(e);
    } else {
      setIsCollapsed(!isCollapsed);
    }
  };

  return (
    <motion.div
      className={`${bgColor} rounded-xl p-6 cursor-pointer h-full transition-all duration-300`}
      whileHover={{ scale: 1.02, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2)' }}
      onClick={handleCardClick}
      animate={{ height: isCollapsed ? 'auto' : 'auto' }}
    >
      <div className="flex flex-col h-full">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start">
            <div className={`w-12 h-12 ${iconBg} rounded-lg flex items-center justify-center mr-4`}>
              {icon || (
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${iconColor}`} viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                </svg>
              )}
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-white mb-1">{title}</h3>
              {!isCollapsed && <p className="text-gray-400 text-sm">{description}</p>}

              {showRiskLevel && !isCollapsed && (
                <div className="relative mt-2">
                  <div 
                    className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                      riskLevel === 'low' ? 'bg-blue-500/20 text-blue-300' : 
                      riskLevel === 'medium' ? 'bg-amber-500/20 text-amber-300' : 
                      'bg-purple-500/20 text-purple-300'
                    }`}
                    onMouseEnter={() => setShowRiskTooltip(true)}
                    onMouseLeave={() => setShowRiskTooltip(false)}
                  >
                    {riskLevel === 'low' ? 'Low Risk' : 
                     riskLevel === 'medium' ? 'Medium Risk' : 'High Risk'}
                  </div>
                  
                  {showRiskTooltip && riskLevel === 'high' && (
                    <div className="absolute left-0 bottom-full mb-2 w-48 p-2 bg-gray-900 text-xs text-purple-300 rounded shadow-lg z-10">
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
              )}
            </div>
          </div>
          
          <div className="flex items-center">
            {isCollapsed && showRiskLevel && (
              <motion.div 
                className={`inline-block px-2 py-0.5 rounded text-xs font-medium mr-2 ${
                  riskLevel === 'low' ? 'bg-blue-500/20 text-blue-300' : 
                  riskLevel === 'medium' ? 'bg-amber-500/20 text-amber-300' : 
                  'bg-purple-500/20 text-purple-300'
                }`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                {riskLevel === 'low' ? 'Low Risk' : 
                 riskLevel === 'medium' ? 'Medium Risk' : 'High Risk'}
              </motion.div>
            )}
            
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
        
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div 
              className="mt-auto pt-4"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              {showLockInLabel ? (
                <motion.div 
                  className="border-2 border-dashed border-blue-500/60 rounded-lg p-3 text-center"
                  whileHover={{ scale: 1.03 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  <div className="text-blue-400 font-bold flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                    LOCK IN FUNDS
                  </div>
                  <div className="text-xs text-gray-400 mt-1">Commit to learn and earn returns</div>
                </motion.div>
              ) : (
                <>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-400">Progress</span>
                    <span className="text-sm font-medium text-white">{progress}%</span>
                  </div>
                  <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${accentColor} rounded-full`}
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  
                  {showProgress && (
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <button className="py-1.5 px-3 bg-gray-700/70 hover:bg-gray-700 text-gray-300 text-xs font-medium rounded transition-colors">
                        Reset Progress
                      </button>
                      <button className="py-1.5 px-3 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded transition-colors">
                        Continue
                      </button>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default SubjectCard; 