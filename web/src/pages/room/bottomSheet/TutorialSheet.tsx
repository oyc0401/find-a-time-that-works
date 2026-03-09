import { useParams } from "react-router-dom";
import { useTranslation, Trans } from "react-i18next";
import { useRoomStore } from "@/stores/useRoomStore";
import { handleShare } from "@/lib/share";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";

export default function TutorialSheet() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const isTutorialOpen = useRoomStore((state) => state.isTutorialOpen);
  const setIsTutorialOpen = useRoomStore((state) => state.setIsTutorialOpen);

  return (
    <BottomSheet
      open={isTutorialOpen}
      onClose={() => setIsTutorialOpen(false)}
      title={t("room.created")}
      footer={
        <>
          <Button
            variant="secondary"
            fullWidth
            onClick={() => setIsTutorialOpen(false)}
          >
            {t("common.close")}
          </Button>
          <Button fullWidth onClick={() => handleShare(id ?? "")}>
            {t("common.invite")}
          </Button>
        </>
      }
    >
      <ol className="list-decimal space-y-3 pl-5 text-base text-gray-800">
        <li>
          <Trans
            i18nKey="room.tutorial.step1"
            components={{ strong: <strong /> }}
          />
        </li>
        <li>
          <Trans
            i18nKey="room.tutorial.step2"
            components={{ strong: <strong /> }}
          />
        </li>
        <li>
          <Trans
            i18nKey="room.tutorial.step3"
            components={{ strong: <strong /> }}
          />
        </li>
      </ol>
    </BottomSheet>
  );
}
