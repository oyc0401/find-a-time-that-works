import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button, FixedBottomCTA, List, ListRow, Top } from "@toss/tds-mobile";
import { adaptive } from "@toss/tds-colors";
import DateSelector from "../components/DateSelector";
import TimeSlider from "../components/TimeSlider";
import { useRoomsControllerCreate } from "../api/model/rooms/rooms";
import { useDateSelectionStore } from "../stores/useDateSelectionStore";
import { useTimeSliderStore } from "../stores/useTimeSliderStore";
import { buildCalendarCells, getSelectedDates } from "../lib/calendar";
import { useTranslation } from "react-i18next";
import { getUserId } from "../repository/userId";
import { getNickname, getGeneratedNickname } from "../repository/nickname";

function Header() {
  const { t } = useTranslation();
  return (
    <>
      <Top
        title={
          <Top.TitleParagraph size={28} color={adaptive.grey900}>
            {t("home.title")}
          </Top.TitleParagraph>
        }
        subtitleBottom={
          <Top.SubtitleParagraph>{t("home.subtitle")}</Top.SubtitleParagraph>
        }
      />
    </>
  );
}

function formatHour(hour: number): string {
  return `${String(hour).padStart(2, "0")}:00`;
}

function LastRoomCard() {
  return (
    <List>
      <ListRow
        left={<ListRow.AssetIcon name="icon-refresh-clock" />}
        contents={
          <ListRow.Texts
            type="2RowTypeA"
            top="최근에 방문한 방 이동하기"
            bottom="오유찬의 방"
          />
        }
        right={
          <Button color="primary" size="small" variant="weak">
            전체보기
          </Button>
        }
        withTouchEffect
      />
    </List>
  );
}
export default function Home() {
  const { t } = useTranslation();
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
        useDateSelectionStore.getState().clear();
        useTimeSliderStore.getState().setStartHour(8);
        useTimeSliderStore.getState().setEndHour(19);
        navigate(`/rooms/${response.data.data.id}?created=true`, {
          replace: true,
        });
      },
    },
  });

  useEffect(() => {
    getGeneratedNickname();
  }, []);

  const handleCreateRoom = async () => {
    const creatorId = await getUserId();
    const creatorName = await getNickname();
    createRoom({
      data: {
        creatorId,
        creatorName,
        dates: selectedDates,
        startTime: formatHour(startHour),
        endTime: formatHour(endHour),
      },
    });
  };

  return (
    <div className="h-screen">
      <Header />
      <LastRoomCard />
      <DateSelector />

      <TimeSlider />
      <FixedBottomCTA
        onTap={handleCreateRoom}
        loading={isPending}
        disabled={selectedDates.length === 0}
        color="primary"
      >
        {t("home.createRoom")}
      </FixedBottomCTA>
    </div>
  );
}
