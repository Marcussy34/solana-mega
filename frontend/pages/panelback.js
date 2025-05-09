import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Script from 'next/script';

export default function Panels() {
  const [gsapLoaded, setGsapLoaded] = useState(false);
  const [scrollTriggerLoaded, setScrollTriggerLoaded] = useState(false);
  const [scrollToLoaded, setScrollToLoaded] = useState(false);

  // Initialize GSAP animations when all plugins are loaded
  useEffect(() => {
    if (gsapLoaded && scrollTriggerLoaded && scrollToLoaded && typeof window !== 'undefined') {
      console.log('Initializing GSAP animations');
      initGSAP();
    }
  }, [gsapLoaded, scrollTriggerLoaded, scrollToLoaded]);

  // Initialize GSAP and ScrollTrigger
  const initGSAP = () => {
    const gsap = window.gsap;
    const ScrollTrigger = window.ScrollTrigger;
    const ScrollToPlugin = window.ScrollToPlugin;

    // Register plugins
    gsap.registerPlugin(ScrollToPlugin, ScrollTrigger);

    // Main elements
    const coloredPanelsContainer = document.querySelector("#colored-panels-container");
    
    // Get all colored panels
    const coloredPanels = gsap.utils.toArray(".colored-panel");
    
    // Calculate panel depth (z-index and position) based on index
    coloredPanels.forEach((panel, i) => {
      // Reverse the index for z-index to make newer panels appear on top
      const reversedIndex = coloredPanels.length - 1 - i;
      
      gsap.set(panel, {
        zIndex: reversedIndex + 1, // Last panel (newest) has highest z-index
        right: `${i * 5}%`,
        top: `${i * 3}%`, // Positive value - each new panel appears higher than the previous
        xPercent: 100,
        opacity: 0,
        scale: 0.85,
        transformOrigin: "center right",
        borderRadius: "15px",
        boxShadow: "0 10px 30px rgba(0,0,0,0.2)"
      });
    });
    
    // Create animation timeline
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: "#panels-section",
        pin: true,
        start: "top top",
        end: `+=${window.innerHeight * 3}`,
        scrub: 1,
        pinSpacing: true
      }
    });
    
    // Add each panel to the timeline with staggered entrance
    coloredPanels.forEach((panel, i) => {
      // Reverse the order of animation - last panels appear first
      const reversedIndex = coloredPanels.length - 1 - i;
      
      tl.to(panel, {
        xPercent: 0,
        opacity: 1,
        scale: 1,
        duration: 0.5
      }, reversedIndex * 0.2); // Stagger timing reversed
      
      // Create individual triggers for panel indicators
      ScrollTrigger.create({
        trigger: "#panels-section",
        start: `top+=${window.innerHeight * 0.5 * i} top`,
        end: `top+=${window.innerHeight * 0.5 * (i + 1)} top`,
        onEnter: () => updateActiveIndicator(i + 1),
        onEnterBack: () => updateActiveIndicator(i + 1),
        id: `panel-trigger-${i+1}`
      });
    });

    // Handle anchor link clicks with GSAP scrollTo
    document.querySelectorAll(".anchor").forEach(anchor => {
      anchor.addEventListener("click", function(e) {
        e.preventDefault();
        const href = e.currentTarget.getAttribute("href");
        
        // Special handling for panel links
        if (href.startsWith('#panel-')) {
          const panelNumber = parseInt(href.split('-')[1]);
          if (panelNumber >= 1 && panelNumber <= coloredPanels.length) {
            // Calculate scroll position based on panel number
            const scrollPosition = tl.scrollTrigger.start + 
              ((panelNumber - 1) / (coloredPanels.length - 1)) * 
              (tl.scrollTrigger.end - tl.scrollTrigger.start);
            
            gsap.to(window, {
              scrollTo: scrollPosition,
              duration: 1,
              ease: "power2.inOut"
            });
          } else {
            gsap.to(window, {
              scrollTo: document.querySelector(href),
              duration: 1
            });
          }
        } else {
          gsap.to(window, {
            scrollTo: document.querySelector(href),
            duration: 1
          });
        }
        
        // Update URL without page reload
        window.history.pushState({}, '', href);
      });
    });
    
    function updateActiveIndicator(panelNumber) {
      document.querySelectorAll('.indicator').forEach(ind => {
        ind.classList.remove('active');
      });
      const indicator = document.querySelector(`.indicator[data-panel="${panelNumber}"]`);
      if (indicator) indicator.classList.add('active');
    }
    
    // Make indicators clickable
    document.querySelectorAll('.indicator').forEach((indicator) => {
      indicator.addEventListener('click', function() {
        const panelNumber = this.getAttribute('data-panel');
        const href = `#panel-${panelNumber}`;
        // Use the anchor link code to scroll to the panel
        const scrollPosition = tl.scrollTrigger.start + 
          ((parseInt(panelNumber) - 1) / (coloredPanels.length - 1)) * 
          (tl.scrollTrigger.end - tl.scrollTrigger.start);
        
        gsap.to(window, {
          scrollTo: scrollPosition,
          duration: 1,
          ease: "power2.inOut"
        });
        
        // Update URL without page reload
        window.history.pushState({}, '', href);
      });
    });
  };

  return (
    <>
      <Head>
        <title>Panels Demo</title>
        <meta name="description" content="Interactive panels with GSAP animations" />
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

      <div id="page" className="site">
        <div id="feather" className="feather"></div>

        <header id="masthead" className="site-header" role="banner">
          <nav className="anchor-nav" role="navigation">
            <a href="#intro" className="anchor">Home</a>
            <a href="#panel-1" className="anchor">Panel 1</a>
            <a href="#panel-3" className="anchor">Panel 3</a>
            <a href="#panel-5" className="anchor">Panel 5</a>
            <a href="#map" className="anchor">Map</a>
          </nav>
        </header>

        <main id="content" className="site-content" role="main">
          <section id="intro" className="full-screen pt-5 gradient-orange">
            <h1>A title</h1>

            <div id="clouds-layer-1" className="clouds"></div>
            <div id="clouds-layer-2" className="clouds"></div>
          </section>

          <section id="panels-section" className="full-screen">
            <div className="two-column-layout">
              {/* Static black sidebar */}
              <div className="static-black-sidebar">
                <div className="sidebar-content">
                  <h2>Static Black Section</h2>
                  <p>This black section remains static while you scroll through the colored panels on the right.</p>
                  
                  <div className="panel-indicators">
                    <div className="indicator active" data-panel="1">01</div>
                    <div className="indicator" data-panel="2">02</div>
                    <div className="indicator" data-panel="3">03</div>
                    <div className="indicator" data-panel="4">04</div>
                    <div className="indicator" data-panel="5">05</div>
                  </div>
                </div>
              </div>
              
              {/* Scrollable colored panels */}
              <div className="scrollable-panels">
                <div id="colored-panels-container">
                  <div id="panel-1" className="colored-panel red-section">
                    <div className="panel-content">
                      <h2>Panel 1</h2>
                      <p className="step-description">
                        Lorem Ipsum is simply dummy text of the printing and typesetting industry. Including versions of Lorem Ipsum.
                      </p>
                      <div className="panels-navigation text-right">
                        <div className="nav-panel" data-sign="plus">
                          <a href="#panel-2" className="anchor">Next</a>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div id="panel-2" className="colored-panel blue-section">
                    <div className="panel-content">
                      <h2>Panel 2</h2>
                      <p className="step-description">
                        Lorem Ipsum is simply dummy text of the printing and typesetting industry. Including versions of Lorem Ipsum.
                      </p>
                      <div className="panels-navigation">
                        <div className="nav-panel" data-sign="minus">
                          <a href="#panel-1" className="anchor">Prev</a>
                        </div>
                        <div className="nav-panel" data-sign="plus">
                          <a href="#panel-3" className="anchor">Next</a>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div id="panel-3" className="colored-panel green-section">
                    <div className="panel-content">
                      <h2>Panel 3</h2>
                      <p className="step-description">
                        Lorem Ipsum is simply dummy text of the printing and typesetting industry. Including versions of Lorem Ipsum.
                      </p>
                      <div className="panels-navigation">
                        <div className="nav-panel" data-sign="minus">
                          <a href="#panel-2" className="anchor">Prev</a>
                        </div>
                        <div className="nav-panel" data-sign="plus">
                          <a href="#panel-4" className="anchor">Next</a>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div id="panel-4" className="colored-panel blue-section">
                    <div className="panel-content">
                      <h2>Panel 4</h2>
                      <p className="step-description">
                        Lorem Ipsum is simply dummy text of the printing and typesetting industry. Including versions of Lorem Ipsum.
                      </p>
                      <div className="panels-navigation">
                        <div className="nav-panel" data-sign="minus">
                          <a href="#panel-3" className="anchor">Prev</a>
                        </div>
                        <div className="nav-panel" data-sign="plus">
                          <a href="#panel-5" className="anchor">Next</a>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div id="panel-5" className="colored-panel green-section">
                    <div className="panel-content">
                      <h2>Panel 5</h2>
                      <p className="step-description">
                        Lorem Ipsum is simply dummy text of the printing and typesetting industry. Including versions of Lorem Ipsum.
                      </p>
                      <div className="panels-navigation text-right">
                        <div className="nav-panel" data-sign="minus">
                          <a href="#panel-4" className="anchor">Prev</a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section id="map" className="full-screen gradient-orange"></section>
        </main>
      </div>

      <style jsx>{`
        /* Base styles */
        .site {
          position: relative;
          overflow-x: hidden;
        }
        
        .full-screen {
          min-height: 100vh;
          width: 100%;
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }
        
        /* Header and Navigation */
        .site-header {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          padding: 20px;
          z-index: 100;
          background: rgba(0, 0, 0, 0.2);
        }
        
        .anchor-nav {
          display: flex;
          justify-content: center;
          gap: 20px;
        }
        
        .anchor {
          color: white;
          text-decoration: none;
          font-weight: bold;
          padding: 5px 10px;
          border-radius: 4px;
          transition: background 0.3s;
        }
        
        .anchor:hover {
          background: rgba(255, 255, 255, 0.2);
        }
        
        /* Two-column layout */
        .two-column-layout {
          display: flex;
          width: 100%;
          height: 100vh;
        }
        
        /* Static black sidebar */
        .static-black-sidebar {
          width: 33.33%;
          background-color: #000000;
          color: white;
          position: relative;
          z-index: 5;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .sidebar-content {
          padding: 2rem;
          max-width: 90%;
        }
        
        .sidebar-content h2 {
          font-size: 2.5rem;
          margin-bottom: 1.5rem;
        }
        
        .sidebar-content p {
          font-size: 1.1rem;
          line-height: 1.6;
          margin-bottom: 2rem;
        }
        
        /* Panel indicators */
        .panel-indicators {
          margin-top: 4rem;
        }
        
        .indicator {
          font-size: 1.2rem;
          font-weight: bold;
          padding: 0.5rem 0;
          opacity: 0.5;
          cursor: pointer;
          transition: all 0.3s ease;
          margin: 0.5rem 0;
        }
        
        .indicator:hover {
          opacity: 0.8;
        }
        
        .indicator.active {
          opacity: 1;
          color: #14F195;
          transform: translateX(10px);
        }
        
        /* Scrollable panels */
        .scrollable-panels {
          width: 66.67%;
          height: 100%;
          overflow: hidden;
          position: relative;
        }
        
        #colored-panels-container {
          position: relative;
          height: 100%;
          width: 100%;
        }
        
        .colored-panel {
          width: 85%;
          height: 75%;
          position: absolute;
          top: 0;
          right: 0;
          display: flex;
          justify-content: center;
          align-items: center;
          will-change: transform;
          overflow: hidden;
        }
        
        .panel-content {
          padding: 2rem;
          max-width: 90%;
          width: 100%;
        }
        
        /* Section colors */
        .red-section {
          background-color: #FF3A3A;
          color: white;
        }
        
        .blue-section {
          background-color: #1976D2;
          color: white;
        }
        
        .green-section {
          background-color: #43A047;
          color: white;
        }
        
        /* Panel content styling */
        .colored-panel h2 {
          font-size: 3rem;
          margin-bottom: 1.5rem;
        }
        
        .step-description {
          font-size: 1.1rem;
          line-height: 1.6;
          margin-bottom: 2rem;
        }
        
        /* Navigation within panels */
        .panels-navigation {
          display: flex;
          gap: 20px;
          margin-top: auto;
          padding-top: 30px;
        }
        
        .text-right {
          justify-content: flex-end;
        }
        
        .nav-panel {
          background: rgba(255, 255, 255, 0.2);
          padding: 10px 20px;
          border-radius: 30px;
          position: relative;
        }
        
        .nav-panel[data-sign]::before {
          content: attr(data-sign);
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          font-size: 18px;
        }
        
        .nav-panel[data-sign="plus"]::before {
          right: 10px;
          content: "→";
        }
        
        .nav-panel[data-sign="minus"]::before {
          left: 10px;
          content: "←";
        }
        
        .nav-panel a {
          color: white;
          text-decoration: none;
          padding: 0 10px;
          font-weight: bold;
        }
        
        /* Gradients */
        .gradient-orange {
          background: linear-gradient(135deg, #FF8C42, #FF5252);
          color: white;
        }
        
        /* Intro section */
        #intro {
          position: relative;
          overflow: hidden;
        }
        
        .clouds {
          position: absolute;
          width: 100%;
          height: 100%;
          top: 0;
          left: 0;
          background-size: contain;
          opacity: 0.5;
        }
        
        #clouds-layer-1 {
          background: url('/clouds.png') repeat-x;
          animation: moveClouds 60s linear infinite;
        }
        
        #clouds-layer-2 {
          background: url('/clouds2.png') repeat-x;
          animation: moveCloudsReverse 40s linear infinite;
        }
        
        @keyframes moveClouds {
          from { background-position: 0 0; }
          to { background-position: 1000px 0; }
        }
        
        @keyframes moveCloudsReverse {
          from { background-position: 1000px 0; }
          to { background-position: 0 0; }
        }
        
        /* Map section */
        #map {
          background-image: url('/map-background.jpg');
          background-size: cover;
          background-position: center;
        }
        
        /* Media queries */
        @media screen and (max-width: 768px) {
          .two-column-layout {
            flex-direction: column;
          }
          
          .static-black-sidebar {
            width: 100%;
            height: 30vh;
          }
          
          .scrollable-panels {
            width: 100%;
            height: 70vh;
          }
          
          .site-header {
            padding: 10px;
          }
          
          .anchor-nav {
            flex-wrap: wrap;
            gap: 10px;
          }
          
          .colored-panel h2 {
            font-size: 2rem;
          }
        }
      `}</style>
    </>
  );
} 