import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';

const QuizPage1 = () => {
  const router = useRouter();
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showError, setShowError] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const question = "What is the capital of England?";
  const options = ["Paris", "London", "Berlin", "Madrid"];
  const correctAnswer = "London";

  const handleSubmit = (e) => {
    e.preventDefault();
    setShowError(false);

    if (selectedAnswer !== null) {
      if (selectedAnswer === correctAnswer) {
        setShowSuccess(true);
        // Start transition after showing success modal
        setTimeout(() => {
          setIsTransitioning(true);
          // Navigate to congrats page after transition animation
          setTimeout(() => {
            router.push('/course/english/congrats');
          }, 500); // Match this with the transition duration
        }, 1500);
      } else {
        setShowError(true);
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-8 relative">
      <h2 className="text-2xl font-semibold mb-6 text-center">Lesson 1: Quick Question</h2>
      <form onSubmit={handleSubmit} className="w-full max-w-md">
        <p className="text-lg mb-8 text-center text-zinc-300">{question}</p>
        <div className="space-y-4 mb-8">
          {options.map((option, index) => (
            <motion.button
              key={index}
              type="button"
              onClick={() => {
                setSelectedAnswer(option);
                setShowError(false);
              }}
              className={`w-full p-4 rounded-md border transition-colors ${
                selectedAnswer === option 
                  ? 'border-white bg-zinc-700' 
                  : 'border-zinc-700 bg-zinc-800 hover:bg-zinc-700'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {option}
            </motion.button>
          ))}
        </div>
        {showError && (
          <motion.p 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-red-500 text-sm text-center mb-4"
          >
            Incorrect answer. Please try again.
          </motion.p>
        )}
        <motion.button 
          type="submit" 
          disabled={selectedAnswer === null}
          className="w-full px-6 py-3 rounded-md bg-green-600 text-white hover:bg-green-500 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed transition-colors font-medium"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Submit Answer
        </motion.button>
      </form>

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccess && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 flex items-center justify-center"
            >
              {/* Modal */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-zinc-900/95 rounded-lg shadow-xl z-50 w-[300px] p-4 mx-auto"
              >
                <div className="flex flex-col items-center text-center">
                  {/* Success Icon */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                    className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mb-3"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </motion.div>
                  
                  <motion.h3
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-lg font-semibold text-green-500 mb-1"
                  >
                    Correct Answer!
                  </motion.h3>
                  
                  <motion.p
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-sm text-zinc-400 mb-3"
                  >
                    Great job! Not too shabby.
                  </motion.p>
                  
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="w-full bg-zinc-800 rounded-full h-1 overflow-hidden"
                  >
                    <motion.div
                      initial={{ width: "0%" }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 2, ease: "easeInOut" }}
                      className="bg-green-500 h-full"
                    />
                  </motion.div>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default QuizPage1; 