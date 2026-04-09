import React, { useState } from "react";
import axios from "axios";

function CreateGroup({ users, token, onClose, onGroupCreated }) {
  const [groupName, setGroupName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const toggleMember = (userId) => {
    setSelectedMembers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleCreate = async () => {
    try {
      if (!groupName.trim()) {
        setError("Group name is required");
        return;
      }
      if (selectedMembers.length === 0) {
        setError("Select at least one member");
        return;
      }

      setLoading(true);
      setError("");

      await axios.post(
        "http://localhost:5000/api/groups/create",
        { name: groupName, members: selectedMembers },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      onGroupCreated();

    } catch (err) {
      setError(err.response?.data?.message || "Failed to create group");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        {/* HEADER */}
        <div style={styles.header}>
          <h3 style={styles.title}>👥 Create New Group</h3>
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {error && <p style={styles.error}>{error}</p>}

        {/* GROUP NAME */}
        <input
          style={styles.input}
          type="text"
          placeholder="Group name..."
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
        />

        {/* MEMBER SELECTION */}
        <p style={styles.label}>Select Members:</p>
        <div style={styles.memberList}>
          {users.map(u => (
            <div
              key={u._id}
              style={{
                ...styles.memberItem,
                backgroundColor: selectedMembers.includes(u._id)
                  ? "#dcf8c6"
                  : "#f9f9f9"
              }}
              onClick={() => toggleMember(u._id)}
            >
              <div style={styles.avatar}>
                {u.username.charAt(0).toUpperCase()}
              </div>
              <span style={styles.memberName}>{u.username}</span>
              {selectedMembers.includes(u._id) && (
                <span style={styles.checkmark}>✓</span>
              )}
            </div>
          ))}
        </div>

        {/* SELECTED COUNT */}
        <p style={styles.selectedCount}>
          {selectedMembers.length} member(s) selected
        </p>

        {/* CREATE BUTTON */}
        <button
          style={styles.createBtn}
          onClick={handleCreate}
          disabled={loading}
        >
          {loading ? "Creating..." : "Create Group"}
        </button>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000
  },
  modal: {
    backgroundColor: "#fff",
    borderRadius: "12px",
    padding: "24px",
    width: "100%",
    maxWidth: "400px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    maxHeight: "80vh",
    overflowY: "auto"
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },
  title: {
    margin: 0,
    fontSize: "18px"
  },
  closeBtn: {
    background: "none",
    border: "none",
    fontSize: "18px",
    cursor: "pointer",
    color: "#888"
  },
  error: {
    color: "red",
    margin: 0,
    fontSize: "14px"
  },
  input: {
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid #ddd",
    fontSize: "15px",
    outline: "none"
  },
  label: {
    margin: 0,
    fontWeight: "bold",
    color: "#555",
    fontSize: "14px"
  },
  memberList: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    maxHeight: "250px",
    overflowY: "auto"
  },
  memberItem: {
    display: "flex",
    alignItems: "center",
    padding: "10px 12px",
    borderRadius: "8px",
    cursor: "pointer",
    gap: "10px",
    border: "1px solid #eee"
  },
  avatar: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    backgroundColor: "#128C7E",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "bold",
    fontSize: "16px",
    flexShrink: 0
  },
  memberName: {
    flex: 1,
    fontSize: "15px"
  },
  checkmark: {
    color: "#128C7E",
    fontWeight: "bold",
    fontSize: "16px"
  },
  selectedCount: {
    margin: 0,
    fontSize: "13px",
    color: "#888",
    textAlign: "center"
  },
  createBtn: {
    padding: "12px",
    borderRadius: "8px",
    border: "none",
    backgroundColor: "#128C7E",
    color: "#fff",
    fontSize: "16px",
    cursor: "pointer",
    fontWeight: "bold"
  }
};

export default CreateGroup;