import {
  Asset,
  Text,
  Top,

  BottomSheet,
  ListRow,
  Checkbox,

  Spacing,
} from '@toss/tds-mobile';
import { adaptive } from '@toss/tds-colors';

export default function Page() {
  return (
    <>
    dsadsad
       <Asset.Icon
        frameShape={Asset.frameShape.CleanW24}
        backgroundColor="transparent"
        name="icon-arrow-back-ios-mono"
        color={adaptive.grey900}
        aria-hidden={true}
        ratio="1/1"
      />
      <Asset.Image
        frameShape={Asset.frameShape.CleanW16}
        backgroundColor="transparent"
        src="https://static.toss.im/appsintoss/2205/c8d4c7e7-9f6c-4568-afef-6445a3867aea.png"
        aria-hidden={true}
        style={{ aspectRatio: '1/1' }}
      />
      <Text color={adaptive.grey900} typography="t6" fontWeight="semibold">
        겹치는 시간 찾기
      </Text>
      <Asset.Icon
        frameShape={Asset.frameShape.CleanW20}
        backgroundColor="transparent"
        name="icon-heart-mono"
        color={adaptive.greyOpacity600}
        aria-hidden={true}
        ratio="1/1"
      />
      <Asset.Icon
        frameShape={Asset.frameShape.CleanW20}
        backgroundColor="transparent"
        name="icon-dots-mono"
        color={adaptive.greyOpacity600}
        aria-hidden={true}
        ratio="1/1"
      />
      <Asset.Icon
        frameShape={Asset.frameShape.CleanW20}
        backgroundColor="transparent"
        name="icon-x-mono"
        color={adaptive.greyOpacity600}
        aria-hidden={true}
        ratio="1/1"
      />
      <Spacing size={12} />
      <Top
        title={
          <Top.TitleParagraph size={22} color={adaptive.grey900}>
            모두가 가능한 시간으로 일정을 정해요
          </Top.TitleParagraph>
        }
        subtitleBottom={
          <Top.SubtitleParagraph>
            방을 만들고 사람들을 초대해요
          </Top.SubtitleParagraph>
        }
      />
      <div>
        <>
          <BottomSheet
            header={<BottomSheet.Header>타이틀 내용</BottomSheet.Header>}
            open={true}
            onClose={() => {}}
            cta={
              <BottomSheet.CTA color="primary" variant="fill" disabled={false}>
                선택하기
              </BottomSheet.CTA>
            }
          >
            <>콘텐츠를 클릭해 확인해주세요</>
          </BottomSheet>
        </>
        <>
          <BottomSheet
            header={<BottomSheet.Header>타이틀 내용</BottomSheet.Header>}
            open={true}
            onClose={() => {}}
            cta={
              <BottomSheet.CTA color="primary" variant="fill" disabled={false}>
                선택하기
              </BottomSheet.CTA>
            }
          >
            <>콘텐츠를 클릭해 확인해주세요</>
          </BottomSheet>
        </>
        <>
          <BottomSheet
            header={<BottomSheet.Header>타이틀 내용</BottomSheet.Header>}
            open={true}
            onClose={() => {}}
            cta={
              <BottomSheet.CTA color="primary" variant="fill" disabled={false}>
                선택하기
              </BottomSheet.CTA>
            }
          >
            <BottomSheet.Select
              value="0"
              onChange={()=>{}}
              options={[
                {
                  name: '2023년 12월',
                  value: '0',
                  hideUnCheckedCheckBox: true,
                },
                { name: '2024년 1월', value: '1', hideUnCheckedCheckBox: true },
                { name: '2024년 2월', value: '2', hideUnCheckedCheckBox: true },
              ]}
            />
          </BottomSheet>
        </>
        <>
          <BottomSheet
            header={<BottomSheet.Header>타이틀 내용</BottomSheet.Header>}
            open={true}
            onClose={() => {}}
            cta={
              <BottomSheet.CTA color="primary" variant="fill" disabled={false}>
                선택하기
              </BottomSheet.CTA>
            }
          >
            <>콘텐츠를 클릭해 확인해주세요</>
          </BottomSheet>
        </>
        <>
          <BottomSheet
            header={<BottomSheet.Header>타이틀 내용</BottomSheet.Header>}
            open={true}
            onClose={() => {}}
            cta={
              <BottomSheet.CTA color="primary" variant="fill" disabled={false}>
                선택하기
              </BottomSheet.CTA>
            }
          >
            <>콘텐츠를 클릭해 확인해주세요</>
          </BottomSheet>
        </>
        <>
          <BottomSheet
            header={<BottomSheet.Header>타이틀 내용</BottomSheet.Header>}
            open={true}
            onClose={() => {}}
            cta={
              <BottomSheet.CTA color="primary" variant="fill" disabled={false}>
                선택하기
              </BottomSheet.CTA>
            }
          >
            <BottomSheet.Select
             onChange={()=>{}}
              value="0"
              options={[
                { name: '2024년', value: '0', hideUnCheckedCheckBox: true },
                { name: '2025년', value: '1', hideUnCheckedCheckBox: true },
                { name: '2026년', value: '2', hideUnCheckedCheckBox: true },
              ]}
            />
          </BottomSheet>
        </>
        <>
          <BottomSheet
            header={<BottomSheet.Header>타이틀 내용</BottomSheet.Header>}
            open={true}
            onClose={() => {}}
            cta={
              <BottomSheet.CTA color="primary" variant="fill" disabled={false}>
                선택하기
              </BottomSheet.CTA>
            }
          >
            <BottomSheet.Select 
             onChange={()=>{}}
              value="0" 
              options={[
                { name: '1월', value: '0', hideUnCheckedCheckBox: true },
                { name: '2월', value: '1', hideUnCheckedCheckBox: true },
                { name: '3월', value: '2', hideUnCheckedCheckBox: true },
              ]}
            />
          </BottomSheet>
        </>
        <>
          <BottomSheet
            header={<BottomSheet.Header>타이틀 내용</BottomSheet.Header>}
            open={true}
            onClose={() => {}}
            cta={
              <BottomSheet.CTA color="primary" variant="fill" disabled={false}>
                선택하기
              </BottomSheet.CTA>
            }
          >
            <>콘텐츠를 클릭해 확인해주세요</>
          </BottomSheet>
        </>
        <Text color={adaptive.grey700} typography="st8" fontWeight="bold">
          2024년 3월
        </Text>
        <ListRow
          role="checkbox"
          aria-checked={true}
          contents={
            <ListRow.Texts
              type="1RowTypeA"
              top="2023년 12월"
              topProps={{ color: adaptive.grey700 }}
            />
          }
          right={<Checkbox.Line size={20} checked={true} />}
          verticalPadding="large"
        />
        <ListRow
          role="checkbox"
          aria-checked={false}
          contents={
            <ListRow.Texts
              type="1RowTypeA"
              top="2024년 1월"
              topProps={{ color: adaptive.grey700 }}
            />
          }
          right={<Checkbox.Line size={20} checked={false} />}
          verticalPadding="large"
        />
        <ListRow
          role="checkbox"
          aria-checked={false}
          contents={
            <ListRow.Texts
              type="1RowTypeA"
              top="2024년 2월"
              topProps={{ color: adaptive.grey700 }}
            />
          }
          right={<Checkbox.Line size={20} checked={false} />}
          verticalPadding="large"
        />
        <ListRow
          role="checkbox"
          aria-checked={true}
          contents={
            <ListRow.Texts
              type="1RowTypeA"
              top="2024년"
              topProps={{ color: adaptive.grey700 }}
            />
          }
          right={<Checkbox.Line size={20} checked={true} />}
          verticalPadding="large"
        />
        <ListRow
          role="checkbox"
          aria-checked={false}
          contents={
            <ListRow.Texts
              type="1RowTypeA"
              top="2025년"
              topProps={{ color: adaptive.grey700 }}
            />
          }
          right={<Checkbox.Line size={20} checked={false} />}
          verticalPadding="large"
        />
        <ListRow
          role="checkbox"
          aria-checked={false}
          contents={
            <ListRow.Texts
              type="1RowTypeA"
              top="2026년"
              topProps={{ color: adaptive.grey700 }}
            />
          }
          right={<Checkbox.Line size={20} checked={false} />}
          verticalPadding="large"
        />
        <ListRow
          role="checkbox"
          aria-checked={true}
          contents={
            <ListRow.Texts
              type="1RowTypeA"
              top="1월"
              topProps={{ color: adaptive.grey700 }}
            />
          }
          right={<Checkbox.Line size={20} checked={true} />}
          verticalPadding="large"
        />
        <ListRow
          role="checkbox"
          aria-checked={false}
          contents={
            <ListRow.Texts
              type="1RowTypeA"
              top="2월"
              topProps={{ color: adaptive.grey700 }}
            />
          }
          right={<Checkbox.Line size={20} checked={false} />}
          verticalPadding="large"
        />
        <ListRow
          role="checkbox"
          aria-checked={false}
          contents={
            <ListRow.Texts
              type="1RowTypeA"
              top="3월"
              topProps={{ color: adaptive.grey700 }}
            />
          }
          right={<Checkbox.Line size={20} checked={false} />}
          verticalPadding="large"
        />
      </div>
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
    
      {/* <FixedBottomCTA.Double
        leftButton={
          <CTAButton color="dark" variant="weak" display="block">
            닫기
          </CTAButton>
        }
        rightButton={<CTAButton display="block">생성하기</CTAButton>}
      /> */}
    </>
  );
}