import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import socket from "../Socket";

function ChatWindow({ selectedUser, currentUser, token }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    // reset state when switching users
    setMessages([]);
    setIsTyping(false);
    setNewMessage("");

    fetchMessages();

    window.dispatchEvent(new CustomEvent("clearUnread", {
      detail: { userId: selectedUser._id }
    }));

    // ✅ remove ALL old listeners before adding new ones
    socket.off("privateMessage");
    socket.off("typing");
    socket.off("stopTyping");
    socket.off("messageDelivered");
    socket.off("messageRead");

    // ✅ incoming message from other user
    socket.on("privateMessage", (data) => {
      // ✅ only add message if it's FROM the other user
      // never add our own messages here (we already add them in sendMessage)
      if (data.senderId === selectedUser._id && 
          data.senderId !== currentUser.id) {
        setMessages(prev => [...prev, {
          _id: data.messageId,
          sender: { _id: data.senderId },
          content: data.content,
          status: "delivered",
          createdAt: data.createdAt
        }]);
      }
    });

    // ✅ typing indicator
    socket.on("typing", (data) => {
      if (data.senderId === selectedUser._id) {
        setIsTyping(true);
      }
    });

    // ✅ stop typing
    socket.on("stopTyping", (data) => {
      if (data.senderId === selectedUser._id) {
        setIsTyping(false);
      }
    });

    // ✅ message delivered status
    socket.on("messageDelivered", ({ messageId }) => {
      setMessages(prev =>
        prev.map(m =>
          m._id === messageId ? { ...m, status: "delivered" } : m
        )
      );
    });

    // ✅ message read status
    socket.on("messageRead", ({ messageId }) => {
      setMessages(prev =>
        prev.map(m =>
          m._id === messageId ? { ...m, status: "read" } : m
        )
      );
    });

    return () => {
      socket.off("privateMessage");
      socket.off("typing");
      socket.off("stopTyping");
      socket.off("messageDelivered");
      socket.off("messageRead");
    };
  }, [selectedUser._id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const res = await axios.get(
        `https://chat-app-c6vk.onrender.com/api/messages/conversation/${selectedUser._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessages(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);

    // emit typing event
    socket.emit("typing", {
      senderId: currentUser.id,
      receiverId: selectedUser._id,
      isGroup: false
    });

    // clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // stop typing after 1.5 seconds
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("stopTyping", {
        senderId: currentUser.id,
        receiverId: selectedUser._id,
        isGroup: false
      });
    }, 1500);
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    const messageContent = newMessage;
    setNewMessage("");

    try {
      // ✅ save to DB via API to get real _id
      const res = await axios.post(
        "https://chat-app-c6vk.onrender.com/api/messages/send",
        {
          receiverId: selectedUser._id,
          content: messageContent
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const savedMessage = res.data.data;

      // ✅ add to local state with real _id
      setMessages(prev => [...prev, {
        _id: savedMessage._id,
        sender: { _id: currentUser.id },
        content: messageContent,
        status: "sent",
        createdAt: savedMessage.createdAt
      }]);

      // ✅ emit via socket for real-time delivery to receiver
      socket.emit("privateMessage", {
        senderId: currentUser.id,
        receiverId: selectedUser._id,
        content: messageContent,
        messageId: savedMessage._id
      });

      // stop typing
      socket.emit("stopTyping", {
        senderId: currentUser.id,
        receiverId: selectedUser._id,
        isGroup: false
      });

    } catch (err) {
      console.log(err);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") sendMessage();
  };

  const getStatusIcon = (status) => {
    if (status === "sent") return <span style={{ color: "#888" }}>✓</span>;
    if (status === "delivered") return <span style={{ color: "#888" }}>✓✓</span>;
    if (status === "read") return <span style={{ color: "#53bdeb" }}>✓✓</span>;
    return "";
  };

  return (
    <div style={styles.container}>
      {/* HEADER */}
      <div style={styles.header}>
        <div style={styles.avatar}>
          {selectedUser.username.charAt(0).toUpperCase()}
        </div>
        <div>
          <p style={styles.name}>{selectedUser.username}</p>
          {isTyping
            ? <p style={styles.typing}>typing...</p>
            : <p style={styles.online}>
                {selectedUser.isOnline ? "🟢 online" : "⚪ offline"}
              </p>
          }
        </div>
      </div>

      {/* MESSAGES */}
      <div style={styles.messages}>
        {messages.map((msg, index) => {
          const isMine = msg.sender._id === currentUser.id ||
                         msg.sender === currentUser.id;
          return (
            <div
              key={index}
              style={{
                ...styles.messageBubble,
                alignSelf: isMine ? "flex-end" : "flex-start",
                backgroundColor: isMine ? "#dcf8c6" : "#fff"
              }}
            >
              <p style={styles.messageText}>{msg.content}</p>
              <div style={styles.messageMeta}>
                <span style={styles.time}>
                  {new Date(msg.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit"
                  })}
                </span>
                {isMine && (
                  <span style={styles.status}>
                    {getStatusIcon(msg.status)}
                  </span>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* INPUT */}
      <div style={styles.inputArea}>
        <input
          style={styles.input}
          type="text"
          placeholder="Type a message..."
          value={newMessage}
          onChange={handleTyping}
          onKeyPress={handleKeyPress}
        />
        <button style={styles.sendBtn} onClick={sendMessage}>
          Send ➤
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    height: "100vh"
  },
  header: {
    padding: "12px 16px",
    backgroundColor: "#128C7E",
    display: "flex",
    alignItems: "center",
    gap: "12px"
  },
  avatar: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    backgroundColor: "#075E54",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "bold",
    fontSize: "18px"
  },
  name: {
    margin: 0,
    color: "#fff",
    fontWeight: "bold",
    fontSize: "16px"
  },
  online: {
    margin: 0,
    color: "#dcf8c6",
    fontSize: "12px"
  },
  typing: {
    margin: 0,
    color: "#dcf8c6",
    fontSize: "12px",
    fontStyle: "italic"
  },
  messages: {
    flex: 1,
    overflowY: "auto",
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    backgroundColor: "#e5ddd5"
  },
  messageBubble: {
    maxWidth: "65%",
    padding: "8px 12px",
    borderRadius: "8px",
    boxShadow: "0 1px 2px rgba(0,0,0,0.1)"
  },
  messageText: {
    margin: 0,
    fontSize: "15px"
  },
  messageMeta: {
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: "4px",
    marginTop: "4px"
  },
  time: {
    fontSize: "11px",
    color: "#888"
  },
  status: {
    fontSize: "12px"
  },
  inputArea: {
    padding: "12px 16px",
    backgroundColor: "#f0f2f5",
    display: "flex",
    gap: "8px",
    alignItems: "center"
  },
  input: {
    flex: 1,
    padding: "10px 16px",
    borderRadius: "24px",
    border: "1px solid #ddd",
    fontSize: "15px",
    outline: "none"
  },
  sendBtn: {
    padding: "10px 20px",
    borderRadius: "24px",
    border: "none",
    backgroundColor: "#128C7E",
    color: "#fff",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "14px"
  }
};

export default ChatWindow;