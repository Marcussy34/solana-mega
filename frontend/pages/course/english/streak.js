import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { motion, animate } from 'framer-motion';

const StreakPage = () => {
  const router = useRouter();
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    // Animate streak from 0 to 1
    const controls = animate(0, 1, {
      type: "tween",
      duration: 1.5, // Duration of the animation
      onUpdate(value) {
        setStreak(Math.round(value));
      },
    });
    return () => controls.stop();
  }, []);

  const handleFinish = () => {
    // Navigate to the main learn page or dashboard after a delay or on click
    router.push('/learn'); // Or any other appropriate page
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-8">
      <h2 className="text-3xl font-bold mb-4">Total Streak Increased!</h2>
      <motion.div 
        className="text-7xl font-bold my-8 text-green-500"        
      >
        {streak}
      </motion.div>
      <button 
        onClick={handleFinish}
        className="px-6 py-3 rounded-md bg-zinc-700 text-zinc-100 hover:bg-zinc-600 transition-colors font-medium"
      >
        Finish Lesson
      </button>
    </div>
  );
};

export default StreakPage; 