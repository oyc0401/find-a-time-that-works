import { useParams } from "react-router-dom";
import { Tab, Top } from "@toss/tds-mobile";
import { adaptive } from "@toss/tds-colors";
import { useEffect, useRef } from "react";
import { useRoomData } from "@/hooks/useRoomData";
import { useAvailabilityStore } from "@/stores/useAvailabilityStore";
import { useRoomStore } from "@/stores/useRoomStore";
import { useSubmitAvailability } from "@/hooks/useSubmitAvailability";
import { getUserId } from "@/lib/userId";
import { generateTimeSlots } from "@/lib/timeSlots";
import { getDefaultName } from "@/lib/nickname";
import { handleShare } from "@/lib/share";
import AvailabilityGrid from "../components/room/AvailabilityGrid";
import OverviewGrid from "../components/room/OverviewGrid";
import ParticipantList from "../components/room/ParticipantList";

export default function Room() {
  const { id } = useParams<{ id: string }>();
  const { room, participants, isLoading } = useRoomData(id);
  const { tabIdx, setTabIdx } = useRoomStore();
  const { enable } = useSubmitAvailability(id);

  const loadedRef = useRef(false);

  useEffect(() => {
    if (!room) return;

    const timeSlots = generateTimeSlots(room.startTime, room.endTime);
    const store = useAvailabilityStore.getState();

    if (!loadedRef.current) {
      loadedRef.current = true;
      store.init(timeSlots.length, room.dates.length);

      getUserId().then(async (userId) => {
          const myParticipant = participants.find((p) => p.userId === userId);
          const nickname =
            myParticipant?.name ?? (await getDefaultName());
          useRoomStore.getState().setNickname(nickname);
          if (myParticipant && myParticipant.slots.length > 0) {
            useAvailabilityStore
              .getState()
              .loadFromSlots(myParticipant.slots, room.dates, timeSlots);
          }
          enable();
      });
    }
  }, [room, participants, enable]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <span style={{ color: adaptive.grey500 }}>로딩 중...</span>
      </div>
    );
  }

  if (!room) {
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
        right={
          <Top.RightButton onClick={() => handleShare(id ?? "")}>
            초대하기
          </Top.RightButton>
        }
      />
      <Tab size="large" onChange={setTabIdx}>
        <Tab.Item selected={tabIdx === 0}>일정선택</Tab.Item>
        <Tab.Item selected={tabIdx === 1}>전체보기</Tab.Item>
        <Tab.Item selected={tabIdx === 2}>참여자</Tab.Item>
      </Tab>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {tabIdx === 0 && <AvailabilityGrid />}
        {tabIdx === 1 && <OverviewGrid />}
        {tabIdx === 2 && <ParticipantList participants={participants} />}
      </div>
    </div>
  );
}
