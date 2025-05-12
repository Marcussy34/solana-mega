import React from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import {
  IconArrowLeft,
  // Placeholder icons for header if needed later
  IconBook, 
  IconMenuBook 
} from '@tabler/icons-react';
import { Timeline } from '@/components/ui/timeline'; 

// Reverted Header to dark theme
const EnglishCourseHeader = () => (
  <div className="bg-green-600 text-white p-4 flex justify-between items-center sticky top-0 z-10 shadow-md">
    <div className="flex items-center">
        {/* Placeholder section/unit info */}
        {/* <IconBook size={20} className="mr-2" /> */}
        <span className="text-sm font-medium ml-2">SECTION 1, UNIT 1</span> 
    </div>
    <h1 className="text-xl font-bold tracking-wide">ENGLISH</h1>
    <button className="bg-white text-green-700 font-semibold py-2 px-3 rounded-lg flex items-center hover:bg-green-50 transition-colors">
      {/* <IconMenuBook size={20} className="mr-2" /> */} 
      <span className="text-sm font-medium">GUIDEBOOK</span>
    </button>
  </div>
);

// Timeline data with INVERTED card styles (white cards on dark background)
const englishTimelineData = [
  {
    title: "Unit 1: Basic Greetings",
    content: (
      <div className="p-4 bg-white rounded-lg shadow-md border border-zinc-200">
        <h4 className="font-semibold text-lg mb-2 text-green-600">Start Your Journey!</h4>
        <p className="text-zinc-700 text-sm mb-3">
          Learn common greetings and introductions.
        </p>
        <Link href="/course/english/quiz/1" passHref>
          <button className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm">
            Start Lesson 1
          </button>
        </Link>
      </div>
    ),
  },
  {
    title: "Unit 2: Simple Sentences",
    content: (
      <div className="p-4 bg-white rounded-lg shadow-md border border-zinc-200">
        <h4 className="font-semibold text-lg mb-2 text-blue-600">Build Sentences!</h4>
        <p className="text-zinc-700 text-sm">
          Learn how to form basic sentences in English.
        </p>
        <p className="text-xs text-zinc-500 mt-2">(Locked - Complete Unit 1)</p>
      </div>
    ),
  },
  {
    title: "Unit 3: Asking Questions",
    content: (
      <div className="p-4 bg-white rounded-lg shadow-md border border-zinc-200">
        <h4 className="font-semibold text-lg mb-2 text-yellow-600">Ask Away!</h4>
        <p className="text-zinc-700 text-sm">
          Learn how to form questions for different situations.
        </p>
        <p className="text-xs text-zinc-500 mt-2">(Locked - Complete Unit 2)</p>
      </div>
    ),
  },
  {
    title: "Unit 4: Vocabulary Basics",
    content: (
      <div className="p-4 bg-white rounded-lg shadow-md border border-zinc-200">
        <h4 className="font-semibold text-lg mb-2 text-orange-600">Expand Your Words!</h4>
        <p className="text-zinc-700 text-sm">
          Build your basic vocabulary with common nouns and verbs.
        </p>
        <p className="text-xs text-zinc-500 mt-2">(Locked - Complete Unit 3)</p>
      </div>
    ),
  },
  {
    title: "Unit 5: Review & Practice",
    content: (
      <div className="p-4 bg-white rounded-lg shadow-md border border-zinc-200">
        <h4 className="font-semibold text-lg mb-2 text-red-600">Practice Time!</h4>
        <p className="text-zinc-700 text-sm">
          Review everything learned so far and practice with exercises.
        </p>
        <p className="text-xs text-zinc-500 mt-2">(Locked - Complete Unit 4)</p>
      </div>
    ),
  },
  // Add more units as needed
];

const EnglishCoursePage = () => {
  const router = useRouter(); 

  return (
    // Set main background to dark gray (zinc-900) and text to light
    <div className="flex h-screen w-full bg-zinc-900 text-neutral-200">
      {/* Sidebar remains dark */}
      <div className="w-20 bg-neutral-800 p-4 flex flex-col items-center space-y-6 border-r border-neutral-700">
        <Link href="/learn" className="text-neutral-400 hover:text-green-500 transition-colors p-3 bg-neutral-700 hover:bg-neutral-600 rounded-lg shadow-md">
          <IconArrowLeft size={28} />
        </Link>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-y-hidden">
        <EnglishCourseHeader /> 
        {/* Set scroll area background to very dark gray (zinc-950) */}
        <div className="flex-1 overflow-y-auto bg-zinc-950"> 
            <Timeline data={englishTimelineData} />
        </div>
      </main>

    </div>
  );
};

export default EnglishCoursePage; 