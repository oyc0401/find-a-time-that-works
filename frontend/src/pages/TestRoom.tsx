import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getRoom, submitAvailability } from "../api/rooms";
import { getUserId } from "../lib/userId";

function generateTimeSlots(startTime: string, endTime: string): string[] {
  const slots: string[] = [];
  const [startH, startM] = startTime.split(":").map(Number);
  const [endH, endM] = endTime.split(":").map(Number);
  let h = startH;
  let m = startM;

  while (h < endH || (h === endH && m < endM)) {
    slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    m += 30;
    if (m >= 60) {
      m = 0;
      h++;
    }
  }
  return slots;
}

export default function TestRoom() {
  const [searchParams] = useSearchParams();
  const roomId = searchParams.get("id") || "";
  const queryClient = useQueryClient();
  const userId = getUserId();

  const [nickname, setNickname] = useState("");
  const [selectedSlots, setSelectedSlots] = useState<Set<string>>(new Set());
  const [initialized, setInitialized] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["room", roomId],
    queryFn: () => getRoom(roomId),
    enabled: !!roomId,
  });

  useEffect(() => {
    if (data && !initialized) {
      const me = data.data.participants.find((p) => p.userId === userId);
      if (me) {
        setNickname(me.name);
        setSelectedSlots(new Set(me.slots.map((s) => `${s.date}_${s.time}`)));
      }
      setInitialized(true);
    }
  }, [data, userId, initialized]);

  const mutation = useMutation({
    mutationFn: (slots: { date: string; time: string }[]) =>
      submitAvailability(roomId, {
        participantId: userId,
        participantName: nickname,
        slots,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["room", roomId] });
    },
  });

  if (!roomId) return <div style={{ padding: 20 }}>방 ID가 없습니다</div>;
  if (isLoading) return <div style={{ padding: 20 }}>로딩 중...</div>;
  if (error) return <div style={{ padding: 20, color: "red" }}>{(error as Error).message}</div>;
  if (!data) return null;

  const { room, participants } = data.data;
  const timeSlots = generateTimeSlots(room.startTime, room.endTime);

  const toggleSlot = (date: string, time: string) => {
    const key = `${date}_${time}`;
    const next = new Set(selectedSlots);
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    setSelectedSlots(next);
  };

  const handleSubmit = () => {
    if (!nickname.trim()) {
      alert("닉네임을 입력하세요");
      return;
    }
    const slots = Array.from(selectedSlots).map((key) => {
      const [date, time] = key.split("_");
      return { date, time };
    });
    mutation.mutate(slots);
  };

  const getSlotCount = (date: string, time: string) => {
    return participants.filter((p) => p.slots.some((s) => s.date === date && s.time === time)).length;
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>{room.name}</h1>
      <p>
        방 ID: {room.id} | 만료: {new Date(room.expiresAt).toLocaleDateString()}
      </p>

      <div style={{ marginBottom: 20 }}>
        <h3>참여자 ({participants.length}명)</h3>
        {participants.map((p) => (
          <span key={p.id} style={{ marginRight: 8, padding: "2px 6px", background: "#eee", borderRadius: 4 }}>
            {p.name}
          </span>
        ))}
      </div>

      <div style={{ marginBottom: 20 }}>
        <label>닉네임: </label>
        <input
          type="text"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="이름 입력"
          style={{ padding: 4 }}
        />
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ border: "1px solid #ccc", padding: 8 }}>시간</th>
              {room.dates.map((date) => (
                <th key={date} style={{ border: "1px solid #ccc", padding: 8 }}>
                  {date}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {timeSlots.map((time) => (
              <tr key={time}>
                <td style={{ border: "1px solid #ccc", padding: 8 }}>{time}</td>
                {room.dates.map((date) => {
                  const key = `${date}_${time}`;
                  const isSelected = selectedSlots.has(key);
                  const count = getSlotCount(date, time);
                  return (
                    <td
                      key={key}
                      onClick={() => toggleSlot(date, time)}
                      style={{
                        border: "1px solid #ccc",
                        padding: 8,
                        cursor: "pointer",
                        background: isSelected ? "#4caf50" : count > 0 ? `rgba(76, 175, 80, ${count * 0.2})` : "#fff",
                        color: isSelected ? "#fff" : "#000",
                        textAlign: "center",
                      }}
                    >
                      {count > 0 ? count : ""}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={mutation.isPending}
        style={{ marginTop: 16, padding: "8px 16px" }}
      >
        {mutation.isPending ? "저장 중..." : "가용 시간 저장"}
      </button>
      {mutation.isSuccess && <span style={{ marginLeft: 8, color: "green" }}>저장됨!</span>}
      {mutation.isError && <span style={{ marginLeft: 8, color: "red" }}>{mutation.error.message}</span>}
    </div>
  );
}
