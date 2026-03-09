import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useRoomStore } from "@/stores/useRoomStore";
import { setSavedNickname } from "@/repository/nickname";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";

export default function NicknameChangeSheet() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const nickname = useRoomStore((state) => state.nickname);
  const generatedNickname = useRoomStore(
    (state) => state.generatedNickname,
  );
  const isNicknameDialogOpen = useRoomStore(
    (state) => state.isNicknameDialogOpen,
  );
  const setIsNicknameDialogOpen = useRoomStore(
    (state) => state.setIsNicknameDialogOpen,
  );
  const [nicknameInput, setNicknameInput] = useState("");

  useEffect(() => {
    if (isNicknameDialogOpen) {
      setNicknameInput(nickname === generatedNickname ? "" : nickname);
    }
  }, [isNicknameDialogOpen, nickname, generatedNickname]);

  const handleSave = useCallback(() => {
    const trimmed = nicknameInput.trim();
    if (!trimmed || !id) return;

    useRoomStore.getState().setNickname(trimmed);
    setSavedNickname(trimmed);
    setIsNicknameDialogOpen(false);
  }, [nicknameInput, id, setIsNicknameDialogOpen]);

  return (
    <BottomSheet
      open={isNicknameDialogOpen}
      onClose={() => setIsNicknameDialogOpen(false)}
      title={t("participant.changeName")}
      footer={
        <>
          <Button
            variant="secondary"
            fullWidth
            onClick={() => setIsNicknameDialogOpen(false)}
          >
            {t("common.close")}
          </Button>
          <Button
            fullWidth
            onClick={handleSave}
            disabled={!nicknameInput.trim()}
          >
            {t("common.save")}
          </Button>
        </>
      }
    >
      <label className="flex flex-col gap-2 text-sm font-semibold text-gray-700">
        <span>{t("participant.nameLabel")}</span>
        <input
          type="text"
          className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-base text-gray-900 outline-none focus:border-blue-400"
          placeholder={
            nickname === generatedNickname
              ? generatedNickname
              : t("participant.namePlaceholder")
          }
          value={nicknameInput}
          onChange={(e) => setNicknameInput(e.target.value)}
        />
      </label>
    </BottomSheet>
  );
}
