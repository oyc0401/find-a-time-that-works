import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { graniteEvent } from "@apps-in-toss/web-framework";
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
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { useRoomSocket } from "@/hooks/useRoomSocket";
import { useAvailabilityStore } from "@/stores/useAvailabilityStore";
import { useRoomStore } from "@/stores/useRoomStore";
import { useSubmitAvailability } from "@/hooks/useSubmitAvailability";
import { getUserId } from "@/lib/userId";
import { generateTimeSlots } from "@/lib/timeSlots";
import { getDefaultName } from "@/lib/nickname";
import { getDefaultThumbnail } from "@/lib/thumbnail";
import { handleShare } from "@/lib/share";
import { useTranslation, Trans } from "react-i18next";
import { WifiOff } from "lucide-react";
import { truncateTitle } from "@/lib/truncateTitle";
import AvailabilityGrid from "../components/room/AvailabilityGrid";
import OverviewGrid from "../components/room/OverviewGrid";
import ParticipantList from "../components/room/ParticipantList";

export default function Room() {
  const { t } = useTranslation();
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
  const { connected } = useRoomSocket({
    roomId: id ?? "",
    enabled: Boolean(id),
  });
  const networkOnline = useNetworkStatus();
  const isDisconnected = !connected || !networkOnline;

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
    const unsubscription = graniteEvent.addEventListener("backEvent", {
      onEvent: () => {
        navigate("/", { replace: true });
      },
      onError: (error) => {
        console.error(`backEvent 에러: ${error}`);
      },
    });

    window.addEventListener("pagehide", unsubscription);
    return () => {
      unsubscription();
      window.removeEventListener("pagehide", unsubscription);
    };
  }, [navigate]);

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
    return <div className="h-screen" />;
  }

  if (!room) {
    return (
      <div className="flex h-screen items-center justify-center">
        <span style={{ color: adaptive.grey500 }}>{t("room.notFound")}</span>
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
              className="flex items-center gap-2 text-left cursor-pointer transition-transform duration-200 active:scale-99"
              onClick={handleRoomNameOpen}
            >
              <Top.TitleParagraph size={28} color={adaptive.grey900}>
                {truncateTitle(room.name)}
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
              {truncateTitle(room.name)}
            </Top.TitleParagraph>
          )
        }
        right={
          <div className="flex items-center gap-2">
            {isDisconnected && <WifiOff size={20} color={adaptive.red200} />}
            <Top.RightButton onClick={() => handleShare(id ?? "")}>
              {t("common.invite")}
            </Top.RightButton>
          </div>
        }
      />
      <Tab size="large" onChange={setTabIdx}>
        <Tab.Item selected={tabIdx === 0}>{t("room.tab.schedule")}</Tab.Item>
        <Tab.Item selected={tabIdx === 1}>{t("room.tab.overview")}</Tab.Item>
        <Tab.Item selected={tabIdx === 2}>
          {t("room.tab.participants")}
        </Tab.Item>
      </Tab>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {tabIdx === 0 && <AvailabilityGrid />}
        {tabIdx === 1 && <OverviewGrid />}
        {tabIdx === 2 && <ParticipantList participants={participants} />}
      </div>

      <BottomSheet
        open={isTutorialOpen}
        onClose={() => setIsTutorialOpen(false)}
        header={<BottomSheet.Header>{t("room.created")}</BottomSheet.Header>}
        cta={
          <BottomSheet.DoubleCTA
            leftButton={
              <Button
                variant="weak"
                color="dark"
                onClick={() => setIsTutorialOpen(false)}
              >
                {t("common.close")}
              </Button>
            }
            rightButton={
              <Button
                onClick={() => {
                  handleShare(id ?? "");
                }}
              >
                {t("common.invite")}
              </Button>
            }
          />
        }
      >
        <Post.Ol>
          <Post.Li>
            <Trans
              i18nKey="room.tutorial.step1"
              components={{ strong: <strong /> }}
            />
          </Post.Li>
          <Post.Li>
            <Trans
              i18nKey="room.tutorial.step2"
              components={{ strong: <strong /> }}
            />
          </Post.Li>
          <Post.Li>
            <Trans
              i18nKey="room.tutorial.step3"
              components={{ strong: <strong /> }}
            />
          </Post.Li>
        </Post.Ol>
      </BottomSheet>

      <BottomSheet
        open={isRoomNameOpen}
        onClose={() => setIsRoomNameOpen(false)}
        header={
          <BottomSheet.Header>{t("room.renameTitle")}</BottomSheet.Header>
        }
        cta={
          <BottomSheet.DoubleCTA
            leftButton={
              <Button
                variant="weak"
                color="dark"
                onClick={() => setIsRoomNameOpen(false)}
              >
                {t("common.close")}
              </Button>
            }
            rightButton={
              <Button
                onClick={handleRoomNameSave}
                disabled={!roomNameInput.trim()}
              >
                {t("common.save")}
              </Button>
            }
          />
        }
      >
        <TextField
          variant="box"
          label={t("room.renameLabel")}
          labelOption="sustain"
          placeholder={t("room.renamePlaceholder")}
          value={roomNameInput}
          onChange={(e) => setRoomNameInput(e.target.value)}
        />
      </BottomSheet>
    </div>
  );
}
