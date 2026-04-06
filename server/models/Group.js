const mongoose = require("mongoose");

const groupSchema = new mongoose.Schema({
  // group name
  name: {
    type: String,
    required: true,
    trim: true
  },

  // who created the group
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  // all members of the group
  members: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  ],

  // last message preview (for chat list)
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Message",
    default: null
  }

}, { timestamps: true });

module.exports = mongoose.model("Group", groupSchema);