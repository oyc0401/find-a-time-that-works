import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  Asset,
  BottomSheet,
  Button,
  Post,
  Tab,
  TextField,
  Top,
} from "@toss/tds-mobile";
import { adaptive } from "@toss/tds-colors";
import {
  getRoomsControllerFindByIdQueryKey,
  useRoomsControllerUpdateRoomName,
} from "@/api/model/rooms/rooms";
import { useRoomData } from "@/hooks/useRoomData";
import { useRoomSocket } from "@/hooks/useRoomSocket";
import { useAvailabilityStore } from "@/stores/useAvailabilityStore";
import { useRoomStore } from "@/stores/useRoomStore";
import { useSubmitAvailability } from "@/hooks/useSubmitAvailability";
import { getUserId } from "@/lib/userId";
import { generateTimeSlots } from "@/lib/timeSlots";
import { getDefaultName } from "@/lib/nickname";
import { getDefaultThumbnail } from "@/lib/thumbnail";
import { handleShare } from "@/lib/share";
import AvailabilityGrid from "../components/room/AvailabilityGrid";
import OverviewGrid from "../components/room/OverviewGrid";
import ParticipantList from "../components/room/ParticipantList";

export default function Room() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { room, participants, isLoading } = useRoomData(id);
  const { tabIdx, setTabIdx } = useRoomStore();
  const { enable } = useSubmitAvailability(id);
  const queryClient = useQueryClient();

  // ── Tutorial bottom sheet ──
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);

  // WebSocket 연결
  useRoomSocket({
    roomId: id ?? "",
    enabled: Boolean(id),
  });

  const loadedRef = useRef(false);
  const [isCreator, setIsCreator] = useState(false);

  // ── Room name bottom sheet ──
  const [isRoomNameOpen, setIsRoomNameOpen] = useState(false);
  const [roomNameInput, setRoomNameInput] = useState("");
  const { mutate: updateRoomName } = useRoomsControllerUpdateRoomName();

  const handleRoomNameOpen = useCallback(() => {
    if (!room) return;
    setRoomNameInput(room.name);
    setIsRoomNameOpen(true);
  }, [room]);

  const handleRoomNameSave = useCallback(() => {
    const trimmed = roomNameInput.trim();
    if (!trimmed || !id) return;

    getUserId().then((userId) => {
      updateRoomName(
        { id, data: { creatorId: userId, name: trimmed } },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({
              queryKey: getRoomsControllerFindByIdQueryKey(id),
            });
            setIsRoomNameOpen(false);
          },
        },
      );
    });
  }, [roomNameInput, id, updateRoomName, queryClient]);

  useEffect(() => {
    if (searchParams.get("created") === "true" && id) {
      setIsTutorialOpen(true);
      navigate(`/rooms/${id}`, { replace: true });
    }
  }, [searchParams, id, navigate]);

  useEffect(() => {
    if (!room) return;

    const timeSlots = generateTimeSlots(room.startTime, room.endTime);
    const store = useAvailabilityStore.getState();

    if (!loadedRef.current) {
      loadedRef.current = true;
      store.init(timeSlots.length, room.dates.length);

      getUserId().then(async (userId) => {
        setIsCreator(room.creatorId === userId);
        const myParticipant = participants.find((p) => p.userId === userId);
        const nickname = myParticipant?.name ?? (await getDefaultName());
        const thumbnail =
          myParticipant?.thumbnail ?? (await getDefaultThumbnail());
        const store = useRoomStore.getState();
        store.setNickname(nickname);
        store.setThumbnail(thumbnail);
        if (myParticipant && myParticipant.slots.length > 0) {
          useAvailabilityStore
            .getState()
            .loadFromSlots(myParticipant.slots, room.dates, timeSlots);
        }
        enable();
      });
    }
  }, [room, participants, enable]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <span style={{ color: adaptive.grey500 }}>로딩 중...</span>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="flex h-screen items-center justify-center">
        <span style={{ color: adaptive.grey500 }}>방을 찾을 수 없습니다</span>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col">
      <Top
        title={
          isCreator ? (
            <button
              type="button"
              className="flex items-center gap-0.5 cursor-pointer transition-transform duration-200 active:scale-99 gap-2"
              onClick={handleRoomNameOpen}
            >
              <Top.TitleParagraph size={28} color={adaptive.grey900}>
                {room.name}
              </Top.TitleParagraph>
              <Asset.Icon
                frameShape={Asset.frameShape.CleanW24}
                backgroundColor="transparent"
                name="icon-pencil-line-mono"
                color={adaptive.grey400}
                scale={1}
                aria-hidden={true}
                ratio="1/1"
              />
            </button>
          ) : (
            <Top.TitleParagraph size={28} color={adaptive.grey900}>
              {room.name}
            </Top.TitleParagraph>
          )
        }
        right={
          <Top.RightButton onClick={() => handleShare(id ?? "")}>
            초대하기
          </Top.RightButton>
        }
      />
      <Tab size="large" onChange={setTabIdx}>
        <Tab.Item selected={tabIdx === 0}>일정선택</Tab.Item>
        <Tab.Item selected={tabIdx === 1}>전체보기</Tab.Item>
        <Tab.Item selected={tabIdx === 2}>참여자</Tab.Item>
      </Tab>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {tabIdx === 0 && <AvailabilityGrid />}
        {tabIdx === 1 && <OverviewGrid />}
        {tabIdx === 2 && <ParticipantList participants={participants} />}
      </div>

      <BottomSheet
        open={isTutorialOpen}
        onClose={() => setIsTutorialOpen(false)}
        header={<BottomSheet.Header>방이 만들어졌어요!</BottomSheet.Header>}
        cta={
          <BottomSheet.DoubleCTA
            leftButton={
              <Button
                variant="weak"
                color="dark"
                onClick={() => setIsTutorialOpen(false)}
              >
                닫기
              </Button>
            }
            rightButton={
              <Button
                onClick={() => {
                  // setIsTutorialOpen(false);
                  handleShare(id ?? "");
                }}
              >
                공유하기
              </Button>
            }
          />
        }
      >
        <Post.Ol>
          <Post.Li>
            아래의 <strong>공유하기</strong> 버튼으로 친구들에게 링크를
            공유하세요
          </Post.Li>
          <Post.Li>
            <strong>일정선택</strong> 탭에서 가능한 시간대를 터치해 선택하세요
          </Post.Li>
          <Post.Li>
            참여자들이 입력을 마치면 <strong>전체보기</strong> 탭에서 겹치는
            시간을 확인할 수 있어요
          </Post.Li>
        </Post.Ol>
      </BottomSheet>

      <BottomSheet
        open={isRoomNameOpen}
        onClose={() => setIsRoomNameOpen(false)}
        header={<BottomSheet.Header>방 이름 변경</BottomSheet.Header>}
        cta={
          <BottomSheet.DoubleCTA
            leftButton={
              <Button
                variant="weak"
                color="dark"
                onClick={() => setIsRoomNameOpen(false)}
              >
                닫기
              </Button>
            }
            rightButton={
              <Button
                onClick={handleRoomNameSave}
                disabled={!roomNameInput.trim()}
              >
                저장
              </Button>
            }
          />
        }
      >
        <TextField
          variant="box"
          label="방 이름"
          labelOption="sustain"
          placeholder="방 이름을 입력해주세요"
          value={roomNameInput}
          onChange={(e) => setRoomNameInput(e.target.value)}
        />
      </BottomSheet>
    </div>
  );
}
