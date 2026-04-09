import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import socket from "../Socket";

function GroupChatWindow({ selectedGroup, currentUser, token }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchMessages();

    // listen for incoming group messages
    socket.on("groupMessage", (data) => {
      if (data.groupId === selectedGroup._id) {
        setMessages(prev => [...prev, {
          sender: { _id: data.senderId, username: data.senderName },
          content: data.content,
          createdAt: data.createdAt
        }]);
      }
    });

    // listen for typing in group
    socket.on("typing", (data) => {
      if (data.groupId === selectedGroup._id) {
        setIsTyping(true);
        setTypingUser(data.senderId);
      }
    });

    // listen for stop typing
    socket.on("stopTyping", (data) => {
      if (data.groupId === selectedGroup._id) {
        setIsTyping(false);
        setTypingUser("");
      }
    });

    return () => {
      socket.off("groupMessage");
      socket.off("typing");
      socket.off("stopTyping");
    };
  }, [selectedGroup]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const res = await axios.get(
        `https://chat-app-c6vk.onrender.com/api/groups/messages/${selectedGroup._id}`,
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

  let typingTimeout;
  const handleTyping = (e) => {
    setNewMessage(e.target.value);

    socket.emit("typing", {
      senderId: currentUser.id,
      isGroup: true,
      groupId: selectedGroup._id
    });

    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
      socket.emit("stopTyping", {
        senderId: currentUser.id,
        isGroup: true,
        groupId: selectedGroup._id
      });
    }, 1500);
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      socket.emit("groupMessage", {
        senderId: currentUser.id,
        groupId: selectedGroup._id,
        content: newMessage
      });

      // add to local messages immediately
      setMessages(prev => [...prev, {
        sender: { _id: currentUser.id, username: currentUser.username },
        content: newMessage,
        createdAt: new Date()
      }]);

      setNewMessage("");

      socket.emit("stopTyping", {
        senderId: currentUser.id,
        isGroup: true,
        groupId: selectedGroup._id
      });

    } catch (err) {
      console.log(err);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") sendMessage();
  };

  return (
    <div style={styles.container}>
      {/* HEADER */}
      <div style={styles.header}>
        <div style={styles.avatar}>#</div>
        <div>
          <p style={styles.name}>{selectedGroup.name}</p>
          {isTyping
            ? <p style={styles.typing}>someone is typing...</p>
            : <p style={styles.members}>
                {selectedGroup.members.length} members
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
              {!isMine && (
                <p style={styles.senderName}>
                  {msg.sender.username || "User"}
                </p>
              )}
              <p style={styles.messageText}>{msg.content}</p>
              <p style={styles.time}>
                {new Date(msg.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit"
                })}
              </p>
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
    fontSize: "20px"
  },
  name: {
    margin: 0,
    color: "#fff",
    fontWeight: "bold",
    fontSize: "16px"
  },
  members: {
    margin: 0,
    color: "#dcf8c6",
    fontSize: "12px"
  },
  typing: {
    margin: 0,
    color: "#dcf8c6",
    fontSize: "12px"
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
  senderName: {
    margin: "0 0 4px 0",
    fontSize: "12px",
    fontWeight: "bold",
    color: "#128C7E"
  },
  messageText: {
    margin: 0,
    fontSize: "15px"
  },
  time: {
    margin: "4px 0 0 0",
    fontSize: "11px",
    color: "#888",
    textAlign: "right"
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

export default GroupChatWindow;