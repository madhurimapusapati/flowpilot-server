const express = require("express");
const router = express.Router();
const { protect, adminOnly } = require("../middleware/authMiddleware");
const {
  createProject,
  getAllProjects,
  getProjectById,
  updateProject,
  deleteProject,
  getDashboardStats,
} = require("../controllers/projectController");

router.use(protect);

// /stats MUST be before /:id — otherwise Express matches "stats" as an ID param
router.get("/stats", getDashboardStats);

router.get("/", getAllProjects);
router.post("/", adminOnly, createProject);       // only admins create projects
router.route("/:id").get(getProjectById).put(updateProject).delete(deleteProject);

module.exports = router;
