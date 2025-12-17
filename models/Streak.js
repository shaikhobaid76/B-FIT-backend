const express = require('express');
const router = express.Router();
const Streak = require('../models/Streak');

// ✅ Update or create streak
router.post('/update', async (req, res) => {
    try {
        const { userId, currentStreak, highestStreak, lastWorkoutDate } = req.body;
        
        console.log('Streak Update Request:', req.body);
        
        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }
        
        // Try to find existing streak
        let streak = await Streak.findOne({ userId: userId });
        
        if (streak) {
            // Update existing streak
            streak.currentStreak = currentStreak || streak.currentStreak;
            streak.highestStreak = Math.max(highestStreak || 0, streak.highestStreak);
            streak.lastWorkoutDate = lastWorkoutDate ? new Date(lastWorkoutDate) : streak.lastWorkoutDate;
            streak.workoutCount += 1;
            
            await streak.save();
            console.log('✅ Streak updated:', streak);
        } else {
            // Create new streak
            streak = new Streak({
                userId: userId,
                currentStreak: currentStreak || 1,
                highestStreak: highestStreak || 1,
                lastWorkoutDate: lastWorkoutDate ? new Date(lastWorkoutDate) : new Date(),
                workoutCount: 1
            });
            
            await streak.save();
            console.log('✅ New streak created:', streak);
        }
        
        res.json({
            success: true,
            message: 'Streak updated successfully',
            streak: {
                currentStreak: streak.currentStreak,
                highestStreak: streak.highestStreak,
                lastWorkoutDate: streak.lastWorkoutDate,
                workoutCount: streak.workoutCount
            }
        });
        
    } catch (error) {
        console.error('❌ Streak update error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to update streak',
            details: error.message 
        });
    }
});

// ✅ Get streak by userId
router.get('/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        
        console.log('Fetching streak for user:', userId);
        
        const streak = await Streak.findOne({ userId: userId });
        
        if (!streak) {
            return res.json({
                success: true,
                streak: {
                    currentStreak: 0,
                    highestStreak: 0,
                    lastWorkoutDate: null,
                    workoutCount: 0
                }
            });
        }
        
        res.json({
            success: true,
            streak: {
                currentStreak: streak.currentStreak,
                highestStreak: streak.highestStreak,
                lastWorkoutDate: streak.lastWorkoutDate,
                workoutCount: streak.workoutCount
            }
        });
        
    } catch (error) {
        console.error('❌ Get streak error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch streak' 
        });
    }
});

// ✅ Sync local streak with MongoDB
router.post('/sync', async (req, res) => {
    try {
        const { userId, currentStreak, highestStreak, lastWorkoutDate } = req.body;
        
        console.log('Streak Sync Request:', req.body);
        
        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }
        
        let streak = await Streak.findOne({ userId: userId });
        
        if (streak) {
            // Update with latest data
            streak.currentStreak = Math.max(currentStreak || 0, streak.currentStreak);
            streak.highestStreak = Math.max(highestStreak || 0, streak.highestStreak);
            
            if (lastWorkoutDate) {
                const newDate = new Date(lastWorkoutDate);
                if (!streak.lastWorkoutDate || newDate > streak.lastWorkoutDate) {
                    streak.lastWorkoutDate = newDate;
                }
            }
            
            await streak.save();
            console.log('✅ Streak synced (updated):', streak);
        } else {
            // Create new from local data
            streak = new Streak({
                userId: userId,
                currentStreak: currentStreak || 0,
                highestStreak: highestStreak || 0,
                lastWorkoutDate: lastWorkoutDate ? new Date(lastWorkoutDate) : null,
                workoutCount: 0
            });
            
            await streak.save();
            console.log('✅ Streak synced (created):', streak);
        }
        
        res.json({
            success: true,
            message: 'Streak synced successfully',
            streak: streak
        });
        
    } catch (error) {
        console.error('❌ Streak sync error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to sync streak' 
        });
    }
});

module.exports = router;