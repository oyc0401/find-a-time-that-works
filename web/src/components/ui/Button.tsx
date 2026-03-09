import { type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  fullWidth?: boolean;
}

const variantClass: Record<Variant, string> = {
  primary:
    "bg-blue-500 text-white hover:bg-blue-500/90 focus-visible:ring-blue-500 disabled:bg-blue-300",
  secondary:
    "bg-gray-100 text-gray-800 hover:bg-gray-200 focus-visible:ring-gray-300 disabled:text-gray-400",
  ghost:
    "bg-transparent text-gray-600 hover:bg-gray-100 focus-visible:ring-gray-300 disabled:text-gray-400",
};

export function Button({
  className,
  variant = "primary",
  fullWidth,
  ...props
}: ButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed",
        variantClass[variant],
        fullWidth && "w-full",
        className,
      )}
      {...props}
    />
  );
}
