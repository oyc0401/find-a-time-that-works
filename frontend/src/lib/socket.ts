import { io, Socket } from "socket.io-client";
import { API_BASE_URL } from "@/api/client";

let socket: Socket | undefined;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(`${API_BASE_URL}/rooms`, {
      autoConnect: false,
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });
  }
  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = undefined;
  }
}
