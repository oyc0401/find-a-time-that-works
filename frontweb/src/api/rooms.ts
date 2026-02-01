export const API_BASE_URL =
  import.meta.env.VITE_API_URL ?? "http://localhost:3001";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...init?.headers },
    ...init,
  });

  if (!response.ok) {
    let message = `HTTP ${response.status}`;
    try {
      const body = await response.json();
      if (body?.message) {
        message = body.message;
      }
    } catch {
      // ignore
    }
    throw new Error(message);
  }

  const text = await response.text();
  return text ? (JSON.parse(text) as T) : ({} as T);
}

export interface RoomSummary {
  id: string;
  name: string;
  creatorId: string;
  dates: string[];
  startTime: string;
  endTime: string;
  createdAt: string;
  expiresAt: string;
}

export interface ParticipantSlot {
  date: string;
  time: string;
}

export interface Participant {
  id: string;
  userId: string;
  name: string;
  slots: ParticipantSlot[];
}

export interface RoomDetail {
  room: RoomSummary;
  participants: Participant[];
}

export interface CreateRoomPayload {
  name: string;
  creatorId: string;
  dates: string[];
  startTime: string;
  endTime: string;
}

export interface AvailabilityPayload {
  participantId: string;
  participantName: string;
  slots: ParticipantSlot[];
}

export interface UpdateRoomNamePayload {
  creatorId: string;
  name: string;
}

export interface DeleteRoomPayload {
  creatorId: string;
}

export interface UpdateNicknamePayload {
  userId: string;
  name: string;
}

export async function createRoom(payload: CreateRoomPayload) {
  return request<{ data: { id: string }; message: string }>("/rooms", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function fetchRoom(id: string) {
  return request<{ data: RoomDetail; message: string }>(`/rooms/${id}`);
}

export async function extendRoom(id: string) {
  return request<{ data: { expiresAt: string }; message: string }>(
    `/rooms/${id}/extend`,
    { method: "POST" },
  );
}

export async function updateRoomName(id: string, payload: UpdateRoomNamePayload) {
  return request<{ data: null; message: string }>(`/rooms/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteRoom(id: string, payload: DeleteRoomPayload) {
  return request<{ data: null; message: string }>(`/rooms/${id}`, {
    method: "DELETE",
    body: JSON.stringify(payload),
  });
}

export async function submitAvailability(
  id: string,
  payload: AvailabilityPayload,
) {
  return request<{ data: null; message: string }>(
    `/rooms/${id}/availability`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}

export async function updateNickname(
  id: string,
  payload: UpdateNicknamePayload,
) {
  return request<{ data: null; message: string }>(`/rooms/${id}/nickname`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}
