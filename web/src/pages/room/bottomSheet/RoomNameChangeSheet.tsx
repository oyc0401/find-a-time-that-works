import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { BottomSheet, Button, TextField } from "@toss/tds-mobile";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import {
  getRoomsControllerFindByIdQueryKey,
  useRoomsControllerUpdateRoomName,
} from "@/api/model/rooms/rooms";
import { useRoomData } from "@/hooks/useRoomData";
import { useRoomStore } from "@/stores/useRoomStore";
import { getUserId } from "@/repository/userId";

export default function RoomNameChangeSheet() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const { room } = useRoomData(id);
  const isRoomNameOpen = useRoomStore((state) => state.isRoomNameOpen);
  const setIsRoomNameOpen = useRoomStore((state) => state.setIsRoomNameOpen);
  const { mutate: updateRoomName } = useRoomsControllerUpdateRoomName();
  const queryClient = useQueryClient();
  const [roomNameInput, setRoomNameInput] = useState("");

  useEffect(() => {
    if (isRoomNameOpen) {
      setRoomNameInput(room?.name ?? "");
    }
  }, [isRoomNameOpen, room?.name]);

  const handleSave = useCallback(() => {
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
  }, [roomNameInput, id, updateRoomName, queryClient, setIsRoomNameOpen]);

  return (
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
            <Button onClick={handleSave} disabled={!roomNameInput.trim()}>
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
  );
}
