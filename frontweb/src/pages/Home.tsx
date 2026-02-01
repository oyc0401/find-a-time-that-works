import { FormEvent, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createRoom } from "../api/rooms";
import { getOrCreateUserId } from "../lib/user";

function todayStr(offset = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date.toISOString().slice(0, 10);
}

function sortDates(dates: string[]) {
  return [...dates].sort((a, b) => (a > b ? 1 : -1));
}

export default function Home() {
  const navigate = useNavigate();
  const [creatorId, setCreatorId] = useState("");
  const [roomName, setRoomName] = useState("다함께 일정 정하기");
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("18:00");
  const [dateInput, setDateInput] = useState(todayStr());
  const [dates, setDates] = useState<string[]>(() => [
    todayStr(),
    todayStr(1),
    todayStr(2),
  ]);
  const [joinId, setJoinId] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    getOrCreateUserId().then((id) => setCreatorId((prev) => prev || id));
  }, []);

  const formattedDates = useMemo(() => sortDates(dates), [dates]);
  const previewDates = formattedDates.slice(0, 3);
  const previewTimeSlots = ["10:00", "10:30", "11:00", "11:30"];
  const previewFilled = new Set(["0-0", "1-1", "1-2", "2-2"]);

  const addDate = () => {
    if (!dateInput) return;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
      setMessage("날짜를 YYYY-MM-DD 형식으로 입력해주세요.");
      return;
    }
    if (dates.includes(dateInput)) {
      setMessage("이미 추가된 날짜입니다.");
      return;
    }
    setMessage(null);
    setDates((prev) => sortDates([...prev, dateInput]));
  };

  const removeDate = (target: string) => {
    setDates((prev) => prev.filter((d) => d !== target));
  };

  const handleCreateRoom = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!creatorId.trim()) {
      setMessage("내 사용자 ID를 불러오는 중입니다. 잠시 후 다시 시도해주세요.");
      return;
    }
    if (formattedDates.length === 0) {
      setMessage("일정을 잡을 날짜를 한 개 이상 추가해주세요.");
      return;
    }
    if (startTime >= endTime) {
      setMessage("시작 시간이 종료 시간보다 빠르도록 설정해주세요.");
      return;
    }
    setMessage(null);
    setPending(true);
    try {
      const response = await createRoom({
        name: roomName.trim() || "새 모임",
        creatorId,
        dates: formattedDates,
        startTime,
        endTime,
      });
      navigate(`/rooms/${response.data.id}?created=1`);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "방 생성에 실패했습니다.",
      );
    } finally {
      setPending(false);
    }
  };

  const handleJoinRoom = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = joinId.trim();
    if (!trimmed) return;
    navigate(`/rooms/${trimmed}`);
  };

  return (
    <div className="container narrow">
      <header className="hero">
        <div className="hero__text">
          <p className="badge">FindTime 실험</p>
          <h1>
            모두의 가능한 시간을
            <br />
            한 번에 수집하세요
          </h1>
          <p className="muted">
            링크 하나로 친구들의 가능 시간을 받고, 가장 많은 사람이 겹치는
            슬롯을 골라보세요. 복잡한 카톡 설문 대신 시각화된 시간표를 바로
            확인할 수 있어요.
          </p>
          <div className="hero__cta">
            <button className="btn primary" onClick={addDate} type="button">
              오늘 날짜 추가하기
            </button>
            <button
              className="btn outline"
              type="button"
              onClick={() => navigate("/rooms/demo")}
              disabled
              title="데모 준비 중"
            >
              라이브 데모 (준비 중)
            </button>
          </div>
        </div>
        <div className="hero__preview">
          <div className="hero__preview-head">
            <strong>시간표 미리보기</strong>
            <span className="muted tiny">드래그로 선택</span>
          </div>
          <div className="hero-preview-grid">
            <div className="hero-preview-grid__times">
              <span />
              {previewTimeSlots.map((slot) => (
                <span key={slot}>{slot}</span>
              ))}
            </div>
            <div className="hero-preview-grid__dates">
              {previewDates.map((date, dateIndex) => (
                <div key={date} className="hero-preview-grid__col">
                  <span className="muted tiny">{date.slice(5)}</span>
                  {previewTimeSlots.map((time, timeIndex) => {
                    const key = `${dateIndex}-${timeIndex}`;
                    const active = previewFilled.has(key);
                    return (
                      <span
                        key={key}
                        className={`hero-slot ${active ? "hero-slot--active" : ""}`}
                      >
                        {active ? "가능" : ""}
                      </span>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </header>

      <section className="card">
        <h2>새로운 모임 방 만들기</h2>
        <form className="form" onSubmit={handleCreateRoom}>
          <label className="field">
            <span>방 이름</span>
            <input
              value={roomName}
              onChange={(event) => setRoomName(event.target.value)}
              placeholder="팀 회의, 주말 번개 등"
            />
          </label>

          <div className="grid">
            <label className="field">
              <span>시작 시각</span>
              <input
                type="time"
                value={startTime}
                onChange={(event) => setStartTime(event.target.value)}
              />
            </label>
            <label className="field">
              <span>종료 시각</span>
              <input
                type="time"
                value={endTime}
                onChange={(event) => setEndTime(event.target.value)}
              />
            </label>
          </div>

          <div className="field">
            <span>약속 후보 날짜</span>
            <div className="date-input">
              <input
                type="date"
                value={dateInput}
                onChange={(event) => setDateInput(event.target.value)}
              />
              <button
                type="button"
                className="btn outline"
                onClick={addDate}
                disabled={!dateInput}
              >
                추가
              </button>
            </div>
            <div className="chips">
              {formattedDates.map((date) => (
                <button
                  key={date}
                  type="button"
                  className="chip"
                  onClick={() => removeDate(date)}
                  title="삭제"
                >
                  {date}
                  <span aria-hidden>&times;</span>
                </button>
              ))}
              {formattedDates.length === 0 && (
                <p className="muted small">날짜를 추가해주세요.</p>
              )}
            </div>
          </div>

          {message && (
            <p className="error" role="alert">
              {message}
            </p>
          )}

          <button className="btn primary" type="submit" disabled={pending}>
            {pending ? "방 만드는 중..." : "방 만들기"}
          </button>
        </form>
      </section>

      <section className="card steps">
        <h2>어떻게 사용하나요?</h2>
        <div className="steps__grid">
          <article>
            <span className="badge secondary">STEP 1</span>
            <h3>모임 정보 입력</h3>
            <p className="muted small">
              모임 이름과 시간대를 정하고 후보 날짜를 추가하세요. 최대 일주일치
              등 원하는 만큼 넣을 수 있어요.
            </p>
          </article>
          <article>
            <span className="badge secondary">STEP 2</span>
            <h3>링크 공유</h3>
            <p className="muted small">
              생성된 링크를 단톡방이나 DM에 붙여넣으면 끝! 친구들은 앱 설치
              없이 바로 시간표를 볼 수 있어요.
            </p>
          </article>
          <article>
            <span className="badge secondary">STEP 3</span>
            <h3>겹치는 시간 선택</h3>
            <p className="muted small">
              참여자 명단과 겹치는 영역이 실시간으로 업데이트됩니다. 가장
              진한 블록이 모두에게 좋은 시간!
            </p>
          </article>
        </div>
      </section>

      <section className="card">
        <h2>이미 링크를 받으셨나요?</h2>
        <p className="muted small">
          방 ID는 공유 링크의 마지막 8자리 (예: findtime.site/rooms/
          <strong>abc123ef</strong>) 입니다.
        </p>
        <form className="form inline" onSubmit={handleJoinRoom}>
          <label className="field">
            <span>roomId</span>
            <input
              value={joinId}
              onChange={(event) => setJoinId(event.target.value)}
              placeholder="8자리 ID"
            />
          </label>
          <button className="btn outline" type="submit" disabled={!joinId}>
            방 참여
          </button>
        </form>
      </section>

      <footer className="footer">
        만들어주셔서 감사합니다!{" "}
        <a
          className="link"
          href="https://github.com/scarf005"
          target="_blank"
          rel="noreferrer"
        >
          프로젝트 GitHub
        </a>
      </footer>
    </div>
  );
}
