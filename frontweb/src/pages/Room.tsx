import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  FormEvent,
} from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  fetchRoom,
  submitAvailability,
  type Participant,
  type RoomDetail,
} from "../api/rooms";
import { getOrCreateUserId } from "../lib/user";
import { formatDateLabel, generateTimeSlots } from "../lib/time";

type AvailabilityMap = Set<string>;

function buildKey(date: string, time: string) {
  return `${date}T${time}`;
}

function slotsToSet(slots: Participant["slots"]): AvailabilityMap {
  return new Set(slots.map((slot) => buildKey(slot.date, slot.time)));
}

export default function RoomPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const justCreated = searchParams.get("created") === "1";
  const [detail, setDetail] = useState<RoomDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState("");
  const [selection, setSelection] = useState<AvailabilityMap>(new Set());
  const [participantName, setParticipantName] = useState("익명");
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragMode, setDragMode] = useState<"add" | "remove" | null>(null);

  useEffect(() => {
    getOrCreateUserId().then((idValue) => setUserId(idValue));
  }, []);

  const refreshRoom = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetchRoom(id);
      setDetail(response.data);
    } catch (fetchError) {
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : "방 정보를 불러오는 중 문제가 발생했습니다.",
      );
      setDetail(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void refreshRoom();
  }, [refreshRoom]);

  useEffect(() => {
    if (!detail || !userId) return;
    const mine = detail.participants.find((p) => p.userId === userId);
    if (mine) {
      setSelection(slotsToSet(mine.slots));
      setParticipantName(mine.name || "익명");
    } else {
      setSelection(new Set());
    }
  }, [detail, userId]);

  const room = detail?.room;
  const participants = useMemo(
    () => detail?.participants ?? [],
    [detail?.participants],
  );
  const timeSlots = useMemo(
    () => (room ? generateTimeSlots(room.startTime, room.endTime) : []),
    [room],
  );

  const availabilityCounts = useMemo(() => {
    const map = new Map<string, number>();
    participants.forEach((participant) => {
      participant.slots.forEach((slot) => {
        const key = buildKey(slot.date, slot.time);
        map.set(key, (map.get(key) ?? 0) + 1);
      });
    });
    return map;
  }, [participants]);

  const maxCount = useMemo(() => {
    let max = 0;
    availabilityCounts.forEach((count) => {
      if (count > max) max = count;
    });
    return max;
  }, [availabilityCounts]);

  const toggleSlot = (date: string, time: string) => {
    setSelection((prev) => {
      const next = new Set(prev);
      const key = buildKey(date, time);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const applySelection = useCallback(
    (date: string, time: string, mode: "add" | "remove") => {
      setSelection((prev) => {
        const next = new Set(prev);
        const key = buildKey(date, time);
        if (mode === "add") {
          next.add(key);
        } else {
          next.delete(key);
        }
        return next;
      });
    },
    [],
  );

  const handlePointerDown = (
    event: React.PointerEvent<HTMLButtonElement>,
    date: string,
    time: string,
  ) => {
    event.preventDefault();
    const key = buildKey(date, time);
    const mode = selection.has(key) ? "remove" : "add";
    setIsDragging(true);
    setDragMode(mode);
    applySelection(date, time, mode);
  };

  const handlePointerEnter = (date: string, time: string) => {
    if (!isDragging || !dragMode) return;
    applySelection(date, time, dragMode);
  };

  useEffect(() => {
    if (!isDragging) return;
    const stopDragging = () => {
      setIsDragging(false);
      setDragMode(null);
    };
    window.addEventListener("pointerup", stopDragging);
    return () => {
      window.removeEventListener("pointerup", stopDragging);
    };
  }, [isDragging]);

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!id || !room) return;
    if (!userId) {
      setSaveMessage("사용자 정보를 불러오는 중입니다. 잠시 후 시도해주세요.");
      return;
    }
    setSaving(true);
    setSaveMessage(null);
    try {
      await submitAvailability(id, {
        participantId: userId,
        participantName: participantName.trim() || "익명",
        slots: Array.from(selection).map((key) => {
          const [date, time] = key.split("T");
          return { date, time };
        }),
      });
      setSaveMessage("✅ 내 가능한 시간이 저장되었습니다.");
      void refreshRoom();
    } catch (submitError) {
      setSaveMessage(
        submitError instanceof Error
          ? submitError.message
          : "저장에 실패했습니다.",
      );
    } finally {
      setSaving(false);
    }
  };

  if (!id) {
    return (
      <div className="container narrow">
        <div className="card">
          <p className="error">방 ID가 필요합니다.</p>
          <Link className="link" to="/">
            홈으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container narrow">
        <div className="card">
          <p className="muted">방 정보를 불러오는 중입니다...</p>
        </div>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="container narrow">
        <div className="card">
          <p className="error">{error ?? "방을 찾을 수 없습니다."}</p>
          <button className="btn outline" type="button" onClick={() => refreshRoom()}>
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <header className="room-header">
        <div>
          <p className="badge">모임 코드 {room.id}</p>
          <h1>{room.name}</h1>
          <p className="muted">
            {room.dates[0]} ~ {room.dates[room.dates.length - 1]} ·{" "}
            {room.startTime} - {room.endTime}
          </p>
          {justCreated && (
            <p className="muted small success">
              방이 생성되었습니다! 아래 링크를 복사해 친구들에게 공유하세요.
            </p>
          )}
        </div>
        <div className="share-card">
          <p className="muted small">공유 링크</p>
          <code>{window.location.origin}/rooms/{room.id}</code>
          <button
            className="btn outline"
            type="button"
            onClick={() => {
              void navigator.clipboard.writeText(
                `${window.location.origin}/rooms/${room.id}`,
              );
            }}
          >
            링크 복사
          </button>
        </div>
      </header>

      <section className="card">
        <div className="card__header">
          <h2>내가 가능한 시간</h2>
          <span className="muted small">
            총 {selection.size}개 슬롯 선택됨 · 드래그로 블록을 선택해 보세요
          </span>
        </div>
        <form className="schedule" onSubmit={handleSave}>
          <p className="muted tiny">
            진한 파란색일수록 다른 참여자들이 많이 선택한 시간입니다.
          </p>
          <div className="schedule-grid">
            <div className="time-column">
              <div className="time-column__head">시간</div>
              {timeSlots.map((slot) => (
                <div key={slot} className="time-column__cell">
                  {slot}
                </div>
              ))}
            </div>

            {room.dates.map((date) => {
              const label = formatDateLabel(date);
              return (
                <div key={date} className="date-column">
                  <div className="date-column__head">
                    <strong>{label.weekday}</strong>
                    <span>{label.label}</span>
                  </div>
                  {timeSlots.map((slot) => {
                    const key = buildKey(date, slot);
                    const active = selection.has(key);
                    const count = availabilityCounts.get(key) ?? 0;
                    const intensity =
                      maxCount > 0 ? Math.min(count / maxCount, 1) : 0;
                    return (
                      <button
                        key={key}
                        type="button"
                        className={`slot ${active ? "slot--active" : ""}`}
                        style={
                          !active && intensity > 0
                            ? {
                                backgroundColor: `rgba(37, 99, 235, ${
                                  0.12 + intensity * 0.4
                                })`,
                              }
                            : undefined
                        }
                        onPointerDown={(event) =>
                          handlePointerDown(event, date, slot)
                        }
                        onPointerEnter={() => handlePointerEnter(date, slot)}
                        onClick={() => toggleSlot(date, slot)}
                      >
                        {active ? "가능" : count > 0 ? (
                          <span className="slot__count">{count}</span>
                        ) : (
                          ""
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>

          <div className="form row">
            <label className="field">
              <span>내 이름 (참여자 리스트에 표시)</span>
              <input
                value={participantName}
                onChange={(event) => setParticipantName(event.target.value)}
              />
            </label>
            <button
              className="btn primary"
              type="submit"
              disabled={saving || timeSlots.length === 0}
            >
              {saving ? "저장 중..." : "내 가능 시간 저장"}
            </button>
          </div>
          {saveMessage && <p className="muted small">{saveMessage}</p>}
        </form>
      </section>

      <section className="card">
        <div className="card__header">
          <h2>참여자 현황</h2>
          <span className="muted small">{participants.length}명 참여</span>
        </div>
        {participants.length === 0 ? (
          <p className="muted small">아직 참여자가 없습니다.</p>
        ) : (
          <div className="participant-summary">
            {participants.map((participant) => (
              <div key={participant.id} className="participant-pill">
                <div>
                  <strong>{participant.name || "익명"}</strong>
                  <p className="muted tiny">
                    {participant.slots.length}개 가능 시간
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="card">
        <h2>추천 사용법</h2>
        <ol className="guide">
          <li>상단 공유 링크를 단톡방이나 DM에 붙여넣습니다.</li>
          <li>친구들이 가능한 시간을 선택하고 저장합니다.</li>
          <li>참여자 현황을 보고 가장 겹치는 시간을 결정합니다.</li>
        </ol>
        <button className="btn outline" type="button" onClick={() => navigate("/")}>
          새로운 모임 만들기
        </button>
      </section>
    </div>
  );
}
