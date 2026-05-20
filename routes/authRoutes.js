const express    = require("express");
const router     = express.Router();
const { protect, adminOnly } = require("../middleware/authMiddleware");
const authController = require("../controllers/authController");

router.post("/signup",  authController.signup);
router.post("/login",   authController.login);

// Protected profile routes
router.get ("/me",       protect,              authController.getMe);
router.put ("/profile",  protect,              authController.updateProfile);
router.put ("/password", protect,              authController.updatePassword);

// Admin-only route — promote or demote any user
router.put ("/promote",  protect, adminOnly,   authController.promoteUser);

// GET all users — admin only (for adding members to projects)
router.get ("/users",    protect, adminOnly,   authController.getAllUsers);

module.exports = router;
