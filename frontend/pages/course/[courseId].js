import React from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link'; // Added for back button
// import { Sidebar, SidebarBody, SidebarLink } from '@/components/ui/sidebar'; // Stays commented for now
import {
  IconArrowLeft, // For back button
  // IconChevronLeft, // Commenting out for testing
  // IconMenuBook     // Commenting out for testing
} from '@tabler/icons-react';
import { Timeline } from '@/components/ui/timeline'; // Import Timeline

// Placeholder components for course page sections
const CourseHeader = ({ courseName }) => (
  <div className="bg-green-600 text-white p-4 flex justify-between items-center sticky top-0 z-10 shadow-md">
    <div className="flex items-center">
        {/* <IconChevronLeft size={24} className="mr-2 cursor-pointer hover:opacity-80" /> */}
        <span className="text-sm font-medium mr-2">ICON</span> {/* Placeholder */}
        <span className="text-sm font-medium">SECTION 1, UNIT 4</span> 
    </div>
    <h1 className="text-xl font-bold tracking-wide">{courseName ? courseName.replace('-', ' ').toUpperCase() : 'COURSE'}</h1>
    <button className="bg-white text-green-700 font-semibold py-2 px-3 rounded-lg flex items-center hover:bg-green-50 transition-colors">
      {/* <IconMenuBook size={20} className="mr-2" /> */}
      <span className="text-sm font-medium mr-2">ICON</span> {/* Placeholder */}
      GUIDEBOOK
    </button>
  </div>
);

// Removed LessonNode and LessonPathPlaceholder components

// Sample data for the Timeline component
const courseTimelineData = [
  {
    title: "Unit 1: Introduction",
    content: (
      <div className="p-4 bg-neutral-800 rounded-lg shadow-md">
        <h4 className="font-semibold text-lg mb-2 text-green-400">Start Your Journey!</h4>
        <p className="text-neutral-300 text-sm">
          Welcome to the first unit. Here you will learn the fundamentals.
          Click on the first lesson to begin.
        </p>
        <button className="mt-3 bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm">
          Start Lesson 1
        </button>
      </div>
    ),
  },
  {
    title: "Unit 2: Core Concepts",
    content: (
      <div className="p-4 bg-neutral-800 rounded-lg shadow-md">
        <h4 className="font-semibold text-lg mb-2 text-blue-400">Dive Deeper!</h4>
        <p className="text-neutral-300 text-sm">
          Explore the core concepts and build a solid understanding.
          This unit contains interactive exercises.
        </p>
        <p className="text-xs text-neutral-500 mt-2">(Locked - Complete Unit 1)</p>
      </div>
    ),
  },
  {
    title: "Unit 3: Advanced Topics",
    content: (
      <div className="p-4 bg-neutral-800 rounded-lg shadow-md">
        <h4 className="font-semibold text-lg mb-2 text-purple-400">Challenge Yourself!</h4>
        <p className="text-neutral-300 text-sm">
          Tackle advanced topics and prepare for the final quiz.
        </p>
        <p className="text-xs text-neutral-500 mt-2">(Locked - Complete Unit 2)</p>
      </div>
    ),
  },
    {
    title: "Unit Quiz",
    content: (
      <div className="p-4 bg-neutral-800 rounded-lg shadow-md">
        <h4 className="font-semibold text-lg mb-2 text-red-400">Test Your Knowledge!</h4>
        <p className="text-neutral-300 text-sm">
          Complete the final quiz to master this course.
        </p>
        <p className="text-xs text-neutral-500 mt-2">(Locked - Complete Unit 3)</p>
      </div>
    ),
  },
];

const CoursePage = () => {
  const router = useRouter();
  const { courseId } = router.query;

  // const [sidebarOpen, setSidebarOpen] = React.useState(false); // Sidebar state not needed for now

  return (
    <div className="flex h-screen w-full bg-neutral-900 text-neutral-200">
      {/* Simplified Left Sidebar */}
      <div className='w-20 bg-neutral-800 p-4 flex flex-col items-center space-y-6 border-r border-neutral-700'>
        <Link href="/learn" className="text-neutral-400 hover:text-green-500 transition-colors p-3 bg-neutral-700 hover:bg-neutral-600 rounded-lg shadow-md">
          <IconArrowLeft size={28} />
        </Link>
        {/* Add other minimal navigation/logo here if needed later */}
      </div>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-y-hidden">
        <CourseHeader courseName={courseId ? String(courseId) : 'Course'} />
        <div className="flex-1 overflow-y-auto bg-neutral-950"> {/* Matched Timeline bg */}
            <Timeline data={courseTimelineData} />
        </div>
      </main>

      {/* Right Sidebar Removed */}
    </div>
  );
};

export default CoursePage; 