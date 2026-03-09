import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useRoomStore } from "@/stores/useRoomStore";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";

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
      title={t("room.navigateTitle")}
      footer={
        <>
          <Button variant="secondary" fullWidth onClick={handleClose}>
            {t("common.close")}
          </Button>
          <Button
            fullWidth
            onClick={handleNavigate}
            disabled={!roomIdInput.trim()}
          >
            {t("room.navigateButton")}
          </Button>
        </>
      }
    >
      <label className="flex flex-col gap-2 text-sm font-semibold text-gray-700">
        <span>{t("room.navigateLabel")}</span>
        <input
          type="text"
          className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-base text-gray-900 outline-none focus:border-blue-400"
          placeholder={t("room.navigatePlaceholder")}
          value={roomIdInput}
          onChange={(e) => setRoomIdInput(e.target.value)}
        />
      </label>
    </BottomSheet>
  );
}
