import React, { useState, useEffect } from "react";
import socket from "../Socket";

function ChatList({ users, groups, selectedUser, selectedGroup, onSelectUser, onSelectGroup }) {

  // ✅ tracks unread count per userId and groupId
  const [unreadCounts, setUnreadCounts] = useState({});

  useEffect(() => {
    // ✅ listen for unread message notifications
    socket.on("newUnreadMessage", ({ senderId }) => {
      // only add badge if that chat is NOT currently open
      if (!selectedUser || selectedUser._id !== senderId) {
        setUnreadCounts(prev => ({
          ...prev,
          [senderId]: (prev[senderId] || 0) + 1
        }));
      }
    });

    // ✅ listen for clear event from ChatWindow
    const handleClear = (e) => {
      setUnreadCounts(prev => ({ ...prev, [e.detail.userId]: 0 }));
    };
    window.addEventListener("clearUnread", handleClear);

    return () => {
      socket.off("newUnreadMessage");
      window.removeEventListener("clearUnread", handleClear);
    };
  }, [selectedUser]);

  const handleSelectUser = (user) => {
    // ✅ clear badge when opening that chat
    setUnreadCounts(prev => ({ ...prev, [user._id]: 0 }));
    onSelectUser(user);
  };

  return (
    <div style={styles.container}>
      {/* USERS SECTION */}
      <p style={styles.sectionTitle}>👤 Users</p>
      {users.map(u => {
        const unread = unreadCounts[u._id] || 0;
        return (
          <div
            key={u._id}
            style={{
              ...styles.item,
              backgroundColor: selectedUser?._id === u._id ? "#dcf8c6" : "#fff"
            }}
            onClick={() => handleSelectUser(u)}
          >
            <div style={styles.avatar}>
              {u.username.charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <p style={styles.name}>{u.username}</p>
              <p style={styles.email}>{u.email}</p>
            </div>

            {/* ✅ UNREAD BADGE */}
            {unread > 0 && (
              <div style={styles.badge}>
                {unread > 99 ? "99+" : unread}
              </div>
            )}
          </div>
        );
      })}

      {/* GROUPS SECTION */}
      <p style={styles.sectionTitle}>👥 Groups</p>
      {groups.map(g => (
        <div
          key={g._id}
          style={{
            ...styles.item,
            backgroundColor: selectedGroup?._id === g._id ? "#dcf8c6" : "#fff"
          }}
          onClick={() => onSelectGroup(g)}
        >
          <div style={{ ...styles.avatar, backgroundColor: "#128C7E" }}>
            #
          </div>
          <div>
            <p style={styles.name}>{g.name}</p>
            <p style={styles.email}>{g.members.length} members</p>
          </div>
        </div>
      ))}
    </div>
  );
}

const styles = {
  container: {
    flex: 1,
    overflowY: "auto"
  },
  sectionTitle: {
    padding: "8px 16px",
    margin: 0,
    fontSize: "13px",
    fontWeight: "bold",
    color: "#888",
    backgroundColor: "#f0f2f5"
  },
  item: {
    display: "flex",
    alignItems: "center",
    padding: "12px 16px",
    cursor: "pointer",
    borderBottom: "1px solid #f0f2f5",
    gap: "12px"
  },
  avatar: {
    width: "42px",
    height: "42px",
    borderRadius: "50%",
    backgroundColor: "#128C7E",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "bold",
    fontSize: "18px",
    flexShrink: 0
  },
  name: {
    margin: 0,
    fontWeight: "bold",
    fontSize: "15px"
  },
  email: {
    margin: 0,
    fontSize: "12px",
    color: "#888"
  },
  // ✅ NEW
  badge: {
    backgroundColor: "#25D366",
    color: "#fff",
    borderRadius: "50%",
    minWidth: "22px",
    height: "22px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "12px",
    fontWeight: "bold",
    padding: "0 4px",
    flexShrink: 0
  }
};

export default ChatList;