import React from 'react';
import { motion } from 'framer-motion';

const SubjectCard = ({ 
  title, 
  description, 
  icon, 
  progress = 0, 
  bgColor = 'bg-gray-800',
  accentColor = 'bg-emerald-500',
  iconBg = 'bg-emerald-500/20',
  iconColor = 'text-emerald-400',
  onClick 
}) => {
  return (
    <motion.div
      className={`${bgColor} rounded-xl p-6 cursor-pointer h-full transition-all duration-300`}
      whileHover={{ scale: 1.02, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2)' }}
      onClick={onClick}
    >
      <div className="flex flex-col h-full">
        <div className="flex items-start mb-4">
          <div className={`w-12 h-12 ${iconBg} rounded-lg flex items-center justify-center mr-4`}>
            {icon || (
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${iconColor}`} viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
              </svg>
            )}
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-white mb-1">{title}</h3>
            <p className="text-gray-400 text-sm">{description}</p>
          </div>
        </div>
        
        {/* Progress display */}
        <div className="mt-auto pt-4">
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
        </div>
      </div>
    </motion.div>
  );
};

export default SubjectCard; 