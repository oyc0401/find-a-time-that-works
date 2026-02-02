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
import { setDefaultName } from "@/lib/nickname";

interface ParticipantListProps {
  participants: ParticipantDto[];
}

export default function ParticipantList({
  participants,
}: ParticipantListProps) {
  const { id } = useParams<{ id: string }>();
  const nickname = useRoomStore((s) => s.nickname);
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
    setRememberDefault(false);
    setIsNicknameOpen(true);
  }, [nickname]);

  const handleNicknameSave = useCallback(() => {
    const trimmed = nicknameInput.trim();
    if (!trimmed || !id) return;

    useRoomStore.getState().setNickname(trimmed);
    if (rememberDefault) {
      setDefaultName(trimmed);
    }
    setIsNicknameOpen(false);
  }, [nicknameInput, rememberDefault, id]);

  return (
    <div>
      <div style={{ padding: 16 }}>
        <button
          type="button"
          className="w-full cursor-pointer transition-transform duration-200 active:scale-99"
          style={{ background: adaptive.grey200, borderRadius: 8 }}
          onClick={handleNicknameOpen}
        >
          <div className="py-1">
            <ListRow
              verticalPadding="large"
              left={
                <ListRow.AssetIcon
                  shape="circle-background"
                  name="icon-crown-simple"
                  backgroundColor={adaptive.grey50}
                />
              }
              contents={
                <ListRow.Texts
                  type="2RowTypeA"
                  top={nickname}
                  bottom="내 정보"
                />
              }
            />
          </div>
        </button>
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
            left={<ListRow.AssetIcon name="bank-toss" />}
            contents={<ListRow.Texts type="1RowTypeA" top={p.name} />}
          />
        </button>
      ))}

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
            다음에도 사용하기
          </span>
        </button>
      </BottomSheet>
    </div>
  );
}
