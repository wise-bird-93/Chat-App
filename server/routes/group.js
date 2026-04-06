const express = require("express");
const router = express.Router();
const Group = require("../models/Group");
const Message = require("../models/Message");
const protect = require("../middleware/authMiddleware");

// CREATE GROUP
router.post("/create", protect, async (req, res) => {
  try {
    const { name, members } = req.body;

    if (!name || !members || members.length === 0) {
      return res.status(400).json({ message: "Group name and members are required" });
    }

    // always include admin in members
    const allMembers = [...new Set([...members, req.user.id])];

    const group = new Group({
      name,
      admin: req.user.id,
      members: allMembers
    });

    await group.save();

    res.status(201).json({ message: "Group created", data: group });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET ALL GROUPS OF LOGGED IN USER
router.get("/mygroups", protect, async (req, res) => {
  try {
    const groups = await Group.find({ members: req.user.id })
      .populate("members", "username email")
      .populate("admin", "username email")
      .populate("lastMessage");

    res.json(groups);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// SEND GROUP MESSAGE
router.post("/send/:groupId", protect, async (req, res) => {
  try {
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ message: "Content is required" });
    }

    // check if user is a member
    const group = await Group.findById(req.params.groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    const isMember = group.members.includes(req.user.id);
    if (!isMember) {
      return res.status(403).json({ message: "You are not a member of this group" });
    }

    const message = new Message({
      sender: req.user.id,
      group: req.params.groupId,
      content,
      messageType: "group",
      status: "sent"
    });

    await message.save();

    // update lastMessage in group
    group.lastMessage = message._id;
    await group.save();

    res.status(201).json({ message: "Group message sent", data: message });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET ALL MESSAGES OF A GROUP
router.get("/messages/:groupId", protect, async (req, res) => {
  try {
    const messages = await Message.find({
      group: req.params.groupId,
      messageType: "group"
    })
    .sort({ createdAt: 1 })
    .populate("sender", "username email");

    res.json(messages);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;