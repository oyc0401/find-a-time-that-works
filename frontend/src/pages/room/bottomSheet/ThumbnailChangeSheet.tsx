import { useCallback, useEffect, useState } from "react";
import { BottomSheet, Button, Asset } from "@toss/tds-mobile";
import { useTranslation } from "react-i18next";
import { adaptive } from "@toss/tds-colors";
import { useRoomStore } from "@/stores/useRoomStore";
import {
  THUMBNAILS,
  thumbnailUrl,
  setDefaultThumbnail,
} from "@/repository/thumbnail";

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
            <Button onClick={handleSave}>{t("common.save")}</Button>
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
        {THUMBNAILS.map((thumb) => (
          <button
            key={thumb}
            type="button"
            className="flex cursor-pointer items-center justify-center w-[84px] h-[84px]"
            onClick={() => setSelectedThumbnail(thumb)}
          >
            <div
              style={{
                padding: 8,
                background:
                  selectedThumbnail === thumb
                    ? adaptive.grey300
                    : adaptive.grey100,
                borderRadius: 9999,
              }}
            >
              <Asset.Image
                src={thumbnailUrl(thumb)}
                frameShape={Asset.frameShape.Circle2XLarge}
                scale={0.9}
              />
            </div>
          </button>
        ))}
      </div>
    </BottomSheet>
  );
}
