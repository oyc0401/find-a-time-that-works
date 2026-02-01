import { describe, expect, it } from "vitest";
import { buildRenderGrid } from "./DateSelector.logic";

describe("buildRenderGrid", () => {
  /**
   * 1x4 그리드: [1(preview), 2(confirmed), 3(empty), 4(empty)]
   */
  it("셀1=preview, 셀2=confirmed 일 때 각각의 RenderCell", () => {
    const confirmed = [[false, true, false, false]];
    const preview = [[true, false, false, false]];

    const grid = buildRenderGrid({
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

    const grid = buildRenderGrid({
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

    const grid = buildRenderGrid({
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

    const grid = buildRenderGrid({
      confirmed,
      preview,
      dragMode: "select",
    });

    // 셀 2 (row=0, col=1): empty, lb 코너에 1(confirmed), 3(preview), 4(confirmed)
    expect(grid[0][1].lb).toEqual({ center: "empty", corner: "preview" });
  });
});
