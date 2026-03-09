import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { List, ListRow, Top } from "@toss/tds-mobile";
import { adaptive } from "@toss/tds-colors";
import { useTranslation } from "react-i18next";
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

  if (!data || data.status !== 200) return null;

  const room = data.data.data.room;
  const participants = data.data.data.participants;
  const creator = participants.find((p) => p.userId === room.creatorId);
  const roomTitle = room.name ?? `${creator?.name}${t("home.roomNameSuffix")}`;

  return (
    <ListRow
      onClick={() => navigate(`/rooms/${room.id}`)}
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
      contents={<ListRow.Texts type="1RowTypeC" top={roomTitle} />}
      withTouchEffect
    />
  );
}

export default function RecentRoomsPage() {
  const { t } = useTranslation();
  const [roomIds, setRoomIds] = useState<string[]>();

  useEffect(() => {
    Repository.getRecentRoomIds().then(setRoomIds);
  }, []);

  return (
    <div className="h-screen">
      <Top
        title={
          <Top.TitleParagraph size={28} color={adaptive.grey900}>
            {t("recent.title")}
          </Top.TitleParagraph>
        }
      />

      {roomIds !== undefined && roomIds.length === 0 && (
        <div className="flex flex-col items-center justify-center pt-20 text-gray-400">
          <span>{t("recent.empty")}</span>
        </div>
      )}

      {roomIds && roomIds.length > 0 && (
        <List>
          {roomIds.map((id) => (
            <RecentRoomItem key={id} roomId={id} />
          ))}
        </List>
      )}
    </div>
  );
}
