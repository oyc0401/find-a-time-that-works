import { useParams } from "react-router-dom";
import { Top } from "@toss/tds-mobile";
import { adaptive } from "@toss/tds-colors";
import { useRoomsControllerFindById } from "../api/model/rooms/rooms";

export default function Room() {
  const { id } = useParams<{ id: string }>();
  const { data: response, isLoading } = useRoomsControllerFindById(id!);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <span style={{ color: adaptive.grey500 }}>로딩 중...</span>
      </div>
    );
  }

  const room = response?.data.data.room;

  return (
    <div className="h-screen">
      <Top
        title={
          <Top.TitleParagraph size={28} color={adaptive.grey900}>
            {room?.name}
          </Top.TitleParagraph>
        }
      />
    </div>
  );
}
