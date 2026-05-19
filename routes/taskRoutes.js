const express = require("express");
const router  = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  createTask,
  getTasks,
  getRecentTasks,
  updateTask,
  deleteTask,
} = require("../controllers/taskController");

router.use(protect);

// /recent MUST be before /:id — otherwise Express treats "recent" as an ID
router.get("/recent", getRecentTasks);

router.route("/").get(getTasks).post(createTask);
router.route("/:id").put(updateTask).delete(deleteTask);

module.exports = router;
