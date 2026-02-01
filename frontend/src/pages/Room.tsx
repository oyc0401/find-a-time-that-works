import { useParams } from "react-router-dom";
import { Tab, Top } from "@toss/tds-mobile";
import { adaptive } from "@toss/tds-colors";
import { useRoomsControllerFindById } from "../api/model/rooms/rooms";
import { useEffect, useState } from "react";
import { useRoomStore } from "@/stores/useRoomStore";
import AvailabilityGrid from "../components/AvailabilityGrid";
import OverviewGrid from "../components/OverviewGrid";

export default function Room() {
  const { id } = useParams<{ id: string }>();
  const { data: response, isLoading } = useRoomsControllerFindById(id!);
  const [selected, setSelected] = useState(0);
  const { room, setRoom } = useRoomStore();

  useEffect(() => {
    if (response?.status === 200) {
      const { room, participants } = response.data.data;
      setRoom(room, participants);
    }
  }, [response, setRoom]);

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
