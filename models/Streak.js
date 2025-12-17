const mongoose = require('mongoose');

const streakSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        required: true,
        ref: 'User'  // Reference to User model
    },
    currentStreak: { 
        type: Number, 
        default: 0 
    },
    highestStreak: { 
        type: Number, 
        default: 0 
    },
    lastWorkoutDate: { 
        type: Date 
    },
    workoutCount: { 
        type: Number, 
        default: 0 
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
});

// Create index for faster queries
streakSchema.index({ userId: 1 });

module.exports = mongoose.model('Streak', streakSchema);