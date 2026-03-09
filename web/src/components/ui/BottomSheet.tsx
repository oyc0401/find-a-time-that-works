import { createPortal } from "react-dom";
import {
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/cn";

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function BottomSheet({
  open,
  onClose,
  title,
  footer,
  children,
  className,
}: BottomSheetProps) {
  const [mounted, setMounted] = useState(false);
  const sheetRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (!open) return;

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", handleKey);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const el = sheetRef.current;
    if (!el) return;
    const timer = window.setTimeout(() => {
      el.classList.remove("translate-y-full", "opacity-0");
    }, 10);
    return () => window.clearTimeout(timer);
  }, [open]);

  const content = useMemo(() => {
    if (!open) return null;

    return (
      <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/40 px-4 pb-6 pt-12">
        <div
          role="presentation"
          className="absolute inset-0 z-10 cursor-pointer"
          onClick={onClose}
        />
        <div
          ref={sheetRef}
          role="dialog"
          aria-modal="true"
          className={cn(
            "relative z-20 mt-auto w-full rounded-t-3xl bg-white p-6 shadow-2xl transition-transform duration-200 ease-out",
            "translate-y-full opacity-0",
            className,
          )}
          onClick={(event) => event.stopPropagation()}
        >
          {title && (
            <div className="text-lg font-semibold text-gray-900">{title}</div>
          )}
          <div className="mt-4 text-sm text-gray-700">{children}</div>
          {footer && <div className="mt-6 flex flex-col gap-3">{footer}</div>}
        </div>
      </div>
    );
  }, [open, onClose, title, children, footer, className]);

  if (!mounted) return null;
  return createPortal(content, document.body);
}
