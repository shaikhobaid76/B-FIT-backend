const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Health Check
router.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'B-FIT Server is running',
        timestamp: new Date().toISOString(),
        version: '2.0',
        deployment: {
            frontend: 'https://b-fit-gym.vercel.app',       // ✅ YOUR VERCEL FRONTEND
            backend: 'https://b-fit-backend-jy2e.onrender.com',  // ✅ YOUR RENDER BACKEND (AFTER DEPLOY)
            database: 'MongoDB Atlas'
        }
    });
});

// Auth Routes
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);

// Streak Routes
router.post('/streak/update', authController.updateStreak);
router.get('/streak/:userId', authController.getStreak);

// Test Route
router.get('/test', authController.getAllData);

module.exports = router;