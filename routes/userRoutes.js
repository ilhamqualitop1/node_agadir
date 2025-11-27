const express = require("express");
const router = express.Router();
const {
  registerUser,
  loginUser,
  getAllUsers,
  deleteUser,
} = require("../controllers/userController");

const { verifyToken, isAdmin } = require("../middleware/authMiddleware");

// Routes publiques
router.post("/register", registerUser);
router.post("/login", loginUser);
// Routes accessibles uniquement aux admins
router.get("/", verifyToken, isAdmin, getAllUsers);
router.delete("/:id", verifyToken, isAdmin, deleteUser);

module.exports = router;
