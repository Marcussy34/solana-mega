import React from 'react';
import { Sidebar, SidebarBody, SidebarLink } from '@/components/ui/sidebar'; // Assuming @ resolves to frontend
import { BentoGrid, BentoGridItem } from '@/components/ui/bento-grid';
import { IconClipboardCheck, IconBook, IconBrandReact, IconAward, IconLogout } from '@tabler/icons-react'; // Example icons

// Placeholder for header components in BentoGridItems
const SkeletonHeader = ({ className }) => (
  <div className={`flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-neutral-800 dark:from-neutral-50 dark:to-neutral-100 to-neutral-900 ${className}`} />
);

const learnPageSubjects = [
  {
    title: "English",
    description: "by Duolingo",
    header: <SkeletonHeader className="bg-green-500" />,
    icon: <IconBook className="h-4 w-4 text-neutral-500" />,
    className: "md:col-span-1",
    href: "/course/english"
  },
  {
    title: "Solana 101",
    description: "Introduction to Solana Development",
    header: <SkeletonHeader className="bg-purple-500" />,
    icon: <IconBrandReact className="h-4 w-4 text-neutral-500" />,
    className: "md:col-span-1",
    href: "/course/solana-101"
  },
  // Add 7 more random subjects
  ...Array.from({ length: 7 }, (_, i) => ({
    title: `Subject ${i + 3}`,
    description: `Learn about random topic ${i + 3}`,
    header: <SkeletonHeader />,
    icon: <IconClipboardCheck className="h-4 w-4 text-neutral-500" />,
    className: "md:col-span-1",
  })),
];

const LearnPage = () => {
  // Example sidebar links - replace with your actual links
  const links = [
    { label: "Courses", href: "/courses", icon: <IconClipboardCheck size={20} /> },
    { label: "Leaderboard", href: "/leaderboard", icon: <IconAward size={20} /> },
  ];

  // For Sidebar state
  const [open, setOpen] = React.useState(false);
  // State for search term
  const [searchTerm, setSearchTerm] = React.useState("");

  // Filtered subjects based on search term
  const filteredSubjects = learnPageSubjects.filter(subject => {
    const term = searchTerm.toLowerCase();
    return (
      subject.title.toLowerCase().includes(term) ||
      subject.description.toLowerCase().includes(term)
    );
  });

  return (
    <div className="flex h-screen w-full bg-neutral-900 dark:bg-neutral-50 text-neutral-200 dark:text-neutral-800">
      <Sidebar open={open} setOpen={setOpen}>
        <SidebarBody className="justify-between gap-10">
          <div className="flex flex-col flex-1 overflow-y-auto">
            {open ? <Logo /> : <LogoIcon />}
            <div className="mt-8 flex flex-col gap-2">
              {links.map((link, idx) => (
                <SidebarLink key={idx} link={link} />
              ))}
            </div>
          </div>
          <div>
            <SidebarLink link={{ label: "Logout", href: "#", icon: <IconLogout size={20} /> }} />
          </div>
        </SidebarBody>
      </Sidebar>

      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <h1 className="text-2xl md:text-3xl font-bold mb-4">Explore Subjects</h1>
        
        {/* Search Bar */}
        <div className="mb-6 flex justify-center">
          <input
            type="text"
            placeholder="Search subjects..."
            className="w-full md:w-1/2 lg:w-1/3 p-2 rounded-md bg-neutral-800 dark:bg-neutral-100 text-neutral-200 dark:text-neutral-800 border border-neutral-700 dark:border-neutral-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-colors"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {filteredSubjects.length > 0 ? (
          <BentoGrid className="md:grid-cols-3 lg:grid-cols-3">
            {filteredSubjects.map((item, i) => (
              <BentoGridItem
                key={i}
                title={item.title}
                description={item.description}
                header={item.header}
                icon={item.icon}
                className={item.className}
                href={item.href}
              />
            ))}
          </BentoGrid>
        ) : (
          <p className="text-center text-neutral-500 dark:text-neutral-400">
            No subjects found matching your search criteria.
          </p>
        )}
      </main>
    </div>
  );
};

// Placeholder Logo components (customize or remove)
export const Logo = () => {
  return (
    <div
      className="font-normal flex items-center text-sm text-white dark:text-black py-1 relative z-20"
    >
      <div className="h-5 w-5 bg-gradient-to-br from-white to-neutral-300 dark:from-black dark:to-neutral-500 rounded-full mr-2" />
      Your Learning Hub
    </div>
  );
};
export const LogoIcon = () => {
  return (
    <div
      className="font-normal flex items-center text-sm text-white dark:text-black py-1 relative z-20"
    >
      <div className="h-5 w-5 bg-gradient-to-br from-white to-neutral-300 dark:from-black dark:to-neutral-500 rounded-full" />
    </div>
  );
};


export default LearnPage;
