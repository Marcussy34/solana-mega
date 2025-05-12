import React from 'react';
import { useRouter } from 'next/router';

const CongratsPage = () => {
  const router = useRouter();

  const handleContinue = () => {
    router.push('/course/english/streak');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-8">
      <h2 className="text-3xl font-bold mb-4 text-green-500">Congratulations!</h2>
      <p className="text-lg mb-8 text-zinc-300">You answered the question.</p>
      <button 
        onClick={handleContinue}
        className="px-6 py-3 rounded-md bg-zinc-700 text-zinc-100 hover:bg-zinc-600 transition-colors font-medium"
      >
        Continue
      </button>
    </div>
  );
};

export default CongratsPage; 