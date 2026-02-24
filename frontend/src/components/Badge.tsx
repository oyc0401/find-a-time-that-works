import { cn } from "@/lib/cn";

interface BadgeProps {
  color: string;
  textColor: string;
  title: string;
  onClick?: () => void;
  className?: string;
  borderColor?: string;
}

export default function Badge({
  color,
  textColor,
  title,
  onClick,
  className,
  borderColor,
}: BadgeProps) {
  return (
    <button
      type="button"
      className={cn(
        "rounded-full px-4 py-1.5 text-sm font-bold cursor-pointer",
        className,
      )}
      style={{
        backgroundColor: color,
        color: textColor,
        borderRadius: 9999,
        fontSize: 14,
        border: `2px solid ${borderColor ?? "transparent"}`,
      }}
      onClick={onClick}
    >
      {title}
    </button>
  );
}
