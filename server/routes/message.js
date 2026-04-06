const express = require("express");
const router = express.Router();
const Message = require("../models/Message");
const protect = require("../middleware/authMiddleware");

// SEND PRIVATE MESSAGE
router.post("/send", protect, async (req, res) => {
  try {
    const { receiverId, content } = req.body;

    if (!receiverId || !content) {
      return res.status(400).json({ message: "Receiver and content are required" });
    }

    const message = new Message({
      sender: req.user.id,
      receiver: receiverId,
      content,
      messageType: "private",
      status: "sent"
    });

    await message.save();

    res.status(201).json({ message: "Message sent", data: message });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET PRIVATE MESSAGES BETWEEN TWO USERS
router.get("/conversation/:userId", protect, async (req, res) => {
  try {
    const messages = await Message.find({
      messageType: "private",
      $or: [
        { sender: req.user.id, receiver: req.params.userId },
        { sender: req.params.userId, receiver: req.user.id }
      ]
    })
    .sort({ createdAt: 1 })
    .populate("sender", "username email")
    .populate("receiver", "username email");

    res.json(messages);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE MESSAGE STATUS
router.put("/status/:messageId", protect, async (req, res) => {
  try {
    const { status } = req.body;

    if (!["sent", "delivered", "read"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const message = await Message.findByIdAndUpdate(
      req.params.messageId,
      { status },
      { new: true }
    );

    res.json({ message: "Status updated", data: message });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;