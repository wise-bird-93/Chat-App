const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  // sender of the message
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  // receiver (for one-to-one chat)
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  },

  // group (for group chat)
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Group",
    default: null
  },

  // actual message content
  content: {
    type: String,
    required: true,
    trim: true
  },

  // message delivery status
  status: {
    type: String,
    enum: ["sent", "delivered", "read"],
    default: "sent"
  },

  // message type
  messageType: {
    type: String,
    enum: ["private", "group"],
    required: true
  }

}, { timestamps: true });

module.exports = mongoose.model("Message", messageSchema);