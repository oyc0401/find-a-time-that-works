import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import {
  graniteEvent,
  generateHapticFeedback,
} from "@apps-in-toss/web-framework";
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
import SelectTap from "./SelectTap";
import OverviewTap from "./OverviewTap";
import ParticipantTap from "./ParticipantTap";
import TutorialSheet from "./bottomSheet/TutorialSheet";
import RoomNameChangeSheet from "./bottomSheet/RoomNameChangeSheet";
import NicknameChangeSheet from "./bottomSheet/NicknameChangeSheet";
import ThumbnailChangeSheet from "./bottomSheet/ThumbnailChangeSheet";
import RoomNavigateSheet from "./bottomSheet/RoomNavigateSheet";
import { BottomActionBar } from "@/components/ui/BottomActionBar";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { Settings, WifiOff } from "lucide-react";
import { cn } from "@/lib/cn";

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
  const setIsRoomNavigateOpen = useRoomStore(
    (state) => state.setIsRoomNavigateOpen,
  );
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

  // ── Room title long press (10s) → room navigate sheet ──
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const isLongPressRef = useRef(false);

  const handleTitlePointerDown = () => {
    isLongPressRef.current = false;
    longPressTimerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      generateHapticFeedback({ type: "success" });
      setIsRoomNavigateOpen(true);
    }, 10000);
  };

  const handleTitlePointerUp = () => {
    clearTimeout(longPressTimerRef.current);
  };

  useEffect(() => {
    return () => clearTimeout(longPressTimerRef.current);
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
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isMenuOpen) return;
    const handleClick = (event: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    window.addEventListener("mousedown", handleClick);
    return () => window.removeEventListener("mousedown", handleClick);
  }, [isMenuOpen]);

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
        {showLoader && <Spinner size={48} />}
      </div>
    );
  }

  if (!room) {
    return (
      <div className="flex h-screen items-center justify-center text-gray-500">
        <span>{t("room.notFound")}</span>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col pb-36">
      <header className="px-5 pt-8">
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1">
            {isCreator ? (
              <button
                type="button"
                className="w-full text-left text-3xl font-bold text-gray-900"
                onClick={() => {
                  if (isLongPressRef.current) return;
                  setIsRoomNameOpen(true);
                }}
                onPointerDown={handleTitlePointerDown}
                onPointerUp={handleTitlePointerUp}
                onPointerLeave={handleTitlePointerUp}
                onPointerCancel={handleTitlePointerUp}
              >
                {truncateTitle(roomTitle)}
              </button>
            ) : (
              <div
                className="text-3xl font-bold text-gray-900"
                onPointerDown={handleTitlePointerDown}
                onPointerUp={handleTitlePointerUp}
                onPointerLeave={handleTitlePointerUp}
                onPointerCancel={handleTitlePointerUp}
              >
                {truncateTitle(roomTitle)}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isDisconnected && (
              <WifiOff className="text-red-300" size={20} aria-hidden />
            )}
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                className={cn(
                  "flex h-11 w-11 items-center justify-center rounded-2xl border border-gray-200 bg-white text-gray-600 transition-all",
                  isMenuOpen && "bg-gray-50",
                )}
                onClick={() => setIsMenuOpen((prev) => !prev)}
              >
                <Settings size={20} />
              </button>
              {isMenuOpen && (
                <div className="absolute right-0 top-12 w-56 rounded-2xl border border-gray-100 bg-white p-1.5 shadow-2xl">
                  <button
                    type="button"
                    className="w-full rounded-xl px-3 py-2 text-left text-sm font-semibold text-gray-700 hover:bg-gray-50"
                    onClick={() => {
                      setIsMenuOpen(false);
                      navigate("/");
                    }}
                  >
                    {t("home.createRoom")}
                  </button>
                  <div className="my-1 h-px bg-gray-100" />
                  <button
                    type="button"
                    className="w-full rounded-xl px-3 py-2 text-left text-sm font-semibold text-gray-700 hover:bg-gray-50"
                    onClick={() => {
                      setIsMenuOpen(false);
                      setIsNicknameDialogOpen(true);
                    }}
                  >
                    {t("participant.changeName")}
                  </button>
                  <button
                    type="button"
                    className="mt-1 w-full rounded-xl px-3 py-2 text-left text-sm font-semibold text-gray-700 hover:bg-gray-50"
                    onClick={() => {
                      setIsMenuOpen(false);
                      setIsThumbnailDialogOpen(true);
                    }}
                  >
                    {t("participant.changeProfile")}
                  </button>
                  {isCreator && (
                    <>
                      <div className="my-1 h-px bg-gray-100" />
                      <button
                        type="button"
                        className="w-full rounded-xl px-3 py-2 text-left text-sm font-semibold text-gray-700 hover:bg-gray-50"
                        onClick={() => {
                          setIsMenuOpen(false);
                          setIsRoomNameOpen(true);
                        }}
                      >
                        {t("room.renameTitle")}
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="mt-6 flex border-b border-gray-200 px-2">
        {[t("room.tab.schedule"), t("room.tab.overview"), t("room.tab.participants")].map(
          (label, idx) => (
            <button
              key={label}
              type="button"
              className={cn(
                "flex-1 pb-3 text-sm font-semibold transition-colors",
                tabIdx === idx
                  ? "border-b-2 border-blue-500 text-blue-500"
                  : "text-gray-400",
              )}
              onClick={() => {
                generateHapticFeedback({ type: "tickWeak" });
                setTabIdx(idx);
              }}
            >
              {label}
            </button>
          ),
        )}
      </div>

      <div className="min-h-0 flex-1">
        {tabIdx === 0 && <SelectTap />}
        {tabIdx === 1 && <OverviewTap />}
        {tabIdx === 2 && <ParticipantTap participants={participants} />}
      </div>
      <BottomActionBar>
        <Button fullWidth onClick={() => handleShare(id ?? "")}>
          {t("common.invite")}
        </Button>
      </BottomActionBar>

      <TutorialSheet />
      <RoomNameChangeSheet />
      <NicknameChangeSheet />
      <ThumbnailChangeSheet />
      <RoomNavigateSheet />
    </div>
  );
}
