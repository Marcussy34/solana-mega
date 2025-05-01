"use client";
import React from "react";
import { 
  Navbar, 
  NavBody, 
  NavbarLogo,
  NavbarButton 
} from "@/components/ui/resizable-navbar";
import { CardContainer, CardBody, CardItem } from "@/components/ui/3d-card";
import Link from "next/link";

export default function WalletsPage() {
  // Array of wallet options
  const wallets = [
    {
      id: "phantom",
      name: "Phantom",
      description: "The Phantom wallet extension for Solana",
      color: "purple",
      gradient: "linear-gradient(145deg, #1a0f2b 0%, #32194f 50%, #4b2a80 100%)",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-14 h-14 text-gray-200">
          <rect x="2" y="6" width="20" height="12" rx="2" strokeWidth="1.5" />
          <path d="M22 10H18C16.9 10 16 10.9 16 12V12C16 13.1 16.9 14 18 14H22V10Z" strokeWidth="1.5" />
        </svg>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Navbar */}
      <Navbar className="top-0">
        <NavBody>
          <Link href="/">
            <NavbarLogo />
          </Link>
          <div className="relative z-20 flex flex-row items-center justify-end space-x-2">
            <NavbarButton variant="secondary" href="/">
              Back to Home
            </NavbarButton>
          </div>
        </NavBody>
      </Navbar>

      {/* Header */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">Connect Your Wallet</h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-12">
            Choose your preferred wallet to connect with SkillStreak and start your learning journey.
          </p>
          
          {/* Wallet Options */}
          <div className="flex justify-center max-w-5xl mx-auto">
            {wallets.map((wallet) => (
              <div key={wallet.id} className="w-full max-w-md">
                <CardContainer className="w-full" containerClassName="!py-4 !w-full">
                  <CardBody className="!w-full !h-[380px]">
                    <button className="w-full h-full focus:outline-none">
                      <div className="relative w-full h-full rounded-xl overflow-hidden transition-all duration-300 group cursor-pointer"
                        style={{
                          background: wallet.gradient,
                          boxShadow: "0 10px 30px rgba(21, 62, 107, 0.15), inset 0 0 0 1px rgba(255, 255, 255, 0.05)"
                        }}>
                        
                        {/* Hover brightness effect */}
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-5 pointer-events-none"
                          style={{ 
                            background: wallet.gradient,
                            mixBlendMode: "soft-light"
                          }}>
                        </div>
                        
                        {/* Metallic overlay with light reflections */}
                        <div className="absolute inset-0 opacity-40 z-10 pointer-events-none"
                          style={{ 
                            background: "linear-gradient(100deg, transparent 0%, rgba(255, 255, 255, 0.05) 20%, rgba(255, 255, 255, 0.2) 50%, rgba(255, 255, 255, 0.05) 80%, transparent 100%)"
                          }}>
                        </div>
                        
                        <div className="absolute inset-0 z-20 p-6">
                          {/* Layout container */}
                          <div className="relative w-full h-full flex flex-col">
                            {/* Top section with icon */}
                            <div className="flex justify-center mb-6">
                              <CardItem
                                translateZ={40}
                                className="w-28 h-28 rounded-full flex items-center justify-center"
                                style={{ 
                                  background: "linear-gradient(135deg, rgba(200,200,200,0.3) 0%, rgba(150,150,150,0.1) 100%)",
                                  boxShadow: "0 0 15px rgba(255,255,255,0.1), inset 0 0 20px rgba(255,255,255,0.03)"
                                }}>
                                {wallet.icon}
                              </CardItem>
                            </div>
                            
                            {/* Middle section with title */}
                            <div className="flex-grow flex flex-col items-center">
                              <CardItem
                                translateZ={50}
                                className="text-3xl font-bold text-center text-white/90 group-hover:text-white mb-4">
                                {wallet.name}
                              </CardItem>
                              
                              <CardItem
                                translateZ={30}
                                className="text-center text-gray-300/80 group-hover:text-gray-300">
                                {wallet.description}
                              </CardItem>
                            </div>
                            
                            {/* Bottom button */}
                            <div className="mt-6">
                              <CardItem
                                translateZ={40}
                                className="bg-white/10 group-hover:bg-white/20 text-white py-3 px-6 rounded-lg text-center font-medium transition-colors">
                                Connect Wallet
                              </CardItem>
                            </div>
                          </div>
                        </div>
                      </div>
                    </button>
                  </CardBody>
                </CardContainer>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-8 mt-20">
        <div className="container mx-auto px-4 text-center text-gray-400">
          <p>Â© 2025 SkillStreak. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
} 