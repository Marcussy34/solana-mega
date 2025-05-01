"use client";
import React, { useState, useRef } from "react";
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
import { ContainerScroll, Header, Card } from "@/components/ui/container-scroll-animation";
import { CardContainer, CardBody, CardItem } from "@/components/ui/3d-card";
import { ThreeDMarquee } from "@/components/ui/3d-marquee";
import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";

export default function LandingPage() {
  // State for mobile menu
  const [isOpen, setIsOpen] = useState(false);
  
  // Reference for scroll animation
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  // Transform values for the 3D card animation
  const rotate = useTransform(scrollYProgress, [0, 0.2], [35, -35]);
  const scale = useTransform(scrollYProgress, [0, 0.8], [1.05, 1]);
  const translate = useTransform(scrollYProgress, [0, 0.9], [0, -100]);



  // Navbar items
  const navItems = [
    { name: "Features", link: "#features" },
    { name: "Benefits", link: "#benefits" },
    { name: "Testimonials", link: "#testimonials" },
    { name: "Pricing", link: "#pricing" },
  ];

  // Images for the marquee
  const images = [
    "https://assets.aceternity.com/cloudinary_bkp/3d-card.png",
    "https://assets.aceternity.com/world-map.webp",
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Resizable Navbar */}
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

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center pt-20">
        {/* 3D Marquee Background */}
        <div className="absolute inset-0 z-0 opacity-25 overflow-hidden">
          <ThreeDMarquee images={images} />
        </div>
        
        {/* Content */}
        <div className="relative z-10 container mx-auto px-4 text-left">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6">
              SkillStreak
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-gray-300">
              Learn, Earn & Build Habits on Solana. Master new skills while earning yield on your capital.
            </p>
          </div>
        </div>
      </section>

      {/* Features Section with Scroll Animation */}
      <div ref={containerRef} className="h-[40rem] md:h-[60rem] flex items-center justify-center relative p-2 md:p-10">
        <div className="py-5 md:py-20 w-full relative" style={{ perspective: "1000px" }}>
          <Header
            translate={translate}
            titleComponent={
              <div className="text-center -mt-20">
                <h2 className="text-3xl md:text-5xl font-bold mb-4 text-white">How It Works</h2>
                <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                  Master new skills while earning yield on your capital through our innovative platform.
                </p>
              </div>
            }
          />
          
          <Card rotate={rotate} translate={translate} scale={scale}>
            <div className="h-full w-full p-6 md:p-10 flex flex-col justify-center items-center">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl">
                {[1, 2, 3].map((item) => (
                  <div 
                    key={item}
                    className="bg-gray-800/50 p-8 rounded-xl border border-gray-700/50"
                  >
                    <div className="w-14 h-14 bg-emerald-500/20 rounded-lg flex items-center justify-center mb-6">
                      <span className="text-emerald-400 text-2xl font-bold">{item}</span>
                    </div>
                    <h3 className="text-xl font-bold mb-3 text-white">
                      {item === 1 ? "Deposit USDC" : item === 2 ? "Choose Skills Track" : "Complete Tasks & Earn"}
                    </h3>
                    <p className="text-gray-400">
                      {item === 1 
                        ? "Start by depositing USDC into your SkillStreak account. Your capital generates yield through Solana DeFi protocols."
                        : item === 2 
                        ? "Choose from various learning tracks - crypto knowledge, coding skills, languages, finance & more."
                        : "Complete daily learning tasks. Earn rewards from yield plus bonus tokens for consistency."
                      }
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Get Started Section with 3D Cards */}
      <section className="py-12 bg-black">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl md:text-5xl mb-8 text-left tracking-wide">
            Get Started On SkillStreak
          </h2>
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            {/* Card 1: Pick a Wallet */}
            <div className="w-full md:w-1/3 mb-8 md:mb-0">
              <Link href="/wallets" className="block w-full h-full">
                <CardContainer className="w-full" containerClassName="!py-4 !w-full">
                  <CardBody className="!w-full !h-[400px]">
                    <div className="relative w-full h-full rounded-xl overflow-hidden transition-all duration-300 group cursor-pointer"
                      style={{
                        background: "linear-gradient(145deg, #1a0f2b 0%, #32194f 50%, #4b2a80 100%)",
                        boxShadow: "0 10px 30px rgba(75, 42, 128, 0.15), inset 0 0 0 1px rgba(255, 255, 255, 0.05)"
                      }}>
                      
                      {/* Hover brightness effect */}
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-5 pointer-events-none"
                        style={{ 
                          background: "linear-gradient(145deg, #2E184A 0%, #4A2D77 50%, #653AA9 100%)",
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
                        <div className="relative w-full h-full flex flex-col justify-between">
                          {/* Top section */}
                          <div className="flex justify-end">
                            {/* Icon in top right */}
                            <CardItem
                              translateZ={40}
                              className="w-28 h-28 rounded-full flex items-center justify-center"
                              style={{ 
                                background: "linear-gradient(135deg, rgba(200,200,200,0.3) 0%, rgba(150,150,150,0.1) 100%)",
                                boxShadow: "0 0 15px rgba(255,255,255,0.1), inset 0 0 20px rgba(255,255,255,0.03)"
                              }}>
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-14 h-14 text-gray-200"
                                style={{ filter: "drop-shadow(0 0 1px rgba(255,255,255,0.3))" }}>
                                <rect x="2" y="6" width="20" height="12" rx="2" strokeWidth="1.5" />
                                <path d="M22 10H18C16.9 10 16 10.9 16 12V12C16 13.1 16.9 14 18 14H22V10Z" strokeWidth="1.5" />
                              </svg>
                            </CardItem>
                          </div>
                          
                          {/* Bottom section */}
                          <div className="flex flex-col items-start">
                            {/* Number badge above title, left aligned, oblong shaped */}
                            <CardItem
                              translateZ={20}
                              className="bg-purple-500/80 text-white h-8 px-4 rounded-full flex items-center justify-center font-bold text-lg mb-2 group-hover:bg-purple-500">
                              1
                            </CardItem>
                            
                            {/* Title at bottom left */}
                            <CardItem
                              translateZ={50}
                              className="text-3xl font-bold text-left text-white/85 group-hover:text-white">
                              Pick a wallet
                            </CardItem>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardBody>
                </CardContainer>
              </Link>
            </div>

            {/* Card 2: Fund Account */}
            <div className="w-full md:w-1/3 mb-8 md:mb-0">
              <div className="cursor-pointer">
                <CardContainer className="w-full" containerClassName="!py-4 !w-full">
                  <CardBody className="!w-full !h-[400px]">
                    <div className="relative w-full h-full rounded-xl overflow-hidden transition-all duration-300 group cursor-pointer"
                      style={{
                        background: "linear-gradient(145deg, #061625 0%, #0d2945 50%, #153e6b 100%)",
                        boxShadow: "0 10px 30px rgba(21, 62, 107, 0.15), inset 0 0 0 1px rgba(255, 255, 255, 0.05)"
                      }}>
                      
                      {/* Hover brightness effect */}
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-5 pointer-events-none"
                        style={{ 
                          background: "linear-gradient(145deg, #0a1f36 0%, #153965 50%, #20518c 100%)",
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
                        <div className="relative w-full h-full flex flex-col justify-between">
                          {/* Top section */}
                          <div className="flex justify-end">
                            {/* Icon in top right */}
                            <CardItem
                              translateZ={40}
                              className="w-28 h-28 flex items-center justify-center">
                              <div className="w-full h-full rotate-45" style={{ 
                                boxShadow: "0 0 15px rgba(255,255,255,0.07)"
                              }}>
                                <div className="absolute inset-0 w-full h-full border-2 border-gray-300/30 rounded-lg" 
                                  style={{ 
                                    background: "linear-gradient(135deg, rgba(200,200,200,0.2) 0%, rgba(150,150,150,0.07) 100%)", 
                                    boxShadow: "inset 0 0 10px rgba(255,255,255,0.03)" 
                                  }}>
                                </div>
                                <div className="absolute inset-0 flex items-center justify-center -rotate-45">
                                  <span className="text-gray-200/90 text-3xl font-bold group-hover:text-gray-200" 
                                    style={{ textShadow: "0 0 5px rgba(255,255,255,0.1)" }}>
                                    IP
                                  </span>
                                </div>
                              </div>
                            </CardItem>
                          </div>
                          
                          {/* Bottom section */}
                          <div className="flex flex-col items-start">
                            {/* Number badge above title, left aligned, oblong shaped */}
                            <CardItem
                              translateZ={20}
                              className="bg-blue-500/80 text-white h-8 px-4 rounded-full flex items-center justify-center font-bold text-lg mb-2 group-hover:bg-blue-500">
                              2
                            </CardItem>
                            
                            {/* Title at bottom left */}
                            <CardItem
                              translateZ={50}
                              className="text-3xl font-bold text-left text-white/85 group-hover:text-white">
                              Fund Account
                            </CardItem>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardBody>
                </CardContainer>
              </div>
            </div>

            {/* Card 3: Explore Apps */}
            <div className="w-full md:w-1/3">
              <div className="cursor-pointer">
                <CardContainer className="w-full" containerClassName="!py-4 !w-full">
                  <CardBody className="!w-full !h-[400px]">
                    <div className="relative w-full h-full rounded-xl overflow-hidden transition-all duration-300 group cursor-pointer"
                      style={{
                        background: "linear-gradient(145deg, #3d2004 0%, #62340a 50%, #8c4c12 100%)",
                        boxShadow: "0 10px 30px rgba(140, 76, 18, 0.15), inset 0 0 0 1px rgba(255, 255, 255, 0.05)"
                      }}>
                      
                      {/* Hover brightness effect */}
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-5 pointer-events-none"
                        style={{ 
                          background: "linear-gradient(145deg, #59300A 0%, #8B4B10 50%, #C26B18 100%)",
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
                        <div className="relative w-full h-full flex flex-col justify-between">
                          {/* Top section */}
                          <div className="flex justify-end">
                            {/* Icon in top right */}
                            <CardItem
                              translateZ={40}
                              className="w-28 h-28 rounded-xl flex items-center justify-center"
                              style={{ 
                                background: "linear-gradient(135deg, rgba(200,200,200,0.3) 0%, rgba(150,150,150,0.1) 100%)",
                                boxShadow: "0 0 15px rgba(255,255,255,0.1), inset 0 0 20px rgba(255,255,255,0.03)"
                              }}>
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-14 h-14 text-gray-200/90 group-hover:text-gray-200"
                                style={{ filter: "drop-shadow(0 0 1px rgba(255,255,255,0.3))" }}>
                                <polygon points="5 3 19 12 5 21 5 3" strokeWidth="1.5" />
                              </svg>
                            </CardItem>
                          </div>
                          
                          {/* Bottom section */}
                          <div className="flex flex-col items-start">
                            {/* Number badge above title, left aligned, oblong shaped */}
                            <CardItem
                              translateZ={20}
                              className="bg-amber-500/80 text-white h-8 px-4 rounded-full flex items-center justify-center font-bold text-lg mb-2 group-hover:bg-amber-500">
                              3
                            </CardItem>
                            
                            {/* Title at bottom left */}
                            <CardItem
                              translateZ={50}
                              className="text-3xl font-bold text-left text-white/85 group-hover:text-white">
                              Explore Learning Tracks
                            </CardItem>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardBody>
                </CardContainer>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between mb-8">
            <div className="mb-8 md:mb-0">
              <h3 className="text-xl font-bold mb-4">SkillStreak</h3>
              <p className="text-gray-400 max-w-xs">
                Learn, Earn & Build Habits on Solana
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
              <div>
                <h4 className="text-lg font-medium mb-4">Product</h4>
                <ul className="space-y-2">
                  {["Features", "Pricing", "Testimonials", "FAQ"].map((item, i) => (
                    <li key={i}>
                      <a href="#" className="text-gray-400 hover:text-white transition-colors">
                        {item}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-lg font-medium mb-4">Resources</h4>
                <ul className="space-y-2">
                  {["Documentation", "Blog", "Community", "Support"].map((item, i) => (
                    <li key={i}>
                      <a href="#" className="text-gray-400 hover:text-white transition-colors">
                        {item}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-lg font-medium mb-4">Company</h4>
                <ul className="space-y-2">
                  {["About", "Careers", "Partners", "Contact"].map((item, i) => (
                    <li key={i}>
                      <a href="#" className="text-gray-400 hover:text-white transition-colors">
                        {item}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 mt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © 2025 SkillStreak. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              {["Twitter", "Discord", "GitHub", "Telegram"].map((item, i) => (
                <a key={i} href="#" className="text-gray-400 hover:text-white transition-colors">
                  {item}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}