import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  BottomSheet,
  Button,
  Checkbox,
  ListRow,
  TextField,
} from "@toss/tds-mobile";
import { adaptive } from "@toss/tds-colors";
import type { ParticipantDto } from "@/api/model/models";
import { useRoomStore } from "@/stores/useRoomStore";
import { getUserId } from "@/lib/userId";
import { setDefaultName, getRememberName, setRememberName } from "@/lib/nickname";
import { THUMBNAILS, thumbnailUrl, setDefaultThumbnail } from "@/lib/thumbnail";

interface ParticipantListProps {
  participants: ParticipantDto[];
}

export default function ParticipantList({
  participants,
}: ParticipantListProps) {
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
          <div className="flex py-1">
            <button
              type="button"
              className="cursor-pointer transition-transform duration-200 active:scale-95"
              style={{ flexShrink: 0 }}
              onClick={handleThumbnailOpen}
            >
              <div className="pl-4 py-3">
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
                contents={
                  <ListRow.Texts
                    type="2RowTypeA"
                    top={nickname}
                    bottom="내 정보"
                  />
                }
              />
            </button>
          </div>
        </div>
      </div>

      {others.map((p) => (
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
      ))}

      {/* ── Nickname Bottom Sheet ── */}
      <BottomSheet
        open={isNicknameOpen}
        onClose={() => setIsNicknameOpen(false)}
        header={<BottomSheet.Header>이름 변경</BottomSheet.Header>}
        cta={
          <BottomSheet.DoubleCTA
            leftButton={
              <Button
                variant="weak"
                color="dark"
                onClick={() => setIsNicknameOpen(false)}
              >
                닫기
              </Button>
            }
            rightButton={
              <Button
                onClick={handleNicknameSave}
                disabled={!nicknameInput.trim()}
              >
                저장
              </Button>
            }
          />
        }
      >
        <TextField
          variant="box"
          label="이름"
          labelOption="sustain"
          placeholder="이름을 입력해주세요"
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
            다음에도 기억하기
          </span>
        </button>
      </BottomSheet>

      {/* ── Thumbnail Bottom Sheet ── */}
      <BottomSheet
        open={isThumbnailOpen}
        onClose={() => setIsThumbnailOpen(false)}
        header={<BottomSheet.Header>썸네일 변경</BottomSheet.Header>}
        cta={
          <BottomSheet.DoubleCTA
            leftButton={
              <Button
                variant="weak"
                color="dark"
                onClick={() => setIsThumbnailOpen(false)}
              >
                닫기
              </Button>
            }
            rightButton={<Button onClick={handleThumbnailSave}>저장</Button>}
          />
        }
      >
        <div className="grid grid-cols-4 gap-3 px-5 py-4">
          {THUMBNAILS.map((t) => (
            <button
              key={t}
              type="button"
              className="flex cursor-pointer items-center justify-center rounded-2xl p-2 transition-colors"
              style={{
                background:
                  selectedThumbnail === t ? adaptive.grey300 : adaptive.grey100,
                border:
                  selectedThumbnail === t
                    ? `2px solid ${adaptive.grey600}`
                    : "2px solid transparent",
              }}
              onClick={() => setSelectedThumbnail(t)}
            >
              <img src={thumbnailUrl(t)} alt={t} width={48} height={48} />
            </button>
          ))}
        </div>
      </BottomSheet>
    </div>
  );
}
