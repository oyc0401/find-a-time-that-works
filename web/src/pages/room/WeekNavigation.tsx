import { Calendar } from "lucide-react";

interface WeekNavigationProps {
  onDateClick?: () => void;
}

export default function WeekNavigation({ onDateClick }: WeekNavigationProps) {
  return (
    <div className="flex items-center justify-end pt-2 pl-4 pr-4 pb-1">
      <button
        type="button"
        className="flex h-11 w-11 items-center justify-center rounded-2xl border border-gray-200 text-blue-500 transition-transform active:scale-95"
        onClick={onDateClick}
      >
        <Calendar size={20} />
      </button>
    </div>
  );
}
