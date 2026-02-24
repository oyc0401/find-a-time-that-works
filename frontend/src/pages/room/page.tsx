import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import {
  graniteEvent,
  generateHapticFeedback,
} from "@apps-in-toss/web-framework";
import {
  Asset,
  Border,
  BottomCTA,
  CTAButton,
  Loader,
  Menu,
  Tab,
  Top,
} from "@toss/tds-mobile";
import { adaptive } from "@toss/tds-colors";
import { useRoomData } from "@/hooks/useRoomData";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { useRoomSocket } from "@/hooks/useRoomSocket";
import { useRoomStore } from "@/stores/useRoomStore";
import { useSubmitAvailability } from "@/hooks/useSubmitAvailability";
import { getUserId } from "@/repository/userId";
import { generateTimeSlots } from "@/lib/timeSlots";
import {
  getSavedNickname,
  getGeneratedNickname,
} from "@/repository/nickname";
import { getDefaultThumbnail } from "@/repository/thumbnail";
import { Repository } from "@/repository/repository";
import { handleShare } from "@/lib/share";
import { useTranslation } from "react-i18next";
import { WifiOff } from "lucide-react";
import { truncateTitle } from "@/lib/truncateTitle";
import AvailabilityGrid from "./SelectTap";
import OverviewGrid from "./OverviewTap";
import ParticipantList from "./ParticipantTap";
import TutorialSheet from "./bottomSheet/TutorialSheet";
import RoomNameChangeSheet from "./bottomSheet/RoomNameChangeSheet";
import NicknameChangeSheet from "./bottomSheet/NicknameChangeSheet";
import ThumbnailChangeSheet from "./bottomSheet/ThumbnailChangeSheet";

export default function Room() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { room, participants, isLoading } = useRoomData(id);
  const tabIdx = useRoomStore((state) => state.tabIdx);
  const setTabIdx = useRoomStore((state) => state.setTabIdx);
  const setIsTutorialOpen = useRoomStore((state) => state.setIsTutorialOpen);
  const setIsRoomNameOpen = useRoomStore((state) => state.setIsRoomNameOpen);
  const setIsNicknameDialogOpen = useRoomStore(
    (state) => state.setIsNicknameDialogOpen,
  );
  const setIsThumbnailDialogOpen = useRoomStore(
    (state) => state.setIsThumbnailDialogOpen,
  );
  const reset = useRoomStore((state) => state.reset);

  useEffect(() => {
    reset();
  }, []);
  const { enable } = useSubmitAvailability(id);

  const roomTitle = useMemo(() => {
    if (room?.name) return room.name;
    const creator = participants?.find((p) => p.userId === room?.creatorId);
    if (creator) return `${creator.name}${t("home.roomNameSuffix")}`;
    return "";
  }, [room, participants, t]);

  // ── Loading delay ──
  const [showLoader, setShowLoader] = useState(false);
  useEffect(() => {
    if (!isLoading) return;
    const timer = setTimeout(() => setShowLoader(true), 1000);
    return () => clearTimeout(timer);
  }, [isLoading]);

  // ── Tutorial bottom sheet ── (open 상태는 useRoomStore에서 관리)

  // WebSocket 연결
  const { connected } = useRoomSocket({
    roomId: id ?? "",
    enabled: Boolean(id),
  });
  const networkOnline = useNetworkStatus();
  const isDisconnected = !connected || !networkOnline;

  const loadedRef = useRef(false);
  const [isCreator, setIsCreator] = useState(false);

  // ── Settings menu ──
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get("created") === "true" && id) {
      setIsTutorialOpen(true);
      navigate(`/rooms/${id}`, { replace: true });
    }
  }, [searchParams, id, navigate]);

  useEffect(() => {
    const unsubscription = graniteEvent.addEventListener("backEvent", {
      onEvent: () => {
        navigate(-1);
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
    const store = useRoomStore.getState();

    if (!loadedRef.current) {
      loadedRef.current = true;
      store.init(timeSlots.length, room.dates.length);
      Repository.setRecentRoomId(room.id);

      getUserId().then(async (userId) => {
        setIsCreator(room.creatorId === userId);
        const myParticipant = participants.find((p) => p.userId === userId);
        const savedNickname = await getSavedNickname();
        const generatedNickname = await getGeneratedNickname();
        const nickname =
          myParticipant?.name ?? savedNickname ?? generatedNickname;
        const thumbnail =
          myParticipant?.thumbnail ?? (await getDefaultThumbnail());
        const roomStore = useRoomStore.getState();
        roomStore.setNickname(nickname);
        roomStore.setGeneratedNickname(generatedNickname);
        roomStore.setThumbnail(thumbnail);
        if (myParticipant && myParticipant.slots.length > 0) {
          roomStore.loadFromSlots(myParticipant.slots, room.dates, timeSlots);
        }
        enable();
      });
    }
  }, [room, participants, enable]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        {showLoader && <Loader size="large" />}
      </div>
    );
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
              className="cursor-pointer active:scale-[0.97] transition-transform"
              onClick={() => setIsRoomNameOpen(true)}
            >
              <Top.TitleParagraph size={28} color={adaptive.grey900}>
                {truncateTitle(roomTitle)}
              </Top.TitleParagraph>
            </button>
          ) : (
            <Top.TitleParagraph size={28} color={adaptive.grey900}>
              {truncateTitle(roomTitle)}
            </Top.TitleParagraph>
          )
        }
        right={
          <div className="flex items-center gap-2">
            {isDisconnected && <WifiOff size={20} color={adaptive.red200} />}
            <Menu.Trigger
              open={isMenuOpen}
              onOpen={() => setIsMenuOpen(true)}
              onClose={() => setIsMenuOpen(false)}
              placement="bottom-end"
              dropdown={
                <Menu.Dropdown>
                  <Menu.DropdownItem
                    onClick={() => {
                      setIsMenuOpen(false);
                      navigate("/");
                    }}
                  >
                    {t("home.createRoom")}
                  </Menu.DropdownItem>
                  <div className="py-1">
                        <Border variant="full" />
                      </div>

                  <Menu.DropdownItem
                    onClick={() => {
                      setIsMenuOpen(false);
                      setIsNicknameDialogOpen(true);
                    }}
                  >
                    {t("participant.changeName")}
                  </Menu.DropdownItem>

                  <Menu.DropdownItem
                    onClick={() => {
                      setIsMenuOpen(false);
                      setIsThumbnailDialogOpen(true);
                    }}
                  >
                    {t("participant.changeProfile")}
                  </Menu.DropdownItem>

                  {isCreator && (
                    <>
                      <div className="py-1">
                        <Border variant="full" />
                      </div>

                      <Menu.DropdownItem
                        onClick={() => {
                          setIsMenuOpen(false);
                          setIsRoomNameOpen(true);
                        }}
                      >
                        {t("room.renameTitle")}
                      </Menu.DropdownItem>
                    </>
                  )}
                </Menu.Dropdown>
              }
            >
              <button
                type="button"
                className="cursor-pointer flex items-center justify-center p-4 active:scale-90 active:opacity-50 transition-transform"
                style={{
                  outline: "none",
                  WebkitTapHighlightColor: "transparent",
                }}
              >
                <Asset.Icon
                  frameShape={Asset.frameShape.CleanW24}
                  backgroundColor="transparent"
                  name="icon-setting-mono"
                  color={adaptive.grey600}
                  scale={1}
                  aria-hidden={true}
                  ratio="1/1"
                />
              </button>
            </Menu.Trigger>
          </div>
        }
      />
      <Tab
        size="large"
        onChange={(idx) => {
          generateHapticFeedback({ type: "tickWeak" });
          setTabIdx(idx);
        }}
      >
        <Tab.Item selected={tabIdx === 0}>{t("room.tab.schedule")}</Tab.Item>
        <Tab.Item selected={tabIdx === 1}>{t("room.tab.overview")}</Tab.Item>
        <Tab.Item selected={tabIdx === 2}>
          {t("room.tab.participants")}
        </Tab.Item>
      </Tab>

      <div className="min-h-0 flex-1">
        {tabIdx === 0 && <AvailabilityGrid />}
        {tabIdx === 1 && <OverviewGrid />}
        {tabIdx === 2 && <ParticipantList participants={participants} />}
      </div>
      <BottomCTA.Double
        fixed
        rightButton={
          <CTAButton onTap={() => handleShare(id ?? "")}>
            {t("common.invite")}
          </CTAButton>
        }
      />

      <TutorialSheet />
      <RoomNameChangeSheet />
      <NicknameChangeSheet />
      <ThumbnailChangeSheet />
    </div>
  );
}
