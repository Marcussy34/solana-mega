import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';

const CongratsPage = () => {
  const router = useRouter();

  const handleContinue = () => {
    router.push('/course/english?lesson1=complete');
  };

  // Confetti effect
  useEffect(() => {
    let timeoutId;
    let confettiInstance;

    const cleanup = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      // Force cleanup any existing confetti
      if (typeof window !== 'undefined') {
        const canvasElements = document.querySelectorAll('canvas');
        canvasElements.forEach(canvas => {
          if (canvas.parentNode && canvas.parentNode.tagName !== 'CANVAS') {
            canvas.parentNode.removeChild(canvas);
          }
        });
      }
    };

    // Clean up any existing confetti first
    cleanup();
    
    import('canvas-confetti').then((confettiModule) => {
      const confettiCannon = confettiModule.default;
      confettiInstance = confettiCannon;
      
      // Initial center burst
      confettiCannon({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        disableForReducedMotion: true
      });

      // Two angled bursts after a short delay
      timeoutId = setTimeout(() => {
        // Left burst
        confettiCannon({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          disableForReducedMotion: true
        });

        // Right burst
        confettiCannon({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          disableForReducedMotion: true
        });
      }, 300);
    });

    // Return cleanup function
    return cleanup;
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-[#0A192F] via-[#112240] to-[#1A365D] text-white p-8 relative overflow-hidden">
      {/* Background glow effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 via-blue-500/10 to-purple-500/10 animate-gradient-shift" />
      
      {/* Content container */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 text-center"
      >
        {/* Trophy icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
          className="mb-8"
        >
          <div className="w-24 h-24 mx-auto bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center shadow-lg shadow-yellow-500/50">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-14 w-14 text-white" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 1c-1.828 0-3.623.149-5.371.435a.75.75 0 00-.629.74v.387c-.827.157-1.642.345-2.445.564a.75.75 0 00-.552.698V5c0 2.056 1.668 3.723 3.724 3.723h.476A5.228 5.228 0 009 13.5a5.228 5.228 0 003.797-4.777h.476C15.332 8.723 17 7.056 17 5v-1.176a.75.75 0 00-.552-.698A19.548 19.548 0 0014.003 2.56v-.387a.75.75 0 00-.629-.74A24.016 24.016 0 0010 1zm5.25 6.662V5.187a18.05 18.05 0 00-10.5 0v2.475C5.5 8.472 6.528 9.5 7.77 9.5h4.46c1.242 0 2.27-1.028 2.27-2.838z" clipRule="evenodd" />
            </svg>
          </div>
        </motion.div>

        {/* Main text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-green-400 to-blue-500 text-transparent bg-clip-text">
            Congratulations!
          </h2>
          <div className="space-y-4">
            <p className="text-xl text-zinc-300">
              You've completed Unit 1!
            </p>
            <p className="text-zinc-400">
              You're making great progress in your learning journey.
            </p>
            <motion.div 
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6, type: "spring", stiffness: 200 }}
              className="flex items-center justify-center gap-2 text-zinc-300"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span>+50 XP Earned</span>
            </motion.div>
          </div>
        </motion.div>

        {/* Continue button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-8"
        >
          <button 
            onClick={handleContinue}
            className="px-8 py-4 rounded-xl bg-gradient-to-r from-green-500 to-blue-500 text-white font-medium 
                     hover:from-green-600 hover:to-blue-600 transform hover:scale-105 transition-all duration-200
                     shadow-lg shadow-blue-500/25 hover:shadow-blue-500/50"
          >
            Continue Your Journey
          </button>
        </motion.div>
      </motion.div>

      {/* Animated circles in background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className={`absolute w-[500px] h-[500px] rounded-full bg-gradient-to-r opacity-30
                       ${i === 0 ? 'from-green-500/10 to-blue-500/10' :
                         i === 1 ? 'from-blue-500/10 to-purple-500/10' :
                                  'from-purple-500/10 to-green-500/10'}`}
            style={{
              left: `${i * 30 - 20}%`,
              top: `${i * 20 - 10}%`,
            }}
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear",
              delay: i * 2,
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default CongratsPage; 