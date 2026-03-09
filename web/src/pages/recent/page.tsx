import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Clock4, ChevronRight } from "lucide-react";
import { useRoomsControllerFindById } from "../../api/model/rooms/rooms";
import { Repository } from "../../repository/repository";
import { thumbnailUrl } from "../../repository/thumbnail";

function RecentRoomItem({ roomId }: { roomId: string }) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { data, isLoading } = useRoomsControllerFindById(roomId, {
    query: {
      retry: false,
      meta: { silent: true },
    },
  });

  if (isLoading) {
    return <div className="h-20 animate-pulse rounded-2xl bg-gray-100" />;
  }

  if (!data || data.status !== 200) return null;

  const room = data.data.data.room;
  const participants = data.data.data.participants;
  const creator = participants.find((p) => p.userId === room.creatorId);
  const roomTitle = room.name ?? `${creator?.name}${t("home.roomNameSuffix")}`;

  return (
    <button
      type="button"
      className="flex w-full items-center gap-4 rounded-2xl border border-gray-100 bg-white px-4 py-3 text-left shadow-sm transition-colors hover:bg-gray-50"
      onClick={() => navigate(`/rooms/${room.id}`)}
    >
      {creator?.thumbnail ? (
        <img
          src={thumbnailUrl(creator.thumbnail)}
          alt={creator?.name ?? ""}
          className="h-12 w-12 rounded-full object-cover"
        />
      ) : (
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-500">
          <Clock4 size={20} />
        </div>
      )}
      <div className="flex-1">
        <p className="text-base font-semibold text-gray-900">{roomTitle}</p>
      </div>
      <ChevronRight className="text-gray-400" />
    </button>
  );
}

export default function RecentRoomsPage() {
  const { t } = useTranslation();
  const [roomIds, setRoomIds] = useState<string[]>();

  useEffect(() => {
    Repository.getRecentRoomIds().then(setRoomIds);
  }, []);

  return (
    <div className="min-h-screen bg-white pb-16">
      <header className="px-5 pb-4 pt-8">
        <p className="text-3xl font-bold text-gray-900">{t("recent.title")}</p>
      </header>

      {roomIds !== undefined && roomIds.length === 0 && (
        <div className="flex flex-col items-center justify-center px-5 pt-20 text-gray-400">
          <span>{t("recent.empty")}</span>
        </div>
      )}

      {roomIds && roomIds.length > 0 && (
        <div className="space-y-3 px-5">
          {roomIds.map((id) => (
            <RecentRoomItem key={id} roomId={id} />
          ))}
        </div>
      )}
    </div>
  );
}
