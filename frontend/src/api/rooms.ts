import { customFetch } from "./client";

interface CreateRoomParams {
  name: string;
  creatorId: string;
  dates: string[];
  startTime: string;
  endTime: string;
}

interface CreateRoomResponse {
  data: { id: string };
  message: string;
}

interface RoomDetailResponse {
  data: {
    room: {
      id: string;
      name: string;
      creatorId: string;
      dates: string[];
      startTime: string;
      endTime: string;
      createdAt: string;
      expiresAt: string;
    };
    participants: {
      id: string;
      userId: string;
      name: string;
      slots: { date: string; time: string }[];
    }[];
  };
  message: string;
}

interface SubmitAvailabilityParams {
  participantId: string;
  participantName: string;
  slots: { date: string; time: string }[];
}

export async function createRoom(params: CreateRoomParams): Promise<CreateRoomResponse> {
  return customFetch<CreateRoomResponse>({
    url: "/rooms",
    method: "POST",
    data: params,
  });
}

export async function getRoom(id: string): Promise<RoomDetailResponse> {
  return customFetch<RoomDetailResponse>({
    url: `/rooms/${id}`,
    method: "GET",
  });
}

export async function submitAvailability(roomId: string, params: SubmitAvailabilityParams): Promise<void> {
  await customFetch({
    url: `/rooms/${roomId}/availability`,
    method: "POST",
    data: params,
  });
}
