const express = require('express');
const router = express.Router();
const Streak = require('../models/Streak');

// ✅ Update or create streak
router.post('/update', async (req, res) => {
    try {
        const { userId, currentStreak, highestStreak, lastWorkoutDate } = req.body;
        
        console.log('📊 Streak Update Request:', req.body);
        
        if (!userId) {
            return res.status(400).json({ 
                success: false, 
                error: 'User ID is required' 
            });
        }
        
        // Try to find existing streak
        let streak = await Streak.findOne({ userId: userId });
        
        if (streak) {
            console.log('📅 Last workout date in DB:', streak.lastWorkoutDate);
            console.log('📅 New workout date:', lastWorkoutDate);
            
            // Check if already worked out today
            if (streak.lastWorkoutDate) {
                const lastDate = new Date(streak.lastWorkoutDate).toDateString();
                const today = new Date(lastWorkoutDate).toDateString();
                
                if (lastDate === today) {
                    return res.json({
                        success: true,
                        message: 'Already worked out today - streak not updated',
                        streak: {
                            currentStreak: streak.currentStreak,
                            highestStreak: streak.highestStreak,
                            lastWorkoutDate: streak.lastWorkoutDate,
                            workoutCount: streak.workoutCount
                        }
                    });
                }
            }
            
            // Update existing streak
            streak.currentStreak = currentStreak || streak.currentStreak;
            streak.highestStreak = Math.max(highestStreak || 0, streak.highestStreak);
            streak.lastWorkoutDate = lastWorkoutDate ? new Date(lastWorkoutDate) : streak.lastWorkoutDate;
            streak.workoutCount += 1;
            
            await streak.save();
            console.log('✅ Streak UPDATED in MongoDB:', streak);
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
            console.log('✅ New streak CREATED in MongoDB:', streak);
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
        
        console.log('🔍 Fetching streak for user:', userId);
        
        const streak = await Streak.findOne({ userId: userId });
        
        if (!streak) {
            console.log('📭 No streak found for user:', userId);
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
        
        console.log('✅ Streak FOUND:', streak);
        
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

// ✅ DELETE Streak (for testing)
router.delete('/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        
        const result = await Streak.deleteOne({ userId: userId });
        
        res.json({
            success: true,
            message: 'Streak deleted for testing',
            deletedCount: result.deletedCount
        });
        
    } catch (error) {
        console.error('Delete streak error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to delete streak' 
        });
    }
});

module.exports = router;