"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { 
  Navbar, 
  NavBody, 
  NavItems, 
  MobileNav, 
  MobileNavHeader, 
  MobileNavMenu, 
  MobileNavToggle,
  NavbarLogo,
  NavbarButton 
} from "@/components/ui/resizable-navbar";
import CustomCourseCard from "@/components/CustomCourseCard";

export default function CoursesPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [solana101Funds, setSolana101Funds] = useState(0);
  const [totalLockedFunds, setTotalLockedFunds] = useState(500);
  const [depositAmount, setDepositAmount] = useState("");
  
  useEffect(() => {
    // Load any existing funds from localStorage
    const storedFunds = localStorage.getItem('solana101Funds');
    if (storedFunds) {
      const parsedFunds = parseInt(storedFunds, 10);
      setSolana101Funds(parsedFunds);
      setTotalLockedFunds(500 + parsedFunds);
    }
  }, []);
  
  // Handle adding funds to Solana 101
  const handleAddFunds = () => {
    const amount = parseInt(depositAmount, 10);
    if (!isNaN(amount) && amount > 0) {
      const newFunds = solana101Funds + amount;
      setSolana101Funds(newFunds);
      setTotalLockedFunds(500 + newFunds);
      localStorage.setItem('solana101Funds', newFunds.toString());
      setDepositAmount("");
    }
  };
  
  // Navbar items
  const navItems = [
    { name: "Home", link: "/" },
    { name: "Features", link: "/#features" },
    { name: "Benefits", link: "/#benefits" },
    { name: "Testimonials", link: "/#testimonials" },
  ];
  
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Navbar */}
      <Navbar className="top-0">
        <NavBody>
          <Link href="/">
            <NavbarLogo asChild />
          </Link>
          <NavItems items={navItems} />
          <div className="relative z-20 flex flex-row items-center justify-end space-x-2">
            <NavbarButton variant="secondary" href="#contact">
              Log In
            </NavbarButton>
            <NavbarButton variant="emerald" href="#contact">
              Get Started
            </NavbarButton>
          </div>
        </NavBody>
        <MobileNav>
          <MobileNavHeader>
            <Link href="/">
              <NavbarLogo asChild />
            </Link>
            <MobileNavToggle isOpen={isOpen} onClick={() => setIsOpen(!isOpen)} />
          </MobileNavHeader>
          <MobileNavMenu isOpen={isOpen}>
            {navItems.map((item, idx) => (
              <a
                key={idx}
                href={item.link}
                className="w-full rounded-md px-3 py-2 text-sm font-medium text-neutral-600 transition-colors hover:bg-gray-100 dark:text-neutral-200 dark:hover:bg-neutral-800"
                onClick={() => setIsOpen(false)}
              >
                {item.name}
              </a>
            ))}
            <div className="mt-4 flex w-full flex-col gap-2">
              <NavbarButton variant="secondary" className="w-full">
                Log In
              </NavbarButton>
              <NavbarButton variant="emerald" className="w-full">
                Get Started
              </NavbarButton>
            </div>
          </MobileNavMenu>
        </MobileNav>
      </Navbar>
      
      {/* Page Content */}
      <div className="pt-24 pb-16 container mx-auto px-4">
        {/* Total Locked Funds Summary */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-16 p-8 rounded-xl"
          style={{ 
            background: "linear-gradient(145deg, rgba(21, 128, 61, 0.15) 0%, rgba(5, 150, 105, 0.25) 100%)",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3), inset 0 0 0 1px rgba(255, 255, 255, 0.1)",
            border: "1px solid rgba(255, 255, 255, 0.1)"
          }}
        >
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div>
              <h2 className="text-xl text-gray-300 font-medium mb-2">Total Locked Funds</h2>
              <div className="flex items-baseline">
                <span className="text-5xl font-bold text-white">${totalLockedFunds.toLocaleString()}</span>
                <span className="ml-2 text-emerald-400">USDC</span>
              </div>
              <p className="mt-2 text-gray-400">
                <span className="text-emerald-400 font-medium">${solana101Funds}</span> added by users to Solana 101
              </p>
            </div>
            
            <div className="flex flex-col gap-3">
              <input
                type="number"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                placeholder="Amount to add"
                min="1"
                className="bg-gray-800/80 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
              <button
                onClick={handleAddFunds}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-3 px-6 rounded-lg transition-colors"
              >
                Add Funds to Solana 101
              </button>
            </div>
          </div>
        </motion.div>
        
        {/* Courses Section Title */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-2">Learning Tracks</h1>
          <p className="text-gray-400 text-xl">Choose a track and start building valuable skills today</p>
        </div>
        
        {/* Course Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Solana 101 Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <CustomCourseCard
              title="Solana 101"
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-6 h-6 text-purple-400">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              }
              riskLevel="high"
              progress={25}
              timeRemaining="21 days"
              lockedAmount={solana101Funds > 0 ? solana101Funds : 0}
              lockPeriod="30 Days"
              assetAllocation={[
                { name: "USDC", percentage: 60, color: "#3b82f6" },
                { name: "SOL", percentage: 30, color: "#8b5cf6" },
                { name: "Other", percentage: 10, color: "#10b981" }
              ]}
              estimatedReturn={5.2}
              accentColor="purple"
              isLocked={true}
              borderColor="border-purple-500/50"
              hoverBorderColor="hover:border-purple-500"
              bgIconColor="bg-purple-500/20"
              animateCard={true}
            />
          </motion.div>
          
          {/* Web3 Development Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <CustomCourseCard
              title="Web3 Development"
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-6 h-6 text-blue-400">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              }
              riskLevel="medium"
              progress={0}
              timeRemaining="60 days"
              lockedAmount={0}
              lockPeriod="60 Days"
              assetAllocation={[
                { name: "USDC", percentage: 70, color: "#3b82f6" },
                { name: "SOL", percentage: 20, color: "#8b5cf6" },
                { name: "Other", percentage: 10, color: "#10b981" }
              ]}
              estimatedReturn={4.8}
              accentColor="blue"
              isLocked={false}
              borderColor="border-blue-500/50"
              hoverBorderColor="hover:border-blue-500"
              bgIconColor="bg-blue-500/20"
              animateCard={true}
            />
          </motion.div>
          
          {/* DeFi Fundamentals Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <CustomCourseCard
              title="DeFi Fundamentals"
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-6 h-6 text-amber-400">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              riskLevel="medium"
              progress={0}
              timeRemaining="45 days"
              lockedAmount={0}
              lockPeriod="45 Days"
              assetAllocation={[
                { name: "USDC", percentage: 50, color: "#3b82f6" },
                { name: "SOL", percentage: 30, color: "#8b5cf6" },
                { name: "Other", percentage: 20, color: "#10b981" }
              ]}
              estimatedReturn={6.5}
              accentColor="amber"
              isLocked={false}
              borderColor="border-amber-500/50"
              hoverBorderColor="hover:border-amber-500"
              bgIconColor="bg-amber-500/20"
              animateCard={true}
            />
          </motion.div>
        </div>
      </div>
    </div>
  );
} 