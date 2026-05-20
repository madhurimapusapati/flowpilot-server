const express = require("express");
const router  = express.Router();
const { protect, adminOnly } = require("../middleware/authMiddleware");
const {
  createTask,
  getTasks,
  getRecentTasks,
  getOverdueTasks,
  updateTask,
  deleteTask,
} = require("../controllers/taskController");

router.use(protect);

// named routes MUST be before /:id
router.get("/recent",  getRecentTasks);
router.get("/overdue", getOverdueTasks);

router.get("/", getTasks);
router.post("/", adminOnly, createTask);          // only admins create tasks
router.put("/:id", updateTask);                   // members can update (toggle status)
router.delete("/:id", deleteTask);

module.exports = router;
