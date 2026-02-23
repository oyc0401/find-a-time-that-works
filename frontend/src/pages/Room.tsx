import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import {
  graniteEvent,
  generateHapticFeedback,
} from "@apps-in-toss/web-framework";
import { useQueryClient } from "@tanstack/react-query";
import {
  Asset,
  BottomCTA,
  BottomSheet,
  Button,
  Checkbox,
  FixedBottomCTA,
  Loader,
  Menu,
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
import { getUserId } from "@/repository/userId";
import { generateTimeSlots } from "@/lib/timeSlots";
import {
  getSavedNickname,
  getGeneratedNickname,
  setSavedNickname,
} from "@/repository/nickname";
import {
  getDefaultThumbnail,
  setDefaultThumbnail,
  THUMBNAILS,
  thumbnailUrl,
} from "@/repository/thumbnail";
import { Repository } from "@/repository/repository";
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
  const {
    tabIdx,
    setTabIdx,
    nickname,
    generatedNickname,
    thumbnail,
    isNicknameDialogOpen,
    isThumbnailDialogOpen,
    setIsNicknameDialogOpen,
    setIsThumbnailDialogOpen,
  } = useRoomStore();
  const { enable } = useSubmitAvailability(id);
  const queryClient = useQueryClient();

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

  // ── Settings menu ──
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // ── Room name bottom sheet ──
  const [isRoomNameOpen, setIsRoomNameOpen] = useState(false);
  const [roomNameInput, setRoomNameInput] = useState("");
  const { mutate: updateRoomName } = useRoomsControllerUpdateRoomName();

  const handleRoomNameOpen = useCallback(() => {
    if (!room) return;
    setRoomNameInput(room.name || "");
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

  // ── Nickname bottom sheet ──
  const [nicknameInput, setNicknameInput] = useState("");

  useEffect(() => {
    if (isNicknameDialogOpen) {
      setNicknameInput(nickname === generatedNickname ? "" : nickname);
    }
  }, [isNicknameDialogOpen, nickname, generatedNickname]);

  const handleNicknameSave = useCallback(() => {
    const trimmed = nicknameInput.trim();
    if (!trimmed || !id) return;

    useRoomStore.getState().setNickname(trimmed);
    setSavedNickname(trimmed); // 항상 저장
    setIsNicknameDialogOpen(false);
  }, [nicknameInput, id, setIsNicknameDialogOpen]);

  // ── Thumbnail bottom sheet ──
  const [selectedThumbnail, setSelectedThumbnail] = useState("");

  useEffect(() => {
    if (isThumbnailDialogOpen) {
      setSelectedThumbnail(thumbnail);
    }
  }, [isThumbnailDialogOpen, thumbnail]);

  const handleThumbnailSave = useCallback(() => {
    if (!selectedThumbnail) return;

    useRoomStore.getState().setThumbnail(selectedThumbnail);
    setDefaultThumbnail(selectedThumbnail);
    setIsThumbnailDialogOpen(false);
  }, [selectedThumbnail, setIsThumbnailDialogOpen]);

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
    const store = useAvailabilityStore.getState();

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
        const store = useRoomStore.getState();
        store.setNickname(nickname);
        store.setGeneratedNickname(generatedNickname);
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
          <Top.TitleParagraph size={28} color={adaptive.grey900}>
            {truncateTitle(roomTitle)}
          </Top.TitleParagraph>
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
                  {isCreator && (
                    <Menu.DropdownItem
                      onClick={() => {
                        setIsMenuOpen(false);
                        handleRoomNameOpen();
                      }}
                    >
                      {t("room.renameTitle")}
                    </Menu.DropdownItem>
                  )}
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
                </Menu.Dropdown>
              }
            >
              <button
                type="button"
                className="cursor-pointer flex items-center justify-center p-4"
                style={{ outline: "none", WebkitTapHighlightColor: "transparent" }}
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
      {!isTutorialOpen &&
        !isRoomNameOpen &&
        !isNicknameDialogOpen &&
        !isThumbnailDialogOpen && (
          <BottomCTA.Single
            onTap={() => handleShare(id ?? "")}
            color="primary"
            fixedAboveKeyboard={false}
            fixed
          >
            {t("common.invite")}
          </BottomCTA.Single>
        )}

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

      {/* ── Nickname Bottom Sheet ── */}
      <BottomSheet
        open={isNicknameDialogOpen}
        onClose={() => setIsNicknameDialogOpen(false)}
        header={
          <BottomSheet.Header>{t("participant.changeName")}</BottomSheet.Header>
        }
        cta={
          <BottomSheet.DoubleCTA
            leftButton={
              <Button
                variant="weak"
                color="dark"
                onClick={() => setIsNicknameDialogOpen(false)}
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
          placeholder={
            nickname === generatedNickname
              ? generatedNickname
              : t("participant.namePlaceholder")
          }
          value={nicknameInput}
          onChange={(e) => setNicknameInput(e.target.value)}
        />
      </BottomSheet>

      {/* ── Thumbnail Bottom Sheet ── */}
      <BottomSheet
        open={isThumbnailDialogOpen}
        onClose={() => setIsThumbnailDialogOpen(false)}
        header={
          <BottomSheet.Header>
            {t("participant.changeProfile")}
          </BottomSheet.Header>
        }
        cta={
          <BottomSheet.DoubleCTA
            leftButton={
              <Button
                variant="weak"
                color="dark"
                onClick={() => setIsThumbnailDialogOpen(false)}
              >
                {t("common.close")}
              </Button>
            }
            rightButton={
              <Button onClick={handleThumbnailSave}>{t("common.save")}</Button>
            }
          />
        }
      >
        <div
          className="grid px-4 py-2"
          style={{
            gridTemplateColumns: "repeat(auto-fit, 84px)",
            justifyContent: "space-evenly",
            justifyItems: "center",
          }}
        >
          {THUMBNAILS.map((t) => (
            <button
              key={t}
              type="button"
              className="flex cursor-pointer items-center justify-center w-[84px] h-[84px]"
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
