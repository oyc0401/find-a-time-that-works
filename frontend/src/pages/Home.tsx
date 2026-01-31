import {
  Asset,
  Text,
  Top,
  BottomSheet,
  ListRow,
  Checkbox,
  Spacing,
  Paragraph,
} from "@toss/tds-mobile";
import { adaptive } from "@toss/tds-colors";
import DateSelector from "../components/DateSelector";

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


function TimeSection() {
  return (
    <>
      <Spacing size={39} />
      <Text color={adaptive.grey700} typography="st13" fontWeight="semibold">
        시작시간
      </Text>
      <Text color={adaptive.blue500} typography="t6" fontWeight="bold">
        종료시간
      </Text>
      <Spacing size={41} />
      <Text color={adaptive.grey600} typography="t7" fontWeight="medium">
        0:00
      </Text>
      <Text color={adaptive.grey600} typography="t7" fontWeight="medium">
        17:00
      </Text>
    </>
  );
}

export default function Page() {
  return (
    <div className="h-screen">
      <Header />
      <DateSelector />
      {/* <TimeSection /> */}
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
