export type RenderCell2 = {
  center: number;
  lt: number;
  rt: number;
  lb: number;
  rb: number;
};

/**
 * count 기반 RenderGrid 생성
 * - 같은 count끼리 이어짐
 * - 높은 count가 위에 떠있는 것처럼 보임
 *
 * 코너 값 규칙:
 * - outer (현재 셀이 인접 2개 모두보다 높음): max(adj1, adj2)
 * - concave (인접 3칸이 모두 현재 셀보다 높음): min(adj1, adj2, diag)
 * - 그 외: 현재 셀의 count
 */
export function buildRenderGrid2(cells: number[][]): RenderCell2[][] {
  const H = cells.length;
  const W = H > 0 ? cells[0].length : 0;

  function getCount(r: number, c: number): number {
    if (r < 0 || r >= H || c < 0 || c >= W) return 0;
    return cells[r][c];
  }

  function getCornerValue(
    centerCount: number,
    adj1Count: number,
    adj2Count: number,
    diagCount: number,
  ): number {
    // outer: 현재 셀이 인접 2개 모두보다 높음
    if (centerCount > adj1Count && centerCount > adj2Count) {
      return Math.max(adj1Count, adj2Count);
    }
    // concave: 인접 3칸이 모두 현재 셀보다 높음 → 가장 낮은 인접 값
    if (
      adj1Count > centerCount &&
      adj2Count > centerCount &&
      diagCount > centerCount
    ) {
      return Math.min(adj1Count, adj2Count, diagCount);
    }
    // 그 외: 현재 셀의 count
    return centerCount;
  }

  const grid: RenderCell2[][] = [];

  for (let r = 0; r < H; r++) {
    const row: RenderCell2[] = [];
    for (let c = 0; c < W; c++) {
      const center = getCount(r, c);
      const t = getCount(r - 1, c);
      const b = getCount(r + 1, c);
      const l = getCount(r, c - 1);
      const rr = getCount(r, c + 1);
      const tl = getCount(r - 1, c - 1);
      const tr = getCount(r - 1, c + 1);
      const bl = getCount(r + 1, c - 1);
      const br = getCount(r + 1, c + 1);

      row.push({
        center,
        lt: getCornerValue(center, t, l, tl),
        rt: getCornerValue(center, t, rr, tr),
        lb: getCornerValue(center, b, l, bl),
        rb: getCornerValue(center, b, rr, br),
      });
    }
    grid.push(row);
  }

  return grid;
}
