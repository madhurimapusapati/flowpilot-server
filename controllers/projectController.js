const Project = require("../models/Project");
const Task    = require("../models/Task");

// Shared populate config
const POPULATE = [
  { path: "createdBy", select: "name email" },
  { path: "members", select: "name email" },
];

// POST /api/projects
exports.createProject = async (req, res) => {
  try {
    const { title, description, status, dueDate, progress, members } = req.body;

    if (!title) {
      return res.status(400).json({ message: "Project title is required" });
    }

    const project = await Project.create({
      title,
      description,
      status,
      dueDate,
      progress,
      members: members || [],
      createdBy: req.user._id,
    });

    const populated = await project.populate(POPULATE);
    res.status(201).json(populated);
  } catch (err) {
    // Mongoose validation errors
    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ message: messages[0] });
    }
    res.status(500).json({ message: err.message });
  }
};

// GET /api/projects
exports.getAllProjects = async (req, res) => {
  try {
    const projects = await Project.find({
      $or: [{ createdBy: req.user._id }, { members: req.user._id }],
    })
      .populate(POPULATE)
      .sort({ createdAt: -1 });

    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/projects/:id
exports.getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).populate(POPULATE);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const isMember =
      project.createdBy._id.toString() === req.user._id.toString() ||
      project.members.some((m) => m._id.toString() === req.user._id.toString());

    if (!isMember) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json(project);
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(400).json({ message: "Invalid project ID" });
    }
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/projects/:id
exports.updateProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const isOwner = project.createdBy.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "Only the project owner or an admin can update it" });
    }

    const allowed = ["title", "description", "status", "dueDate", "progress", "members"];
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) project[field] = req.body[field];
    });

    await project.save();
    const populated = await project.populate(POPULATE);
    res.json(populated);
  } catch (err) {
    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ message: messages[0] });
    }
    if (err.name === "CastError") {
      return res.status(400).json({ message: "Invalid project ID" });
    }
    res.status(500).json({ message: err.message });
  }
};

// GET /api/projects/stats  — dashboard analytics
exports.getDashboardStats = async (req, res) => {
  try {
    const userId = req.user._id;

    // All projects this user owns or is a member of
    const userFilter = { $or: [{ createdBy: userId }, { members: userId }] };

    const [statusCounts, recentProjects, taskCounts] = await Promise.all([
      // Count projects grouped by status
      Project.aggregate([
        { $match: userFilter },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),

      // 4 most recently updated projects
      Project.find(userFilter)
        .populate({ path: "createdBy", select: "name email" })
        .populate({ path: "members",   select: "name email" })
        .sort({ updatedAt: -1 })
        .limit(4),

      // Task counts across all user projects
      Task.aggregate([
        { $match: { project: { $in: await Project.find(userFilter).distinct("_id") } } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
    ]);

    // Shape status counts into a flat object  { Planning: 2, Active: 5, Completed: 1 }
    const byStatus = { Planning: 0, Active: 0, Completed: 0 };
    statusCounts.forEach(({ _id, count }) => {
      if (_id in byStatus) byStatus[_id] = count;
    });

    const totalProjects = byStatus.Planning + byStatus.Active + byStatus.Completed;

    // Average progress across all projects
    const progressAgg = await Project.aggregate([
      { $match: userFilter },
      { $group: { _id: null, avgProgress: { $avg: "$progress" } } },
    ]);
    const avgProgress = progressAgg[0]
      ? Math.round(progressAgg[0].avgProgress)
      : 0;

    // Shape task counts
    let totalTasks = 0, completedTasks = 0;
    taskCounts.forEach(({ _id, count }) => {
      totalTasks += count;
      if (_id === "done") completedTasks = count;
    });

    res.json({
      totalProjects,
      byStatus,
      avgProgress,
      totalTasks,
      completedTasks,
      recentProjects,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/projects/:id
exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const isOwner = project.createdBy.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "Only the project owner or an admin can delete it" });
    }

    await project.deleteOne();
    res.json({ message: "Project deleted successfully" });
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(400).json({ message: "Invalid project ID" });
    }
    res.status(500).json({ message: err.message });
  }
};
