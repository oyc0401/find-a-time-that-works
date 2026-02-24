import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BottomSheet, Button, TextField } from "@toss/tds-mobile";
import { useTranslation } from "react-i18next";
import { useRoomStore } from "@/stores/useRoomStore";

export default function RoomNavigateSheet() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isRoomNavigateOpen = useRoomStore((state) => state.isRoomNavigateOpen);
  const setIsRoomNavigateOpen = useRoomStore(
    (state) => state.setIsRoomNavigateOpen,
  );
  const [roomIdInput, setRoomIdInput] = useState("");

  const handleClose = () => {
    setIsRoomNavigateOpen(false);
    setRoomIdInput("");
  };

  const handleNavigate = () => {
    const trimmed = roomIdInput.trim();
    if (!trimmed) return;
    handleClose();
    navigate(`/rooms/${trimmed}`);
  };

  return (
    <BottomSheet
      open={isRoomNavigateOpen}
      onClose={handleClose}
      header={
        <BottomSheet.Header>{t("room.navigateTitle")}</BottomSheet.Header>
      }
      cta={
        <BottomSheet.DoubleCTA
          leftButton={
            <Button variant="weak" color="dark" onClick={handleClose}>
              {t("common.close")}
            </Button>
          }
          rightButton={
            <Button onClick={handleNavigate} disabled={!roomIdInput.trim()}>
              {t("room.navigateButton")}
            </Button>
          }
        />
      }
    >
      <TextField
        variant="box"
        label={t("room.navigateLabel")}
        labelOption="sustain"
        placeholder={t("room.navigatePlaceholder")}
        value={roomIdInput}
        onChange={(e) => setRoomIdInput(e.target.value)}
      />
    </BottomSheet>
  );
}
