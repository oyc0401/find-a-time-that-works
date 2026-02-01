import { buildRenderGrid2 } from "./renderGrid2";

export type Owner = "empty" | "preview" | "confirmed";

export type RenderQuad = { corner: Owner; center: Owner };
export type RenderCell = {
  lt: RenderQuad;
  rt: RenderQuad;
  lb: RenderQuad;
  rb: RenderQuad;
};

export type DragMode = "select" | "deselect";

function countToOwner(count: number): Owner {
  if (count === 0) return "empty";
  if (count === 1) return "preview";
  return "confirmed";
}

/**
 * 2차원 confirmed/preview 배열 → RenderCell[][] 생성
 * 내부적으로 buildRenderGrid2를 사용
 */
export function buildRenderDragGrid(args: {
  confirmed: boolean[][];
  preview: boolean[][];
  dragMode: DragMode;
}): RenderCell[][] {
  const { confirmed, preview, dragMode } = args;
  const H = confirmed.length;
  const W = H > 0 ? confirmed[0].length : 0;

  // boolean[][] → number[][] 변환
  const cells: number[][] = [];
  for (let r = 0; r < H; r++) {
    cells[r] = [];
    for (let c = 0; c < W; c++) {
      const isSel = confirmed[r][c];
      const isPrev = preview[r][c];

      if (dragMode === "select") {
        // select: confirmed=2, preview=1, empty=0
        if (isSel) cells[r][c] = 2;
        else if (isPrev) cells[r][c] = 1;
        else cells[r][c] = 0;
      } else {
        // deselect: confirmed(not preview)=2, confirmed+preview=1, else=0
        if (isSel && !isPrev) cells[r][c] = 2;
        else if (isSel && isPrev) cells[r][c] = 1;
        else cells[r][c] = 0;
      }
    }
  }

  // buildRenderGrid2 호출
  const grid2 = buildRenderGrid2(cells);

  // RenderCell2[][] → RenderCell[][] 변환
  const grid: RenderCell[][] = [];
  for (let r = 0; r < H; r++) {
    const row: RenderCell[] = [];
    for (let c = 0; c < W; c++) {
      const cell2 = grid2[r][c];
      const centerOwner = countToOwner(cell2.center);

      row.push({
        lt: { center: centerOwner, corner: countToOwner(cell2.lt) },
        rt: { center: centerOwner, corner: countToOwner(cell2.rt) },
        lb: { center: centerOwner, corner: countToOwner(cell2.lb) },
        rb: { center: centerOwner, corner: countToOwner(cell2.rb) },
      });
    }
    grid.push(row);
  }

  return grid;
}
