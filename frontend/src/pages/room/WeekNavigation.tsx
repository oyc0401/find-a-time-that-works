import { Calendar } from "lucide-react";
import { adaptive } from "@toss/tds-colors";

interface WeekNavigationProps {
  onDateClick?: () => void;
}

export default function WeekNavigation({ onDateClick }: WeekNavigationProps) {
  return (
    <div className="flex items-center justify-end pt-3 pl-4 pr-4 pb-1">
      <button
        type="button"
        className="flex items-center justify-center cursor-pointer transition-[colors,transform] duration-50 active:bg-[#f2f4f6] active:scale-90"
        style={{ width: 44, height: 44, borderRadius: 8 }}
        onClick={onDateClick}
      >
        <Calendar size={24} color={adaptive.blue400} />
      </button>
    </div>
  );
}
