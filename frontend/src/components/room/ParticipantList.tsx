import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Asset,
  BottomSheet,
  Button,
  Checkbox,
  ListRow,
  Result,
  TextField,
} from "@toss/tds-mobile";
import { adaptive } from "@toss/tds-colors";
import type { ParticipantDto } from "@/api/model/models";
import { useRoomStore } from "@/stores/useRoomStore";
import { getUserId } from "@/lib/userId";
import {
  setDefaultName,
  getRememberName,
  setRememberName,
} from "@/lib/nickname";
import { useTranslation } from "react-i18next";
import { THUMBNAILS, thumbnailUrl, setDefaultThumbnail } from "@/lib/thumbnail";

interface ParticipantListProps {
  participants: ParticipantDto[];
}

export default function ParticipantList({
  participants,
}: ParticipantListProps) {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const nickname = useRoomStore((s) => s.nickname);
  const thumbnail = useRoomStore((s) => s.thumbnail);
  const { setTabIdx, setSelectedUserId } = useRoomStore();
  const [myUserId, setMyUserId] = useState<string>();

  useEffect(() => {
    getUserId().then(setMyUserId);
  }, []);

  const others = participants.filter((p) => p.userId !== myUserId);

  // ── Nickname bottom sheet ──
  const [isNicknameOpen, setIsNicknameOpen] = useState(false);
  const [nicknameInput, setNicknameInput] = useState("");
  const [rememberDefault, setRememberDefault] = useState(false);

  const handleNicknameOpen = useCallback(() => {
    setNicknameInput(nickname);
    getRememberName().then(setRememberDefault);
    setIsNicknameOpen(true);
  }, [nickname]);

  const handleNicknameSave = useCallback(() => {
    const trimmed = nicknameInput.trim();
    if (!trimmed || !id) return;

    useRoomStore.getState().setNickname(trimmed);
    setRememberName(rememberDefault);
    if (rememberDefault) {
      setDefaultName(trimmed);
    }
    setIsNicknameOpen(false);
  }, [nicknameInput, rememberDefault, id]);

  // ── Thumbnail bottom sheet ──
  const [isThumbnailOpen, setIsThumbnailOpen] = useState(false);
  const [selectedThumbnail, setSelectedThumbnail] = useState("");

  const handleThumbnailOpen = useCallback(() => {
    setSelectedThumbnail(thumbnail);
    setIsThumbnailOpen(true);
  }, [thumbnail]);

  const handleThumbnailSave = useCallback(() => {
    if (!selectedThumbnail) return;

    useRoomStore.getState().setThumbnail(selectedThumbnail);
    setDefaultThumbnail(selectedThumbnail);
    setIsThumbnailOpen(false);
  }, [selectedThumbnail]);

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
              onClick={handleThumbnailOpen}
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
              onClick={handleNicknameOpen}
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

      {/* ── Nickname Bottom Sheet ── */}
      <BottomSheet
        open={isNicknameOpen}
        onClose={() => setIsNicknameOpen(false)}
        header={<BottomSheet.Header>{t("participant.changeName")}</BottomSheet.Header>}
        cta={
          <BottomSheet.DoubleCTA
            leftButton={
              <Button
                variant="weak"
                color="dark"
                onClick={() => setIsNicknameOpen(false)}
              >
                {t("common.close")}
              </Button>
            }
            rightButton={
              <Button
                onClick={handleNicknameSave}
                disabled={!nicknameInput.trim()}
              >
                {t("common.save")}
              </Button>
            }
          />
        }
      >
        <TextField
          variant="box"
          label={t("participant.nameLabel")}
          labelOption="sustain"
          placeholder={t("participant.namePlaceholder")}
          value={nicknameInput}
          onChange={(e) => setNicknameInput(e.target.value)}
        />
        <button
          type="button"
          className="flex w-full items-center justify-end gap-2 pr-5 cursor-pointer"
          onClick={() => setRememberDefault((prev) => !prev)}
        >
          <Checkbox.Circle
            checked={rememberDefault}
            onCheckedChange={setRememberDefault}
          />
          <span style={{ fontSize: 14, color: adaptive.grey600 }}>
            {t("participant.rememberMe")}
          </span>
        </button>
      </BottomSheet>

      {/* ── Thumbnail Bottom Sheet ── */}
      <BottomSheet
        open={isThumbnailOpen}
        onClose={() => setIsThumbnailOpen(false)}
        header={<BottomSheet.Header>{t("participant.changeProfile")}</BottomSheet.Header>}
        cta={
          <BottomSheet.DoubleCTA
            leftButton={
              <Button
                variant="weak"
                color="dark"
                onClick={() => setIsThumbnailOpen(false)}
              >
                {t("common.close")}
              </Button>
            }
            rightButton={<Button onClick={handleThumbnailSave}>{t("common.save")}</Button>}
          />
        }
      >
        <div
          className="grid px-4 py-2"
          style={{
            gridTemplateColumns: "repeat(auto-fit, 84px)", // 아이템 폭 고정
            justifyContent: "space-evenly",
            justifyItems: "center",
          }}
        >
          {THUMBNAILS.map((t) => (
            <button
              key={t}
              type="button"
              className="flex cursor-pointer items-center justify-center w-[84px] h-[84px] "
              onClick={() => setSelectedThumbnail(t)}
            >
              <div
                style={{
                  padding: 8,
                  background:
                    selectedThumbnail === t
                      ? adaptive.grey300
                      : adaptive.grey100,

                  borderRadius: 9999,
                }}
              >
                <Asset.Image
                  src={thumbnailUrl(t)}
                  frameShape={Asset.frameShape.Circle2XLarge}
                  scale={0.9}
                />
              </div>
            </button>
          ))}
        </div>
      </BottomSheet>
    </div>
  );
}
