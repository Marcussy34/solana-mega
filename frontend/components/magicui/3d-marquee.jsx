"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export const ThreeDMarquee = ({
  images,
  direction = "left",
  speed = 30,
  className,
}) => {
  const containerRef = useRef(null);
  const scrollerRef = useRef(null);
  const [start, setStart] = useState(false);

  useEffect(() => {
    addAnimation();
  }, []);

  function addAnimation() {
    if (containerRef.current && scrollerRef.current) {
      const scrollerContent = Array.from(scrollerRef.current.children);

      scrollerContent.forEach((item) => {
        const duplicatedItem = item.cloneNode(true);
        if (direction === "right") {
          scrollerRef.current.insertBefore(
            duplicatedItem,
            scrollerRef.current.firstChild
          );
        } else {
          scrollerRef.current.appendChild(duplicatedItem);
        }
      });

      getDirection();
      setStart(true);
    }
  }

  function getDirection() {
    if (containerRef.current) {
      if (direction === "right") {
        containerRef.current.style.setProperty(
          "--animation-direction",
          "forwards"
        );
      } else {
        containerRef.current.style.setProperty(
          "--animation-direction",
          "reverse"
        );
      }
    }
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "scroller relative z-20 overflow-hidden",
        start && "animate-[scroll_var(--animation-duration)_linear_infinite]",
        className
      )}
      style={{
        ["--animation-duration"]: `${speed}s`,
        ["--animation-direction"]: "forwards",
      }}
    >
      <div
        ref={scrollerRef}
        className="flex min-w-full shrink-0 items-center justify-around gap-4"
      >
        {images.map((image, idx) => (
          <ScrollerImage image={image} key={idx} />
        ))}
      </div>
    </div>
  );
};

const ScrollerImage = ({ image }) => {
  const [isHovered, setIsHovered] = useState(false);
  const imageRef = useRef(null);

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  return (
    <motion.div
      ref={imageRef}
      className="relative h-44 w-44 shrink-0 overflow-hidden rounded-xl border border-neutral-700/40"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      whileHover={{ rotate: 8, scale: 1.5 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
      style={{
        transformStyle: "preserve-3d",
      }}
    >
      <img
        src={image}
        alt="thumbnail"
        className="h-full w-full rounded-xl object-cover"
      />
    </motion.div>
  );
}; 