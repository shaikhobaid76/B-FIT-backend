const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Auth Routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/all-data', authController.getAllData);

// Streak Routes
router.post('/streak/update', authController.updateStreak);
router.get('/streak/:userId', authController.getStreak);

module.exports = router;