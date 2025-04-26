import React from 'react';
import { motion } from 'framer-motion';
import WelcomeHeader from '@/components/WelcomeHeader';
import SubjectCard from '@/components/SubjectCard';
import { Link } from 'react-router-dom';

// Remove the duplicate SubjectCard definition since we're already importing it
// This was causing a conflict in the component name

const Index = () => {
  const subjects = [
    {
      title: "Mathematics",
      description: "Master essential math concepts from basic arithmetic to advanced calculus",
      icon: "book", // Removed "as const"
      progress: 45,
    },
    {
      title: "Sciences",
      description: "Explore physics, chemistry, and biology through interactive lessons",
      icon: "graduation", // Removed "as const"
      progress: 30,
    },
    {
      title: "Languages",
      description: "Learn new languages with our immersive learning approach",
      icon: "globe", // Removed "as const"
      progress: 60,
    },
    {
      title: "Computer Science",
      description: "Discover programming, algorithms, and computer fundamentals",
      icon: "book", // Removed "as const"
      progress: 15,
    },
    {
      title: "History",
      description: "Journey through time and understand key historical events",
      icon: "book", // Removed "as const"
    },
    {
      title: "Arts & Literature",
      description: "Explore creative expression through various art forms and literary works",
      icon: "graduation", // Removed "as const"
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-12">
      <div className="max-w-6xl mx-auto">
        <WelcomeHeader />
        
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {subjects.map((subject, index) => (
            <motion.div
              key={subject.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
            >
              <SubjectCard
                title={subject.title}
                description={subject.description}
                icon={subject.icon}
                progress={subject.progress}
              />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default Index;