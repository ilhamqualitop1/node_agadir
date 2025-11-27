const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

// 🔐 Routes accessibles uniquement aux admins
router.get('/users', verifyToken, isAdmin, adminController.getAllUsers);
router.post('/users', verifyToken, isAdmin, adminController.addUser);
router.put('/users/:id', verifyToken, isAdmin, adminController.updateUser);
router.delete('/users/:id', verifyToken, isAdmin, adminController.deleteUser);

module.exports = router;
