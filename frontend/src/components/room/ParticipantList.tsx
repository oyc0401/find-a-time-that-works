import { ListRow } from "@toss/tds-mobile";
import { adaptive } from "@toss/tds-colors";
import type { ParticipantDto } from "@/api/model/models";
import { useRoomStore } from "@/stores/useRoomStore";

interface ParticipantListProps {
  participants: ParticipantDto[];
}

export default function ParticipantList({
  participants,
}: ParticipantListProps) {
  const nickname = useRoomStore((s) => s.nickname);

  return (
    <div>
      <div style={{ padding: 16 }}>
        <button
          type="button"
          className="w-full cursor-pointer transition-transform duration-200 active:scale-99"
          style={{ background: adaptive.grey200, borderRadius: 8 }}
        >
          <div className="py-1">
            <ListRow
              verticalPadding="large"
              left={
                <ListRow.AssetIcon
                  shape="circle-background"
                  name="icon-crown-simple"
                  backgroundColor={adaptive.grey50}
                />
              }
              contents={
                <ListRow.Texts
                  type="2RowTypeA"
                  top={nickname}
                  bottom="내 정보"
                />
              }
            />
          </div>
        </button>
      </div>

      {participants.map((p) => (
        <ListRow
          key={p.id}
          left={<ListRow.AssetIcon name="bank-toss" />}
          contents={<ListRow.Texts type="1RowTypeA" top={p.name} />}
        />
      ))}
    </div>
  );
}
