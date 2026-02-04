import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BottomCTA,
  FixedBottomCTA,
  List,
  ListRow,
  Top,
} from "@toss/tds-mobile";
import { adaptive } from "@toss/tds-colors";
import DateSelector from "../components/DateSelector";
import TimeSlider from "../components/TimeSlider";
import {
  useRoomsControllerCreate,
  useRoomsControllerFindById,
} from "../api/model/rooms/rooms";
import { useDateSelectionStore } from "../stores/useDateSelectionStore";
import { useTimeSliderStore } from "../stores/useTimeSliderStore";
import { buildCalendarCells, getSelectedDates } from "../lib/calendar";
import { useTranslation } from "react-i18next";
import { getUserId } from "../repository/userId";
import { getNickname, getGeneratedNickname } from "../repository/nickname";
import { Repository } from "../repository/repository";
import { thumbnailUrl } from "../repository/thumbnail";

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
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [recentRoomId, setRecentRoomId] = useState<string>();

  useEffect(() => {
    Repository.getRecentRoomId().then(setRecentRoomId);
  }, []);

  const { data, isLoading } = useRoomsControllerFindById(recentRoomId ?? "", {
    query: {
      enabled: Boolean(recentRoomId),
      retry: false,
    },
  });

  const room = data?.status === 200 ? data.data.data.room : undefined;
  const participants = data?.status === 200 ? data.data.data.participants : [];

  useEffect(() => {
    if (data && data.status !== 200) {
      Repository.removeRecentRoomId();
      setRecentRoomId(undefined);
    }
  }, [data]);

  if (!recentRoomId) return null;

  if (isLoading) {
    return (
      <div className="h-[66px] overflow-hidden">
        <div className="origin-top-left scale-[0.85]">
          <List>
            <ListRow.Loader type="circle" verticalPadding="extraSmall" />
          </List>
        </div>
      </div>
    );
  }

  if (!room) return null;

  const creator = participants.find((p) => p.userId === room.creatorId);
  const roomTitle = room.name || `${creator?.name}${t("home.roomNameSuffix")}`;

  return (
    <List>
      <ListRow
        onClick={() => navigate(`/rooms/${room.id}`, { replace: true })}
        left={
          creator?.thumbnail ? (
            <ListRow.AssetIcon
              shape="circle-background"
              url={thumbnailUrl(creator.thumbnail)}
              backgroundColor={adaptive.grey100}
            />
          ) : (
            <ListRow.AssetIcon name="icon-refresh-clock" />
          )
        }
        contents={
          <ListRow.Texts
            type="2RowTypeA"
            top={t("home.recentRoom")}
            bottom={roomTitle}
          />
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
      {selectedDates.length === 0 && (
        <BottomCTA.Single
          onTap={handleCreateRoom}
          loading={isPending}
          disabled={true}
          color="primary"
          fixed={true}
        >
          {t("home.createRoom")}
        </BottomCTA.Single>
      )}
      {selectedDates.length !== 0 && (
        <BottomCTA.Single
          onTap={handleCreateRoom}
          loading={isPending}
          color="primary"
          fixed={true}
        >
          {t("home.createRoom")}
        </BottomCTA.Single>
      )}
    </div>
  );
}
