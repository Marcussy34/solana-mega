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
import { CardContainer, CardBody, CardItem } from "@/components/magicui/3d-card";
import { ThreeDMarquee } from "@/components/ui/3d-marquee";
import { motion, useScroll, useTransform } from "framer-motion";

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
  const rotate = useTransform(scrollYProgress, [0, 1], [25, -50]);
  const scale = useTransform(scrollYProgress, [0, 1], [1.05, 1]);
  const translate = useTransform(scrollYProgress, [0, 1], [0, -100]);

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
    "https://assets.aceternity.com/animated-modal.png",
    "https://assets.aceternity.com/animated-testimonials.webp",
    "https://assets.aceternity.com/cloudinary_bkp/Tooltip_luwy44.png",
    "https://assets.aceternity.com/github-globe.png",
    "https://assets.aceternity.com/glare-card.png",
    "https://assets.aceternity.com/layout-grid.png",
    "https://assets.aceternity.com/flip-text.png",
    "https://assets.aceternity.com/hero-highlight.png",
    "https://assets.aceternity.com/carousel.webp",
    "https://assets.aceternity.com/placeholders-and-vanish-input.png",
    "https://assets.aceternity.com/shooting-stars-and-stars-background.png",
    "https://assets.aceternity.com/signup-form.png",
    "https://assets.aceternity.com/cloudinary_bkp/stars_sxle3d.png",
    "https://assets.aceternity.com/spotlight-new.webp",
    "https://assets.aceternity.com/cloudinary_bkp/Spotlight_ar5jpr.png",
    "https://assets.aceternity.com/cloudinary_bkp/Parallax_Scroll_pzlatw_anfkh7.png",
    "https://assets.aceternity.com/tabs.png",
    "https://assets.aceternity.com/cloudinary_bkp/Tracing_Beam_npujte.png",
    "https://assets.aceternity.com/cloudinary_bkp/typewriter-effect.png",
    "https://assets.aceternity.com/glowing-effect.webp",
    "https://assets.aceternity.com/hover-border-gradient.png",
    "https://assets.aceternity.com/cloudinary_bkp/Infinite_Moving_Cards_evhzur.png",
    "https://assets.aceternity.com/cloudinary_bkp/Lamp_hlq3ln.png",
    "https://assets.aceternity.com/macbook-scroll.png",
    "https://assets.aceternity.com/cloudinary_bkp/Meteors_fye3ys.png",
    "https://assets.aceternity.com/cloudinary_bkp/Moving_Border_yn78lv.png",
    "https://assets.aceternity.com/multi-step-loader.png",
    "https://assets.aceternity.com/vortex.png",
    "https://assets.aceternity.com/wobble-card.png",
    "https://assets.aceternity.com/world-map.webp",
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Resizable Navbar */}
      <Navbar className="top-0">
        <NavBody>
          <NavbarLogo />
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
            <NavbarLogo />
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
      <section className="relative min-h-screen flex items-center justify-center pt-20">
        {/* 3D Marquee Background */}
        <div className="absolute inset-0 z-0 opacity-25 overflow-hidden">
          <ThreeDMarquee images={images} />
        </div>
        
        {/* Content */}
        <div className="relative z-10 container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6">
            SkillStreak
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto text-gray-300">
            Learn, Earn & Build Habits on Solana. Master new skills while earning yield on your capital.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-lg font-medium transition-colors duration-300">
              Get Started
            </button>
            <button className="bg-transparent border border-white/30 hover:bg-white/10 text-white px-8 py-3 rounded-lg font-medium transition-colors duration-300">
              Learn More
            </button>
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

      {/* 3D Card Section with Scroll Animation */}
      <ContainerScroll
        containerClassName="bg-gray-950 py-20"
        className="container mx-auto px-4"
        threshold={0.15}
        speed={20}
      >
        <div className="flex flex-col md:flex-row items-center gap-12">
          <div className="md:w-1/2">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Build Valuable Skills While Earning
            </h2>
            <p className="text-xl text-gray-400 mb-8">
              SkillStreak combines DeFi yield farming with skill development, creating a powerful incentive to learn consistently. Your capital works for you while you build valuable skills.
            </p>
            <ul className="space-y-4">
              {["Earn yield on your deposits", "Build consistent learning habits", "Track your progress", "Connect with other learners"].map((item, i) => (
                <li key={i} className="flex items-start">
                  <span className="text-emerald-500 mr-3">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="md:w-1/2">
            <CardContainer>
              <CardBody className="bg-gray-900 relative group/card dark:hover:shadow-2xl dark:hover:shadow-emerald-500/[0.1] dark:bg-black dark:border-white/[0.2] border-black/[0.1] w-auto sm:w-[30rem] h-auto rounded-xl p-6 border">
                <CardItem
                  translateZ="50"
                  className="text-xl font-bold text-neutral-300"
                >
                  Crypto Basics Track
                </CardItem>
                <CardItem
                  as="p"
                  translateZ="60"
                  className="text-neutral-400 text-sm max-w-sm mt-2"
                >
                  Learn the fundamentals of blockchain, cryptocurrencies and Web3 technology
                </CardItem>
                <CardItem translateZ="100" className="w-full mt-4">
                  <img
                    src="https://images.unsplash.com/photo-1639322537228-f710d846310a?q=80&w=2232&auto=format&fit=crop&ixlib=rb-4.0.3"
                    height="1000"
                    width="1000"
                    className="h-60 w-full object-cover rounded-xl group-hover/card:shadow-xl"
                    alt="cryptocurrency"
                  />
                </CardItem>
                <div className="flex justify-between items-center mt-6">
                  <CardItem
                    translateZ={40}
                    as="button"
                    className="px-4 py-2 rounded-xl text-xs font-normal bg-emerald-500/30 text-white"
                  >
                    Start Learning →
                  </CardItem>
                  <CardItem
                    translateZ={40}
                    className="px-4 py-2 rounded-xl text-xs font-normal text-white"
                  >
                    <span className="text-emerald-500 font-medium">4.2% APY</span> + Bonuses
                  </CardItem>
                </div>
              </CardBody>
            </CardContainer>
          </div>
        </div>
      </ContainerScroll>

      {/* Courses Section with 3D Marquee and Scroll Animation */}
      <ContainerScroll
        containerClassName="bg-gray-900 py-16"
        className="w-full"
        threshold={0.05}
        speed={15}
      >
        <div className="container mx-auto px-4 mb-10">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-center">
            Explore Learning Tracks
          </h2>
          <p className="text-xl text-gray-400 mb-8 text-center max-w-3xl mx-auto">
            Choose from a variety of skill paths, each offering competitive yield rates and valuable knowledge.
          </p>
        </div>
        <ThreeDMarquee images={images} className="max-w-7xl mx-auto" />
      </ContainerScroll>

      {/* CTA Section */}
      <section className="py-20 bg-emerald-900">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Start Your Learning Journey?
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Join thousands of users who are building skills and earning rewards on SkillStreak.
          </p>
          <button className="bg-white text-emerald-900 hover:bg-gray-100 px-8 py-3 rounded-lg font-medium text-lg transition-colors duration-300">
            Sign Up Now
          </button>
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
