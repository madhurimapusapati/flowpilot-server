const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Project title is required"],
      trim: true,
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
      default: "",
    },
    status: {
      type: String,
      enum: {
        values: ["Planning", "Active", "Completed"],
        message: "Status must be Planning, Active, or Completed",
      },
      default: "Planning",
    },
    dueDate: {
      type: Date,
      default: null,
    },
    progress: {
      type: Number,
      min: [0, "Progress cannot be less than 0"],
      max: [100, "Progress cannot exceed 100"],
      default: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);

// Ensure createdBy is always in members list
projectSchema.pre("save", function () {
  const creatorId = this.createdBy.toString();

  const alreadyMember = this.members.some(
    (m) => m.toString() === creatorId
  );

  if (!alreadyMember) {
    this.members.unshift(this.createdBy);
  }
});
module.exports = mongoose.model("Project", projectSchema);
