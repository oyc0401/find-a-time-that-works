import { useParams } from "react-router-dom";
import { BottomSheet, Button, Post } from "@toss/tds-mobile";
import { useTranslation, Trans } from "react-i18next";
import { useRoomStore } from "@/stores/useRoomStore";
import { handleShare } from "@/lib/share";

export default function TutorialSheet() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const isTutorialOpen = useRoomStore((state) => state.isTutorialOpen);
  const setIsTutorialOpen = useRoomStore((state) => state.setIsTutorialOpen);

  return (
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
            <Button onClick={() => handleShare(id ?? "")}>
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
  );
}
