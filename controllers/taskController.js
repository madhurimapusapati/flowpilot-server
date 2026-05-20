const Task    = require("../models/Task");
const Project = require("../models/Project");

const POPULATE = [
  { path: "assignee",  select: "name email" },
  { path: "createdBy", select: "name email" },
  { path: "project",   select: "title" },
];

// Verify the requesting user is a member or owner of the project
async function assertProjectAccess(projectId, userId) {
  const project = await Project.findById(projectId);
  if (!project) return { error: "Project not found", status: 404 };

  const isOwner  = project.createdBy.toString() === userId.toString();
  const isMember = project.members.some((m) => m.toString() === userId.toString());
  if (!isOwner && !isMember) return { error: "Access denied", status: 403 };

  return { project };
}

// POST /api/tasks
exports.createTask = async (req, res) => {
  try {
    const { title, description, status, priority, dueDate, project, assignee } = req.body;

    if (!title)   return res.status(400).json({ message: "Task title is required" });
    if (!project) return res.status(400).json({ message: "Project ID is required" });

    const access = await assertProjectAccess(project, req.user._id);
    if (access.error) return res.status(access.status).json({ message: access.error });

    const task = await Task.create({
      title, description, status, priority, dueDate,
      project,
      assignee: assignee || null,
      createdBy: req.user._id,
    });

    const populated = await task.populate(POPULATE);
    res.status(201).json(populated);
  } catch (err) {
    if (err.name === "ValidationError") {
      const msg = Object.values(err.errors)[0].message;
      return res.status(400).json({ message: msg });
    }
    res.status(500).json({ message: err.message });
  }
};

// GET /api/tasks?project=<id>
exports.getTasks = async (req, res) => {
  try {
    const { project } = req.query;
    if (!project) return res.status(400).json({ message: "project query param is required" });

    const access = await assertProjectAccess(project, req.user._id);
    if (access.error) return res.status(access.status).json({ message: access.error });

    const tasks = await Task.find({ project })
      .populate(POPULATE)
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/tasks/recent  — last 6 tasks across all user's projects (for dashboard)
exports.getRecentTasks = async (req, res) => {
  try {
    const userId = req.user._id;

    const projects = await Project.find({
      $or: [{ createdBy: userId }, { members: userId }],
    }).select("_id");

    const projectIds = projects.map((p) => p._id);

    const tasks = await Task.find({ project: { $in: projectIds } })
      .populate(POPULATE)
      .sort({ updatedAt: -1 })
      .limit(6);

    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/tasks/overdue  — all non-done tasks with dueDate < today
exports.getOverdueTasks = async (req, res) => {
  try {
    const userId = req.user._id;

    const projects = await Project.find({
      $or: [{ createdBy: userId }, { members: userId }],
    }).select("_id");

    const projectIds = projects.map((p) => p._id);
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const tasks = await Task.find({
      project: { $in: projectIds },
      status:  { $ne: "done" },
      dueDate: { $lt: now },
    })
      .populate(POPULATE)
      .sort({ dueDate: 1 });

    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/tasks/:id
exports.updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    const access = await assertProjectAccess(task.project, req.user._id);
    if (access.error) return res.status(access.status).json({ message: access.error });

    const allowed = ["title", "description", "status", "priority", "dueDate", "assignee"];
    allowed.forEach((f) => { if (req.body[f] !== undefined) task[f] = req.body[f]; });

    await task.save();
    const populated = await task.populate(POPULATE);
    res.json(populated);
  } catch (err) {
    if (err.name === "ValidationError") {
      const msg = Object.values(err.errors)[0].message;
      return res.status(400).json({ message: msg });
    }
    if (err.name === "CastError") return res.status(400).json({ message: "Invalid task ID" });
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/tasks/:id
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    // Task creator, project owner, or admin can delete
    const project        = await Project.findById(task.project);
    const isTaskCreator  = task.createdBy.toString() === req.user._id.toString();
    const isProjectOwner = project?.createdBy.toString() === req.user._id.toString();
    const isAdmin        = req.user.role === "admin";

    if (!isTaskCreator && !isProjectOwner && !isAdmin) {
      return res.status(403).json({ message: "Not authorized to delete this task" });
    }

    await task.deleteOne();
    res.json({ message: "Task deleted" });
  } catch (err) {
    if (err.name === "CastError") return res.status(400).json({ message: "Invalid task ID" });
    res.status(500).json({ message: err.message });
  }
};
