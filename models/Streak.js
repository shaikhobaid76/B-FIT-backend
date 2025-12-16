const mongoose = require('mongoose');

const streakSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true, 
        unique: true 
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

// Create compound index
streakSchema.index({ userId: 1 }, { unique: true });

module.exports = mongoose.model('Streak', streakSchema);