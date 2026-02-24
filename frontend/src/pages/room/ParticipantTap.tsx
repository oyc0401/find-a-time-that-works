import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Asset,
  BottomCTA,
  FixedBottomCTA,
  ListRow,
  Result,
} from "@toss/tds-mobile";
import { adaptive } from "@toss/tds-colors";
import type { ParticipantDto } from "@/api/model/models";
import { useRoomStore } from "@/stores/useRoomStore";
import { getUserId } from "@/repository/userId";
import { useTranslation } from "react-i18next";
import { thumbnailUrl } from "@/repository/thumbnail";

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
  const setSelectedUserId = useRoomStore((state) => state.setSelectedUserId);
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
    <div>
      <div style={{ padding: 16 }}>
        <div
          className="w-full overflow-hidden"
          style={{ background: adaptive.grey200, borderRadius: 8 }}
        >
          <div className="flex py-2">
            <button
              type="button"
              className="cursor-pointer transition-transform duration-200 active:scale-95"
              style={{ flexShrink: 0 }}
              onClick={() => setIsThumbnailDialogOpen(true)}
            >
              <div className="pl-5 py-3">
                <ListRow.AssetIcon
                  shape="circle-background"
                  url={thumbnailUrl(thumbnail)}
                  backgroundColor={adaptive.grey50}
                />
              </div>
            </button>
            <button
              type="button"
              className="min-w-0 flex-1 cursor-pointer transition-transform duration-200 active:scale-99"
              onClick={() => setIsNicknameDialogOpen(true)}
            >
              <ListRow
                horizontalPadding="small"
                contents={
                  <ListRow.Texts
                    type="2RowTypeA"
                    top={nickname}
                    bottom={t("participant.myInfo")}
                  />
                }
              />
            </button>
          </div>
        </div>
      </div>

      {others.length === 0 ? (
        <div className="py-8">
          <Result
            figure={
              <Asset.Image
                src="https://static.toss.im/2d-emojis/png/4x/u1F465.png"
                frameShape={Asset.frameShape.CleanH60}
              />
            }
            title={t("participant.noParticipants")}
            description={t("participant.inviteDescription")}
          />
        </div>
      ) : (
        others.map((p) => (
          <button
            key={p.id}
            type="button"
            className="w-full cursor-pointer transition-transform duration-200 active:scale-99"
            onClick={() => {
              setSelectedUserId(p.userId);
              setTabIdx(1);
            }}
          >
            <ListRow
              left={
                <ListRow.AssetIcon
                  shape="circle-background"
                  url={thumbnailUrl(p.thumbnail)}
                  backgroundColor={adaptive.grey100}
                />
              }
              contents={<ListRow.Texts type="1RowTypeA" top={p.name} />}
            />
          </button>
        ))
      )}
    </div>
  );
}
