const mongoose = require("mongoose");

// Subdocument schema for browsing records
const browsingSchema = new mongoose.Schema({
  email: { type: String, required: true },
  androidId: { type: String, required: true },
  urls: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

// Main user schema
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  browsingData: [browsingSchema] // array of browsing records
});

module.exports = mongoose.model("User", userSchema);
