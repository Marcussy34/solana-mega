import React from 'react';

const WelcomeHeader = ({ walletAddress }) => {
  // Format wallet address to show first and last 4 characters
  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold text-white">
        Welcome, <span className="text-blue-400">{formatAddress(walletAddress)}</span>
      </h2>
      <p className="text-gray-400 mt-2">
        Manage your deposits and track your yield progress
      </p>
    </div>
  );
};

export default WelcomeHeader; 