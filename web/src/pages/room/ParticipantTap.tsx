import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import type { ParticipantDto } from "@/api/model/models";
import { useRoomStore } from "@/stores/useRoomStore";
import { getUserId } from "@/repository/userId";
import { useTranslation } from "react-i18next";
import { thumbnailUrl } from "@/repository/thumbnail";
import { Users } from "lucide-react";

interface ParticipantListProps {
  participants: ParticipantDto[];
}

export default function ParticipantTap({
  participants,
}: ParticipantListProps) {
  const { t } = useTranslation();
  const nickname = useRoomStore((s) => s.nickname);
  const thumbnail = useRoomStore((s) => s.thumbnail);
  const setTabIdx = useRoomStore((state) => state.setTabIdx);
  const setSelectedUserIds = useRoomStore((state) => state.setSelectedUserIds);
  const setIsNicknameDialogOpen = useRoomStore(
    (state) => state.setIsNicknameDialogOpen,
  );
  const setIsThumbnailDialogOpen = useRoomStore(
    (state) => state.setIsThumbnailDialogOpen,
  );
  const [myUserId, setMyUserId] = useState<string>();

  useEffect(() => {
    getUserId().then(setMyUserId);
  }, []);

  const others = participants.filter((p) => p.userId !== myUserId);

  return (
    <div className="space-y-4 pb-32">
      <div className="px-4">
        <div className="flex items-center gap-3 rounded-2xl bg-gray-100 p-4">
          <button
            type="button"
            className="flex-shrink-0"
            onClick={() => setIsThumbnailDialogOpen(true)}
          >
            <img
              src={thumbnailUrl(thumbnail)}
              alt={nickname}
              className="h-14 w-14 rounded-full border-2 border-white object-cover shadow"
            />
          </button>
          <button
            type="button"
            className="flex-1 text-left"
            onClick={() => setIsNicknameDialogOpen(true)}
          >
            <p className="text-base font-semibold text-gray-900">{nickname}</p>
            <p className="text-sm text-gray-500">{t("participant.myInfo")}</p>
          </button>
        </div>
      </div>

      {others.length === 0 ? (
        <div className="flex flex-col items-center gap-3 px-4 py-8 text-center text-gray-500">
          <Users size={40} className="text-gray-300" />
          <p className="text-lg font-semibold">
            {t("participant.noParticipants")}
          </p>
          <p className="text-sm">{t("participant.inviteDescription")}</p>
        </div>
      ) : (
        <div className="space-y-3 px-4">
          {others.map((p) => (
            <button
              key={p.id}
              type="button"
              className="flex w-full items-center gap-3 rounded-2xl border border-gray-100 bg-white px-4 py-3 text-left shadow-sm transition-colors hover:bg-gray-50"
              onClick={() => {
                setSelectedUserIds([p.userId]);
                setTabIdx(1);
              }}
            >
              <img
                src={thumbnailUrl(p.thumbnail)}
                alt={p.name}
                className="h-12 w-12 rounded-full object-cover"
              />
              <span className="text-base font-semibold text-gray-900">
                {p.name}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
