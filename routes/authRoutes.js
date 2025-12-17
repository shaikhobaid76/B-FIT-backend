const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// ===============================
// AUTH ROUTES
// ===============================

// Register User
router.post('/register', authController.register);

// Login User
router.post('/login', authController.login);

// Get All Data
router.get('/all-data', authController.getAllData);

// ===============================
// STREAK ROUTES
// ===============================

// Update Streak
router.post('/streak/update', authController.updateStreak);

// Get User Streak
router.get('/streak/:userId', authController.getStreak);

module.exports = router;