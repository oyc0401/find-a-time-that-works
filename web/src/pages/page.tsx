import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import DateSelector from "./DateSelector";
import TimeSlider from "./TimeSlider";
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
import { thumbnailUrl, getDefaultThumbnail } from "../repository/thumbnail";
import { BottomActionBar } from "@/components/ui/BottomActionBar";
import { Button } from "@/components/ui/Button";
import { Clock4, ChevronRight } from "lucide-react";

function Header() {
  const { t } = useTranslation();
  return (
    <header className="px-5 pb-4 pt-8">
      <p className="text-3xl font-bold text-gray-900">{t("home.title")}</p>
      <p className="mt-2 text-base text-gray-500">{t("home.subtitle")}</p>
    </header>
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
      meta: {
        silent: true, // 백그라운드 조회이므로 에러 알림 표시 안 함
      },
    },
  });

  const room = data?.status === 200 ? data.data.data.room : undefined;
  const participants = data?.status === 200 ? data.data.data.participants : [];

  useEffect(() => {
    if (data && data.status == 404) {
      Repository.removeRecentRoomId();
      setRecentRoomId(undefined);
    }
  }, [data]);

  if (!recentRoomId) return null;

  if (isLoading) {
    return (
      <div className="px-5 pt-2">
        <div className="h-20 animate-pulse rounded-2xl bg-gray-100" />
      </div>
    );
  }

  if (!room) return null;

  const creator = participants.find((p) => p.userId === room.creatorId);
  const roomTitle = room.name || `${creator?.name}${t("home.roomNameSuffix")}`;

  const avatar = creator?.thumbnail ? (
    <img
      src={thumbnailUrl(creator.thumbnail)}
      alt={creator?.name ?? ""}
      className="h-12 w-12 rounded-full object-cover"
    />
  ) : (
    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-500">
      <Clock4 size={20} />
    </div>
  );

  return (
    <section className="px-5 pt-2">
      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>{t("home.recentRoom")}</span>
        <button
          type="button"
          className="font-semibold text-blue-500 hover:text-blue-600"
          onClick={() => navigate("/recent")}
        >
          {t("home.viewAll")}
        </button>
      </div>
      <div className="mt-3 rounded-2xl border border-gray-100 bg-white shadow-sm">
        <button
          type="button"
          className="flex w-full items-center gap-4 px-4 py-3 text-left transition-colors hover:bg-gray-50"
          onClick={() => navigate(`/rooms/${room.id}`)}
        >
          {avatar}
          <div className="flex-1">
            <p className="text-base font-semibold text-gray-900">
              {roomTitle}
            </p>
          </div>
          <ChevronRight className="text-gray-400" />
        </button>
      </div>
    </section>
  );
}
export default function Home() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const confirmed = useDateSelectionStore((s) => s.confirmed);
  const startHour = useTimeSliderStore((s) => s.startHour);
  const endHour = useTimeSliderStore((s) => s.endHour);
  const cells = useMemo(() => buildCalendarCells(new Date()), []);

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
        navigate(`/rooms/${response.data.data.id}?created=true`);
      },
    },
  });

  useEffect(() => {
    getGeneratedNickname();
  }, []);

  const handleCreateRoom = async () => {
    const creatorId = await getUserId();
    const creatorName = await getNickname();
    const creatorThumbnail = await getDefaultThumbnail();
    createRoom({
      data: {
        creatorId,
        creatorName,
        creatorThumbnail,
        dates: selectedDates,
        startTime: formatHour(startHour),
        endTime: formatHour(endHour),
      },
    });
  };

  const disableCreate = selectedDates.length === 0 || isPending;

  return (
    <div className="relative min-h-screen pb-36">
      <Header />
      <LastRoomCard />
      <DateSelector />
      <TimeSlider />

      <BottomActionBar>
        <Button
          onClick={handleCreateRoom}
          disabled={disableCreate}
          fullWidth
        >
          {t("home.createRoom")}
        </Button>
      </BottomActionBar>
    </div>
  );
}
