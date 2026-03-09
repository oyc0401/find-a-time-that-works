import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { BottomSheet, Button, TextField } from "@toss/tds-mobile";
import { useTranslation } from "react-i18next";
import { useRoomStore } from "@/stores/useRoomStore";
import { setSavedNickname } from "@/repository/nickname";

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
            <Button onClick={handleSave} disabled={!nicknameInput.trim()}>
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
  );
}
