"use client";
import React, { useState, useRef, useEffect } from "react";
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
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import Link from "next/link";

export default function LandingPage() {
  // State for mobile menu
  const [isOpen, setIsOpen] = useState(false);
  
  // State for loading animation
  const [loading, setLoading] = useState(true);
  const [animationComplete, setAnimationComplete] = useState(false);
  
  // Text to display letter by letter
  const fullText = "LockedIn";
  
  // Animation timing
  useEffect(() => {
    // Show black screen for a shorter time (500ms instead of 1000ms)
    const animationTimer = setTimeout(() => {
      // Show the text falling down
      setAnimationComplete(true);
      
      // After animation completes, fade out faster (700ms instead of 1000ms)
      setTimeout(() => {
        setLoading(false);
      }, 700);
    }, 500);
    
    return () => clearTimeout(animationTimer);
  }, []);
  
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
    <>
      {/* Loading Overlay */}
      <AnimatePresence>
        {loading && (
          <motion.div 
            className="fixed inset-0 bg-black z-50 flex items-center justify-center"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
          >
            <motion.div
              className="relative"
              initial={{ scale: 1 }}
              animate={{ scale: animationComplete ? 1 : 1 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <motion.h1 
                className="text-white text-7xl md:text-9xl font-bold tracking-tighter"
                initial={{ opacity: 0, y: -100 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  type: "spring", 
                  damping: 12, 
                  stiffness: 100, 
                  duration: 0.6 
                }}
                style={{ 
                  textShadow: "0 0 20px rgba(255,255,255,0.3)",
                  fontWeight: 800
                }}
              >
                LockedIn
              </motion.h1>
              
              {animationComplete && (
                <motion.div 
                  className="h-1 bg-white mt-4 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                ></motion.div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
                LockedIn
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
                          ? "Start by depositing USDC into your LockedIn account. Your capital generates yield through Solana DeFi protocols."
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

        {/* Footer */}
        <footer className="bg-gray-900 py-12">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between mb-8">
              <div className="mb-8 md:mb-0">
                <h3 className="text-xl font-bold mb-4">LockedIn</h3>
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
                © 2025 LockedIn. All rights reserved.
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
    </>
  );
}
