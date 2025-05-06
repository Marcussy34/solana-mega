"use client";;
import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export const Tabs = ({
  tabs: propTabs,
  containerClassName,
  activeTabClassName,
  tabClassName,
  contentClassName
}) => {
  const [active, setActive] = useState(propTabs[0]);
  const [tabs, setTabs] = useState(propTabs);
  const [isChanging, setIsChanging] = useState(false);

  const moveSelectedTabToTop = (idx) => {
    if (idx === 0 || isChanging) return; // Already at top or currently changing
    
    setIsChanging(true);
    
    // Show all tabs briefly stacked
    setTimeout(() => {
      const newTabs = [...propTabs];
      const selectedTab = newTabs.splice(idx, 1);
      newTabs.unshift(selectedTab[0]);
      setTabs(newTabs);
      setActive(newTabs[0]);
      
      // Reset after animation completes
      setTimeout(() => {
        setIsChanging(false);
      }, 800);
    }, 500); // Delay before reorganizing tabs
  };

  const [hovering, setHovering] = useState(false);

  return (
    <>
      <div
        className={cn(
          "flex flex-row items-center justify-start [perspective:1000px] relative overflow-auto sm:overflow-visible no-visible-scrollbar max-w-full w-full",
          containerClassName
        )}>
        {propTabs.map((tab, idx) => (
          <button
            key={tab.title}
            onClick={() => {
              moveSelectedTabToTop(idx);
            }}
            onMouseEnter={() => setHovering(true)}
            onMouseLeave={() => setHovering(false)}
            className={cn("relative px-4 py-2 rounded-full", tabClassName)}
            style={{
              transformStyle: "preserve-3d",
            }}>
            {active.value === tab.value && (
              <motion.div
                layoutId="clickedbutton"
                transition={{ type: "spring", bounce: 0.3, duration: 0.6 }}
                className={cn(
                  "absolute inset-0 rounded-full shadow-lg shadow-blue-500/20",
                  activeTabClassName
                )}>
                <div className="absolute inset-0 rounded-full opacity-30 blur-sm -z-10" 
                     style={{ background: "inherit" }} />
              </motion.div>
            )}

            <span className="relative block text-white">
              {tab.title}
            </span>
          </button>
        ))}
      </div>
      <FadeInDiv
        tabs={tabs}
        active={active}
        isChanging={isChanging}
        key={active.value}
        hovering={hovering}
        className={cn("mt-24", contentClassName)} />
    </>
  );
};

export const FadeInDiv = ({
  className,
  tabs,
  hovering,
  isChanging
}) => {
  const isActive = (tab) => {
    return tab.value === tabs[0].value;
  };
  
  return (
    <div className="relative w-full h-full min-h-[300px]">
      {tabs.map((tab, idx) => {
        // Calculate staggered offsets for the stack effect
        const offset = isChanging 
          ? 10 + (idx * 10) // When changing tabs, spread them out more visibly
          : hovering 
            ? idx * -20 // When hovering, stack upward a bit 
            : 0; // Normal state
            
        // Calculate rotation for the stack effect
        const rotation = isChanging
          ? idx * -1 // Slight rotation when changing
          : 0;
            
        return (
          <motion.div
            key={tab.value}
            layoutId={tab.value}
            initial={{ scale: 0.95, y: 20, opacity: 0.8 }}
            animate={{ 
              scale: idx === 0 ? 1 : 1 - idx * 0.05,
              y: offset, 
              x: isChanging ? idx * 5 : 0,
              rotate: rotation,
              opacity: isChanging 
                ? 1 - (idx * 0.1) 
                : idx < 3 ? 1 - idx * 0.2 : 0,
              zIndex: 10 - idx
            }}
            transition={{ 
              duration: 0.6, 
              ease: [0.34, 1.56, 0.64, 1]
            }}
            className={cn(
              "w-full absolute rounded-xl backdrop-blur-sm p-5 border",
              idx === 0 
                ? "border-blue-500/20 bg-gray-800/70" 
                : "border-gray-700/30 bg-gray-800/40",
              className
            )}
            style={{
              boxShadow: `0 ${4 + idx * 2}px ${10 + idx * 5}px rgba(0,0,0,0.${2 + idx})`,
              transformOrigin: "center top"
            }}
          >
            <div className="relative">
              {tab.content}
            </div>
            
            {/* Card decoration elements */}
            {idx > 0 && isChanging && (
              <div 
                className="absolute top-3 right-3 w-4 h-4 rounded-full" 
                style={{ 
                  background: `hsl(${idx * 30 + 200}, 70%, 60%)`,
                  boxShadow: `0 0 10px hsl(${idx * 30 + 200}, 70%, 60%, 0.5)`
                }}
              />
            )}
          </motion.div>
        );
      })}
    </div>
  );
};
