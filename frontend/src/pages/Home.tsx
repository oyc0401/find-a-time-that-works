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

type Props = {
  daysInMonth?: number; // 28~31
  startOffset?: number; // 0=일,1=월,...6=토 (1일이 시작하는 요일)
};

function DateSection({
  daysInMonth = 30,
  startOffset = 3, // 스샷처럼 1일이 '수'에 오게 하려면 3
}: Props) {
  const weekdays = ["일", "월", "화", "수", "목", "금", "토"];

  // 앞쪽 빈칸 + 날짜들
  const cells: Array<number | null> = [
    ...Array.from({ length: startOffset }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div className="w-full px-5 py-4">
      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 text-center">
        {weekdays.map((d) => (
          <div
            key={d}
            className="text-[17px] font-medium tracking-wide text-slate-300"
          >
            {d}
          </div>
        ))}
      </div>

      {/* 날짜 그리드 */}
      <div className="mt-5 grid grid-cols-7 justify-items-center gap-y-4">
        {cells.map((v, idx) => (
          <div
            key={idx}
            className={[
              "h-[32px] w-[32px] select-none text-center",
              "text-[23px] font-normal leading-[32px] text-slate-700",
              v == null ? "opacity-0" : "",
            ].join(" ")}
          >
            {v ?? 0}
          </div>
        ))}
      </div>
    </div>
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
    <div>
      <Header />
      <DateSection />
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
