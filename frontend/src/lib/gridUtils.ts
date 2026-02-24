import type { CSSProperties } from "react";

export type Cell = { row: number; col: number };
export type CornerPos = "lt" | "rt" | "lb" | "rb";
export const CORNERS: CornerPos[] = ["lt", "rt", "lb", "rb"];
export const CELL_H = 20;
export const CELL_W = 56;
export const CORNER_SIZE = 0;
export const TIME_WIDTH = 16;

export function getCellFromPoint(x: number, y: number): Cell | undefined {
  const el = document.elementFromPoint(x, y);
  if (!el) return undefined;
  const cellEl = el.closest("[data-cell]");
  if (!cellEl) return undefined;
  const attr = cellEl.getAttribute("data-cell");
  if (!attr) return undefined;
  const [r, c] = attr.split(",").map(Number);
  if (Number.isNaN(r) || Number.isNaN(c)) return undefined;
  return { row: r, col: c };
}

export function getHeaderColFromPoint(x: number, y: number): number | undefined {
  const el = document.elementFromPoint(x, y);
  if (!el) return undefined;
  const headerEl = el.closest("[data-header-col]");
  if (!headerEl) return undefined;
  const attr = headerEl.getAttribute("data-header-col");
  if (!attr) return undefined;
  const col = Number(attr);
  if (Number.isNaN(col)) return undefined;
  return col;
}

export function isSameCell(a: Cell, b: Cell): boolean {
  return a.row === b.row && a.col === b.col;
}

export function cornerStyle(pos: CornerPos): CSSProperties {
  const s: CSSProperties = {
    position: "absolute",
    width: CORNER_SIZE,
    height: CORNER_SIZE,
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

export function roundClass(pos: CornerPos): string {
  if (pos === "lt") return "rounded-tl";
  if (pos === "rt") return "rounded-tr";
  if (pos === "lb") return "rounded-bl";
  return "rounded-br";
}
