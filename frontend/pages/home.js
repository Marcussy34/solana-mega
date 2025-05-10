"use client";
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import WelcomeHeader from '@/components/WelcomeHeader';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useWallet } from '@solana/wallet-adapter-react';
import dynamic from 'next/dynamic';
    
// Dynamically import WalletMultiButton with no SSR
const WalletMultiButton = dynamic(
  () => import('@solana/wallet-adapter-react-ui').then(mod => mod.WalletMultiButton),
  { ssr: false }
);

// Constants
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
    description: "Lower returns with minimal risk exposure.",
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
    description: "Moderate returns with calculated risk exposure.",
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
    description: "Higher potential returns with increased risk exposure.",
      allocation: [
        { name: "Stable Lending", percentage: "20%", color: "blue" },
        { name: "AMM Pools", percentage: "30%", color: "amber" },
        { name: "Leveraged Yield", percentage: "40%", color: "purple" },
        { name: "New Protocols", percentage: "10%", color: "rose" }
      ],
      annualRate: 0.12
    }
  ];

const Home = () => {
  // Router and Wallet hooks
  const router = useRouter();
  const { publicKey, disconnect } = useWallet();

  // Client-side rendering state
  const [mounted, setMounted] = useState(false);

  // User state
  const [totalLockedFunds, setTotalLockedFunds] = useState(0);
  const [lockedAmount, setLockedAmount] = useState(0);
  const [smartContractAmount, setSmartContractAmount] = useState(0);

  // Mount effect
  useEffect(() => {
    setMounted(true);
  }, []);

  // Protection effect
  useEffect(() => {
    if (mounted && !publicKey) {
      router.push('/wallets');
    }
  }, [mounted, publicKey, router]);

  // Early return if not mounted
  if (!mounted) {
    return null;
  }

  // Show connect wallet message if no wallet is connected
  if (!publicKey) {
  return (
      <div className="min-h-screen bg-gray-950 text-white px-4 py-12 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Welcome to LockedIn</h1>
          <p className="text-gray-400 mb-8">Please connect a wallet to continue</p>
          <Link 
            href="/wallets"
            className="inline-flex items-center px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors"
          >
            Connect Wallet
          </Link>
              </div>
            </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white px-4 py-12">
      <div className="max-w-6xl mx-auto">
        {/* Header with Welcome Message and Disconnect Button */}
        <div className="flex flex-col space-y-4 mb-8">
                            <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">Welcome back!</h1>
                        <button 
              onClick={disconnect}
              className="px-4 py-2 bg-transparent hover:bg-gray-800 text-gray-400 hover:text-white rounded-lg transition-colors flex items-center space-x-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l-3-3a1 1 0 000-1.414l3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
                            </svg>
              <span>Disconnect</span>
                        </button>
                      </div>
          <WelcomeHeader 
            username={publicKey ? `${publicKey.toString().slice(0, 4)}...${publicKey.toString().slice(-4)}` : "Connect Wallet"}
            solanaAmount={lockedAmount}
            smartContractAmount={smartContractAmount}
            totalFunds={totalLockedFunds}
          />
                            </div>
        
        {/* Dashboard Content */}
        <div className="text-center mt-8">
          <h2 className="text-2xl font-bold">Your Dashboard</h2>
          <p className="text-gray-400 mt-2">Connected with wallet: {publicKey.toString()}</p>
                              </div>
                            </div>
    </div>
  );
};

export default Home;