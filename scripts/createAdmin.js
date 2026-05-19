/**
 * FlowPilot — Create Admin Script
 * Run once from the server folder:
 *   node scripts/createAdmin.js
 */

require("dotenv").config();
const mongoose = require("mongoose");
const User     = require("../models/User");

const ADMIN = {
  name:     "Admin",
  email:    "admin@flowpilot.io",  // change before running
  password: "Admin@1234",          // change before running
};

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");

    const existing = await User.findOne({ email: ADMIN.email });

    if (existing) {
      console.log(`User already exists — email: ${existing.email}, role: ${existing.role}`);
      if (existing.role !== "admin") {
        existing.role = "admin";
        await existing.save();
        console.log("Promoted to admin successfully.");
      } else {
        console.log("Already an admin. Nothing to do.");
      }
      process.exit(0);
    }

    const admin = await User.create({ ...ADMIN, role: "admin" });
    console.log(`Admin created — email: ${admin.email}, id: ${admin._id}`);
    process.exit(0);
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
}

createAdmin();
