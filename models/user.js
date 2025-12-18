const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true,
        trim: true
    },
    phone: { 
        type: String, 
        required: true, 
        unique: true,
        trim: true,
        minlength: 10,
        maxlength: 10
    },
    password: { 
        type: String, 
        required: true 
    },
    gender: { 
        type: String, 
        required: true,
        enum: ['male', 'female', 'other']
    },
    age: { 
        type: Number, 
        min: 12, 
        max: 100 
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
});

module.exports = mongoose.model('User', userSchema);