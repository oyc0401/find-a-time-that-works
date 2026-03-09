import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import {
  getRoomsControllerFindByIdQueryKey,
  useRoomsControllerUpdateRoomName,
} from "@/api/model/rooms/rooms";
import { useRoomData } from "@/hooks/useRoomData";
import { useRoomStore } from "@/stores/useRoomStore";
import { getUserId } from "@/repository/userId";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";

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
      title={t("room.renameTitle")}
      footer={
        <>
          <Button
            variant="secondary"
            fullWidth
            onClick={() => setIsRoomNameOpen(false)}
          >
            {t("common.close")}
          </Button>
          <Button
            fullWidth
            onClick={handleSave}
            disabled={!roomNameInput.trim()}
          >
            {t("common.save")}
          </Button>
        </>
      }
    >
      <label className="flex flex-col gap-2 text-sm font-semibold text-gray-700">
        <span>{t("room.renameLabel")}</span>
        <input
          type="text"
          className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-base text-gray-900 outline-none focus:border-blue-400"
          placeholder={t("room.renamePlaceholder")}
          value={roomNameInput}
          onChange={(e) => setRoomNameInput(e.target.value)}
        />
      </label>
    </BottomSheet>
  );
}
