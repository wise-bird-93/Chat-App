import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import socket from "../Socket.js";
import ChatList from "../components/ChatList";
import ChatWindow from "../components/ChatWindow";
import CreateGroup from "../components/CreateGroup";
import GroupChatWindow from "../components/GroupChatWindow";

function Chat({ onLogout }) {
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("token");

  useEffect(() => {
    // tell server this user is online
    socket.emit("userOnline", user.id);

    fetchUsers();
    fetchGroups();

    socket.on("onlineUsers", (onlineUserIds) => {
      setUsers(prev => prev.map(u => ({
        ...u,
        isOnline: onlineUserIds.includes(u._id)
      })));
    });

    // ✅ when tab is closed or refreshed
    const handleBeforeUnload = () => {
      socket.emit("userOffline", user.id);
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      // ✅ when component unmounts (logout)
      socket.emit("userOffline", user.id);
      socket.off("onlineUsers");
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await axios.get("https://chat-app-c6vk.onrender.com/api/Auth/users", {
        headers: { Authorization: `Bearer ${token}` }
      });
      // filter out current user
      const otherUsers = res.data.filter(u => u._id !== user.id);
      setUsers(otherUsers);
    } catch (err) {
      console.log(err);
    }
  };

  const fetchGroups = async () => {
    try {
      const res = await axios.get("https://chat-app-c6vk.onrender.com/api/groups/mygroups", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setGroups(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  const handleLogout = () => {
    onLogout();
    navigate("/login");
  };

  const handleSelectUser = (u) => {
    setSelectedUser(u);
    setSelectedGroup(null);
  };

  const handleSelectGroup = (g) => {
    setSelectedGroup(g);
    setSelectedUser(null);
    // join group room
    socket.emit("joinGroup", g._id);
  };

  return (
    <div style={styles.container}>
      {/* LEFT SIDEBAR */}
      <div style={styles.sidebar}>
        {/* Header */}
        <div style={styles.sidebarHeader}>
          <h3 style={styles.appName}>💬 ChatApp</h3>
          <div style={styles.headerButtons}>
            <button
              style={styles.groupBtn}
              onClick={() => setShowCreateGroup(true)}
            >
              + Group
            </button>
            <button
              style={styles.logoutBtn}
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        </div>

        {/* Logged in user info */}
        <div style={styles.currentUser}>
          👤 {user.username}
        </div>

        {/* Chat List */}
        <ChatList
          users={users}
          groups={groups}
          selectedUser={selectedUser}
          selectedGroup={selectedGroup}
          onSelectUser={handleSelectUser}
          onSelectGroup={handleSelectGroup}
        />
      </div>

      {/* RIGHT CHAT AREA */}
      <div style={styles.chatArea}>
        {selectedUser && (
          <ChatWindow
            selectedUser={selectedUser}
            currentUser={user}
            token={token}
          />
        )}
        {selectedGroup && (
          <GroupChatWindow
            selectedGroup={selectedGroup}
            currentUser={user}
            token={token}
          />
        )}
        {!selectedUser && !selectedGroup && (
          <div style={styles.placeholder}>
            <h2>👈 Select a chat to start messaging</h2>
            <p style={{ color: "#888" }}>Choose a user or group from the left</p>
          </div>
        )}
      </div>

      {/* CREATE GROUP MODAL */}
      {showCreateGroup && (
        <CreateGroup
          users={users}
          token={token}
          onClose={() => setShowCreateGroup(false)}
          onGroupCreated={() => {
            fetchGroups();
            setShowCreateGroup(false);
          }}
        />
      )}
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    height: "100vh",
    backgroundColor: "#f0f2f5"
  },
  sidebar: {
    width: "320px",
    backgroundColor: "#fff",
    borderRight: "1px solid #ddd",
    display: "flex",
    flexDirection: "column"
  },
  sidebarHeader: {
    padding: "16px",
    backgroundColor: "#128C7E",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },
  appName: {
    color: "#fff",
    margin: 0,
    fontSize: "20px"
  },
  headerButtons: {
    display: "flex",
    gap: "8px"
  },
  groupBtn: {
    padding: "6px 10px",
    borderRadius: "6px",
    border: "none",
    backgroundColor: "#075E54",
    color: "#fff",
    cursor: "pointer",
    fontSize: "13px"
  },
  logoutBtn: {
    padding: "6px 10px",
    borderRadius: "6px",
    border: "none",
    backgroundColor: "#ff4444",
    color: "#fff",
    cursor: "pointer",
    fontSize: "13px"
  },
  currentUser: {
    padding: "10px 16px",
    backgroundColor: "#f0f2f5",
    fontSize: "14px",
    color: "#555",
    borderBottom: "1px solid #ddd"
  },
  chatArea: {
    flex: 1,
    display: "flex",
    flexDirection: "column"
  },
  placeholder: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    color: "#333"
  }
};

export default Chat;