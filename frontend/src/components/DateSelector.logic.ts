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
export function buildRenderCell(
  p: {
    center: NeighborInfo;
    t: NeighborInfo;
    b: NeighborInfo;
    l: NeighborInfo;
    r: NeighborInfo;
    tl: NeighborInfo;
    tr: NeighborInfo;
    bl: NeighborInfo;
    br: NeighborInfo;
  },
  dragMode: DragMode,
): RenderCell {
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
    // deselect 모드: confirmed 이웃 또는 (자신도 preview이고 이웃도 preview)인 경우 반영
    // select 모드: preview 이웃도 반영
    if (dragMode === "deselect") {
      // confirmed 이웃이 있으면 preview
      if (adj1.confirmed || adj2.confirmed) return "preview";
      // 자신(center)이 preview이고 이웃도 preview면 preview (둘 다 지워지는 중)
      if (p.center.preview && (adj1.preview || adj2.preview)) return "preview";
    } else {
      if (adj1.preview || adj2.preview || adj1.confirmed || adj2.confirmed)
        return "preview";
    }
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
  // 3칸이 모두 채워져 있으면 concave 필요
  const concaveCorner = (
    adj1: NeighborInfo,
    adj2: NeighborInfo,
    diag: NeighborInfo,
  ): Owner => {
    // select/deselect 모두: confirmed 또는 preview면 "채워짐"으로 봄
    // (deselect 모드에서 preview = 지워지는 중인 셀, 아직은 채워져 있음)
    const filled1 = adj1.confirmed || adj1.preview;
    const filled2 = adj2.confirmed || adj2.preview;
    const filledDiag = diag.confirmed || diag.preview;
    if (!filled1 || !filled2 || !filledDiag) return "empty";
    // 3칸 모두 채워짐 → preview가 하나라도 있으면 preview
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

  // 1차: 기본 계산
  for (let r = 0; r < H; r++) {
    confirmedOn[r] = [];
    previewAdjOn[r] = [];
    previewFillOn[r] = [];
    for (let c = 0; c < W; c++) {
      const isSel = confirmed[r][c];
      const isPrev = preview[r][c];

      confirmedOn[r][c] = isSel && !(dragMode === "deselect" && isPrev);
      previewAdjOn[r][c] = dragMode === "select" ? isSel || isPrev : isSel;
      previewFillOn[r][c] = dragMode === "select" ? isSel || isPrev : isSel;
    }
  }

  // 2차: deselect 모드에서 지워지는 셀과 인접한 confirmed 셀도 preview로 표시
  if (dragMode === "deselect") {
    for (let r = 0; r < H; r++) {
      for (let c = 0; c < W; c++) {
        // 지워지는 셀인지 확인
        if (confirmed[r][c] && preview[r][c]) {
          // 인접 셀 중 confirmed지만 preview가 아닌 셀을 previewFillOn으로 표시
          const neighbors = [
            [r - 1, c],
            [r + 1, c],
            [r, c - 1],
            [r, c + 1],
          ];
          for (const [nr, nc] of neighbors) {
            if (nr >= 0 && nr < H && nc >= 0 && nc < W) {
              if (confirmed[nr][nc] && !preview[nr][nc]) {
                previewFillOn[nr][nc] = true;
              }
            }
          }
        }
      }
    }
  }

  function infoAt(r: number, c: number): NeighborInfo {
    if (r < 0 || r >= H || c < 0 || c >= W) return EMPTY_NEIGHBOR;
    // deselect 모드: 원래 confirmed였던 셀만 "지워지는 preview"로 인정
    const isPreview =
      dragMode === "deselect"
        ? confirmed[r][c] && preview[r][c]
        : preview[r][c];
    return { confirmed: confirmedOn[r][c], preview: isPreview };
  }

  const grid: RenderCell[][] = [];
  for (let r = 0; r < H; r++) {
    const row: RenderCell[] = [];
    for (let c = 0; c < W; c++) {
      row.push(
        buildRenderCell(
          {
            center: {
              confirmed: confirmedOn[r][c],
              preview: previewFillOn[r][c],
            },
            t: infoAt(r - 1, c),
            b: infoAt(r + 1, c),
            l: infoAt(r, c - 1),
            r: infoAt(r, c + 1),
            tl: infoAt(r - 1, c - 1),
            tr: infoAt(r - 1, c + 1),
            bl: infoAt(r + 1, c - 1),
            br: infoAt(r + 1, c + 1),
          },
          dragMode,
        ),
      );
    }
    grid.push(row);
  }

  return grid;
}
