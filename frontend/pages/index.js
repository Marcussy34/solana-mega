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
import Script from 'next/script';
import Head from 'next/head';
import { Timeline } from "@/components/ui/timeline";

export default function LandingPage() {
  // State for mobile menu
  const [isOpen, setIsOpen] = useState(false);
  
  // State for loading animation
  const [loading, setLoading] = useState(true);
  const [animationComplete, setAnimationComplete] = useState(false);
  const [visibleLetters, setVisibleLetters] = useState(0);
  
  // States for panel GSAP plugins
  const [gsapLoaded, setGsapLoaded] = useState(false);
  const [scrollTriggerLoaded, setScrollTriggerLoaded] = useState(false);
  const [scrollToLoaded, setScrollToLoaded] = useState(false);
  
  // Text to display letter by letter
  const fullText = "LockedIn";
  
  // Font families for random styling
  const fontFamilies = [
    "'Arial Black', sans-serif", 
    "'Impact', sans-serif", 
    "'Verdana', sans-serif", 
    "'Courier New', monospace", 
    "'Trebuchet MS', sans-serif",
    "'Georgia', serif",
    "'Times New Roman', serif"
  ];
  
  // Animation timing
  useEffect(() => {
    // Show black screen for a longer time
    const animationTimer = setTimeout(() => {
      // Animate letters one by one
      const letterInterval = setInterval(() => {
        setVisibleLetters(prev => {
          if (prev < fullText.length) {
            return prev + 1;
          } else {
            clearInterval(letterInterval);
            // After all letters are shown, complete the animation
            setAnimationComplete(true);
            
            // After animation completes, fade out after a longer delay to showcase the final result
            setTimeout(() => {
              setLoading(false);
            }, 1500); // Extended from 700ms to 1500ms
            return prev;
          }
        });
      }, 150); // Slower timing between letters (increased from 100ms to 150ms)
      
      return () => clearInterval(letterInterval);
    }, 800); // Extended initial delay from 500ms to 800ms
    
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

  // GSAP and ScrollTrigger initialization for panels
  useEffect(() => {
    if (gsapLoaded && scrollTriggerLoaded && scrollToLoaded && typeof window !== 'undefined') {
      console.log('Initializing GSAP animations for panels');
      initPanelGSAP();
    }
  }, [gsapLoaded, scrollTriggerLoaded, scrollToLoaded]);

  // Initialize GSAP and ScrollTrigger for Panels
  const initPanelGSAP = () => {
    const gsap = window.gsap;
    const ScrollTrigger = window.ScrollTrigger;
    const ScrollToPlugin = window.ScrollToPlugin;

    gsap.registerPlugin(ScrollToPlugin, ScrollTrigger); // Ensure plugins are registered

    // Main elements for panels
    const coloredPanelsContainer = document.querySelector("#colored-panels-container-howitworks");
    const coloredPanels = gsap.utils.toArray(".colored-panel-howitworks");
    
    if (!coloredPanelsContainer || coloredPanels.length === 0) {
      console.warn("Panel elements not found for GSAP animation in index.js. Check selectors: #colored-panels-container-howitworks, .colored-panel-howitworks");
      return;
    }

    coloredPanels.forEach((panel, i) => {
      const reversedIndex = coloredPanels.length - 1 - i;
      gsap.set(panel, {
        zIndex: reversedIndex + 1,
        left: `${15 - i * 2}%`,
        top: '17.5%',
        xPercent: 100,
        opacity: 0,
        scale: 0.85,
        transformOrigin: "left center", // Changed for left-oriented stack/reveal
        borderRadius: "1rem",
        boxShadow: "0 10px 30px rgba(0,0,0,0.2)"
      });
    });
    
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: "#panels-section-howitworks",
        pin: true,
        start: "top top",
        end: `+=${window.innerHeight * (coloredPanels.length * 0.75)}`, // Adjusted end based on panel count
        scrub: 1,
        pinSpacing: true
      }
    });
    
    coloredPanels.forEach((panel, i) => {
      const reversedIndex = coloredPanels.length - 1 - i;
      tl.to(panel, {
        xPercent: 0,
        opacity: 1,
        scale: 1,
        duration: 0.5
      }, reversedIndex * 0.25); // Adjusted stagger timing
      
      ScrollTrigger.create({
        trigger: "#panels-section-howitworks",
        start: `top+=${window.innerHeight * 0.4 * i} top`, // Adjusted trigger points
        end: `top+=${window.innerHeight * 0.4 * (i + 1)} top`,
        onEnter: () => updateActiveIndicator(i + 1),
        onEnterBack: () => updateActiveIndicator(i + 1),
        id: `panel-trigger-howitworks-${i+1}`
      });
    });

    document.querySelectorAll(".anchor-howitworks").forEach(anchor => {
      anchor.addEventListener("click", function(e) {
        e.preventDefault();
        const href = e.currentTarget.getAttribute("href");
        
        if (href.startsWith('#panel-howitworks-')) {
          const panelNumber = parseInt(href.split('-')[2]);
          if (panelNumber >= 1 && panelNumber <= coloredPanels.length) {
            const scrollPosition = tl.scrollTrigger.start + 
              ((panelNumber - 1) / (coloredPanels.length -1)) * // Ensure float division
              (tl.scrollTrigger.end - tl.scrollTrigger.start);
            
            gsap.to(window, {
              scrollTo: { y: scrollPosition, autoKill: false }, // autoKill false for smoother scroll with pin
              duration: 1,
              ease: "power2.inOut"
            });
          } else {
            gsap.to(window, { scrollTo: { y: href, autoKill: false }, duration: 1 });
          }
        } else {
          gsap.to(window, { scrollTo: { y: href, autoKill: false }, duration: 1 });
        }
      });
    });
    
    function updateActiveIndicator(panelNumber) {
      document.querySelectorAll('.indicator-howitworks').forEach(ind => {
        ind.classList.remove('active');
        ind.querySelector('.indicator-dot')?.classList.replace('bg-[#14F195]', 'bg-[#778DA9]');
      });
      const activeIndicator = document.querySelector(`.indicator-howitworks[data-panel="${panelNumber}"]`);
      if (activeIndicator) {
        activeIndicator.classList.add('active');
        activeIndicator.querySelector('.indicator-dot')?.classList.replace('bg-[#778DA9]', 'bg-[#14F195]');
      }
    }
    
    document.querySelectorAll('.indicator-howitworks').forEach((indicator) => {
      indicator.addEventListener('click', function() {
        const panelNumber = this.getAttribute('data-panel');
        const href = `#panel-howitworks-${panelNumber}`;
        const panelIndex = parseInt(panelNumber) - 1;

        if (panelIndex >= 0 && panelIndex < coloredPanels.length) {
            const scrollPosition = tl.scrollTrigger.start +
                                 (panelIndex / (coloredPanels.length -1)) * 
                                 (tl.scrollTrigger.end - tl.scrollTrigger.start);
            gsap.to(window, {
              scrollTo: { y: scrollPosition, autoKill: false },
              duration: 1,
              ease: "power2.inOut"
            });
        }
      });
    });
  };

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

  // Data for the new Timeline component
  const skillStreakTimelineData = [
    {
      title: "Sign Up & Connect",
      content: (
        <div className="text-neutral-700 dark:text-neutral-300 text-sm md:text-base">
          <p className="mb-2">Quickly create your SkillStreak account and connect your Solana wallet (like Phantom or Solflare). This is your gateway to learning and earning!</p>
          <img src="/placeholder-signup.png" alt="Sign Up Illustration" className="rounded-lg shadow-md mt-3 w-full max-w-xs" />
        </div>
      ),
    },
    {
      title: "Choose Your Track",
      content: (
        <div className="text-neutral-700 dark:text-neutral-300 text-sm md:text-base">
          <p className="mb-2">Browse our extensive library of courses. Whether it's coding, design, or blockchain fundamentals, pick a learning track that excites you and fits your goals.</p>
          <img src="/placeholder-courses.png" alt="Course Selection Illustration" className="rounded-lg shadow-md mt-3 w-full max-w-xs" />
        </div>
      ),
    },
    {
      title: "Learn & Earn Yield",
      content: (
        <div className="text-neutral-700 dark:text-neutral-300 text-sm md:text-base">
          <p className="mb-2">Deposit SOL to your SkillStreak account. As you complete lessons and maintain your learning streaks, you'll earn attractive yields on your deposited capital. The more you learn, the more you earn!</p>
        </div>
      ),
    },
    {
      title: "Compete & Bet (Optional)",
      content: (
        <div className="text-neutral-700 dark:text-neutral-300 text-sm md:text-base">
          <p className="mb-2">Up the ante with social betting! Challenge friends or other learners on course completion. Stake SOL, race to the finish, and win extra rewards plus bragging rights.</p>
        </div>
      ),
    },
    {
      title: "Track Progress & Grow",
      content: (
        <div className="text-neutral-700 dark:text-neutral-300 text-sm md:text-base">
          <p className="mb-2">Monitor your achievements on your personalized dashboard. See your completed courses, total earnings, and skill development. Keep the streak alive and watch your knowledge and wallet expand!</p>
          <img src="/placeholder-dashboard.png" alt="Dashboard Illustration" className="rounded-lg shadow-md mt-3 w-full max-w-xs" />
        </div>
      ),
    },
  ];

  return (
    <>
      <Head>
        <title>LockedIn - Secure Your Future</title>
        <meta name="description" content="Welcome to LockedIn, the future of secure asset management." />
      </Head>

      {/* Load GSAP and plugins */}
      <Script 
        src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.4/gsap.min.js"
        strategy="afterInteractive"
        onLoad={() => setGsapLoaded(true)}
      />
      <Script 
        src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.4/ScrollTrigger.min.js"
        strategy="afterInteractive"
        onLoad={() => setScrollTriggerLoaded(true)}
      />
      <Script 
        src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.4/ScrollToPlugin.min.js"
        strategy="afterInteractive"
        onLoad={() => setScrollToLoaded(true)}
      />

      {/* Loading Overlay */}
      <AnimatePresence>
        {loading && (
          <motion.div 
            className="fixed inset-0 bg-[#0D1B2A] z-50 flex items-center justify-center"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
          >
            <motion.div
              className="relative"
              initial={{ scale: 1 }}
              animate={{ 
                scale: animationComplete ? 0.85 : 1,
                y: animationComplete ? -10 : 0
              }}
              transition={{ 
                duration: 0.8, 
                ease: "easeInOut",
                delay: 0.2
              }}
            >
              <div className="text-[#E0E1DD] text-7xl md:text-9xl font-bold tracking-tighter flex">
                {"LockedIn".split('').map((letter, index) => {
                  // Random style for each letter
                  const randomFontFamily = fontFamilies[Math.floor(Math.random() * fontFamilies.length)];
                  const randomRotation = Math.random() * 60 - 30; // Between -30 and 30 degrees (increased range)
                  const randomScale = 0.7 + Math.random() * 0.6; // Between 0.7 and 1.3 (increased range)
                  
                  return (
                    <motion.span
                      key={index}
                      initial={{ 
                        opacity: 0, 
                        y: -100, 
                        rotate: randomRotation,
                        scale: randomScale
                      }}
                      animate={{ 
                        opacity: index < visibleLetters ? 1 : 0, 
                        y: index < visibleLetters ? 0 : -100,
                        rotate: index < visibleLetters ? 0 : randomRotation,
                        scale: index < visibleLetters ? 1 : randomScale
                      }}
                      transition={{ 
                        type: "spring", 
                        damping: 12, 
                        stiffness: 100,
                        delay: 0.05
                      }}
                      style={{ 
                        textShadow: "0 0 20px rgba(224, 225, 221, 0.3)",
                        fontWeight: 800,
                        fontFamily: !animationComplete ? randomFontFamily : 'inherit',
                        display: 'inline-block',
                        marginRight: letter === ' ' ? '0.5rem' : '0'
                      }}
                    >
                      {letter}
                    </motion.span>
                  );
                })}
              </div>
              
              {animationComplete && (
                <>
                  <motion.div 
                    className="h-1 bg-[#778DA9] mt-4 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  ></motion.div>
                  
                  {/* Solana branding */}
                  <motion.div
                    className="mt-6 flex flex-col items-center justify-center"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                  >
                    <div className="text-[#14F195] text-xl md:text-2xl font-medium flex items-center gap-2">
                      <svg width="20" height="20" viewBox="0 0 397 311" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M64.8583 237.414L149.861 310.823C152.998 313.574 157.191 313.574 160.328 310.823L396.249 106.395C401.151 102.077 401.151 94.2139 396.249 89.8954L347.258 46.5828C344.121 43.8314 339.928 43.8314 336.791 46.5828L64.8583 276.152C59.956 280.47 59.956 288.333 64.8583 292.651V237.414Z" fill="#14F195"/>
                        <path d="M64.8583 152.707L149.861 226.117C152.998 228.868 157.191 228.868 160.328 226.117L396.249 21.6888C401.151 17.3704 401.151 9.5071 396.249 5.1886L347.258 -38.1239C344.121 -40.8753 339.928 -40.8753 336.791 -38.1239L64.8583 191.446C59.956 195.764 59.956 203.627 64.8583 207.945V152.707Z" fill="#14F195"/>
                        <path d="M149.861 141.41L64.8583 67.9999C59.956 63.6815 59.956 55.8182 64.8583 51.4998L113.85 8.18712C116.986 5.43573 121.18 5.43573 124.317 8.18712L233.368 104.229C236.505 106.98 236.505 111.299 233.368 114.05L160.328 177.512C157.191 180.263 152.998 180.263 149.861 177.512V141.41Z" fill="#14F195"/>
                      </svg>
                      Powered by Solana
                    </div>
                    
                    <motion.div
                      className="text-[#778DA9] text-sm mt-2 flex gap-3"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.8 }}
                      transition={{ duration: 0.6, delay: 0.6 }}
                    >
                      <span>Web3</span>
                      <span>•</span>
                      <span>Crypto</span>
                      <span>•</span>
                      <span>Blockchain</span>
                    </motion.div>
                  </motion.div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="min-h-screen bg-[#0D1B2A] text-[#E0E1DD]">
        {/* Resizable Navbar */}
        <Navbar className="top-0 bg-[#1B263B]/80 backdrop-blur-sm border-b border-[#415A77]/20">
          <NavBody>
            <Link href="/">
              <NavbarLogo asChild />
            </Link>
            <NavItems items={navItems} className="text-[#E0E1DD]" />
            <div className="relative z-20 flex flex-row items-center justify-end space-x-2">
              <NavbarButton variant="secondary" href="#contact" className="bg-[#1B263B] text-[#E0E1DD] border border-[#415A77]/50 hover:bg-[#415A77]/50">
                Log In
              </NavbarButton>
              <NavbarButton variant="emerald" href="#contact" className="bg-[#415A77] text-[#E0E1DD] hover:bg-[#778DA9]">
                Get Started
              </NavbarButton>
            </div>
          </NavBody>
          <MobileNav>
            <MobileNavHeader>
              <Link href="/">
                <NavbarLogo asChild />
              </Link>
              <MobileNavToggle isOpen={isOpen} onClick={() => setIsOpen(!isOpen)} className="text-[#E0E1DD]" />
            </MobileNavHeader>
            <MobileNavMenu isOpen={isOpen} className="bg-[#1B263B]">
              {navItems.map((item, idx) => (
                <a
                  key={idx}
                  href={item.link}
                  className="w-full rounded-md px-3 py-2 text-sm font-medium text-[#778DA9] transition-colors hover:bg-[#415A77]/20 hover:text-[#E0E1DD]"
                  onClick={() => setIsOpen(false)}
                >
                  {item.name}
                </a>
              ))}
              <div className="mt-4 flex w-full flex-col gap-2">
                <NavbarButton variant="secondary" className="w-full bg-[#1B263B] border border-[#415A77]/50 text-[#E0E1DD] hover:bg-[#415A77]/50">
                  Log In
                </NavbarButton>
                <NavbarButton variant="emerald" className="w-full bg-[#415A77] text-[#E0E1DD] hover:bg-[#778DA9]">
                  Get Started
                </NavbarButton>
              </div>
            </MobileNavMenu>
          </MobileNav>
        </Navbar>

        {/* Hero Section */}
        <section className="relative min-h-screen flex items-center pt-20">
          {/* 3D Marquee Background */}
          <div className="absolute inset-0 z-0 opacity-15 overflow-hidden">
            <ThreeDMarquee images={images} />
          </div>
          
          {/* Content */}
          <div className="relative z-10 container mx-auto px-4 text-left">
            <div className="max-w-2xl">
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 text-[#E0E1DD]">
                LockedIn
              </h1>
              <p className="text-xl md:text-2xl mb-8 text-[#778DA9]">
                Learn, Earn & Build Habits on Solana. Master new skills while earning yield on your capital.
              </p>
            </div>
          </div>
        </section>

        {/* Get Started Section with 3D Cards - MOVED HERE */}
        <section className="py-12 bg-[#0D1B2A]">
          <div className="container mx-auto px-4">
            <h2 className="text-4xl md:text-5xl mb-8 text-left tracking-wide text-[#E0E1DD]">
              Get Started with LockedIn
            </h2>
            <div className="flex flex-col md:flex-row justify-between items-center gap-8">
              {/* Card 1: Pick a Wallet */}
              <div className="w-full md:w-1/3 mb-8 md:mb-0">
                <Link href="/wallets" className="block w-full h-full">
                  <CardContainer className="w-full" containerClassName="!py-4 !w-full">
                    <CardBody className="!w-full !h-[400px]">
                      <div className="relative w-full h-full rounded-xl overflow-hidden transition-all duration-300 group cursor-pointer"
                        style={{
                          background: `linear-gradient(145deg, #1A374D 0%, #406882 50%, #6998AB 100%)`,
                          boxShadow: "0 10px 30px rgba(27, 38, 59, 0.25), inset 0 0 0 1px rgba(224, 225, 221, 0.05)"
                        }}>
                        
                        {/* Hover brightness effect */}
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-5 pointer-events-none"
                          style={{ 
                            background: "linear-gradient(145deg, #406882 0%, #6998AB 50%, #B1D0E0 100%)",
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
                                  background: "linear-gradient(135deg, rgba(119, 141, 169, 0.3) 0%, rgba(65, 90, 119, 0.1) 100%)",
                                  boxShadow: "0 0 15px rgba(224, 225, 221, 0.1), inset 0 0 20px rgba(224, 225, 221, 0.03)"
                                }}>
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-14 h-14 text-[#E0E1DD]"
                                  style={{ filter: "drop-shadow(0 0 1px rgba(224, 225, 221, 0.3))" }}>
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
                                className="bg-[#415A77]/80 text-[#E0E1DD] h-8 px-4 rounded-full flex items-center justify-center font-bold text-lg mb-2 group-hover:bg-[#415A77]">
                                1
                              </CardItem>
                              
                              {/* Title at bottom left */}
                              <CardItem
                                translateZ={50}
                                className="text-3xl font-bold text-left text-[#E0E1DD]/85 group-hover:text-[#E0E1DD]">
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
                          background: `linear-gradient(145deg, #3D2C8D 0%, #916BBF 50%, #C996CC 100%)`,
                          boxShadow: "0 10px 30px rgba(27, 38, 59, 0.25), inset 0 0 0 1px rgba(224, 225, 221, 0.05)"
                        }}>
                        
                        {/* Hover brightness effect */}
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-5 pointer-events-none"
                          style={{ 
                            background: "linear-gradient(145deg, #4B3A9F 0%, #916BBF 50%, #D1A7D1 100%)",
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
                                  boxShadow: "0 0 15px rgba(224, 225, 221, 0.07)"
                                }}>
                                  <div className="absolute inset-0 w-full h-full border-2 border-[#778DA9]/30 rounded-lg" 
                                    style={{ 
                                      background: "linear-gradient(135deg, rgba(119, 141, 169, 0.2) 0%, rgba(65, 90, 119, 0.07) 100%)", 
                                      boxShadow: "inset 0 0 10px rgba(224, 225, 221, 0.03)" 
                                    }}>
                                  </div>
                                  <div className="absolute inset-0 flex items-center justify-center -rotate-45">
                                    <span className="text-[#E0E1DD]/90 text-3xl font-bold group-hover:text-[#E0E1DD]" 
                                      style={{ textShadow: "0 0 5px rgba(224, 225, 221, 0.1)" }}>
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
                                className="bg-[#415A77]/80 text-[#E0E1DD] h-8 px-4 rounded-full flex items-center justify-center font-bold text-lg mb-2 group-hover:bg-[#415A77]">
                                2
                              </CardItem>
                              
                              {/* Title at bottom left */}
                              <CardItem
                                translateZ={50}
                                className="text-3xl font-bold text-left text-[#E0E1DD]/85 group-hover:text-[#E0E1DD]">
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
                          background: `linear-gradient(145deg, #3F4E4F 0%, #A27B5C 50%, #DCD7C9 100%)`,
                          boxShadow: "0 10px 30px rgba(27, 38, 59, 0.25), inset 0 0 0 1px rgba(224, 225, 221, 0.05)"
                        }}>
                        
                        {/* Hover brightness effect */}
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-5 pointer-events-none"
                          style={{ 
                            background: "linear-gradient(145deg, #576F72 0%, #A27B5C 50%, #E4DCCF 100%)",
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
                                  background: "linear-gradient(135deg, rgba(119, 141, 169, 0.3) 0%, rgba(65, 90, 119, 0.1) 100%)",
                                  boxShadow: "0 0 15px rgba(224, 225, 221, 0.1), inset 0 0 20px rgba(224, 225, 221, 0.03)"
                                }}>
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-14 h-14 text-[#E0E1DD]/90 group-hover:text-[#E0E1DD]"
                                  style={{ filter: "drop-shadow(0 0 1px rgba(224, 225, 221, 0.3))" }}>
                                  <polygon points="5 3 19 12 5 21 5 3" strokeWidth="1.5" />
                                </svg>
                              </CardItem>
                            </div>
                            
                            {/* Bottom section */}
                            <div className="flex flex-col items-start">
                              {/* Number badge above title, left aligned, oblong shaped */}
                              <CardItem
                                translateZ={20}
                                className="bg-[#415A77]/80 text-[#E0E1DD] h-8 px-4 rounded-full flex items-center justify-center font-bold text-lg mb-2 group-hover:bg-[#415A77]">
                                3
                              </CardItem>
                              
                              {/* Title at bottom left */}
                              <CardItem
                                translateZ={50}
                                className="text-3xl font-bold text-left text-[#E0E1DD]/85 group-hover:text-[#E0E1DD]">
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

        {/* How SkillStreak Works - Timeline Section */}
        <section className="bg-[#0D1B2A]"> {/* Match page background, timeline component might override parts of this */}
          <div className="max-w-7xl mx-auto py-16 md:py-24 px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl md:text-5xl font-bold mb-4 text-center text-[#E0E1DD]">
              How SkillStreak Works
            </h2>
            <p className="text-xl text-center text-[#778DA9] max-w-3xl mx-auto mb-12 md:mb-16">
              Follow these simple steps to start learning, earning, and growing with SkillStreak on the Solana blockchain.
            </p>
            <Timeline data={skillStreakTimelineData} />
          </div>
        </section>

        {/* Interactive Panels Section (Formerly How It Works) */}
        <section id="panels-section-howitworks" className="min-h-screen bg-[#0D1B2A] py-12 md:py-20 relative">
          <div className="container mx-auto px-4">
            <div className="two-column-layout-howitworks h-[100vh] flex w-full">
              {/* Static black sidebar */}
              <div className="static-black-sidebar-howitworks w-[30%] bg-[#0D1B2A] text-[#E0E1DD] p-8 rounded-lg shadow-xl relative z-10 flex flex-col justify-center">
                <div className="sidebar-content-howitworks">
                  <h3 className="text-3xl md:text-4xl font-bold mb-6 text-[#E0E1DD]">Sharpen Your Skills and Wallet with SkillStreak</h3>
                  <p className="text-[#ADB5BD] mb-8 text-lg leading-relaxed">
                    Want to learn new skills and make money while doing it? Welcome to SkillStreak, the game-changing app on the Solana blockchain that pays you to grow. With cutting-edge courses, financial rewards, and a vibrant community, SkillStreak turns learning into a habit that fuels your future.
                  </p>
                </div>
              </div>
              
              {/* Scrollable colored panels */}
              <div className="scrollable-panels-howitworks w-[70%] h-[100vh] overflow-hidden relative">
                <div id="colored-panels-container-howitworks" className="relative h-full w-full">
                  {/* Panel 1 */}
                  <div id="panel-howitworks-1" className="colored-panel-howitworks absolute w-[70%] h-[65%] top-0 right-[5%] flex flex-col overflow-hidden rounded-xl shadow-2xl bg-white text-slate-700">
                    <div className="panel-content-howitworks w-full h-full flex flex-col justify-between p-6 md:p-8">
                      {/* Top Right Icon Area */}
                      <div className="flex justify-end">
                        <div className="w-14 h-14 md:w-16 md:h-16 bg-slate-100 rounded-lg flex items-center justify-center text-2xl md:text-3xl text-slate-500">
                          <span>🚀</span>
                        </div>
                      </div>
                      {/* Bottom Left Title and Subtext Area */}
                      <div>
                        <h4 className="text-2xl md:text-3xl font-bold mb-2 md:mb-3 text-left">Powered by Solana's Speed</h4>
                        <p className="text-base md:text-lg text-left leading-relaxed text-slate-600">
                          Built on Solana, SkillStreak delivers lightning-fast transactions and rock-solid security. Deposit, earn, and bet with zero hassle, knowing your funds are safe on one of the world's most advanced blockchains. Focus on learning, not logistics.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Panel 2 */}
                  <div id="panel-howitworks-2" className="colored-panel-howitworks absolute w-[70%] h-[65%] top-0 right-[5%] flex flex-col overflow-hidden rounded-xl shadow-2xl bg-white text-slate-700">
                    <div className="panel-content-howitworks w-full h-full flex flex-col justify-between p-6 md:p-8">
                      {/* Top Right Icon Area */}
                      <div className="flex justify-end">
                        <div className="w-14 h-14 md:w-16 md:h-16 bg-slate-100 rounded-lg flex items-center justify-center text-2xl md:text-3xl text-slate-500">
                          <span>🤝</span>
                        </div>
                      </div>
                      {/* Bottom Left Title and Subtext Area */}
                      <div>
                        <h4 className="text-2xl md:text-3xl font-bold mb-2 md:mb-3 text-left">Compete, Connect, Cash Out</h4>
                        <p className="text-base md:text-lg text-left leading-relaxed text-slate-600">
                          Take learning to the next level with SkillStreak's social betting feature. Challenge friends or global learners to fun wagers on your learning goals—stake SOL and race to finish a course first! Win bragging rights, extra rewards, and build bonds with a community that's as driven as you are.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Panel 3 */}
                  <div id="panel-howitworks-3" className="colored-panel-howitworks absolute w-[70%] h-[65%] top-0 right-[5%] flex flex-col overflow-hidden rounded-xl shadow-2xl bg-white text-slate-700">
                    <div className="panel-content-howitworks w-full h-full flex flex-col justify-between p-6 md:p-8">
                      {/* Top Right Icon Area */}
                      <div className="flex justify-end">
                        <div className="w-14 h-14 md:w-16 md:h-16 bg-slate-100 rounded-lg flex items-center justify-center text-2xl md:text-3xl text-slate-500">
                          <span>🎯</span>
                        </div>
                      </div>
                      {/* Bottom Left Title and Subtext Area */}
                      <div>
                        <h4 className="text-2xl md:text-3xl font-bold mb-2 md:mb-3 text-left">Stick to It, See Results</h4>
                        <p className="text-base md:text-lg text-left leading-relaxed text-slate-600">
                          Building habits is hard, but SkillStreak makes it rewarding. Our intuitive tools help you stay consistent with daily streaks and motivational nudges. Track your progress with a sleek dashboard that shows your course completions, earned rewards, and skill milestones. Watch your growth soar as learning becomes second nature.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Panel 4 */}
                  <div id="panel-howitworks-4" className="colored-panel-howitworks absolute w-[70%] h-[65%] top-0 right-[5%] flex flex-col overflow-hidden rounded-xl shadow-2xl bg-white text-slate-700">
                    <div className="panel-content-howitworks w-full h-full flex flex-col justify-between p-6 md:p-8">
                      {/* Top Right Icon Area */}
                      <div className="flex justify-end">
                        <div className="w-14 h-14 md:w-16 md:h-16 bg-slate-100 rounded-lg flex items-center justify-center text-2xl md:text-3xl text-slate-500">
                          <span>📚</span>
                        </div>
                      </div>
                      {/* Bottom Left Title and Subtext Area */}
                      <div>
                        <h4 className="text-2xl md:text-3xl font-bold mb-2 md:mb-3 text-left">Master Any Skill, Your Way</h4>
                        <p className="text-base md:text-lg text-left leading-relaxed text-slate-600">
                          From blockchain coding to creative storytelling, SkillStreak offers a massive range of subjects to spark your curiosity. Our short, engaging courses fit into your busy life, making it easy to build a daily learning habit. Pick a topic, dive in, and level up your expertise in minutes a day.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Panel 5 */}
                  <div id="panel-howitworks-5" className="colored-panel-howitworks absolute w-[70%] h-[65%] top-0 right-[5%] flex flex-col overflow-hidden rounded-xl shadow-2xl bg-white text-slate-700">
                    <div className="panel-content-howitworks w-full h-full flex flex-col justify-between p-6 md:p-8">
                      {/* Top Right Icon Area */}
                      <div className="flex justify-end">
                        <div className="w-14 h-14 md:w-16 md:h-16 bg-slate-100 rounded-lg flex items-center justify-center text-2xl md:text-3xl text-slate-500">
                          <span>💰</span>
                        </div>
                      </div>
                      {/* Bottom Left Title and Subtext Area */}
                      <div>
                        <h4 className="text-2xl md:text-3xl font-bold mb-2 md:mb-3 text-left">Cash In While You Learn</h4>
                        <p className="text-base md:text-lg text-left leading-relaxed text-slate-600">
                          Why just learn when you can earn? Deposit SOL into SkillStreak and watch your funds grow with attractive yields as you study. Every course you complete brings you closer to financial freedom. It's simple: the more you learn, the more you earn. Start stacking knowledge and wealth today!
                        </p>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-[#1B263B] py-12">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between mb-8">
              <div className="mb-8 md:mb-0">
                <h3 className="text-xl font-bold mb-4 text-[#E0E1DD]">LockedIn</h3>
                <p className="text-[#778DA9] max-w-xs">
                  Learn, Earn & Build Habits on Solana
                </p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
                <div>
                  <h4 className="text-lg font-medium mb-4 text-[#E0E1DD]">Product</h4>
                  <ul className="space-y-2">
                    {["Features", "Pricing", "Testimonials", "FAQ"].map((item, i) => (
                      <li key={i}>
                        <a href="#" className="text-[#778DA9] hover:text-[#E0E1DD] transition-colors">
                          {item}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-lg font-medium mb-4 text-[#E0E1DD]">Resources</h4>
                  <ul className="space-y-2">
                    {["Documentation", "Blog", "Community", "Support"].map((item, i) => (
                      <li key={i}>
                        <a href="#" className="text-[#778DA9] hover:text-[#E0E1DD] transition-colors">
                          {item}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-lg font-medium mb-4 text-[#E0E1DD]">Company</h4>
                  <ul className="space-y-2">
                    {["About", "Careers", "Partners", "Contact"].map((item, i) => (
                      <li key={i}>
                        <a href="#" className="text-[#778DA9] hover:text-[#E0E1DD] transition-colors">
                          {item}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
            <div className="border-t border-[#415A77] pt-8 mt-8 flex flex-col md:flex-row justify-between items-center">
              <p className="text-[#778DA9] text-sm">
                © 2025 LockedIn. All rights reserved.
              </p>
              <div className="flex space-x-6 mt-4 md:mt-0">
                {["Twitter", "Discord", "GitHub", "Telegram"].map((item, i) => (
                  <a key={i} href="#" className="text-[#778DA9] hover:text-[#E0E1DD] transition-colors">
                    {item}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </footer>
      </div>

      {/* Styles for the How It Works Panels - Scoped */}
      <style jsx>{`
        /* Base for panel section */
        #panels-section-howitworks {
          /* Ensures it has a backdrop if needed, though bg is on the section itself */
        }

        .two-column-layout-howitworks {
          /* display: flex; Already handled by Tailwind on the div */
          /* width: 100%; Already handled by Tailwind */
          /* height: 100vh; Already handled by Tailwind */
        }
        
        .static-black-sidebar-howitworks {
          /* width: 30%; Handled by Tailwind */
          /* background-color: #1B263B; Handled by Tailwind */
          /* color: #E0E1DD; Handled by Tailwind */
          /* position: relative; Handled by Tailwind */
          /* z-index: 10; Tailwind z-10 used */
          /* height: 100%; Handled by Tailwind */
          /* display: flex; Handled by Tailwind */
          /* align-items: center; Handled by Tailwind */
          /* justify-content: center; Handled by Tailwind */
        }
        
        .sidebar-content-howitworks {
          /* padding: 2rem; Tailwind p-8 used */
          /* max-width: 90%; */
        }
                
        .panel-indicators-howitworks .indicator-howitworks.active {
          color: #14F195; /* Active color from original panels.js */
          /* transform: translateX(10px); Optional: if you want the text to shift */
        }

        .panel-indicators-howitworks .indicator-howitworks .indicator-dot {
          transition: background-color 0.3s ease;
        }
        
        .scrollable-panels-howitworks {
          /* width: 70%; Handled by Tailwind */
          /* height: 100%; Handled by Tailwind */
          /* overflow: hidden; Handled by Tailwind */
          /* position: relative; Handled by Tailwind */
        }
        
        #colored-panels-container-howitworks {
          /* position: relative; Handled by Tailwind */
          /* height: 100%; Handled by Tailwind */
          /* width: 100%; Handled by Tailwind */
          /* padding-top: 2%; Handled by Tailwind pt-[2%] */
        }
        
        .colored-panel-howitworks {
          /* These are set by GSAP, but good to have defaults if JS fails or for initial state */
          /* width: 80%; Handled by Tailwind */
          /* height: 75%; Handled by Tailwind */
          /* position: absolute; Handled by Tailwind */
          /* top: 0; Handled by Tailwind */
          /* right: 5%; Handled by Tailwind */
          /* display: flex; Handled by Tailwind */
          /* justify-content: center; Handled by Tailwind */
          /* align-items: center; Handled by Tailwind */
          will-change: transform, opacity; /* Optimization for GSAP */
          /* overflow: hidden; Handled by Tailwind */
          /* border-radius: 1rem; Tailwind rounded-xl used */
          /* box-shadow: ...; Tailwind shadow-2xl used */
        }
        
        .panel-content-howitworks {
          /* padding: 2rem; Tailwind p-8 used */
          /* max-width: 90%; Tailwind max-w-md used, can adjust if needed */
          /* width: 100%; Handled by Tailwind */
        }
                
        /* Navigation within panels */
        .panels-navigation-howitworks {
          /* display: flex; Handled by Tailwind */
          /* gap: 20px; Tailwind gap- can be used if multiple items */
          /* margin-top: auto; Can be useful if content height varies */
        }
        
        .nav-panel-howitworks a {
          text-decoration: none;
          color: inherit; /* Inherits color from parent button */
        }

        /* Ensure smooth scroll behavior if not globally set */
        html {
          scroll-behavior: smooth;
        }

        /* Responsive adjustments if needed - initial ones from panels.js were for a different structure */
        @media screen and (max-width: 768px) {
          .two-column-layout-howitworks {
            flex-direction: column;
            height: auto; /* Adjust height for stacked layout */
          }
          
          .static-black-sidebar-howitworks {
            width: 100%;
            height: auto; /* Adjust height */
            margin-bottom: 2rem; /* Add some space between sidebar and panels */
          }
          
          .scrollable-panels-howitworks {
            width: 100%;
            height: 70vh; /* Or adjust as needed for content */
          }

          .colored-panel-howitworks {
             /* Consider adjusting panel size or positioning for mobile */
             /* For example, make them take more width and less overlap */
             width: 90%;
             right: 2%; /* Center it a bit more */
          }
        }
      `}</style>
    </>
  );
}
