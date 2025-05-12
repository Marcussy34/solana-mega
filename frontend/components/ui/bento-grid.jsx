import { cn } from "@/lib/utils";
import React from "react";
import Link from 'next/link';

export const BentoGrid = ({
  className,
  children
}) => {
  return (
    <div
      className={cn(
        "mx-auto grid max-w-7xl grid-cols-1 gap-4 md:auto-rows-[18rem] md:grid-cols-3",
        className
      )}>
      {children}
    </div>
  );
};

export const BentoGridItem = ({
  className,
  title,
  description,
  header,
  icon,
  href
}) => {
  const content = (
    <div
      className={cn(
        "group/bento shadow-input row-span-1 flex flex-col space-y-4 rounded-xl border border-neutral-800 bg-black p-4 transition duration-200 hover:shadow-xl dark:border-black/[0.2] dark:bg-white dark:shadow-none md:h-[18rem]",
        href ? "cursor-pointer hover:border-neutral-700 dark:hover:border-neutral-300" : "",
        className
      )}>
      {header}
      <div className="transition duration-200 group-hover/bento:translate-x-2">
        {icon}
        <div
          className="mt-2 mb-2 font-sans font-bold text-neutral-300 dark:text-neutral-700">
          {title}
        </div>
        <div
          className="font-sans text-xs font-normal text-neutral-300 dark:text-neutral-600 line-clamp-2 min-h-[2rem]">
          {description}
        </div>
      </div>
    </div>
  );

  if (href) {
    return <Link href={href} className="no-underline">{content}</Link>;
  }

  return content;
};
