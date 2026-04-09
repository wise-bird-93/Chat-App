const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

dotenv.config();

const app = express();
app.use(cors({
  origin: "http://localhost:3000",
  methods: ["GET", "POST", "PUT", "DELETE"]
}));
app.use(express.json());

// routes
const authRoutes = require("./routes/Auth");
const messageRoutes = require("./routes/message");
const groupRoutes = require("./routes/group");

app.use("/api/Auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/groups", groupRoutes);

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  family: 4
})
.then(() => console.log("MongoDB Connected ✅"))
.catch(err => console.log(err));

// ✅ create http server from express app
const server = http.createServer(app);

// ✅ attach socket.io to http server
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// ✅ store online users
const onlineUsers = {};

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // 1. USER JOINS
  socket.on("userOnline", (userId) => {
    onlineUsers[userId] = socket.id;
    console.log("Online users:", onlineUsers);
    io.emit("onlineUsers", Object.keys(onlineUsers));
  });

  // 2. PRIVATE MESSAGE
socket.on("privateMessage", async (data) => {
    try {
      if (typeof data === "string") {
        data = JSON.parse(data);
      }

      const { senderId, receiverId, content, messageId } = data;

      if (!senderId || !receiverId || !content) return;

      const receiverSocketId = onlineUsers[receiverId];
      if (receiverSocketId) {
        // ✅ only emit to RECEIVER, not sender
        io.to(receiverSocketId).emit("privateMessage", {
          senderId,
          content,
          messageId,
          createdAt: new Date()
        });

        // update status to delivered
        if (messageId) {
          const Message = require("./models/Message");
          await Message.findByIdAndUpdate(messageId, { status: "delivered" });
        }

        // ✅ notify only the SENDER about delivery
        socket.emit("messageDelivered", { messageId });
      }

    } catch (err) {
      console.log("privateMessage error:", err.message);
    }
  });

  // 3. GROUP MESSAGE
  socket.on("groupMessage", async (data) => {
    try {
      console.log("Received groupMessage data:", data); // debug

      // handle both string and object data from Postman
      if (typeof data === "string") {
        data = JSON.parse(data);
      }

      const { senderId, groupId, content } = data;

      // validate
      if (!senderId || !groupId || !content) {
        console.log("Missing fields:", { senderId, groupId, content });
        return;
      }

      const Message = require("./models/Message");
      const Group = require("./models/Group");

      const message = new Message({
        sender: senderId,
        group: groupId,
        content,
        messageType: "group",
        status: "sent"
      });
      await message.save();
      console.log("Group message saved to DB ✅");

      // update lastMessage in group
      await Group.findByIdAndUpdate(groupId, { lastMessage: message._id });

      // send to all members in group room
      socket.to(groupId).emit("groupMessage", {
        senderId,
        groupId,
        content,
        messageId: message._id,
        createdAt: message.createdAt
      });

    } catch (err) {
      console.log("groupMessage error:", err.message);
    }
  });

  // 4. JOIN GROUP ROOM
  socket.on("joinGroup", (groupId) => {
    // handle both string and object data from Postman
    if (typeof groupId === "string") {
      groupId = groupId.replace(/"/g, "");
    }
    socket.join(groupId);
    console.log(`User joined group: ${groupId}`);
  });

  // 5. TYPING INDICATOR
  socket.on("typing", (data) => {
    try {
      console.log("Typing data:", data); // debug

      if (typeof data === "string") {
        data = JSON.parse(data);
      }

      const { senderId, receiverId, isGroup, groupId } = data;

      if (isGroup) {
        socket.to(groupId).emit("typing", { senderId, groupId });
      } else {
        const receiverSocketId = onlineUsers[receiverId];
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("typing", { senderId });
        }
      }
    } catch (err) {
      console.log("typing error:", err.message);
    }
  });

  // 6. STOP TYPING
  socket.on("stopTyping", (data) => {
    try {
      if (typeof data === "string") {
        data = JSON.parse(data);
      }

      const { senderId, receiverId, isGroup, groupId } = data;

      if (isGroup) {
        socket.to(groupId).emit("stopTyping", { senderId, groupId });
      } else {
        const receiverSocketId = onlineUsers[receiverId];
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("stopTyping", { senderId });
        }
      }
    } catch (err) {
      console.log("stopTyping error:", err.message);
    }
  });

  // 7. MESSAGE READ
  socket.on("messageRead", async (data) => {
    try {
      if (typeof data === "string") {
        data = JSON.parse(data);
      }

      const { messageId, senderId } = data;

      if (!messageId || !senderId) return;

      const Message = require("./models/Message");
      await Message.findByIdAndUpdate(messageId, { status: "read" });
      console.log("Message marked as read ✅");

      // notify sender
      const senderSocketId = onlineUsers[senderId];
      if (senderSocketId) {
        io.to(senderSocketId).emit("messageRead", { messageId });
      }
    } catch (err) {
      console.log("messageRead error:", err.message);
    }
  });

  // 8. USER DISCONNECTS
  socket.on("disconnect", () => {
    for (const userId in onlineUsers) {
      if (onlineUsers[userId] === socket.id) {
        delete onlineUsers[userId];
        console.log("User went offline:", userId);
        break;
      }
    }
    io.emit("onlineUsers", Object.keys(onlineUsers));
    console.log("User disconnected:", socket.id);
  });
});

// ✅ use server.listen not app.listen
server.listen(5000, () => {
  console.log("Server running on port 5000 🚀");
});