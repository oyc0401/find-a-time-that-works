import { useParams } from "react-router-dom";
import { Tab, Top } from "@toss/tds-mobile";
import { adaptive } from "@toss/tds-colors";
import { useRoomsControllerFindById } from "../api/model/rooms/rooms";
import { useEffect, useRef, useState } from "react";
import { useRoomStore } from "@/stores/useRoomStore";
import { useAvailabilityStore } from "@/stores/useAvailabilityStore";
import { useSubmitAvailability } from "@/hooks/useSubmitAvailability";
import { getUserId } from "@/lib/userId";
import { generateTimeSlots } from "@/lib/timeSlots";
import AvailabilityGrid from "../components/room/AvailabilityGrid";
import OverviewGrid from "../components/room/OverviewGrid";

export default function Room() {
  const { id } = useParams<{ id: string }>();
  const { data: response, isLoading } = useRoomsControllerFindById(id!);
  const [selected, setSelected] = useState(0);
  const { room, setRoom } = useRoomStore();
  const { enable } = useSubmitAvailability();

  const loadedRef = useRef(false);

  useEffect(() => {
    if (response?.status === 200) {
      const { room: roomData, participants } = response.data.data;
      setRoom(roomData, participants);

      const timeSlots = generateTimeSlots(roomData.startTime, roomData.endTime);
      const store = useAvailabilityStore.getState();

      if (!loadedRef.current) {
        loadedRef.current = true;
        // init으로 grid 초기화
        store.init(timeSlots.length, roomData.dates.length);

        getUserId().then((userId) => {
          const myParticipant = participants.find((p) => p.userId === userId);
          if (myParticipant && myParticipant.slots.length > 0) {
            useAvailabilityStore
              .getState()
              .loadFromSlots(myParticipant.slots, roomData.dates, timeSlots);
          }
          enable();
        });
      }
    }
  }, [response, setRoom, enable]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <span style={{ color: adaptive.grey500 }}>로딩 중...</span>
      </div>
    );
  }

  if (!response || response.status !== 200 || !room) {
    return (
      <div className="flex h-screen items-center justify-center">
        <span style={{ color: adaptive.grey500 }}>방을 찾을 수 없습니다</span>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col">
      <Top
        title={
          <Top.TitleParagraph size={28} color={adaptive.grey900}>
            {room.name}
          </Top.TitleParagraph>
        }
      />
      <Tab size="large" onChange={(index) => setSelected(index)}>
        <Tab.Item selected={selected === 0}>일정선택</Tab.Item>
        <Tab.Item selected={selected === 1}>전체보기</Tab.Item>
        <Tab.Item selected={selected === 2}>참여자</Tab.Item>
      </Tab>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {selected === 0 && <AvailabilityGrid />}
        {selected === 1 && <OverviewGrid />}
      </div>
    </div>
  );
}
