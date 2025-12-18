const mongoose = require('mongoose');

const streakSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        required: true,
        ref: 'User'
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
    },
    updatedAt: { 
        type: Date, 
        default: Date.now 
    }
});

streakSchema.index({ userId: 1 });
streakSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Streak', streakSchema);