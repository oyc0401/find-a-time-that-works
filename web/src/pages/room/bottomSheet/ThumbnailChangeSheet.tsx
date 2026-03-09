import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useRoomStore } from "@/stores/useRoomStore";
import {
  THUMBNAILS,
  thumbnailUrl,
  setDefaultThumbnail,
} from "@/repository/thumbnail";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";

export default function ThumbnailChangeSheet() {
  const { t } = useTranslation();
  const thumbnail = useRoomStore((state) => state.thumbnail);
  const isThumbnailDialogOpen = useRoomStore(
    (state) => state.isThumbnailDialogOpen,
  );
  const setIsThumbnailDialogOpen = useRoomStore(
    (state) => state.setIsThumbnailDialogOpen,
  );
  const [selectedThumbnail, setSelectedThumbnail] = useState("");

  useEffect(() => {
    if (isThumbnailDialogOpen) {
      setSelectedThumbnail(thumbnail);
    }
  }, [isThumbnailDialogOpen, thumbnail]);

  const handleSave = useCallback(() => {
    if (!selectedThumbnail) return;

    useRoomStore.getState().setThumbnail(selectedThumbnail);
    setDefaultThumbnail(selectedThumbnail);
    setIsThumbnailDialogOpen(false);
  }, [selectedThumbnail, setIsThumbnailDialogOpen]);

  return (
    <BottomSheet
      open={isThumbnailDialogOpen}
      onClose={() => setIsThumbnailDialogOpen(false)}
      title={t("participant.changeProfile")}
      footer={
        <>
          <Button
            variant="secondary"
            fullWidth
            onClick={() => setIsThumbnailDialogOpen(false)}
          >
            {t("common.close")}
          </Button>
          <Button fullWidth onClick={handleSave}>
            {t("common.save")}
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-3 gap-4 px-1 py-2">
        {THUMBNAILS.map((thumb) => (
          <button
            key={thumb}
            type="button"
            className="flex h-20 w-full items-center justify-center rounded-full border border-gray-100 bg-gray-50 transition-all hover:border-blue-200 focus-visible:outline-none"
            onClick={() => setSelectedThumbnail(thumb)}
            style={{
              boxShadow:
                selectedThumbnail === thumb
                  ? "0 0 0 2px #3182f6 inset"
                  : "none",
            }}
          >
            <img
              src={thumbnailUrl(thumb)}
              alt=""
              className="h-12 w-12 rounded-full object-cover"
            />
          </button>
        ))}
      </div>
    </BottomSheet>
  );
}
