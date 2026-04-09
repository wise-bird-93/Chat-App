import { io } from "socket.io-client";

const socket = io("https://chat-app-c6vk.onrender.com");

export default socket;