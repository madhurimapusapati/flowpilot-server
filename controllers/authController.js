const User = require("../models/User");
const generateToken = require("../utils/generateToken");

exports.signup = async (req, res) => {
  try {
    const { name, email, password, role, adminKey } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Determine final role
    let assignedRole = "member";
    if (role === "admin") {
      const secret = process.env.ADMIN_SECRET_KEY;
      if (!secret) {
        return res.status(403).json({ message: "Admin signup is disabled" });
      }
      if (!adminKey || adminKey !== secret) {
        return res.status(401).json({ message: "Invalid admin secret key" });
      }
      assignedRole = "admin";
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const user = await User.create({ name, email, password, role: assignedRole });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id, user.role),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/auth/me
exports.getMe = async (req, res) => {
  res.json({
    _id:   req.user._id,
    name:  req.user.name,
    email: req.user.email,
    role:  req.user.role,
    createdAt: req.user.createdAt,
  });
};

// PUT /api/auth/profile  — update name / email
exports.updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;
    if (!name?.trim()) return res.status(400).json({ message: "Name is required" });
    if (!email?.trim()) return res.status(400).json({ message: "Email is required" });

    // Check email not taken by another user
    const conflict = await User.findOne({ email: email.toLowerCase(), _id: { $ne: req.user._id } });
    if (conflict) return res.status(409).json({ message: "Email already in use" });

    req.user.name  = name.trim();
    req.user.email = email.toLowerCase().trim();
    await req.user.save();

    res.json({
      _id:   req.user._id,
      name:  req.user.name,
      email: req.user.email,
      role:  req.user.role,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/auth/password  — change password
exports.updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword)
      return res.status(400).json({ message: "Both fields are required" });
    if (newPassword.length < 6)
      return res.status(400).json({ message: "New password must be at least 6 characters" });

    const user = await User.findById(req.user._id); // need full doc with password
    const match = await user.matchPassword(currentPassword);
    if (!match) return res.status(401).json({ message: "Current password is incorrect" });

    user.password = newPassword; // pre-save hook hashes it
    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/auth/promote  — admin promotes/demotes any user by email
exports.promoteUser = async (req, res) => {
  try {
    const { email, role } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });
    if (![ "admin", "member" ].includes(role))
      return res.status(400).json({ message: "Role must be admin or member" });

    const target = await User.findOne({ email: email.toLowerCase() });
    if (!target) return res.status(404).json({ message: "User not found" });
    if (target._id.toString() === req.user._id.toString())
      return res.status(400).json({ message: "You cannot change your own role" });

    target.role = role;
    await target.save();

    res.json({
      message: `${target.name} is now a ${role}`,
      user: { _id: target._id, name: target.name, email: target.email, role: target.role },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id, user.role),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
