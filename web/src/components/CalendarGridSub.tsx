// frontend/src/components/CalendarGridSub.tsx
import React from "react";
import { useTranslation } from "react-i18next";
import { adaptive } from "@toss/tds-colors";
import { cn } from "@/lib/cn";

// ── 5-band zIndex ──
const Z = {
  TODAY: 10,
  CENTER: 20,
  CORNER_COLOR: 30,
  CORNER_CUT: 40,
  TEXT: 50,
} as const;

type CornerPos = "lt" | "rt" | "lb" | "rb";
const CORNERS: CornerPos[] = ["lt", "rt", "lb", "rb"];

function cornerStyle(pos: CornerPos): React.CSSProperties {
  const s: React.CSSProperties = {
    position: "absolute",
    width: 8,
    height: 8,
    pointerEvents: "none",
  };
  if (pos === "lt") {
    s.top = 0;
    s.left = 0;
  } else if (pos === "rt") {
    s.top = 0;
    s.right = 0;
  } else if (pos === "lb") {
    s.bottom = 0;
    s.left = 0;
  } else {
    s.bottom = 0;
    s.right = 0;
  }
  return s;
}

function roundClass(pos: CornerPos) {
  if (pos === "lt") return "rounded-tl-lg";
  if (pos === "rt") return "rounded-tr-lg";
  if (pos === "lb") return "rounded-bl-lg";
  return "rounded-br-lg";
}

function needsCornerOp(center: string | undefined, corner: string | undefined) {
  // center가 있으면: corner가 없거나(center와 다르면) => op 필요
  if (center !== undefined) return corner !== center;
  // center가 없으면: corner가 있을 때만 op 필요
  return corner !== undefined;
}

// ── Types ──

export interface PointerHandlers {
  onPointerDown: React.PointerEventHandler;
  onPointerMove: React.PointerEventHandler;
  onPointerUp: React.PointerEventHandler;
  onPointerCancel: React.PointerEventHandler;
  onLostPointerCapture: React.PointerEventHandler;
}

export type CalendarCellModel = {
  hidden?: boolean;

  // text
  day: string | number;
  text?: string | number;
  textColor?: string; // hexColor
  subTexts?: string[]; // Optional sub labels per cell

  // today ring
  isToday?: boolean;
  circleColor?: string; // hexColor

  // fills
  center?: string; // hexColor (센터 채움)
  lt?: string; // hexColor (corner band)
  rt?: string;
  lb?: string;
  rb?: string;
};

// ── CalendarCell ──

export interface CalendarCellProps {
  cell: CalendarCellModel;
  cellIdx: number;
  baseBg?: string;

  onCellClick?: (cellIdx: number) => void;
  onCellPressStart?: (cellIdx: number) => void;
  onCellPressEnd?: () => void;
}

export function CalendarCell({
  cell,
  cellIdx,
  baseBg = "white",
  onCellClick,
  onCellPressStart,
  onCellPressEnd,
}: CalendarCellProps) {
  const valid = !(cell.hidden ?? false);

  const centerBg = cell.center;
  const filled = centerBg !== undefined;

  const text = cell.text ?? cell.day;
  const textColor = cell.textColor ?? adaptive.grey800;
  const subTexts = cell.subTexts ?? [];
  const hasSubTexts = subTexts.length > 0;

  const ringColor = cell.circleColor ?? adaptive.blue400;

  return (
    <button
      type="button"
      data-cell-idx={cellIdx}
      className={cn(
        "relative select-none flex items-center justify-center w-full aspect-square",
        !valid && "opacity-0 pointer-events-none",
        onCellClick && "cursor-pointer",
      )}
      onClick={onCellClick ? () => onCellClick(cellIdx) : undefined}
      onPointerDown={
        onCellPressStart ? () => onCellPressStart(cellIdx) : undefined
      }
      onPointerUp={onCellPressEnd}
      onPointerLeave={onCellPressEnd}
    >
      {/* Center fill */}
      {filled && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            zIndex: Z.CENTER,
            backgroundColor: centerBg,
          }}
        />
      )}

      {/* Corner Color band */}
      {CORNERS.map((pos) => {
        const corner =
          pos === "lt"
            ? cell.lt
            : pos === "rt"
              ? cell.rt
              : pos === "lb"
                ? cell.lb
                : cell.rb;

        if (!needsCornerOp(centerBg, corner)) return null;

        const outerColor =
          centerBg !== undefined
            ? corner === undefined
              ? baseBg
              : corner
            : corner!;

        return (
          <div
            key={`cc-${pos}`}
            className="pointer-events-none"
            style={{
              ...cornerStyle(pos),
              zIndex: Z.CORNER_COLOR,
              backgroundColor: outerColor,
            }}
          />
        );
      })}

      {/* Corner Cut band */}
      {CORNERS.map((pos) => {
        const corner =
          pos === "lt"
            ? cell.lt
            : pos === "rt"
              ? cell.rt
              : pos === "lb"
                ? cell.lb
                : cell.rb;

        if (!needsCornerOp(centerBg, corner)) return null;

        const innerColor = centerBg !== undefined ? centerBg : baseBg;

        return (
          <div
            key={`ct-${pos}`}
            className={cn(
              "absolute pointer-events-none w-2 h-2",
              roundClass(pos),
            )}
            style={{
              ...cornerStyle(pos),
              zIndex: Z.CORNER_CUT,
              backgroundColor: innerColor,
            }}
          />
        );
      })}

      {/* Date label (top-center) */}
      <span
        className="absolute top-1 left-1 right-1 pointer-events-none text-center text-xs font-medium opacity-50"
        style={{
          zIndex: Z.TEXT,
          color: textColor,
        }}
      >
        {text}
      </span>

      {/* Sub texts */}
      {hasSubTexts && (
        <div
          className="absolute inset-x-1 bottom-2 top-6 pointer-events-none flex flex-col items-center justify-center text-center gap-0.5"
          style={{
            zIndex: Z.TEXT,
          }}
        >
          {subTexts.map((subText, idx) => (
            <span
              key={`sub-${idx}`}
              className={cn("truncate", idx === 0 ? "text-base" : "text-[10px]")}
              style={{
                color: textColor,
                lineHeight: idx === 0 ? "18px" : "12px",
              }}
            >
              {subText}
            </span>
          ))}
        </div>
      )}
    </button>
  );
}

// ── CalendarGridSub ──

export interface CalendarGridSubProps {
  cells: CalendarCellModel[];
  pointerHandlers?: PointerHandlers;

  onCellClick?: (cellIdx: number) => void;
  onCellPressStart?: (cellIdx: number) => void;
  onCellPressEnd?: () => void;

  baseBg?: string;
}

export default function CalendarGridSub({
  cells,
  pointerHandlers,
  onCellClick,
  onCellPressStart,
  onCellPressEnd,
  baseBg = "white",
}: CalendarGridSubProps) {
  const { t } = useTranslation();
  const weekdays = t("weekdays", { returnObjects: true }) as string[];
  return (
    <div className="w-full px-5 py-4">
      <div className="grid grid-cols-7 text-center">
        {weekdays.map((d, i) => (
          <span
            key={d}
            style={{
              fontSize: 15,
              lineHeight: "22.5px",
              color: i === 0 ? adaptive.red400 : i === 6 ? adaptive.blue300 : adaptive.grey500,
            }}
          >
            {d}
          </span>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-7" {...pointerHandlers}>
        {cells.map((cell, idx) => (
          <CalendarCell
            key={idx}
            cell={cell}
            cellIdx={idx}
            baseBg={baseBg}
            onCellClick={onCellClick}
            onCellPressStart={onCellPressStart}
            onCellPressEnd={onCellPressEnd}
          />
        ))}
      </div>
    </div>
  );
}
