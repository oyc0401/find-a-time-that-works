export type Owner = "empty" | "preview" | "confirmed";

export type RenderQuad = { corner: Owner; center: Owner };
export type RenderCell = {
  lt: RenderQuad;
  rt: RenderQuad;
  lb: RenderQuad;
  rb: RenderQuad;
};

export type NeighborInfo = { confirmed: boolean; preview: boolean };

/**
 * 해당 셀 + 8방향 이웃 정보를 받아 RenderCell을 한 번에 산출.
 *
 * - center가 채워진 셀 → outer corner 라운딩 판정 (상하좌우 4방향)
 * - center가 빈 셀     → concave corner 패치 판정 (8방향 전부)
 */
export function buildRenderCell(p: {
  center: NeighborInfo;
  t: NeighborInfo;
  b: NeighborInfo;
  l: NeighborInfo;
  r: NeighborInfo;
  tl: NeighborInfo;
  tr: NeighborInfo;
  bl: NeighborInfo;
  br: NeighborInfo;
}): RenderCell {
  const centerOwner: Owner = p.center.confirmed
    ? "confirmed"
    : p.center.preview
      ? "preview"
      : "empty";

  // confirmed 셀의 corner: confirmed 우선, 없으면 preview, 없으면 empty
  const cornerForConfirmed = (a: NeighborInfo, b: NeighborInfo): Owner => {
    if (a.confirmed || b.confirmed) return "confirmed";
    if (a.preview || b.preview) return "preview";
    return "empty";
  };

  // 채워진 셀: outer corner(바깥 라운드) 판정
  if (centerOwner === "confirmed") {
    return {
      lt: { center: "confirmed", corner: cornerForConfirmed(p.t, p.l) },
      rt: { center: "confirmed", corner: cornerForConfirmed(p.t, p.r) },
      lb: { center: "confirmed", corner: cornerForConfirmed(p.b, p.l) },
      rb: { center: "confirmed", corner: cornerForConfirmed(p.b, p.r) },
    };
  }

  // preview 셀의 corner: 인접2 + 대각선1 모두 confirmed면 confirmed, 아니면 preview/empty
  const cornerForPreview = (
    adj1: NeighborInfo,
    adj2: NeighborInfo,
    diag: NeighborInfo,
  ): Owner => {
    // 3칸 모두 confirmed(preview 아님)이면 confirmed
    if (
      adj1.confirmed &&
      !adj1.preview &&
      adj2.confirmed &&
      !adj2.preview &&
      diag.confirmed &&
      !diag.preview
    ) {
      return "confirmed";
    }
    if (adj1.preview || adj2.preview || adj1.confirmed || adj2.confirmed)
      return "preview";
    return "empty";
  };

  if (centerOwner === "preview") {
    return {
      lt: { center: centerOwner, corner: cornerForPreview(p.t, p.l, p.tl) },
      rt: { center: centerOwner, corner: cornerForPreview(p.t, p.r, p.tr) },
      lb: { center: centerOwner, corner: cornerForPreview(p.b, p.l, p.bl) },
      rb: { center: centerOwner, corner: cornerForPreview(p.b, p.r, p.br) },
    };
  }

  // 빈 셀: concave corner 패치 판정
  // 3칸이 모두 채워져 있으면 concave 필요, preview가 하나라도 있으면 preview 색상
  const concaveCorner = (
    adj1: NeighborInfo,
    adj2: NeighborInfo,
    diag: NeighborInfo,
  ): Owner => {
    const filled1 = adj1.confirmed || adj1.preview;
    const filled2 = adj2.confirmed || adj2.preview;
    const filledDiag = diag.confirmed || diag.preview;
    if (!filled1 || !filled2 || !filledDiag) return "empty";
    // 3칸 모두 채워짐 → preview가 하나라도 있으면 preview, 아니면 confirmed
    if (adj1.preview || adj2.preview || diag.preview) return "preview";
    return "confirmed";
  };

  return {
    lt: {
      center: "empty",
      corner: concaveCorner(p.t, p.l, p.tl),
    },
    rt: {
      center: "empty",
      corner: concaveCorner(p.t, p.r, p.tr),
    },
    lb: {
      center: "empty",
      corner: concaveCorner(p.b, p.l, p.bl),
    },
    rb: {
      center: "empty",
      corner: concaveCorner(p.b, p.r, p.br),
    },
  };
}

export type DragMode = "select" | "deselect";

const EMPTY_NEIGHBOR: NeighborInfo = { confirmed: false, preview: false };
const EMPTY_QUAD: RenderQuad = { corner: "empty", center: "empty" };
const EMPTY_CELL: RenderCell = {
  lt: EMPTY_QUAD,
  rt: EMPTY_QUAD,
  lb: EMPTY_QUAD,
  rb: EMPTY_QUAD,
};

/**
 * 2차원 confirmed/preview 배열 → RenderCell[][] 생성
 */
export function buildRenderGrid(args: {
  confirmed: boolean[][];
  preview: boolean[][];
  dragMode: DragMode;
}): RenderCell[][] {
  const { confirmed, preview, dragMode } = args;
  const H = confirmed.length;
  const W = H > 0 ? confirmed[0].length : 0;

  const confirmedOn: boolean[][] = [];
  const previewAdjOn: boolean[][] = [];
  const previewFillOn: boolean[][] = [];

  for (let r = 0; r < H; r++) {
    confirmedOn[r] = [];
    previewAdjOn[r] = [];
    previewFillOn[r] = [];
    for (let c = 0; c < W; c++) {
      const isSel = confirmed[r][c];
      const isPrev = preview[r][c];

      confirmedOn[r][c] =
        isSel && !(dragMode === "deselect" && isPrev);
      previewAdjOn[r][c] =
        dragMode === "select" ? isSel || isPrev : isSel;
      previewFillOn[r][c] =
        dragMode === "select" ? isSel || isPrev : isSel;
    }
  }

  function infoAt(r: number, c: number): NeighborInfo {
    if (r < 0 || r >= H || c < 0 || c >= W) return EMPTY_NEIGHBOR;
    return { confirmed: confirmedOn[r][c], preview: preview[r][c] };
  }

  const grid: RenderCell[][] = [];
  for (let r = 0; r < H; r++) {
    const row: RenderCell[] = [];
    for (let c = 0; c < W; c++) {
      row.push(
        buildRenderCell({
          center: { confirmed: confirmedOn[r][c], preview: previewFillOn[r][c] },
          t: infoAt(r - 1, c),
          b: infoAt(r + 1, c),
          l: infoAt(r, c - 1),
          r: infoAt(r, c + 1),
          tl: infoAt(r - 1, c - 1),
          tr: infoAt(r - 1, c + 1),
          bl: infoAt(r + 1, c - 1),
          br: infoAt(r + 1, c + 1),
        }),
      );
    }
    grid.push(row);
  }

  return grid;
}

/**
 * Set<number> 기반 1D 인덱스 → 2D boolean[][] 변환 후 buildRenderGrid 호출
 */
export function buildRenderGridFromSets(args: {
  H: number;
  W: number;
  isHidden: (idx: number) => boolean;
  confirmed: Set<number>;
  preview: Set<number>;
  dragMode: DragMode;
}): RenderCell[][] {
  const { H, W, isHidden, confirmed, preview, dragMode } = args;

  const confirmed2d: boolean[][] = [];
  const preview2d: boolean[][] = [];

  for (let r = 0; r < H; r++) {
    confirmed2d[r] = [];
    preview2d[r] = [];
    for (let c = 0; c < W; c++) {
      const idx = r * W + c;
      const hidden = isHidden(idx);
      confirmed2d[r][c] = !hidden && confirmed.has(idx);
      preview2d[r][c] = !hidden && preview.has(idx);
    }
  }

  return buildRenderGrid({ confirmed: confirmed2d, preview: preview2d, dragMode });
}
