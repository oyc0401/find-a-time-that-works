import { describe, expect, it } from "vitest";
import { buildRenderDragGrid } from "./renderDragGrid";

describe("buildRenderDragGrid", () => {
  /**
   * 1x4 그리드: [1(preview), 2(confirmed), 3(empty), 4(empty)]
   */
  it("셀1=preview, 셀2=confirmed 일 때 각각의 RenderCell", () => {
    const confirmed = [[false, true, false, false]];
    const preview = [[true, false, false, false]];

    const grid = buildRenderDragGrid({
      confirmed,
      preview,
      dragMode: "select",
    });

    // 셀 1 (preview): r=confirmed이므로 rt,rb는 preview
    expect(grid[0][0]).toEqual({
      lt: { center: "preview", corner: "empty" },
      rt: { center: "preview", corner: "preview" },
      lb: { center: "preview", corner: "empty" },
      rb: { center: "preview", corner: "preview" },
    });

    // 셀 2 (confirmed): l=preview → lt,lb는 corner=preview
    expect(grid[0][1]).toEqual({
      lt: { center: "confirmed", corner: "preview" },
      rt: { center: "confirmed", corner: "empty" },
      lb: { center: "confirmed", corner: "preview" },
      rb: { center: "confirmed", corner: "empty" },
    });
  });

  /**
   * 1x4 그리드: [1(confirmed), 2(confirmed), 3(empty), 4(empty)]
   * 드래그 모드 (preview 있음)
   */
  it("셀1,2 둘다 confirmed + 드래그모드일 때 인접 코너는 confirmed", () => {
    const confirmed = [[true, true, false, false]];
    const preview = [[false, false, false, false]];

    const grid = buildRenderDragGrid({
      confirmed,
      preview,
      dragMode: "select",
    });

    // 셀 1: rt, rb는 셀2와 인접 → corner=confirmed
    expect(grid[0][0]).toEqual({
      lt: { center: "confirmed", corner: "empty" },
      rt: { center: "confirmed", corner: "confirmed" },
      lb: { center: "confirmed", corner: "empty" },
      rb: { center: "confirmed", corner: "confirmed" },
    });

    // 셀 2: lt, lb는 셀1과 인접 → corner=confirmed, rt, rb는 비어있으니 empty
    expect(grid[0][1]).toEqual({
      lt: { center: "confirmed", corner: "confirmed" },
      rt: { center: "confirmed", corner: "empty" },
      lb: { center: "confirmed", corner: "confirmed" },
      rb: { center: "confirmed", corner: "empty" },
    });
  });

  /**
   * 2x2 그리드:
   * [1(confirmed), 2(confirmed)]
   * [3(preview),   4(confirmed)]
   */
  it("2x2에서 3이 preview일 때 rt는 center=preview, corner=confirmed", () => {
    const confirmed = [
      [true, true],
      [false, true],
    ];
    const preview = [
      [false, false],
      [true, false],
    ];

    const grid = buildRenderDragGrid({
      confirmed,
      preview,
      dragMode: "select",
    });

    // 셀 3 (row=1, col=0): preview, 주변 1,2,4가 confirmed
    expect(grid[1][0].rt).toEqual({ center: "preview", corner: "confirmed" });
  });

  /**
   * 2x2 그리드:
   * [1(confirmed), 2(empty)]
   * [3(preview),   4(confirmed)]
   *
   * 셀2의 lb 코너: 1,3,4가 채워짐 → concave 패치 필요
   */
  it("2x2에서 1,4=confirmed, 3=preview일 때 셀2의 lb는 center=empty, corner=preview", () => {
    const confirmed = [
      [true, false],
      [false, true],
    ];
    const preview = [
      [false, false],
      [true, false],
    ];

    const grid = buildRenderDragGrid({
      confirmed,
      preview,
      dragMode: "select",
    });

    // 셀 2 (row=0, col=1): empty, lb 코너에 1(confirmed), 3(preview), 4(confirmed)
    expect(grid[0][1].lb).toEqual({ center: "empty", corner: "preview" });
  });

  /**
   * 2x2 그리드 deselect 모드:
   * [1(confirmed+preview), 2(preview)]
   * [3(empty),             4(empty)]
   *
   * 1은 원래 confirmed였고, 1,2가 preview(deselect 드래그 중)
   * → 1은 deselect 프리뷰에 걸려 confirmed에서 제외됨
   */
  it("deselect 모드: 1=confirmed+preview, 2=preview일 때 2의 lt,lb와 4의 lt 검증", () => {
    const confirmed = [
      [true, false],
      [true, false],
    ];
    const preview = [
      [true, true],
      [false, false],
    ];

    const grid = buildRenderDragGrid({
      confirmed,
      preview,
      dragMode: "deselect",
    });

    // 셀 1 (row=0, col=0): deselect 프리뷰에 걸려 confirmed에서 제외 → center=empty
    expect(grid[0][0]).toEqual({
      lt: { center: "preview", corner: "empty" },
      rt: { center: "preview", corner: "empty" },
      lb: { center: "preview", corner: "preview" },
      rb: { center: "preview", corner: "preview" },
    });

    // 셀 2 (row=0, col=1): deselect 모드에서 preview는 표시 안 됨, 1도 confirmed에서 제외
    // → center=empty, lt/lb는 왼쪽(1)이 비워졌으니 empty
    expect(grid[0][1].lt).toEqual({ center: "empty", corner: "empty" });
    expect(grid[0][1].lb).toEqual({ center: "empty", corner: "empty" });

    expect(grid[1][0].lt).toEqual({ center: "confirmed", corner: "preview" });
    expect(grid[1][0].rt).toEqual({ center: "confirmed", corner: "preview" });

    // 셀 4 (row=1, col=1): empty, 위(2)도 empty, 대각선(1)도 제외됨
    expect(grid[1][1].lt).toEqual({ center: "empty", corner: "empty" });
  });

  /**
   * 2x2 그리드 select 모드:
   * [1(preview), 2(confirmed)]
   * [3(confirmed), 4(confirmed)]
   *
   * 2,3,4가 confirmed 상태에서 1을 select 드래그
   * → 셀1의 rb는 corner=preview (셀1 자체가 preview)
   */
  it("select 모드: 2,3,4=confirmed에서 1 선택 시 셀1의 rb는 corner=preview", () => {
    const confirmed = [
      [false, true],
      [true, true],
    ];
    const preview = [
      [true, true],
      [true, true],
    ];

    const grid = buildRenderDragGrid({
      confirmed,
      preview,
      dragMode: "select",
    });

    // 셀 1 (row=0, col=0): preview
    expect(grid[0][0].rb).toEqual({
      center: "preview",
      corner: "confirmed",
    });
  });

  /**
   * 2x2 그리드 deselect 모드:
   * [1(confirmed), 2(empty)]
   * [3(confirmed+preview), 4(confirmed+preview)]
   *
   * 1,3,4가 confirmed 상태에서 3,4를 deselect 드래그
   * → 셀2의 lb는 corner=preview (왼쪽아래 셀3이 deselect preview)
   */
  it("deselect 모드: 1,3,4=confirmed에서 3,4 제거 시 셀2의 lb는 corner=preview", () => {
    const confirmed = [
      [true, false],
      [true, true],
    ];
    const preview = [
      [false, false],
      [true, true],
    ];

    const grid = buildRenderDragGrid({
      confirmed,
      preview,
      dragMode: "deselect",
    });

    // 셀 2 (row=0, col=1): empty, lb 코너에 3(deselect preview)가 있음
    expect(grid[0][1].lb).toEqual({ center: "empty", corner: "preview" });
  });

  /**
   * 1x2 그리드: [1(confirmed), 2(confirmed)]
   * deselect 모드로 1,2 모두 preview → 둘 다 지워짐
   */
  it("deselect 모드: 1,2 모두 confirmed+preview일 때 둘 다 empty", () => {
    const confirmed = [[true, true]];
    const preview = [[true, true]];

    const grid = buildRenderDragGrid({
      confirmed,
      preview,
      dragMode: "deselect",
    });

    // 셀 1
    expect(grid[0][0]).toEqual({
      lt: { center: "preview", corner: "empty" },
      rt: { center: "preview", corner: "preview" },
      lb: { center: "preview", corner: "empty" },
      rb: { center: "preview", corner: "preview" },
    });

    // 셀 2
    expect(grid[0][1]).toEqual({
      lt: { center: "preview", corner: "preview" },
      rt: { center: "preview", corner: "empty" },
      lb: { center: "preview", corner: "preview" },
      rb: { center: "preview", corner: "empty" },
    });
  });
});
