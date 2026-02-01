import { FixedBottomCTA, Top } from "@toss/tds-mobile";
import { adaptive } from "@toss/tds-colors";
import DateSelector from "../components/DateSelector";
import TimeSlider from "../components/TimeSlider";

function Header() {
  return (
    <>
      <Top
        title={
          <Top.TitleParagraph size={28} color={adaptive.grey900}>
            모두가 가능한 시간으로 일정을 정해요
          </Top.TitleParagraph>
        }
        subtitleBottom={
          <Top.SubtitleParagraph>
            방을 만들고 사람들을 초대해요
          </Top.SubtitleParagraph>
        }
      />
    </>
  );
}

export default function Page() {
  return (
    <div className="h-screen">
      <Header />
      <DateSelector />
      <TimeSlider />
      <FixedBottomCTA
        onTap={() => console.log("방 생성하기 클릭됨")}
        loading={false}
        disabled={false}
        color="primary"
      >
        방 생성하기
      </FixedBottomCTA>
    </div>
  );
}
