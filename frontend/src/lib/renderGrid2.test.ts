import { describe, expect, it } from "vitest";
import { buildRenderGrid2 } from "./renderGrid2";

describe("buildRenderGrid2", () => {
  it("", () => {
    const cells = [[1, 2, 0, 0]];
    const grid = buildRenderGrid2(cells);

    expect(grid[0][0]).toEqual({
      center: 1,
      lt: 0,
      rt: 1,
      lb: 0,
      rb: 1,
    });

    expect(grid[0][1]).toEqual({
      center: 2,
      lt: 1,
      rt: 0,
      lb: 1,
      rb: 0,
    });
  });

  it("", () => {
    const cells = [[2, 2, 0, 0]];
    const grid = buildRenderGrid2(cells);

    expect(grid[0][0]).toEqual({
      center: 2,
      lt: 0,
      rt: 2,
      lb: 0,
      rb: 2,
    });

    expect(grid[0][1]).toEqual({
      center: 2,
      lt: 2,
      rt: 0,
      lb: 2,
      rb: 0,
    });
  });

  it("", () => {
    const cells = [
      [2, 2],
      [1, 2],
    ];

    const grid = buildRenderGrid2(cells);

    expect(grid[1][0].rt).toBe(2);
  });

  it("", () => {
    const cells = [
      [2, 0],
      [1, 2],
    ];

    const grid = buildRenderGrid2(cells);

    expect(grid[0][1].lb).toBe(1);
  });

  it("", () => {
    const cells = [
      [1, 0],
      [2, 0],
    ];

    const grid = buildRenderGrid2(cells);

    expect(grid[0][0]).toEqual({
      center: 1,
      lt: 0,
      rt: 0,
      lb: 1,
      rb: 1,
    });

    expect(grid[0][1].lt).toBe(0);
    expect(grid[0][1].lb).toBe(0);

    expect(grid[1][0].lt).toBe(1);
    expect(grid[1][0].rt).toBe(1);

    expect(grid[1][1].lt).toBe(0);
  });

  it("", () => {
    const cells = [
      [1, 2],
      [2, 2],
    ];

    const grid = buildRenderGrid2(cells);

    expect(grid[0][0].rb).toBe(2);
  });

  it("", () => {
    const cells = [
      [2, 0],
      [1, 1],
    ];

    const grid = buildRenderGrid2(cells);

    expect(grid[0][1].lb).toBe(1);
  });

  it("", () => {
    const cells = [[1, 1]];
    const grid = buildRenderGrid2(cells);

    expect(grid[0][0]).toEqual({
      center: 1,
      lt: 0,
      rt: 1,
      lb: 0,
      rb: 1,
    });

    expect(grid[0][1]).toEqual({
      center: 1,
      lt: 1,
      rt: 0,
      lb: 1,
      rb: 0,
    });
  });

  it("", () => {
    const cells = [
      [2, 2, 2],
      [2, 0, 2],
      [2, 2, 2],
    ];

    const grid = buildRenderGrid2(cells);

    expect(grid[1][1]).toEqual({
      center: 0,
      lt: 2,
      rt: 2,
      lb: 2,
      rb: 2,
    });
  });
});
