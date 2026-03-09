import { type ReactNode } from "react";
import { cn } from "@/lib/cn";

interface BottomActionBarProps {
  children: ReactNode;
  className?: string;
}

export function BottomActionBar({ children, className }: BottomActionBarProps) {
  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 border-t border-gray-200 bg-white/95 px-4 pb-6 pt-4 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] backdrop-blur",
        className,
      )}
    >
      {children}
    </div>
  );
}
