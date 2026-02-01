import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Link,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import {
  deleteRoom,
  extendRoom,
  fetchRoom,
  submitAvailability,
  updateNickname,
  updateRoomName,
} from "../api/rooms";
import type { AvailabilityPayload, RoomDetail } from "../api/rooms";
import { getOrCreateUserId } from "../lib/user";

function parseSlots(input: string): AvailabilityPayload["slots"] {
  return input
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [date, time] = line.split(/\s+/);
      if (!date || !time) {
        return undefined;
      }
      return { date, time };
    })
    .filter((slot): slot is { date: string; time: string } => Boolean(slot));
}

export default function TestRoom() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const roomId = searchParams.get("id") ?? "";
  const [roomIdInput, setRoomIdInput] = useState(roomId);
  const [detail, setDetail] = useState<RoomDetail | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [creatorIdInput, setCreatorIdInput] = useState("");
  const [roomNameInput, setRoomNameInput] = useState("");
  const [extendLog, setExtendLog] = useState("");
  const [updateLog, setUpdateLog] = useState("");
  const [deleteLog, setDeleteLog] = useState("");
  const [availabilityLog, setAvailabilityLog] = useState("");
  const [nicknameLog, setNicknameLog] = useState("");
  const [participantId, setParticipantId] = useState("");
  const [participantName, setParticipantName] = useState("테스터");
  const [slotsInput, setSlotsInput] = useState("");
  const [nicknameUserId, setNicknameUserId] = useState("");
  const [nicknameName, setNicknameName] = useState("새 닉네임");

  useEffect(() => {
    setRoomIdInput(roomId);
  }, [roomId]);

  const refreshRoom = useCallback(async () => {
    if (!roomId) return;
    setIsFetching(true);
    setFetchError(null);
    try {
      const response = await fetchRoom(roomId);
      setDetail(response.data);
    } catch (error) {
      setDetail(null);
      setFetchError(
        error instanceof Error ? error.message : "불러오기에 실패했습니다.",
      );
    } finally {
      setIsFetching(false);
    }
  }, [roomId]);

  useEffect(() => {
    if (!roomId) return;
    void refreshRoom();
  }, [roomId, refreshRoom]);

  useEffect(() => {
    if (!detail) return;
    setCreatorIdInput((prev) => prev || detail.room.creatorId);
    setRoomNameInput((prev) => prev || detail.room.name);
    setSlotsInput(
      (prev) =>
        prev ||
        (detail.room.dates[0]
          ? `${detail.room.dates[0]} ${detail.room.startTime}`
          : ""),
    );
  }, [detail]);

  useEffect(() => {
    getOrCreateUserId().then((id) => {
      setParticipantId((prev) => prev || id);
      setNicknameUserId((prev) => prev || id);
    });
  }, []);

  const participants = detail?.participants ?? [];
  const readableSlotCount = useMemo(
    () => participants.reduce((sum, participant) => sum + participant.slots.length, 0),
    [participants],
  );

  const handleRoomIdSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextId = roomIdInput.trim();
    if (!nextId) return;
    setSearchParams({ id: nextId });
  };

  const handleExtend = async () => {
    if (!roomId) return;
    setExtendLog("요청 중...");
    try {
      const result = await extendRoom(roomId);
      setExtendLog(`✅ 만료일: ${new Date(result.data.expiresAt).toLocaleString()}`);
      void refreshRoom();
    } catch (error) {
      setExtendLog(
        `❌ ${error instanceof Error ? error.message : "연장 실패"}`,
      );
    }
  };

  const handleUpdateRoomName = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!roomId) return;
    const creator = creatorIdInput.trim();
    const newName = roomNameInput.trim();
    if (!creator || !newName) {
      setUpdateLog("creatorId와 새 이름을 모두 입력하세요.");
      return;
    }
    setUpdateLog("요청 중...");
    try {
      await updateRoomName(roomId, { creatorId: creator, name: newName });
      setUpdateLog("✅ 방 이름이 변경되었습니다.");
      void refreshRoom();
    } catch (error) {
      setUpdateLog(
        `❌ ${error instanceof Error ? error.message : "변경 실패"}`,
      );
    }
  };

  const handleDeleteRoom = async () => {
    if (!roomId) return;
    const creator = creatorIdInput.trim();
    if (!creator) {
      setDeleteLog("creatorId를 입력하세요.");
      return;
    }
    if (!window.confirm("정말 이 방을 삭제할까요?")) {
      return;
    }
    setDeleteLog("요청 중...");
    try {
      await deleteRoom(roomId, { creatorId: creator });
      setDeleteLog("✅ 삭제되었습니다. /test로 이동합니다.");
      navigate("/test");
    } catch (error) {
      setDeleteLog(
        `❌ ${error instanceof Error ? error.message : "삭제 실패"}`,
      );
    }
  };

  const handleAvailability = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!roomId) return;
    const pid = participantId.trim();
    if (!pid) {
      setAvailabilityLog("participantId를 입력하세요.");
      return;
    }
    const slots = parseSlots(slotsInput);
    setAvailabilityLog("요청 중...");
    try {
      await submitAvailability(roomId, {
        participantId: pid,
        participantName: participantName.trim() || "익명",
        slots,
      });
      setAvailabilityLog(`✅ ${slots.length}개의 슬롯 저장`);
      void refreshRoom();
    } catch (error) {
      setAvailabilityLog(
        `❌ ${error instanceof Error ? error.message : "저장 실패"}`,
      );
    }
  };

  const handleNickname = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!roomId) return;
    const userId = nicknameUserId.trim();
    const nick = nicknameName.trim();
    if (!userId || !nick) {
      setNicknameLog("userId와 닉네임을 모두 입력하세요.");
      return;
    }
    setNicknameLog("요청 중...");
    try {
      await updateNickname(roomId, { userId, name: nick });
      setNicknameLog("✅ 닉네임이 변경되었습니다.");
      void refreshRoom();
    } catch (error) {
      setNicknameLog(
        `❌ ${error instanceof Error ? error.message : "변경 실패"}`,
      );
    }
  };

  return (
    <div className="container">
      <header className="card">
        <div className="card__header">
          <h1>Room 상세 테스트</h1>
          <Link to="/test" className="link">
            ← /test
          </Link>
        </div>
        <p className="muted">
          방 ID를 입력하면 방 정보 조회부터 삭제까지 대부분의 Rooms API를
          직접 호출할 수 있습니다.
        </p>
      </header>

      <section className="card">
        <h2>방 불러오기</h2>
        <form className="form inline" onSubmit={handleRoomIdSubmit}>
          <label className="field">
            <span>roomId</span>
            <input
              value={roomIdInput}
              onChange={(event) => setRoomIdInput(event.target.value)}
              placeholder="8자리 방 ID"
            />
          </label>
          <button className="btn primary" type="submit" disabled={!roomIdInput}>
            불러오기
          </button>
        </form>
        {roomId && (
          <p className="muted">현재 URL: /test/room?id={roomId}</p>
        )}
      </section>

      {roomId ? (
        <section className="stack">
          <div className="card">
            <div className="card__header">
              <h3>방 정보</h3>
              <button
                type="button"
                className="link-button"
                onClick={() => refreshRoom()}
                disabled={isFetching}
              >
                새로고침
              </button>
            </div>
            {isFetching ? (
              <p className="muted">불러오는 중...</p>
            ) : fetchError ? (
              <p className="error">{fetchError}</p>
            ) : detail ? (
              <dl className="info-grid">
                <div>
                  <dt>방 이름</dt>
                  <dd>{detail.room.name}</dd>
                </div>
                <div>
                  <dt>creatorId</dt>
                  <dd>{detail.room.creatorId}</dd>
                </div>
                <div>
                  <dt>날짜</dt>
                  <dd>{detail.room.dates.join(", ")}</dd>
                </div>
                <div>
                  <dt>시간대</dt>
                  <dd>
                    {detail.room.startTime} ~ {detail.room.endTime}
                  </dd>
                </div>
                <div>
                  <dt>만료일</dt>
                  <dd>{new Date(detail.room.expiresAt).toLocaleString()}</dd>
                </div>
              </dl>
            ) : (
              <p className="muted">데이터가 없습니다.</p>
            )}
          </div>

          <div className="card">
            <h3>참여자</h3>
            {participants.length === 0 ? (
              <p className="muted">참여자가 아직 없습니다.</p>
            ) : (
              <div className="participant-list">
                {participants.map((participant) => (
                  <div key={participant.id} className="participant-card">
                    <strong>{participant.name}</strong>
                    <span className="muted small">{participant.userId}</span>
                    {participant.slots.length > 0 ? (
                      <p className="muted small">
                        {participant.slots
                          .map((slot) => `${slot.date} ${slot.time}`)
                          .join(", ")}
                      </p>
                    ) : (
                      <p className="muted small">선택한 슬롯 없음</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="two-columns">
            <div className="stack">
              <div className="card">
                <h3>방 설정</h3>
                <button className="btn primary" type="button" onClick={handleExtend}>
                  만료일 30일 연장
                </button>
                {extendLog && <p className="muted small">{extendLog}</p>}

                <form className="form" onSubmit={handleUpdateRoomName}>
                  <label className="field">
                    <span>creatorId</span>
                    <input
                      value={creatorIdInput}
                      onChange={(event) => setCreatorIdInput(event.target.value)}
                    />
                  </label>
                  <label className="field">
                    <span>새 방 이름</span>
                    <input
                      value={roomNameInput}
                      onChange={(event) => setRoomNameInput(event.target.value)}
                    />
                  </label>
                  <button className="btn outline" type="submit">
                    방 이름 변경
                  </button>
                  {updateLog && <p className="muted small">{updateLog}</p>}
                </form>

                <div className="divider" />
                <button className="btn danger" type="button" onClick={handleDeleteRoom}>
                  방 삭제
                </button>
                {deleteLog && <p className="muted small">{deleteLog}</p>}
              </div>
            </div>

            <div className="stack">
              <div className="card">
                <h3>가용 시간 제출</h3>
                <form className="form" onSubmit={handleAvailability}>
                  <label className="field">
                    <span>participantId</span>
                    <input
                      value={participantId}
                      onChange={(event) => setParticipantId(event.target.value)}
                    />
                  </label>
                  <label className="field">
                    <span>표시할 이름</span>
                    <input
                      value={participantName}
                      onChange={(event) => setParticipantName(event.target.value)}
                    />
                  </label>
                  <label className="field">
                    <span>슬롯 (YYYY-MM-DD HH:mm)</span>
                    <textarea
                      value={slotsInput}
                      onChange={(event) => setSlotsInput(event.target.value)}
                      rows={4}
                    />
                  </label>
                  <button className="btn primary" type="submit">
                    가용 시간 저장
                  </button>
                  {availabilityLog && (
                    <p className="muted small">{availabilityLog}</p>
                  )}
                  {readableSlotCount > 0 && (
                    <p className="muted small">
                      현재 등록된 총 슬롯 수: {readableSlotCount}
                    </p>
                  )}
                </form>
              </div>

              <div className="card">
                <h3>닉네임 변경</h3>
                <form className="form" onSubmit={handleNickname}>
                  <label className="field">
                    <span>userId</span>
                    <input
                      value={nicknameUserId}
                      onChange={(event) =>
                        setNicknameUserId(event.target.value)
                      }
                    />
                  </label>
                  <label className="field">
                    <span>새 닉네임</span>
                    <input
                      value={nicknameName}
                      onChange={(event) => setNicknameName(event.target.value)}
                    />
                  </label>
                  <button className="btn outline" type="submit">
                    닉네임 변경
                  </button>
                  {nicknameLog && <p className="muted small">{nicknameLog}</p>}
                </form>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section className="card">
          <p className="muted">먼저 roomId를 입력하세요.</p>
        </section>
      )}
    </div>
  );
}
