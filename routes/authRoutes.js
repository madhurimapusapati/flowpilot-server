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

module.exports = router;
