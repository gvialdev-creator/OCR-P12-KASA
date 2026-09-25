"use client";

import { useId, useState, type ReactNode } from "react";

import { ArrowUpIcon } from "@/components/ui/icons";

interface CollapsibleSectionProps {
  children: ReactNode;
  defaultOpen?: boolean;
  title: string;
}

export function CollapsibleSection({
  children,
  defaultOpen = true,
  title,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const contentId = useId();

  return (
    <section>
      <button
        type="button"
        className="flex w-full items-center justify-between gap-4 py-2 text-left font-medium text-neutral-black"
        aria-controls={contentId}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
      >
        {title}
        <ArrowUpIcon
          className={`size-5 shrink-0 transition-transform duration-200 motion-reduce:transition-none ${isOpen ? "rotate-0" : "rotate-180"}`}
        />
      </button>
      <div
        id={contentId}
        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
      >
        <div className="overflow-hidden">
          <div className="pt-2">{children}</div>
        </div>
      </div>
    </section>
  );
}