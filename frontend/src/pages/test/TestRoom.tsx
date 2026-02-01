import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Link,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import type { AvailabilitySlotDto } from "@/api/model/models";
import {
  useRoomsControllerDeleteRoom,
  useRoomsControllerExtendRoom,
  useRoomsControllerFindById,
  useRoomsControllerSubmitAvailability,
  useRoomsControllerUpdateNickname,
  useRoomsControllerUpdateRoomName,
} from "@/api/model/rooms/rooms";
import { getUserId } from "@/lib/userId";

function parseSlots(input: string): AvailabilitySlotDto[] {
  return input
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [date, time] = line.split(/\s+/);
      if (!date || !time) return undefined;
      return { date, time };
    })
    .filter((slot): slot is AvailabilitySlotDto => Boolean(slot));
}

export default function TestRoom() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const roomId = searchParams.get("id") ?? "";
  const [roomIdField, setRoomIdField] = useState(roomId);
  useEffect(() => {
    setRoomIdField(roomId);
  }, [roomId]);

  const query = useRoomsControllerFindById(roomId, {
    query: {
      enabled: Boolean(roomId),
    },
  });

  const roomData = query.data?.status === 200 ? query.data.data.data : undefined;
  const room = roomData?.room;
  const participants = useMemo(
    () => roomData?.participants ?? [],
    [roomData?.participants],
  );
  const roomDatesKey = room?.dates.join(",") ?? "";

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
    if (!room) return;
    setRoomNameInput(room.name);
    setCreatorIdInput(room.creatorId);
    setSlotsInput((prev) =>
      prev || (room.dates[0] ? `${room.dates[0]} ${room.startTime}` : ""),
    );
  }, [room, roomDatesKey]);

  useEffect(() => {
    getUserId().then((id) => {
      setParticipantId((prev) => prev || id);
      setNicknameUserId((prev) => prev || id);
    });
  }, []);

  const { mutate: extendRoom, isPending: extending } =
    useRoomsControllerExtendRoom();
  const { mutate: updateRoomName, isPending: updatingRoom } =
    useRoomsControllerUpdateRoomName();
  const { mutate: deleteRoom, isPending: deletingRoom } =
    useRoomsControllerDeleteRoom();
  const { mutate: submitAvailability, isPending: submittingAvailability } =
    useRoomsControllerSubmitAvailability();
  const { mutate: updateNickname, isPending: updatingNickname } =
    useRoomsControllerUpdateNickname();

  const handleRoomIdSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextId = roomIdField.trim();
    if (!nextId) return;
    setSearchParams({ id: nextId });
  };

  const handleExtend = () => {
    if (!roomId) return;
    extendRoom(
      { id: roomId },
      {
        onSuccess: (response) => {
          if (response.status === 201) {
            setExtendLog(
              `✅ 만료일 연장: ${response.data.data.expiresAt}`,
            );
            query.refetch();
          }
        },
        onError: (error) => {
          const message = error instanceof Error ? error.message : "실패";
          setExtendLog(`❌ ${message}`);
        },
      },
    );
  };

  const handleUpdateRoomName = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!roomId) return;
    const creator = creatorIdInput.trim();
    const newName = roomNameInput.trim();
    if (!creator || !newName) {
      setUpdateLog("creatorId와 새 이름을 모두 입력하세요.");
      return;
    }

    updateRoomName(
      {
        id: roomId,
        data: { creatorId: creator, name: newName },
      },
      {
        onSuccess: () => {
          setUpdateLog("✅ 방 이름 업데이트 완료");
          query.refetch();
        },
        onError: (error) => {
          const message = error instanceof Error ? error.message : "실패";
          setUpdateLog(`❌ ${message}`);
        },
      },
    );
  };

  const handleDeleteRoom = () => {
    if (!roomId) return;
    const creator = creatorIdInput.trim();
    if (!creator) {
      setDeleteLog("creatorId를 입력하세요.");
      return;
    }
    if (!window.confirm("정말로 이 방을 삭제할까요?")) {
      return;
    }

    deleteRoom(
      {
        id: roomId,
        data: { creatorId: creator },
      },
      {
        onSuccess: () => {
          setDeleteLog("✅ 삭제되었습니다. /test 페이지로 돌아갑니다.");
          navigate("/test");
        },
        onError: (error) => {
          const message = error instanceof Error ? error.message : "실패";
          setDeleteLog(`❌ ${message}`);
        },
      },
    );
  };

  const handleAvailability = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!roomId) return;
    const pid = participantId.trim();
    if (!pid) {
      setAvailabilityLog("participantId를 입력하세요.");
      return;
    }
    const slots = parseSlots(slotsInput);

    submitAvailability(
      {
        id: roomId,
        data: {
          participantId: pid,
          participantName: participantName.trim() || "익명",
          slots,
        },
      },
      {
        onSuccess: () => {
          setAvailabilityLog(
            `✅ ${slots.length}개의 슬롯으로 저장되었습니다.`,
          );
          query.refetch();
        },
        onError: (error) => {
          const message = error instanceof Error ? error.message : "실패";
          setAvailabilityLog(`❌ ${message}`);
        },
      },
    );
  };

  const handleNickname = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!roomId) return;
    const userId = nicknameUserId.trim();
    const nick = nicknameName.trim();
    if (!userId || !nick) {
      setNicknameLog("userId와 닉네임을 모두 입력하세요.");
      return;
    }

    updateNickname(
      { id: roomId, data: { userId, name: nick } },
      {
        onSuccess: () => {
          setNicknameLog("✅ 닉네임 업데이트 완료");
          query.refetch();
        },
        onError: (error) => {
          const message = error instanceof Error ? error.message : "실패";
          setNicknameLog(`❌ ${message}`);
        },
      },
    );
  };

  const readableSlots = useMemo(
    () =>
      participants.flatMap((participant) =>
        participant.slots.map((slot) => `${slot.date} ${slot.time}`),
      ),
    [participants],
  );

  return (
    <div className="mx-auto flex min-h-screen max-w-5xl flex-col gap-8 bg-slate-50 p-6">
      <header className="space-y-4 rounded-xl bg-white p-6 shadow">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-slate-900">
            Room 상세 테스트
          </h1>
          <Link
            to="/test"
            className="text-sm font-medium text-blue-600 hover:underline"
          >
            ← /test
          </Link>
        </div>
        <p className="text-sm text-slate-600">
          방 ID를 입력한 뒤 각종 Rooms API 엔드포인트를 바로 호출해 볼 수 있는
          화면입니다.
        </p>
      </header>

      <section className="rounded-xl bg-white p-6 shadow">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">
          방 불러오기
        </h2>
        <form className="flex flex-col gap-4 sm:flex-row" onSubmit={handleRoomIdSubmit}>
          <input
            value={roomIdField}
            onChange={(event) => setRoomIdField(event.target.value)}
            className="flex-1 rounded border border-slate-200 px-3 py-2 text-sm"
            placeholder="room id (8자리)"
          />
          <button
            type="submit"
            className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            disabled={!roomIdField.trim()}
          >
            방 불러오기
          </button>
        </form>
        {roomId && (
          <p className="mt-2 text-xs text-slate-500">
            현재 URL: /test/room?id={roomId}
          </p>
        )}
      </section>

      {roomId ? (
        <section className="space-y-6">
          <div className="rounded-xl bg-white p-6 shadow">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">
                방 정보
              </h3>
              <button
                type="button"
                onClick={() => query.refetch()}
                className="text-sm font-semibold text-blue-600 hover:underline"
              >
                새로고침
              </button>
            </div>
            {query.isLoading ? (
              <p className="mt-4 text-sm text-slate-500">불러오는 중...</p>
            ) : query.error ? (
              <p className="mt-4 text-sm text-red-500">
                {query.error instanceof Error
                  ? query.error.message
                  : "불러오지 못했습니다."}
              </p>
            ) : room ? (
              <dl className="mt-4 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                <div>
                  <dt className="font-medium text-slate-500">방 이름</dt>
                  <dd className="text-slate-900">{room.name}</dd>
                </div>
                <div>
                  <dt className="font-medium text-slate-500">creatorId</dt>
                  <dd className="text-slate-900">{room.creatorId}</dd>
                </div>
                <div>
                  <dt className="font-medium text-slate-500">기간</dt>
                  <dd className="text-slate-900">
                    {room.dates.join(", ")}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-slate-500">시간대</dt>
                  <dd className="text-slate-900">
                    {room.startTime} ~ {room.endTime}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-slate-500">만료일</dt>
                  <dd className="text-slate-900">
                    {new Date(room.expiresAt).toLocaleString()}
                  </dd>
                </div>
              </dl>
            ) : (
              <p className="mt-4 text-sm text-slate-500">
                데이터를 찾을 수 없습니다.
              </p>
            )}
          </div>

          <div className="rounded-xl bg-white p-6 shadow">
            <h3 className="text-lg font-semibold text-slate-900">참여자</h3>
            {participants.length === 0 ? (
              <p className="mt-4 text-sm text-slate-500">참여자가 없습니다.</p>
            ) : (
              <div className="mt-4 space-y-4">
                {participants.map((participant) => (
                  <div
                    key={participant.id}
                    className="rounded border border-slate-200 p-4"
                  >
                    <p className="text-sm font-semibold text-slate-900">
                      {participant.name} ({participant.userId})
                    </p>
                    {participant.slots.length > 0 ? (
                      <p className="mt-2 text-xs text-slate-600">
                        {participant.slots
                          .map((slot) => `${slot.date} ${slot.time}`)
                          .join(", ")}
                      </p>
                    ) : (
                      <p className="mt-2 text-xs text-slate-500">
                        선택한 슬롯 없음
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-6">
              <section className="rounded-xl bg-white p-6 shadow">
                <h3 className="mb-4 text-lg font-semibold text-slate-900">
                  방 설정
                </h3>
                <button
                  type="button"
                  onClick={handleExtend}
                  disabled={extending}
                  className="w-full rounded bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {extending ? "연장 중..." : "만료일 30일 연장"}
                </button>
                {extendLog && (
                  <p className="mt-2 text-xs text-slate-600">{extendLog}</p>
                )}

                <form className="mt-6 space-y-3" onSubmit={handleUpdateRoomName}>
                  <label className="block">
                    <span className="text-sm font-medium text-slate-700">
                      creatorId
                    </span>
                    <input
                      value={creatorIdInput}
                      onChange={(event) =>
                        setCreatorIdInput(event.target.value)
                      }
                      className="mt-1 w-full rounded border border-slate-200 px-3 py-2 text-sm"
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium text-slate-700">
                      새 방 이름
                    </span>
                    <input
                      value={roomNameInput}
                      onChange={(event) => setRoomNameInput(event.target.value)}
                      className="mt-1 w-full rounded border border-slate-200 px-3 py-2 text-sm"
                    />
                  </label>
                  <button
                    type="submit"
                    disabled={updatingRoom}
                    className="w-full rounded border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                  >
                    {updatingRoom ? "변경 중..." : "방 이름 변경"}
                  </button>
                  {updateLog && (
                    <p className="text-xs text-slate-600">{updateLog}</p>
                  )}
                </form>

                <div className="mt-6 border-t border-slate-100 pt-4">
                  <button
                    type="button"
                    onClick={handleDeleteRoom}
                    disabled={deletingRoom}
                    className="w-full rounded border border-red-500 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
                  >
                    {deletingRoom ? "삭제 중..." : "방 삭제"}
                  </button>
                  {deleteLog && (
                    <p className="mt-2 text-xs text-slate-600">{deleteLog}</p>
                  )}
                </div>
              </section>
            </div>

            <div className="space-y-6">
              <section className="rounded-xl bg-white p-6 shadow">
                <h3 className="mb-4 text-lg font-semibold text-slate-900">
                  가용 시간 제출
                </h3>
                <form className="space-y-3" onSubmit={handleAvailability}>
                  <label className="block">
                    <span className="text-sm font-medium text-slate-700">
                      participantId
                    </span>
                    <input
                      value={participantId}
                      onChange={(event) => setParticipantId(event.target.value)}
                      className="mt-1 w-full rounded border border-slate-200 px-3 py-2 text-sm"
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium text-slate-700">
                      표시할 이름
                    </span>
                    <input
                      value={participantName}
                      onChange={(event) =>
                        setParticipantName(event.target.value)
                      }
                      className="mt-1 w-full rounded border border-slate-200 px-3 py-2 text-sm"
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium text-slate-700">
                      슬롯 입력 (YYYY-MM-DD HH:mm, 줄바꿈 단위)
                    </span>
                    <textarea
                      value={slotsInput}
                      onChange={(event) => setSlotsInput(event.target.value)}
                      rows={4}
                      className="mt-1 w-full rounded border border-slate-200 px-3 py-2 text-sm"
                    />
                  </label>
                  <button
                    type="submit"
                    disabled={submittingAvailability}
                    className="w-full rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    {submittingAvailability
                      ? "업데이트 중..."
                      : "가용 시간 제출"}
                  </button>
                  {availabilityLog && (
                    <p className="text-xs text-slate-600">{availabilityLog}</p>
                  )}
                  {!!readableSlots.length && (
                    <p className="text-xs text-slate-500">
                      현재 등록된 슬롯 수: {readableSlots.length}
                    </p>
                  )}
                </form>
              </section>

              <section className="rounded-xl bg-white p-6 shadow">
                <h3 className="mb-4 text-lg font-semibold text-slate-900">
                  닉네임 변경
                </h3>
                <form className="space-y-3" onSubmit={handleNickname}>
                  <label className="block">
                    <span className="text-sm font-medium text-slate-700">
                      userId
                    </span>
                    <input
                      value={nicknameUserId}
                      onChange={(event) =>
                        setNicknameUserId(event.target.value)
                      }
                      className="mt-1 w-full rounded border border-slate-200 px-3 py-2 text-sm"
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium text-slate-700">
                      새로운 닉네임
                    </span>
                    <input
                      value={nicknameName}
                      onChange={(event) => setNicknameName(event.target.value)}
                      className="mt-1 w-full rounded border border-slate-200 px-3 py-2 text-sm"
                    />
                  </label>
                  <button
                    type="submit"
                    disabled={updatingNickname}
                    className="w-full rounded border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                  >
                    {updatingNickname ? "변경 중..." : "닉네임 변경"}
                  </button>
                  {nicknameLog && (
                    <p className="text-xs text-slate-600">{nicknameLog}</p>
                  )}
                </form>
              </section>
            </div>
          </div>
        </section>
      ) : (
        <section className="rounded-xl bg-white p-6 text-sm text-slate-600 shadow">
          /test/room?id= 파라미터에 유효한 roomId를 입력해주세요.
        </section>
      )}
    </div>
  );
}
