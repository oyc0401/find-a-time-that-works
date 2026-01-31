import { Top } from "@toss/tds-mobile";
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
      {/* <FixedBottomCTA.Double
        leftButton={
          <CTAButton color="dark" variant="weak" display="block">
            닫기
          </CTAButton>
        }
        rightButton={<CTAButton display="block">생성하기</CTAButton>}
      /> */}
    </div>
  );
}
