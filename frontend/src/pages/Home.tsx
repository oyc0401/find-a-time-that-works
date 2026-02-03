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
import { useTranslation } from "react-i18next";
import { getUserId } from "../repository/userId";
import { getDefaultName } from "../repository/nickname";

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

  const handleCreateRoom = async () => {
    const [creatorId, defaultName] = await Promise.all([
      getUserId(),
      getDefaultName(),
    ]);
    createRoom({
      data: {
        name: `${defaultName}${t("home.roomNameSuffix")}`,
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
        {t("home.createRoom")}
      </FixedBottomCTA>
    </div>
  );
}
