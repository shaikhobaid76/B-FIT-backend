const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Health Check
router.get('/health', (req, res) => {
    res.json({ 
        success: true, 
        message: 'B-FIT Server is running',
        timestamp: new Date().toISOString(),
        version: '2.0',
        deployment: {
            frontend: 'https://b-fit-gym.vercel.app',
            backend: 'https://b-fit-backend-jy2e.onrender.com',
            database: 'MongoDB Atlas'
        }
    });
});

// Auth Routes
router.post('/register', authController.register);
router.post('/login', authController.login);

// Streak Routes (Simple get)
router.get('/streak/:userId', authController.getStreak);

// Test Route
router.get('/test', authController.getAllData);

module.exports = router;