import React, { useState } from 'react';
import { useRouter } from 'next/router';

const QuizPage1 = () => {
  const router = useRouter();
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showError, setShowError] = useState(false); // State to show error message

  const question = "What is the capital of England?";
  const options = ["Paris", "London", "Berlin", "Madrid"];
  const correctAnswer = "London"; // In a real app, this might be validated server-side

  const handleSubmit = (e) => {
    e.preventDefault();
    setShowError(false); // Reset error on new submission

    if (selectedAnswer !== null) {
      if (selectedAnswer === correctAnswer) {
        router.push('/course/english/congrats');
      } else {
        setShowError(true); // Show error if answer is incorrect
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-8">
      <h2 className="text-2xl font-semibold mb-6 text-center">Lesson 1: Quick Question</h2>
      <form onSubmit={handleSubmit} className="w-full max-w-md">
        <p className="text-lg mb-8 text-center text-zinc-300">{question}</p>
        <div className="space-y-4 mb-8">
          {options.map((option, index) => (
            <button
              key={index}
              type="button" // Prevent default form submission on click
              onClick={() => {
                setSelectedAnswer(option);
                setShowError(false); // Hide error when a new option is selected
              }}
              className={`w-full p-4 rounded-md border transition-colors \
                ${selectedAnswer === option 
                  ? 'border-white bg-zinc-700' 
                  : 'border-zinc-700 bg-zinc-800 hover:bg-zinc-700'}\
              `}
            >
              {option}
            </button>
          ))}
        </div>
        {showError && (
          <p className="text-red-500 text-sm text-center mb-4">Incorrect answer. Please try again.</p>
        )}
        <button 
          type="submit" 
          disabled={selectedAnswer === null}
          className="w-full px-6 py-3 rounded-md bg-zinc-600 text-zinc-100 hover:bg-zinc-500 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed transition-colors font-medium"
        >
          Submit Answer
        </button>
      </form>
    </div>
  );
};

export default QuizPage1; 