import React from "react";

function ChatList({ users, groups, selectedUser, selectedGroup, onSelectUser, onSelectGroup }) {
  return (
    <div style={styles.container}>
      {/* USERS SECTION */}
      <p style={styles.sectionTitle}>👤 Users</p>
      {users.map(u => (
        <div
          key={u._id}
          style={{
            ...styles.item,
            backgroundColor: selectedUser?._id === u._id ? "#dcf8c6" : "#fff"
          }}
          onClick={() => onSelectUser(u)}
        >
          <div style={styles.avatar}>
            {u.username.charAt(0).toUpperCase()}
          </div>
          <div>
            <p style={styles.name}>{u.username}</p>
            <p style={styles.email}>{u.email}</p>
          </div>
        </div>
      ))}

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
  }
};

export default ChatList;