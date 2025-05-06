import React from 'react';
import { Tabs } from '@/components/ui/tabs';

export default function TabsExample() {
  const tabs = [
    {
      title: "Solana 101",
      value: "solana",
      content: (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-blue-400">Solana Blockchain</h2>
          <p className="text-gray-300">
            Solana is a high-performance blockchain platform designed for decentralized applications and marketplaces.
            It uses a unique proof-of-history consensus combined with proof-of-stake for high throughput and low fees.
          </p>
          <div className="bg-gradient-to-br from-blue-900/40 to-blue-700/20 p-4 rounded-lg border border-blue-500/20">
            <h3 className="font-medium mb-2 text-blue-300">Key Features</h3>
            <ul className="list-disc pl-5 text-gray-300 space-y-1">
              <li>Fast transactions (65,000+ TPS)</li>
              <li>Low transaction fees</li>
              <li>Energy-efficient consensus</li>
              <li>Smart contract capabilities</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      title: "Smart Contracts",
      value: "smart-contracts",
      content: (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-emerald-400">Smart Contracts on Solana</h2>
          <p className="text-gray-300">
            Smart contracts on Solana are called "programs" and are typically written in Rust. They execute instructions
            on the Solana blockchain and can interact with accounts to store and modify data.
          </p>
          <div className="bg-gradient-to-br from-emerald-900/40 to-emerald-700/20 p-4 rounded-lg border border-emerald-500/20">
            <h3 className="font-medium mb-2 text-emerald-300">Development Frameworks</h3>
            <ul className="list-disc pl-5 text-gray-300 space-y-1">
              <li>Anchor - The most popular Solana development framework</li>
              <li>Native Solana Program Library</li>
              <li>Seahorse - Python-like language for Solana development</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      title: "Wallet Setup",
      value: "wallet-setup",
      content: (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-purple-400">Setting Up Your Wallet</h2>
          <p className="text-gray-300">
            To interact with Solana applications, you'll need a compatible wallet. Phantom is one of the most popular
            wallet options for Solana users.
          </p>
          <div className="bg-gradient-to-br from-purple-900/40 to-purple-700/20 p-4 rounded-lg border border-purple-500/20">
            <h3 className="font-medium mb-2 text-purple-300">Getting Started</h3>
            <ol className="list-decimal pl-5 text-gray-300 space-y-2">
              <li>Install the Phantom wallet browser extension</li>
              <li>Create a new wallet or import an existing one</li>
              <li>Secure your seed phrase in a safe location</li>
              <li>Connect your wallet to LockedIn to begin learning</li>
            </ol>
          </div>
        </div>
      )
    },
    {
      title: "DeFi Basics",
      value: "defi",
      content: (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-amber-400">DeFi on Solana</h2>
          <p className="text-gray-300">
            Decentralized Finance (DeFi) applications on Solana allow users to lend, borrow, trade, and earn yield
            on their assets without traditional financial intermediaries.
          </p>
          <div className="bg-gradient-to-br from-amber-900/40 to-amber-700/20 p-4 rounded-lg border border-amber-500/20">
            <h3 className="font-medium mb-2 text-amber-300">Popular Protocols</h3>
            <ul className="list-disc pl-5 text-gray-300 space-y-1">
              <li>Serum - Decentralized exchange (DEX)</li>
              <li>Raydium - Automated market maker (AMM)</li>
              <li>Solend - Lending and borrowing platform</li>
              <li>Marinade - Liquid staking protocol</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      title: "NFTs & Gaming",
      value: "nfts",
      content: (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-rose-400">NFTs & Gaming on Solana</h2>
          <p className="text-gray-300">
            Solana's high throughput and low fees make it ideal for NFT marketplaces and blockchain gaming applications,
            enabling seamless user experiences.
          </p>
          <div className="bg-gradient-to-br from-rose-900/40 to-rose-700/20 p-4 rounded-lg border border-rose-500/20">
            <h3 className="font-medium mb-2 text-rose-300">Key Platforms</h3>
            <ul className="list-disc pl-5 text-gray-300 space-y-1">
              <li>Magic Eden - Leading NFT marketplace</li>
              <li>Metaplex - NFT standard and tooling</li>
              <li>Star Atlas - AAA blockchain game</li>
              <li>Aurory - Play-to-earn gaming</li>
            </ul>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 to-gray-900 text-white p-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-emerald-600 bg-clip-text text-transparent">
          <h1 className="text-4xl font-bold mb-2">Card Stack Tabs</h1>
          <p className="text-lg mb-12">Click on different tabs to see the stack effect in action</p>
        </div>
        
        <div className="mb-4 text-gray-400 text-sm">
          Try clicking on different tabs to see the card stack animation. Watch how all cards briefly appear stacked before transitioning.
        </div>
        
        <Tabs 
          tabs={tabs}
          containerClassName="mb-16 bg-gray-800/50 p-2 rounded-full backdrop-blur-lg"
          activeTabClassName="bg-gradient-to-r from-blue-600 via-purple-600 to-emerald-600"
          tabClassName="text-sm font-medium px-5 py-2"
          contentClassName="mt-12 min-h-[400px]"
        />
      </div>
    </div>
  );
} 