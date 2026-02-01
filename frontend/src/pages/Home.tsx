import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { FixedBottomCTA, Top } from "@toss/tds-mobile";
import { adaptive } from "@toss/tds-colors";
import DateSelector from "../components/DateSelector";
import TimeSlider from "../components/TimeSlider";
import { useRoomsControllerCreate } from "../api/model/rooms/rooms";
import { useDateSelectionStore } from "../stores/useDateSelectionStore";
import { useTimeSliderStore } from "../stores/useTimeSliderStore";
import { buildCalendarCells, getSelectedDates } from "../lib/calendar";
import { getUserId } from "../lib/userId";

function Header() {
  return (
    <>
      <Top
        title={
          <Top.TitleParagraph size={28} color={adaptive.grey900}>
            모두가 가능한 시간으로 일정을 정해요
          </Top.TitleParagraph>
        }
        subtitleBottom={
          <Top.SubtitleParagraph>
            방을 만들고 사람들을 초대해요
          </Top.SubtitleParagraph>
        }
      />
    </>
  );
}

function formatHour(hour: number): string {
  return `${String(hour).padStart(2, "0")}:00`;
}

export default function Home() {
  const navigate = useNavigate();
  const confirmed = useDateSelectionStore((s) => s.confirmed);
  const startHour = useTimeSliderStore((s) => s.startHour);
  const endHour = useTimeSliderStore((s) => s.endHour);
  const cells = useMemo(() => buildCalendarCells(), []);

  const selectedDates = useMemo(
    () => getSelectedDates(confirmed, cells),
    [confirmed, cells],
  );

  const { mutate: createRoom, isPending } = useRoomsControllerCreate({
    mutation: {
      onSuccess: (response) => {
        navigate(`/rooms/${response.data.data.id}`);
      },
    },
  });

  const handleCreateRoom = async () => {
    const creatorId = await getUserId();
    createRoom({
      data: {
        name: "새 모임",
        creatorId,
        dates: selectedDates,
        startTime: formatHour(startHour),
        endTime: formatHour(endHour),
      },
    });
  };

  return (
    <div className="h-screen">
      <Header />
      <DateSelector />
      <TimeSlider />
      <FixedBottomCTA
        onTap={handleCreateRoom}
        loading={isPending}
        disabled={selectedDates.length === 0}
        color="primary"
      >
        방 생성하기
      </FixedBottomCTA>
    </div>
  );
}
