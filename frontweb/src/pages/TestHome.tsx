import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createRoom } from "../api/rooms";
import { getOrCreateUserId } from "../lib/user";

function buildDefaultDates(count = 3): string[] {
  const now = new Date();
  const results: string[] = [];
  for (let i = 0; i < count; i += 1) {
    const next = new Date(now);
    next.setDate(now.getDate() + i);
    results.push(next.toISOString().slice(0, 10));
  }
  return results;
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
    () => buildDefaultDates().join(", "),
  );
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("18:00");
  const [roomIdInput, setRoomIdInput] = useState("");
  const [createLog, setCreateLog] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    getOrCreateUserId().then((id) => setCreatorId((prev) => prev || id));
  }, []);

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedCreator = creatorId.trim();
    const parsedDates = parseDates(datesInput);

    if (!trimmedCreator) {
      setErrorMessage("creatorId를 입력해주세요.");
      return;
    }
    if (!parsedDates.length) {
      setErrorMessage("YYYY-MM-DD 형식의 날짜를 최소 1개 입력해주세요.");
      return;
    }
    setErrorMessage("");
    setIsLoading(true);

    try {
      const result = await createRoom({
        name: name.trim() || "테스트 방",
        creatorId: trimmedCreator,
        dates: parsedDates,
        startTime: startTime.trim() || "10:00",
        endTime: endTime.trim() || "18:00",
      });
      setCreateLog(
        `✅ 방 생성 완료\n${JSON.stringify(result.data, null, 2)}`,
      );
      setRoomIdInput(result.data.id);
    } catch (error) {
      setCreateLog(
        `❌ ${error instanceof Error ? error.message : "알 수 없는 오류"}`,
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleGotoRoom = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = roomIdInput.trim();
    if (!trimmed) return;
    navigate(`/test/room?id=${trimmed}`);
  };

  return (
    <div className="container">
      <header className="card">
        <div className="card__header">
          <h1>FrontWeb Rooms Test</h1>
          <Link to="/test/room" className="link">
            방 상세 바로가기
          </Link>
        </div>
        <p className="muted">
          백엔드 Rooms API를 검증하기 위한 간단한 테스트 클라이언트입니다.
          아래에서 방을 생성한 뒤 `/test/room` 화면에서 다른 기능들을 호출할 수
          있습니다.
        </p>
      </header>

      <section className="card">
        <h2>방 생성</h2>
        <form className="form" onSubmit={handleCreate}>
          <label className="field">
            <span>방 이름</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="테스트 방"
            />
          </label>
          <label className="field">
            <span>creatorId</span>
            <input
              value={creatorId}
              onChange={(event) => setCreatorId(event.target.value)}
              placeholder="user-uuid"
            />
          </label>
          <label className="field">
            <span>날짜 목록 (쉼표 구분)</span>
            <input
              value={datesInput}
              onChange={(event) => setDatesInput(event.target.value)}
              placeholder="2025-01-01, 2025-01-02"
            />
          </label>
          <div className="grid">
            <label className="field">
              <span>시작 시각</span>
              <input
                value={startTime}
                onChange={(event) => setStartTime(event.target.value)}
                placeholder="10:00"
              />
            </label>
            <label className="field">
              <span>종료 시각</span>
              <input
                value={endTime}
                onChange={(event) => setEndTime(event.target.value)}
                placeholder="18:00"
              />
            </label>
          </div>

          {errorMessage && (
            <p className="error" role="alert">
              {errorMessage}
            </p>
          )}

          <button className="btn primary" type="submit" disabled={isLoading}>
            {isLoading ? "생성 중..." : "방 생성"}
          </button>
        </form>

        {createLog && <pre className="log">{createLog}</pre>}
      </section>

      <section className="card">
        <h2>/test/room 이동</h2>
        <form className="form inline" onSubmit={handleGotoRoom}>
          <label className="field">
            <span>roomId</span>
            <input
              value={roomIdInput}
              onChange={(event) => setRoomIdInput(event.target.value)}
              placeholder="생성된 8자리 ID"
            />
          </label>
          <button className="btn outline" type="submit" disabled={!roomIdInput}>
            이동
          </button>
        </form>
        {roomIdInput && (
          <p className="muted">
            링크:{" "}
            <Link className="link" to={`/test/room?id=${roomIdInput}`}>
              /test/room?id={roomIdInput}
            </Link>
          </p>
        )}
      </section>
    </div>
  );
}
