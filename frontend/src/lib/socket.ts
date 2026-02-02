import type { Socket } from "socket.io-client";
import { API_BASE_URL } from "@/api/client";

let socket: Socket | undefined;
let ioModule: typeof import("socket.io-client") | undefined;

export async function getSocket(): Promise<Socket> {
  if (!ioModule) {
    ioModule = await import("socket.io-client");
  }

  if (!socket) {
    socket = ioModule.io(`${API_BASE_URL}/rooms`, {
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
