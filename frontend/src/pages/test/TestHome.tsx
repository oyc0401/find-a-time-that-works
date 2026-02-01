import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useRoomsControllerCreate } from "@/api/model/rooms/rooms";
import { getUserId } from "@/lib/userId";

function buildDefaultDates(count = 3): string[] {
  const today = new Date();
  const dates: string[] = [];
  for (let i = 0; i < count; i += 1) {
    const next = new Date(today);
    next.setDate(today.getDate() + i);
    dates.push(next.toISOString().split("T")[0]);
  }
  return dates;
}

function parseDates(input: string): string[] {
  return input
    .split(",")
    .map((token) => token.trim())
    .filter(Boolean);
}

export default function TestHome() {
  const navigate = useNavigate();
  const [creatorId, setCreatorId] = useState("");
  const [name, setName] = useState("테스트 방");
  const [datesInput, setDatesInput] = useState(
    () => `${buildDefaultDates().join(", ")}`,
  );
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("18:00");
  const [roomIdInput, setRoomIdInput] = useState("");
  const [createLog, setCreateLog] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    getUserId().then((id) => setCreatorId((prev) => prev || id));
  }, []);

  const { mutate: createRoom, isPending } = useRoomsControllerCreate();

  const handleCreateRoom = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedCreator = creatorId.trim();
    const dateList = parseDates(datesInput);

    if (!trimmedCreator) {
      setErrorMsg("creatorId를 입력하세요.");
      return;
    }
    if (dateList.length === 0) {
      setErrorMsg("YYYY-MM-DD 형태의 날짜를 최소 하나 입력하세요.");
      return;
    }
    setErrorMsg("");

    createRoom(
      {
        data: {
          name: name.trim() || "테스트 방",
          creatorId: trimmedCreator,
          dates: dateList,
          startTime: startTime.trim() || "10:00",
          endTime: endTime.trim() || "18:00",
        },
      },
      {
        onSuccess: (response) => {
          if (response.status === 201) {
            const newId = response.data.data.id;
            setCreateLog(
              `✅ 방 생성 완료\n${JSON.stringify(response.data, null, 2)}`,
            );
            setRoomIdInput(newId);
          } else {
            setCreateLog(`예상치 못한 응답: ${response.status}`);
          }
        },
        onError: (error) => {
          const message = error instanceof Error ? error.message : "에러 발생";
          setCreateLog(`❌ 실패: ${message}`);
        },
      },
    );
  };

  const handleEnterRoom = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = roomIdInput.trim();
    if (!trimmed) return;
    navigate(`/test/room?id=${trimmed}`);
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col gap-10 bg-slate-50 p-6">
      <header className="space-y-4 rounded-xl bg-white p-6 shadow">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-slate-900">
            Rooms API 테스트 페이지
          </h1>
          <Link
            to="/"
            className="text-sm font-medium text-blue-600 hover:underline"
          >
            메인 화면
          </Link>
        </div>
        <p className="text-sm text-slate-600">
          백엔드 Rooms API를 손쉽게 호출할 수 있는 임시 페이지입니다. 방을
          생성한 뒤 `/test/room?id=...`으로 이동해서 나머지 기능을 확인해
          보세요.
        </p>
      </header>

      <section className="rounded-xl bg-white p-6 shadow">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">방 생성</h2>
        <form className="space-y-4" onSubmit={handleCreateRoom}>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">방 이름</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="mt-1 w-full rounded border border-slate-200 px-3 py-2 text-sm"
              placeholder="방 이름"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">
              creatorId
            </span>
            <input
              value={creatorId}
              onChange={(event) => setCreatorId(event.target.value)}
              className="mt-1 w-full rounded border border-slate-200 px-3 py-2 text-sm"
              placeholder="user-uuid"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">
              대상 날짜 (쉼표로 구분)
            </span>
            <input
              value={datesInput}
              onChange={(event) => setDatesInput(event.target.value)}
              className="mt-1 w-full rounded border border-slate-200 px-3 py-2 text-sm"
              placeholder="2025-01-01, 2025-01-02"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">
                시작 시각
              </span>
              <input
                value={startTime}
                onChange={(event) => setStartTime(event.target.value)}
                className="mt-1 w-full rounded border border-slate-200 px-3 py-2 text-sm"
                placeholder="10:00"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">
                종료 시각
              </span>
              <input
                value={endTime}
                onChange={(event) => setEndTime(event.target.value)}
                className="mt-1 w-full rounded border border-slate-200 px-3 py-2 text-sm"
                placeholder="18:00"
              />
            </label>
          </div>

          {errorMsg && (
            <p className="text-sm text-red-500" role="alert">
              {errorMsg}
            </p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {isPending ? "생성 중..." : "방 생성"}
          </button>
        </form>

        {createLog && (
          <pre className="mt-4 whitespace-pre-wrap rounded bg-slate-900/90 p-4 text-xs text-white">
            {createLog}
          </pre>
        )}
      </section>

      <section className="rounded-xl bg-white p-6 shadow">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">
          방 상세 페이지 이동
        </h2>
        <form className="space-y-4" onSubmit={handleEnterRoom}>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">
              roomId (8자리)
            </span>
            <input
              value={roomIdInput}
              onChange={(event) => setRoomIdInput(event.target.value)}
              className="mt-1 w-full rounded border border-slate-200 px-3 py-2 text-sm"
              placeholder="생성된 방 ID 입력"
            />
          </label>
          <button
            type="submit"
            className="w-full rounded border border-blue-600 px-4 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50 disabled:opacity-60"
            disabled={!roomIdInput.trim()}
          >
            /test/room으로 이동
          </button>
        </form>

        {roomIdInput.trim() && (
          <p className="mt-4 text-sm text-slate-600">
            바로 이동:{" "}
            <Link
              className="font-semibold text-blue-600 hover:underline"
              to={`/test/room?id=${roomIdInput.trim()}`}
            >
              /test/room?id={roomIdInput.trim()}
            </Link>
          </p>
        )}
      </section>
    </div>
  );
}
