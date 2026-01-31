import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { DayPicker } from "react-day-picker";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { createRoom } from "../api/rooms";
import { getUserId } from "../lib/userId";
import "react-day-picker/style.css";

const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2);
  const m = i % 2 === 0 ? "00" : "30";
  return `${String(h).padStart(2, "0")}:${m}`;
});

export default function TestMain() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("18:00");

  const mutation = useMutation({
    mutationFn: createRoom,
    onSuccess: (res) => {
      navigate(`/test/room?id=${res.data.id}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedDates.length === 0) {
      alert("날짜를 선택하세요");
      return;
    }
    const dates = selectedDates.map((d) => format(d, "yyyy-MM-dd")).sort();
    mutation.mutate({
      name,
      creatorId: getUserId(),
      dates,
      startTime,
      endTime,
    });
  };

  return (
    <div style={{ padding: 20, maxWidth: 500 }}>
      <h1>FindTime - 방 만들기</h1>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 12 }}>
          <label>방 이름</label>
          <br />
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="팀 회의"
            required
            style={{ width: "100%", padding: 8 }}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>날짜 선택 (클릭하여 여러 날짜 선택)</label>
          <DayPicker
            mode="multiple"
            selected={selectedDates}
            onSelect={(dates) => setSelectedDates(dates || [])}
            locale={ko}
            disabled={{ before: new Date() }}
          />
          {selectedDates.length > 0 && (
            <p style={{ fontSize: 14, color: "#666" }}>
              선택: {selectedDates.map((d) => format(d, "M/d")).join(", ")}
            </p>
          )}
        </div>

        <div style={{ marginBottom: 12, display: "flex", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <label>시작 시간</label>
            <br />
            <select
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              style={{ width: "100%", padding: 8 }}
            >
              {TIME_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label>종료 시간</label>
            <br />
            <select
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              style={{ width: "100%", padding: 8 }}
            >
              {TIME_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button type="submit" disabled={mutation.isPending} style={{ padding: "8px 16px" }}>
          {mutation.isPending ? "생성 중..." : "방 만들기"}
        </button>
        {mutation.isError && <p style={{ color: "red" }}>{mutation.error.message}</p>}
      </form>
    </div>
  );
}
