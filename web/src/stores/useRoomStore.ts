import { create } from "zustand";
import type { SlotDto } from "@/api/model/models";

function createGrid(rows: number, cols: number): boolean[][] {
  return Array.from({ length: rows }, () => Array(cols).fill(false));
}

interface RoomState {
  /** 뷰 상태 섹션 */
  // 방 페이지 탭 선택 상태 (0:선택,1:개요,2:참가자)
  tabIdx: number;
  // Overview에서 강조할 참가자 ID 목록 (다중선택)
  selectedUserIds: string[];
  setTabIdx: (idx: number) => void;
  setSelectedUserIds: (userIds: string[]) => void;

  /** 사용자 섹션 */
  // 사용자가 직접 입력 중인 닉네임
  nickname: string;
  // 시스템이 추천해 둔 임시 닉네임
  generatedNickname: string;
  // 참가자 썸네일(이미지 키)
  thumbnail: string;
  setNickname: (name: string) => void;
  setGeneratedNickname: (name: string) => void;
  setThumbnail: (thumbnail: string) => void;

  /** 그리드 섹션 */
  // 화면에서 직접 편집 중인 시간 격자 상태
  grid: boolean[][];
  // 방 시간표 크기로 grid 초기화
  init: (rows: number, cols: number) => void;
  // 서버 슬롯 데이터를 grid에 반영
  loadFromSlots: (slots: SlotDto[], dates: string[], timeSlots: string[]) => void;
  // 특정 범위를 선택 상태(true)로 변경
  select: (r0: number, r1: number, c0: number, c1: number) => void;
  // 특정 범위를 선택 해제(false)
  deselect: (r0: number, r1: number, c0: number, c1: number) => void;

  /** 다이얼로그/시트 섹션 */
  // 튜토리얼 시트 표시 여부
  isTutorialOpen: boolean;
  // 방 이름 변경 시트 표시 여부
  isRoomNameOpen: boolean;
  // 닉네임 변경 다이얼로그 표시 여부
  isNicknameDialogOpen: boolean;
  // 썸네일 변경 다이얼로그 표시 여부
  isThumbnailDialogOpen: boolean;
  // 개요 탭의 달력 모달 표시 여부
  isOverviewCalendarOpen: boolean;
  // 날짜 선택 시트 표시 여부
  isSelectCalendarOpen: boolean;
  // 방 이동 시트 표시 여부
  isRoomNavigateOpen: boolean;
  setIsTutorialOpen: (open: boolean) => void;
  setIsRoomNameOpen: (open: boolean) => void;
  setIsNicknameDialogOpen: (open: boolean) => void;
  setIsThumbnailDialogOpen: (open: boolean) => void;
  setIsOverviewCalendarOpen: (open: boolean) => void;
  setIsSelectCalendarOpen: (open: boolean) => void;
  setIsRoomNavigateOpen: (open: boolean) => void;

  /** 리셋 섹션 */
  reset: () => void;
}

export const useRoomStore = create<RoomState>((set) => ({
  // ── View state ──
  tabIdx: 0,
  selectedUserIds: [],
  setTabIdx: (idx) => set({ tabIdx: idx }),
  setSelectedUserIds: (userIds) => set({ selectedUserIds: userIds }),

  // ── User state ──
  nickname: "",
  generatedNickname: "",
  thumbnail: "",
  setNickname: (name) => set({ nickname: name }),
  setGeneratedNickname: (name) => set({ generatedNickname: name }),
  setThumbnail: (thumbnail) => set({ thumbnail }),

  // ── Grid state ──
  grid: [],
  init: (rows, cols) => set({ grid: createGrid(rows, cols) }),
  loadFromSlots: (slots, dates, timeSlots) =>
    set((s) => {
      const rows = timeSlots.length;
      const cols = dates.length;
      const grid =
        s.grid.length === rows && s.grid[0]?.length === cols
          ? s.grid.map((row) => [...row])
          : createGrid(rows, cols);

      // reset all to false first
      for (let r = 0; r < rows; r++)
        for (let c = 0; c < cols; c++) grid[r][c] = false;

      const dateIdx = new Map(dates.map((d, i) => [d, i]));
      const timeIdx = new Map(timeSlots.map((t, i) => [t, i]));

      for (const slot of slots) {
        const c = dateIdx.get(slot.date);
        const r = timeIdx.get(slot.time);
        if (r !== undefined && c !== undefined) {
          grid[r][c] = true;
        }
      }
      return { grid };
    }),
  select: (r0, r1, c0, c1) =>
    set((s) => {
      const next = s.grid.map((row) => [...row]);
      for (let r = r0; r <= r1; r++)
        for (let c = c0; c <= c1; c++) next[r][c] = true;
      return { grid: next };
    }),
  deselect: (r0, r1, c0, c1) =>
    set((s) => {
      const next = s.grid.map((row) => [...row]);
      for (let r = r0; r <= r1; r++)
        for (let c = c0; c <= c1; c++) next[r][c] = false;
      return { grid: next };
    }),

  // ── Dialog / sheet state ──
  isTutorialOpen: false,
  isRoomNameOpen: false,
  isNicknameDialogOpen: false,
  isThumbnailDialogOpen: false,
  isOverviewCalendarOpen: false,
  isSelectCalendarOpen: false,
  isRoomNavigateOpen: false,
  setIsTutorialOpen: (open) => set({ isTutorialOpen: open }),
  setIsRoomNameOpen: (open) => set({ isRoomNameOpen: open }),
  setIsNicknameDialogOpen: (open) => set({ isNicknameDialogOpen: open }),
  setIsThumbnailDialogOpen: (open) => set({ isThumbnailDialogOpen: open }),
  setIsOverviewCalendarOpen: (open) => set({ isOverviewCalendarOpen: open }),
  setIsSelectCalendarOpen: (open) => set({ isSelectCalendarOpen: open }),
  setIsRoomNavigateOpen: (open) => set({ isRoomNavigateOpen: open }),
  reset: () =>
    set({
      tabIdx: 0,
      selectedUserIds: [],
      nickname: "",
      generatedNickname: "",
      thumbnail: "",
      grid: [],
      isTutorialOpen: false,
      isRoomNameOpen: false,
      isNicknameDialogOpen: false,
      isThumbnailDialogOpen: false,
      isOverviewCalendarOpen: false,
      isSelectCalendarOpen: false,
      isRoomNavigateOpen: false,
    }),
}));
