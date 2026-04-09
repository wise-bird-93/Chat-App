import { io } from "socket.io-client";

const socket = io("https://chat-app-c6vk.onrender.com", {
  transports: ["polling", "websocket"],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000
});

export default socket;