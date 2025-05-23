"use client";
import React, { useState, useRef, useEffect, useId, useCallback } from "react";
import { ContainerScroll, Header, Card } from "@/components/ui/container-scroll-animation";
import { CardContainer, CardBody, CardItem } from "@/components/ui/3d-card";
import { ThreeDMarquee } from "@/components/ui/3d-marquee";
import { motion, useScroll, useTransform, AnimatePresence, useMotionValue, useAnimationFrame, animate } from "framer-motion";
import Link from "next/link";
import Script from 'next/script';
import Head from 'next/head';
import { useOutsideClick } from "@/hooks/use-outside-click";
import { AuroraText } from "@/components/magicui/aurora-text";

export default function LandingPage() {
  // State for mobile menu
  const [isOpen, setIsOpen] = useState(false);
  
  // State for navbar visibility
  const [showNavbar, setShowNavbar] = useState(true);  // Start with navbar visible

  // Track last scroll position
  const [lastScrollY, setLastScrollY] = useState(0);

  // Hover detection area ref
  const hoverDetectionRef = useRef(null);
  
  // State for loading animation
  const [loading, setLoading] = useState(true);
  const [animationComplete, setAnimationComplete] = useState(false);
  const [visibleLetters, setVisibleLetters] = useState(0);
  
  // States for panel GSAP plugins
  const [gsapLoaded, setGsapLoaded] = useState(false);
  const [scrollTriggerLoaded, setScrollTriggerLoaded] = useState(false);
  const [scrollToLoaded, setScrollToLoaded] = useState(false);
  const [draggableLoaded, setDraggableLoaded] = useState(false);
  
  // State for spinning circle icons
  const [randomIconPoolURLs] = useState([
    '/image/lockedin_logo.png', 
    '/solanaLogoMark.svg', 
    '/usd-coin-usdc-logo.svg'
  ]);
  const [selectedIconURLs, setSelectedIconURLs] = useState(['', '', '']);
  
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
  
  // Add this state near the top with other states
  const [isGsapReady, setIsGsapReady] = useState(false);

  // Update the GSAP loading effect
  useEffect(() => {
    if (typeof window !== 'undefined') {
      let intervalId = null;

      const checkGsap = () => {
        if (window.gsap) {
          setIsGsapReady(true);
          if (intervalId) {
            clearInterval(intervalId);
          }
        }
      };
      
      // Check immediately
      checkGsap();
      
      // Set up interval if GSAP isn't available yet
      if (!window.gsap) {
        intervalId = setInterval(checkGsap, 100);
      }
      
      // Cleanup
      return () => {
        if (intervalId) {
          clearInterval(intervalId);
        }
      };
    }
  }, []);

  // Navbar visibility control
  useEffect(() => {
    // Initially show navbar
    setShowNavbar(true);
    
    const controlNavbar = () => {
      const currentScrollY = window.scrollY;
      
      // Show navbar if scrolled to the top
      if (currentScrollY <= 10) {
        setShowNavbar(true);
      } 
      // Hide navbar if scrolled down past a threshold
      else if (currentScrollY > 100) {
        // Revised: Always hide if scrolled down, hover logic will override if needed.
        setShowNavbar(false); 
      }
    };
    
    const checkMousePosition = (e) => {
      // Show navbar if mouse is within 100px of the top of the page
      if (e.clientY <= 100) {
        setShowNavbar(true);
      } 
      // No explicit hide needed here based on mouse position alone if scrolled down.
    };

    // Add event listeners
    window.addEventListener('scroll', controlNavbar, { passive: true }); // Use passive listener for scroll
    window.addEventListener('mousemove', checkMousePosition);
    
    // Remove event listeners on cleanup
    return () => {
      window.removeEventListener('scroll', controlNavbar);
      window.removeEventListener('mousemove', checkMousePosition);
    };
  }, []);

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
            }, 1500); 
            return prev;
          }
        });
      }, 150); 
      
      return () => clearInterval(letterInterval);
    }, 800); 
    
    return () => clearTimeout(animationTimer);
  }, []);

  // Scroll to top when loading is complete
  useEffect(() => {
    if (!loading) {
      window.scrollTo(0, 0);
    }
  }, [loading]);
  
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
      // initPanelGSAP(); // Temporarily commented out as the panel section is removed
    }
  }, [gsapLoaded, scrollTriggerLoaded, scrollToLoaded]);

  // Add these near the top with other imports
  const animationsRef = useRef(null);
  const mainCircleRef = useRef(null);
  const subCirclesRef = useRef([]);

  // Function to initialize animations
  const initializeAnimations = useCallback(() => {
    if (!isGsapReady || typeof window === 'undefined') {
      console.log('GSAP not ready yet');
      return;
    }

    try {
      const gsap = window.gsap;
      
      // Kill any existing animations
      if (animationsRef.current) {
        animationsRef.current.forEach(anim => anim?.kill());
      }
      animationsRef.current = [];

      const mainCircle = mainCircleRef.current;
      const subCircles = subCirclesRef.current;

      if (!mainCircle || subCircles.length === 0) {
        console.log('Elements not found');
        return;
      }

      // Create main rotation animation
      const mainAnim = gsap.to(mainCircle, {
        rotation: 360,
        duration: 50,
        repeat: -1,
        ease: "none"
      });
      animationsRef.current.push(mainAnim);

      // Set up and animate sub-circles
      subCircles.forEach((subCircle, index) => {
        if (!subCircle) return;
        
        const angle = (index / 3) * Math.PI * 2;
        const radius = mainCircle.offsetWidth / 2;

        gsap.set(subCircle, {
          position: 'absolute',
          left: '50%',
          top: '50%',
          xPercent: -50,
          yPercent: -50,
          x: Math.cos(angle) * radius,
          y: Math.sin(angle) * radius
        });

        const subAnim = gsap.to(subCircle, {
          rotation: -360,
          duration: 50,
          repeat: -1,
          ease: "none"
        });
        animationsRef.current.push(subAnim);
      });
    } catch (error) {
      console.error('Error initializing animations:', error);
    }
  }, [isGsapReady]);

  // Effect for handling animations
  useEffect(() => {
    // Only initialize if GSAP is ready
    if (isGsapReady) {
      const timeoutId = setTimeout(() => {
        initializeAnimations();
      }, 100); // Increased timeout to ensure DOM is ready

      return () => {
        clearTimeout(timeoutId);
        if (animationsRef.current) {
          animationsRef.current.forEach(anim => anim?.kill());
          animationsRef.current = null;
        }
        
        if (window.gsap) {
          if (mainCircleRef.current) {
            window.gsap.set(mainCircleRef.current, { clearProps: "all" });
          }
          
          subCirclesRef.current.forEach(circle => {
            if (circle) {
              window.gsap.set(circle, { clearProps: "all" });
            }
          });
        }
      };
    }
  }, [initializeAnimations, isGsapReady]);

  // Effect for setting up icons
  useEffect(() => {
    if (!isGsapReady) return;

    const uniqueImageUrls = Array.from(new Set(randomIconPoolURLs));
    const shuffledUniqueImageUrls = [...uniqueImageUrls].sort(() => 0.5 - Math.random());
    
    const newSelectedIconURLsOutput = shuffledUniqueImageUrls.slice(0, 3).map(url => ({
      url,
      className: url.includes('lockedin_logo') ? 'circle-icon-style lockedin-logo' : 'circle-icon-style'
    }));
    
    setSelectedIconURLs(newSelectedIconURLsOutput);
  }, [isGsapReady, randomIconPoolURLs]);

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
        transformOrigin: "left center", 
        borderRadius: "1rem",
        boxShadow: "0 10px 30px rgba(0,0,0,0.2)"
      });
    });
    

    
    coloredPanels.forEach((panel, i) => {
      const reversedIndex = coloredPanels.length - 1 - i;
      tl.to(panel, {
        xPercent: 0,
        opacity: 1,
        scale: 1,
        duration: 0.5
      }, reversedIndex * 0.25); 
      
      ScrollTrigger.create({
        trigger: "#panels-section-howitworks",
        start: `top+=${window.innerHeight * 0.4 * i} top`, 
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
              ((panelNumber - 1) / (coloredPanels.length -1)) * 
              (tl.scrollTrigger.end - tl.scrollTrigger.start);
            
            gsap.to(window, {
              scrollTo: { y: scrollPosition, autoKill: false }, 
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
        ind.classList.remove('active', 'text-white');
        ind.classList.add('text-zinc-500');
        ind.querySelector('.indicator-dot')?.classList.replace('bg-white', 'bg-zinc-600');
      });
      const activeIndicator = document.querySelector(`.indicator-howitworks[data-panel="${panelNumber}"]`);
      if (activeIndicator) {
        activeIndicator.classList.add('active', 'text-white');
        activeIndicator.classList.remove('text-zinc-500');
        activeIndicator.querySelector('.indicator-dot')?.classList.replace('bg-zinc-600', 'bg-white');
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

    
  ];

  // Images for the marquee
  const marqueeImages = [
    "https://assets.aceternity.com/cloudinary_bkp/3d-card.png",
    "https://assets.aceternity.com/world-map.webp",
  ];



  const investmentProductsData = [
    { title: "Token Lending", description: "Lending out various crypto assets on established decentralized lending platforms to earn interest.", src: "/image_index/Crypto Asset Lending_simple_compose_01jv47c6yeeaz9x6ppxwxh6b1e.png", ctaText: "Learn More", ctaLink: "#", content: () => <p>A portion of funds is allocated to lend out various crypto assets—such as ETH, WBTC, and even stablecoins—on leading decentralized money markets. We primarily use platforms like Aave, Compound, Spark Protocol, and Sonne Finance, which are known for their deep liquidity and strong security track records. By supplying assets to these protocols, we earn interest paid by borrowers, with most platforms employing over-collateralization and real-time liquidation mechanisms to manage risk. When lending volatile assets, we use risk-adjusted allocation caps to protect the portfolio from sudden price swings.</p> },
    { title: "Stablecoin Lending", description: "Providing USDC liquidity to lending protocols, earning a stable yield from borrowing demand.", src: "/image_index/Stablecoin Lending Platforms_simple_compose_01jv48x4k8eqbss5kba20s5fry.png", ctaText: "Learn More", ctaLink: "#", content: () => <p>USDC is deployed into dedicated stablecoin-focused lending markets across protocols like Maple Finance (for institutional lending), Morpho Blue (an efficient, peer-to-peer layer on top of Aave), Notional Finance (for fixed-rate lending), and IPOR (for interest rate derivatives). These platforms enable us to lend USDC in a way that prioritizes capital preservation while generating predictable, low-volatility returns. The demand for borrowing USDC—especially from arbitrageurs, DAOs, and trading desks—ensures a steady flow of interest income.</p> },
    { title: "Liquidity Pool Automation", description: "Automated strategies that manage and optimize positions in various decentralized exchange liquidity pools.", src: "/image_index/Automated Liquidity Management_simple_compose_01jv48zmq3edn9yq5jjc7exkkh.png", ctaText: "Learn More", ctaLink: "#", content: () => <p>To enhance returns, we provide liquidity to decentralized exchanges (DEXs) like Uniswap v3, Balancer, Curve, and Trader Joe. These platforms allow us to earn fees from every trade executed within our pools. However, providing liquidity isn't passive—our system uses automation tools such as Arrakis Finance, Gamma Strategies, and Revert Finance to dynamically manage these positions, rebalancing price ranges and minimizing impermanent loss. In some cases, we also earn protocol-native rewards or bribes from governance systems like Convex and Aura.</p> },
    { title: "Yield-Generating Assets", description: "Investing in tokens or assets that inherently generate yield, such as interest-bearing tokens or liquid staking derivatives.", src: "/image_index/Decentralized Staking Benefits_simple_compose_01jv4976wbfzerzy28x962r1t5.png", ctaText: "Learn More", ctaLink: "#", content: () => <p>We strategically allocate into DeFi-native tokens that inherently generate passive income over time. These include interest-accruing tokens such as aUSDC (Aave), cUSDC (Compound), and stETH, rETH, or sfrxETH—liquid staking derivatives that represent staked ETH across networks like Lido, Rocket Pool, and Frax. These assets grow in value automatically as they collect yield, and in many cases, can also be used as collateral in other DeFi platforms to compound returns further.</p> },
    { title: "Staking", description: "Participating in network consensus by staking proof-of-stake (PoS) assets to earn staking rewards.", src: "/image_index/DeFi Yield Assets_simple_compose_01jv494z1rf7yrnm29g4tqhtf0.png", ctaText: "Learn More", ctaLink: "#", content: () => <p>We participate in Proof-of-Stake (PoS) network consensus by staking native assets like ETH, MATIC, SOL, and AVAX via decentralized staking providers. We primarily use non-custodial, liquid staking platforms like Lido, Rocket Pool, Marinade Finance, Stader Labs, and EigenLayer. Staking helps secure the underlying networks while offering consistent, chain-native yields—usually in the form of inflationary token rewards. By using liquid staking tokens (LSTs), we can unlock additional layers of utility while the assets continue to earn yield in the background.</p> },
    { title: "Leveraged Yield Tokens", description: "Utilizing tokenized products that offer leveraged exposure to underlying yield-bearing assets for potentially amplified returns (and risks).", src: "/image_index/Leveraged Yield Strategies_simple_compose_01jv49axjpeeq98k9cgfjnfvb8.png", ctaText: "Learn More", ctaLink: "#", content: () => <p>To boost returns on a portion of the portfolio, we integrate leveraged strategies through protocols like Pendle, Gearbox, and Index Coop. For instance, Pendle allows us to separate and trade future yield, enabling precise control over interest rate exposure. Gearbox, on the other hand, lets us access leverage through composable credit accounts, increasing exposure to yield-bearing strategies while carefully managing risk. These instruments can generate significantly higher returns, but are only used within predefined risk parameters to avoid exposing the broader portfolio to excessive volatility.</p> }
  ];

  // New HorizontalScroller component definition
  const HorizontalScroller = ({ items, speed = 50000 }) => {
    if (!items || items.length === 0) {
      return null; // Or some placeholder if items are empty
    }
    const duplicatedItems = [...items, ...items];

    const baseX = useMotionValue(0); // Represents the percentage offset, starting at 0

    useAnimationFrame((time, delta) => {
      // We want baseX to go from 0 to -50 (representing -50% of motion.div width) in 'speed' milliseconds.
      // So, the change per millisecond is -50 / speed.
      let advance = (-50 / speed) * delta;
      baseX.set(baseX.get() + advance);
    });

    // Wrap utility function
    const wrap = (min, max, v) => {
      const rangeSize = max - min;
      return ((((v - min) % rangeSize) + rangeSize) % rangeSize) + min;
    };
    
    // Use useTransform to apply the wrap and convert to percentage string for the x style
    const x = useTransform(baseX, (latest) => `${wrap(-50, 0, latest)}%`);

    return (
      <div className="w-full overflow-hidden relative" /* style={{ maskImage: 'linear-gradient(to right, transparent, black 5%, black 95%, transparent)' }} */ > {/* Temporarily remove maskImage */}
        <motion.div
          className="flex"
          style={{ x }} // Use the transformed x value
        >
          {duplicatedItems.map((item, index) => (
            <div key={`${item.title}-${index}`} className="flex-shrink-0 w-[320px] md:w-[380px] p-3"> {/* Card width and padding */}
              <div className="bg-zinc-800 p-5 rounded-xl shadow-xl h-full flex flex-col justify-between transition-all duration-300 hover:bg-zinc-700/80">
                <div>
                  <img 
                    src={item.src} 
                    alt={item.title} 
                    className="w-full h-48 object-cover rounded-lg mb-4" // Image styling
                  />
                  <h3 className="text-xl font-bold text-white mb-2 truncate">{item.title}</h3> {/* Title styling */}
                  <p className="text-sm text-zinc-300 mb-4 h-16 overflow-hidden" style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>{item.description}</p> {/* Description with line clamp */}
                </div>
                <button
                  className="mt-4 px-5 py-2.5 text-sm rounded-full font-semibold bg-green-500 text-white hover:bg-green-600 transition-colors self-start focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-75"
                  // onClick behavior can be added later if cards need to be interactive
                >
                  Learn More
                </button>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    );
  };

  // Add useEffect for particles.js initialization
  useEffect(() => {
    if (typeof window !== 'undefined' && window.particlesJS) {
      window.particlesJS.load('particles-js', '/particles-config.json', function() {
        console.log('particles.js loaded - callback');
      });
    }
  }, []);

  // Add styles for particles
  const particlesStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: 0
  };

  return (
    <>
      <Head>
        <title>LockedIn - Secure Your Future</title>
        <meta name="description" content="Welcome to LockedIn, the future of secure asset management." />
        <script src="https://cdn.jsdelivr.net/particles.js/2.0.0/particles.min.js"></script>
      </Head>


      <Script 
        src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.4/gsap.min.js"
        strategy="afterInteractive"
        onLoad={() => setIsGsapReady(true)}
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
      <Script 
        src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.4/Draggable.min.js"
        strategy="afterInteractive"
        onLoad={() => {
          console.log('[GSAP Draggable] Loaded');
          setDraggableLoaded(true);
        }}
      />

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
              <div className="text-white text-7xl md:text-9xl font-bold tracking-tighter flex">
                {"LockedIn".split('').map((letter, index) => {
                  const randomFontFamily = fontFamilies[Math.floor(Math.random() * fontFamilies.length)];
                  const randomRotation = Math.random() * 60 - 30;
                  const randomScale = 0.7 + Math.random() * 0.6;
                  
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
                        textShadow: "0 0 20px rgba(255, 255, 255, 0.3)",
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
                    className="h-1 bg-zinc-600 mt-4 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  ></motion.div>
                  
                  <motion.div
                    className="mt-6 flex flex-col items-center justify-center"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                  >
                    <div className="text-zinc-300 text-xl md:text-2xl font-medium flex items-center gap-2">
                      <svg width="20" height="20" viewBox="0 0 397 311" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M64.8583 237.414L149.861 310.823C152.998 313.574 157.191 313.574 160.328 310.823L396.249 106.395C401.151 102.077 401.151 94.2139 396.249 89.8954L347.258 46.5828C344.121 43.8314 339.928 43.8314 336.791 46.5828L64.8583 276.152C59.956 280.47 59.956 288.333 64.8583 292.651V237.414Z" fill="currentColor"/>
                        <path d="M64.8583 152.707L149.861 226.117C152.998 228.868 157.191 228.868 160.328 226.117L396.249 21.6888C401.151 17.3704 401.151 9.5071 396.249 5.1886L347.258 -38.1239C344.121 -40.8753 339.928 -40.8753 336.791 -38.1239L64.8583 191.446C59.956 195.764 59.956 203.627 64.8583 207.945V152.707Z" fill="currentColor"/>
                        <path d="M149.861 141.41L64.8583 67.9999C59.956 63.6815 59.956 55.8182 64.8583 51.4998L113.85 8.18712C116.986 5.43573 121.18 5.43573 124.317 8.18712L233.368 104.229C236.505 106.98 236.505 111.299 233.368 114.05L160.328 177.512C157.191 180.263 152.998 180.263 149.861 177.512V141.41Z" fill="currentColor"/>
                      </svg>
                      Powered by Solana
                    </div>
                  </motion.div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="min-h-screen bg-black text-white">
        {/* Hover detection area - invisible div at the top of the page */}
        <div 
          ref={hoverDetectionRef}
          className="fixed top-0 left-0 w-full h-4 z-40"
        />

        {/* Hover Navbar */}
        <AnimatePresence>
          {!loading && showNavbar && (
            <motion.div 
              className="fixed top-0 left-0 w-full z-50 bg-zinc-900/80 backdrop-blur-sm border-b border-zinc-700/50"
              initial={{ y: -100 }}
              animate={{ y: 0 }}
              exit={{ y: -100 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <div className="mx-auto px-0 w-full max-w-7xl">
                <div className="flex items-center justify-between h-16">
                  {/* Logo */}
                  <Link href="/" className="flex items-center">
                    <img src="/image/lockedin_logo.png" alt="LockedIn Logo" className="h-8 w-auto" />
                    <span className="ml-2 text-xl font-bold text-white">LockedIn</span>
                  </Link>
                  
                  {/* Desktop Navigation */}
                  <div className="hidden md:flex items-center space-x-8">
                    {navItems.map((item, idx) => (
                      <a
                        key={idx}
                        href={item.link}
                        className="text-zinc-300 hover:text-white transition-colors text-sm font-medium"
                      >
                        {item.name}
                      </a>
                    ))}
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex items-center space-x-4">
                    <Link href="/wallets" className="px-4 py-2 text-sm font-medium rounded-md bg-purple-600 text-white hover:bg-purple-700 transition-colors">
                      Get Started
                    </Link>
                  </div>
                  
                  {/* Mobile Navigation Toggle */}
                  <div className="md:hidden flex items-center">
                    <button 
                      onClick={() => setIsOpen(!isOpen)}
                      className="text-zinc-300 hover:text-white focus:outline-none"
                    >
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        {isOpen ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        )}
                      </svg>
                    </button>
                  </div>
                </div>
                
                {/* Mobile Navigation Menu */}
                {isOpen && (
                  <div className="md:hidden">
                    <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-zinc-900">
                      {navItems.map((item, idx) => (
                        <a
                          key={idx}
                          href={item.link}
                          className="block px-3 py-2 rounded-md text-base font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                          onClick={() => setIsOpen(false)}
                        >
                          {item.name}
                        </a>
                      ))}
                      <div className="mt-4 flex flex-col space-y-2">
                        <Link href="/wallets" className="w-full px-4 py-2 text-sm font-medium rounded-md bg-purple-600 text-white hover:bg-purple-700 transition-colors text-center">
                          Get Started
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hero Section */}
        <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
          {/* Particles.js Container */}
          <div id="particles-js" className="absolute inset-0 z-0"></div>

          {/* Background Video - Removed since we're using particles */}
          {/* <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute z-0 w-auto min-w-full min-h-full max-w-none object-cover filter grayscale"
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: 'translate(-50%, -50%)',
              zIndex: 0,
            }}
          >
            <source src="/" type="video/mp4" />
            Your browser does not support the video tag.
          </video> */}

          {/* 3D Marquee Background */}
          <div className="absolute inset-0 z-1 opacity-10 overflow-hidden filter grayscale">
            <ThreeDMarquee images={marqueeImages} />
          </div>
          
          {/* Content */}
          <div className="relative z-10 container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center justify-between min-h-[calc(100vh-5rem)] pt-16 md:pt-0 gap-8">
              {/* Text Content Block */}
              <div className="md:w-1/2 lg:w-3/5 max-w-2xl text-left md:ml-16 lg:ml-24">
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6">
                  <AuroraText 
                    colors={[
                      "#FF0080",  // Hot pink
                      "#FF0000",  // Bright red
                      "#FF8C00",  // Bright orange
                      "#FFD700",  // Gold
                      "#00FF00",  // Bright green
                      "#00FFFF",  // Cyan
                      "#0080FF",  // Bright blue
                      "#7928CA",  // Purple
                    ]} 
                    speed={3}
                    className="text-4xl md:text-6xl lg:text-7xl font-bold"
                  >
                    LockedIn
                  </AuroraText>
                </h1>
                <p className="text-xl md:text-2xl mb-8 text-zinc-300">
                  Learn, Earn & Build Habits on Solana. Master new skills while earning yield on your capital.
                </p>
                {/* Hero Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 mb-8">
                  <Link href="/wallets" className="px-8 py-3 text-lg font-semibold rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors text-center sm:text-left">
                    Get Started
                  </Link>
                  <a href="#how-we-invest-funds-section" className="px-8 py-3 text-lg font-semibold rounded-lg bg-zinc-700 text-white hover:bg-zinc-600 transition-colors text-center sm:text-left">
                    Learn More
                  </a>
                </div>
              </div>
              {/* Spinning Circle Block */}
              <div className="md:w-1/2 lg:w-2/5 flex justify-center items-center mt-8 md:mt-0">
                <div className="viewport-box">
                  <div className="main-circle" ref={mainCircleRef}>
                    {selectedIconURLs.map((icon, index) => (
                      <div 
                        key={index} 
                        className="sub-circle"
                        ref={el => subCirclesRef.current[index] = el}
                      >
                        {icon.url && <img src={icon.url} alt={`Icon ${index + 1}`} className={icon.className} />}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Get Started Section with 3D Cards - MOVED HERE */}
        <section className="py-12 bg-black">
          <div className="container mx-auto px-4">
            <h2 className="text-4xl md:text-5xl mb-8 text-left tracking-wide text-white">
              Get Started with LockedIn
            </h2>
            <div className="flex flex-col md:flex-row justify-between items-center gap-8">
              {/* Card 1: Pick a Wallet */}
              <div className="w-full md:w-1/3 mb-8 md:mb-0">
                <Link href="/wallets" className="block w-full h-full">
                  <CardContainer className="w-full" containerClassName="!py-4 !w-full">
                    <CardBody className="!w-full !h-[400px]">
                      <div className="relative w-full h-full rounded-xl overflow-hidden transition-all duration-300 group cursor-pointer bg-gradient-to-br from-slate-300 via-slate-400 to-slate-500 border border-slate-500"
                        style={{
                          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.2), inset 0 0 0 1px rgba(0, 0, 0, 0.05)"
                        }}>
                        
                        {/* Hover brightness effect */}
                        <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300 z-5 pointer-events-none">
                        </div>
                        
                        <div className="absolute inset-0 z-20 p-6">
                          <div className="relative w-full h-full flex flex-col justify-between">
                            <div className="flex justify-end">
                              {/* Icon container */}
                              <CardItem
                                translateZ={40}
                                className="w-28 h-28 rounded-full flex items-center justify-center bg-slate-200 border border-slate-400"
                                style={{ 
                                  boxShadow: "0 0 15px rgba(0, 0, 0, 0.1), inset 0 0 10px rgba(0, 0, 0, 0.05)"
                                }}>
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-14 h-14 text-slate-600"
                                  style={{ filter: "drop-shadow(0 0 1px rgba(0, 0, 0, 0.1))" }}>
                                  <rect x="2" y="6" width="20" height="12" rx="2" strokeWidth="1.5" />
                                  <path d="M22 10H18C16.9 10 16 10.9 16 12V12C16 13.1 16.9 14 18 14H22V10Z" strokeWidth="1.5" />
                                </svg>
                              </CardItem>
                            </div>
                            
                            <div className="flex flex-col items-start">
                              {/* Number badge */}
                              <CardItem
                                translateZ={20}
                                className="bg-slate-500/80 text-white h-8 px-4 rounded-full flex items-center justify-center font-bold text-lg mb-2 group-hover:bg-slate-600">
                                1
                              </CardItem>
                              
                              {/* Title */}
                              <CardItem
                                translateZ={50}
                                className="text-3xl font-bold text-left text-slate-800 group-hover:text-black">
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
                      <div className="relative w-full h-full rounded-xl overflow-hidden transition-all duration-300 group cursor-pointer bg-gradient-to-br from-slate-300 via-slate-400 to-slate-500 border border-slate-500"
                        style={{
                          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.2), inset 0 0 0 1px rgba(0, 0, 0, 0.05)"
                        }}>
                        
                        {/* Hover brightness effect */}
                        <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300 z-5 pointer-events-none">
                        </div>
                        
                        <div className="absolute inset-0 z-20 p-6">
                          <div className="relative w-full h-full flex flex-col justify-between">
                            <div className="flex justify-end">
                              {/* Icon container */}
                              <CardItem
                                translateZ={40}
                                className="w-28 h-28 flex items-center justify-center">
                                <div className="w-full h-full rotate-45" style={{ 
                                  boxShadow: "0 0 15px rgba(0, 0, 0, 0.1)"
                                }}>
                                  <div className="absolute inset-0 w-full h-full border-2 border-slate-500/50 rounded-lg bg-slate-200/30" 
                                    style={{ 
                                      boxShadow: "inset 0 0 10px rgba(0, 0, 0, 0.05)"
                                    }}>
                                  </div>
                                  <div className="absolute inset-0 flex items-center justify-center -rotate-45">
                                    <span className="text-slate-700 text-3xl font-bold group-hover:text-black" 
                                      style={{ textShadow: "0 0 5px rgba(0, 0, 0, 0.05)" }}>
                                      IP
                                    </span>
                                  </div>
                                </div>
                              </CardItem>
                            </div>
                            
                            <div className="flex flex-col items-start">
                              {/* Number badge */}
                              <CardItem
                                translateZ={20}
                                className="bg-slate-500/80 text-white h-8 px-4 rounded-full flex items-center justify-center font-bold text-lg mb-2 group-hover:bg-slate-600">
                                2
                              </CardItem>
                              
                              {/* Title */}
                              <CardItem
                                translateZ={50}
                                className="text-3xl font-bold text-left text-slate-800 group-hover:text-black">
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
                      <div className="relative w-full h-full rounded-xl overflow-hidden transition-all duration-300 group cursor-pointer bg-gradient-to-br from-slate-300 via-slate-400 to-slate-500 border border-slate-500"
                        style={{
                          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.2), inset 0 0 0 1px rgba(0, 0, 0, 0.05)"
                        }}>
                        
                        {/* Hover brightness effect */}
                        <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300 z-5 pointer-events-none">
                        </div>
                        
                        <div className="absolute inset-0 z-20 p-6">
                          <div className="relative w-full h-full flex flex-col justify-between">
                            <div className="flex justify-end">
                              {/* Icon container */}
                              <CardItem
                                translateZ={40}
                                className="w-28 h-28 rounded-xl flex items-center justify-center bg-slate-200 border border-slate-400"
                                style={{ 
                                  boxShadow: "0 0 15px rgba(0, 0, 0, 0.1), inset 0 0 10px rgba(0, 0, 0, 0.05)"
                                }}>
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-14 h-14 text-slate-600 group-hover:text-black"
                                  style={{ filter: "drop-shadow(0 0 1px rgba(0, 0, 0, 0.1))" }}>
                                  <polygon points="5 3 19 12 5 21 5 3" strokeWidth="1.5" />
                                </svg>
                              </CardItem>
                            </div>
                            
                            <div className="flex flex-col items-start">
                              {/* Number badge */}
                              <CardItem
                                translateZ={20}
                                className="bg-slate-500/80 text-white h-8 px-4 rounded-full flex items-center justify-center font-bold text-lg mb-2 group-hover:bg-slate-600">
                                3
                              </CardItem>
                              
                              {/* Title */}
                              <CardItem
                                translateZ={50}
                                className="text-3xl font-bold text-left text-slate-800 group-hover:text-black">
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

        {/* Interactive Panels Section (Formerly How It Works) */}
        {/* <section id="panels-section-howitworks" className="min-h-screen bg-black py-12 md:py-20 relative">
          <div className="container mx-auto px-4">
            <div className="two-column-layout-howitworks h-[100vh] flex w-full">
              {/* Static black sidebar */}
              {/* <div className="static-black-sidebar-howitworks w-[30%] bg-black text-white p-8 rounded-lg shadow-xl relative z-10 flex flex-col justify-center ">
                <div className="sidebar-content-howitworks">
                  <h3 className="text-3xl md:text-4xl font-bold mb-6 text-white">Sharpen Your Skills and Wallet with LockedIn</h3>
                  <p className="text-zinc-400 mb-8 text-lg leading-relaxed">
                    Want to learn new skills and make money while doing it? Welcome to LockedIn, the game-changing app on the Solana blockchain that pays you to grow. With cutting-edge courses, financial rewards, and a vibrant community, LockedIn turns learning into a habit that fuels your future.
                  </p>
                </div>
              </div> */}
              
              {/* Scrollable colored panels */}
              {/* <div className="scrollable-panels-howitworks w-[70%] h-[100vh] overflow-hidden relative">
                <div id="colored-panels-container-howitworks" className="relative h-full w-full"> */}
                  {/* Panel 1 */}
                  {/* <div id="panel-howitworks-1" className="colored-panel-howitworks absolute w-[70%] h-[65%] top-0 right-[5%] flex flex-col overflow-hidden rounded-xl shadow-2xl bg-zinc-100 text-black">
                    <div className="panel-content-howitworks w-full h-full flex flex-col justify-between p-6 md:p-8">
                      <div className="flex justify-end">
                        <div className="w-14 h-14 md:w-16 md:h-16 bg-zinc-200 rounded-lg flex items-center justify-center text-2xl md:text-3xl text-zinc-600">
                          <span>🚀</span>
                        </div>
                      </div>
                      <div>
                        <h4 className="text-2xl md:text-3xl font-bold mb-2 md:mb-3 text-left text-black">
                          Powered by Solana's Speed
                        </h4>
                        <p className="text-base md:text-lg text-left leading-relaxed text-zinc-700">
                          Built on Solana, LockedIn delivers lightning-fast transactions and rock-solid security. Deposit, earn, and bet with zero hassle, knowing your funds are safe on one of the world's most advanced blockchains. Focus on learning, not logistics.
                        </p>
                      </div>
                    </div>
                  </div> */}

                  {/* Panel 2 */}
                  {/* <div id="panel-howitworks-2" className="colored-panel-howitworks absolute w-[70%] h-[65%] top-0 right-[5%] flex flex-col overflow-hidden rounded-xl shadow-2xl bg-zinc-100 text-black">
                    <div className="panel-content-howitworks w-full h-full flex flex-col justify-between p-6 md:p-8">
                      <div className="flex justify-end">
                        <div className="w-14 h-14 md:w-16 md:h-16 bg-zinc-200 rounded-lg flex items-center justify-center text-2xl md:text-3xl text-zinc-600">
                          <span>🤝</span>
                        </div>
                      </div>
                      <div>
                        <h4 className="text-2xl md:text-3xl font-bold mb-2 md:mb-3 text-left text-black">
                          Compete, Connect, Cash Out
                        </h4>
                        <p className="text-base md:text-lg text-left leading-relaxed text-zinc-700">
                          Take learning to the next level with LockedIn's social betting feature. Challenge friends or global learners to fun wagers on your learning goals—stake USDC and race to finish a course first! Win bragging rights, extra rewards, and build bonds with a community that's as driven as you are.
                        </p>
                      </div>
                    </div>
                  </div> */}

                  {/* Panel 3 */}
                  {/* <div id="panel-howitworks-3" className="colored-panel-howitworks absolute w-[70%] h-[65%] top-0 right-[5%] flex flex-col overflow-hidden rounded-xl shadow-2xl bg-zinc-100 text-black">
                    <div className="panel-content-howitworks w-full h-full flex flex-col justify-between p-6 md:p-8">
                      <div className="flex justify-end">
                        <div className="w-14 h-14 md:w-16 md:h-16 bg-zinc-200 rounded-lg flex items-center justify-center text-2xl md:text-3xl text-zinc-600">
                          <span>🎯</span>
                        </div>
                      </div>
                      <div>
                        <h4 className="text-2xl md:text-3xl font-bold mb-2 md:mb-3 text-left text-black">
                          Stick to It, See Results
                        </h4>
                        <p className="text-base md:text-lg text-left leading-relaxed text-zinc-700">
                          Building habits is hard, but LockedIn makes it rewarding. Our intuitive tools help you stay consistent with daily streaks and motivational nudges. Track your progress with a sleek dashboard that shows your course completions, earned rewards, and skill milestones. Watch your growth soar as learning becomes second nature.
                        </p>
                      </div>
                    </div>
                  </div> */}

                  {/* Panel 4 */}
                  {/* <div id="panel-howitworks-4" className="colored-panel-howitworks absolute w-[70%] h-[65%] top-0 right-[5%] flex flex-col overflow-hidden rounded-xl shadow-2xl bg-zinc-100 text-black">
                    <div className="panel-content-howitworks w-full h-full flex flex-col justify-between p-6 md:p-8">
                      <div className="flex justify-end">
                        <div className="w-14 h-14 md:w-16 md:h-16 bg-zinc-200 rounded-lg flex items-center justify-center text-2xl md:text-3xl text-zinc-600">
                          <span>📚</span>
                        </div>
                      </div>
                      <div>
                        <h4 className="text-2xl md:text-3xl font-bold mb-2 md:mb-3 text-left text-black">
                          Master Any Skill, Your Way
                        </h4>
                        <p className="text-base md:text-lg text-left leading-relaxed text-zinc-700">
                          From blockchain coding to creative storytelling, LockedIn offers a massive range of subjects to spark your curiosity. Our short, engaging courses fit into your busy life, making it easy to build a daily learning habit. Pick a topic, dive in, and level up your expertise in minutes a day.
                        </p>
                      </div>
                    </div>
                  </div> */}

                  {/* Panel 5 */}
                  {/* <div id="panel-howitworks-5" className="colored-panel-howitworks absolute w-[70%] h-[65%] top-0 right-[5%] flex flex-col overflow-hidden rounded-xl shadow-2xl bg-zinc-100 text-black">
                    <div className="panel-content-howitworks w-full h-full flex flex-col justify-between p-6 md:p-8">
                      <div className="flex justify-end">
                        <div className="w-14 h-14 md:w-16 md:h-16 bg-zinc-200 rounded-lg flex items-center justify-center text-2xl md:text-3xl text-zinc-600">
                          <span>💰</span>
                        </div>
                      </div>
                      <div>
                        <h4 className="text-2xl md:text-3xl font-bold mb-2 md:mb-3 text-left text-black">
                          Cash In While You Learn
                        </h4>
                        <p className="text-base md:text-lg text-left leading-relaxed text-zinc-700">
                          Why just learn when you can earn? Deposit USDC into LockedIn and watch your funds grow with attractive yields as you study. Every course you complete brings you closer to financial freedom. It's simple: the more you learn, the more you earn. Start stacking knowledge and wealth today!
                        </p>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div> */
        }

        {/* How We Invest Your Funds Section - Updated with Horizontal Scroller */}
        <section id="how-we-invest-funds-section" className="py-16 md:py-24 bg-black text-white">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold mb-10 text-center">
              How We Invest Your Funds
            </h2>
            <p className="text-lg md:text-xl text-zinc-400 mb-12 max-w-3xl mx-auto text-center">
              To generate yield, your deposited USDC is strategically allocated across a diversified portfolio of on-chain products. Our system continuously monitors and optimizes these positions to maximize returns while managing risk. Here are some of the core strategies we employ:
            </p>
            <HorizontalScroller items={investmentProductsData} speed={12500} /> {/* Using the new scroller, speed updated from 25000 to 12500 */}
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-zinc-900 py-12 border-t border-zinc-800">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between mb-8">
              <div className="mb-8 md:mb-0">
                <h3 className="text-xl font-bold mb-4 text-white">LockedIn</h3>
                <p className="text-zinc-400 max-w-xs">
                  Learn, Earn & Build Habits on Solana
                </p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
                <div>
                  <h4 className="text-lg font-medium mb-4 text-white">Product</h4>
                  <ul className="space-y-2">
                    {["Features", "Pricing", "Testimonials", "FAQ"].map((item, i) => (
                      <li key={i}>
                        <a href="#" className="text-zinc-400 hover:text-white transition-colors">
                          {item}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-lg font-medium mb-4 text-white">Resources</h4>
                  <ul className="space-y-2">
                    {["Documentation", "Blog", "Community", "Support"].map((item, i) => (
                      <li key={i}>
                        <a href="#" className="text-zinc-400 hover:text-white transition-colors">
                          {item}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-lg font-medium mb-4 text-white">Company</h4>
                  <ul className="space-y-2">
                    {["About", "Careers", "Partners", "Contact"].map((item, i) => (
                      <li key={i}>
                        <a href="#" className="text-zinc-400 hover:text-white transition-colors">
                          {item}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
            <div className="border-t border-zinc-700 pt-8 mt-8 flex flex-col md:flex-row justify-between items-center">
              <p className="text-zinc-500 text-sm">
                © 2025 LockedIn. All rights reserved.
              </p>
              <div className="flex space-x-6 mt-4 md:mt-0">
                {["Twitter", "Discord", "GitHub", "Telegram"].map((item, i) => (
                  <a key={i} href="#" className="text-zinc-500 hover:text-white transition-colors">
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
        .viewport-box {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px 240px 20px 0;
        }
        .main-circle {
          width: 400px;
          height: 400px;
          border: solid 2px #fffce1;
          border-radius: 50%;
          position: relative;
        }
        .sub-circle {
          position: absolute;
          width: 80px;
          height: 80px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          backdrop-filter: blur(4px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        .circle-icon-style {
          width: 55px;
          height: 55px;
          display: block;
          object-fit: contain;
          border-radius: 50%;
          filter: brightness(1.2);
        }
        .lockedin-logo {
          width: 70px !important;
          height: 70px !important;
          object-fit: contain;
        }
      `}</style>
    </>
  );
}
