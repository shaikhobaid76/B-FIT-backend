const User = require('../models/user');
const Streak = require('../models/Streak');
const bcrypt = require('bcryptjs');

// ✅ YEH ADD KARO:
let Streak;
try {
    Streak = mongoose.model('Streak');
} catch {
    // Create Streak model if doesn't exist
    const streakSchema = new mongoose.Schema({
        userId: { type: mongoose.Schema.Types.ObjectId, required: true },
        currentStreak: { type: Number, default: 0 },
        highestStreak: { type: Number, default: 0 },
        lastWorkoutDate: { type: Date },
        workoutCount: { type: Number, default: 0 }
    });
    Streak = mongoose.model('Streak', streakSchema);
}

const bcrypt = require('bcryptjs');


// ===============================
// REGISTER USER
// ===============================
exports.register = async (req, res) => {
    try {
        const { name, phone, password, gender, age } = req.body;
        
        console.log('📝 Registration request for phone:', phone);
        
        // Validation
        if (!name || !phone || !password || !gender) {
            return res.status(400).json({ 
                success: false, 
                error: 'All fields are required' 
            });
        }
        
        // Check if user exists
        const existingUser = await User.findOne({ phone });
        if (existingUser) {
            return res.status(400).json({ 
                success: false, 
                error: 'Phone number already registered' 
            });
        }
        
        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        // Create user
        const user = new User({
            name,
            phone,
            password: hashedPassword,
            gender,
            age: age || null
        });
        
        const savedUser = await user.save();
        console.log('✅ USER SAVED TO MONGODB:', savedUser._id);
        
        // Create streak for user
        const streak = new Streak({
            userId: savedUser._id,
            currentStreak: 0,
            highestStreak: 0,
            workoutCount: 0
        });
        
        await streak.save();
        console.log('✅ STREAK CREATED for user:', savedUser._id);
        
        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            userId: savedUser._id,
            user: {
                _id: savedUser._id,
                name: savedUser.name,
                phone: savedUser.phone,
                gender: savedUser.gender,
                age: savedUser.age
            },
            streak: {
                currentStreak: 0,
                highestStreak: 0,
                workoutCount: 0,
                lastWorkoutDate: null
            }
        });
        
    } catch (error) {
        console.error('❌ Registration Error:', error.message);
        
        if (error.code === 11000) {
            return res.status(400).json({ 
                success: false, 
                error: 'Phone number already exists' 
            });
        }
        
        res.status(500).json({ 
            success: false, 
            error: 'Server error: ' + error.message
        });
    }
};

// ===============================
// LOGIN USER
// ===============================
exports.login = async (req, res) => {
    try {
        const { phone, password } = req.body;
        
        console.log('🔐 Login attempt for phone:', phone);
        
        if (!phone || !password) {
            return res.status(400).json({ 
                success: false, 
                error: 'Phone and password are required' 
            });
        }
        
        // Find user
        const user = await User.findOne({ phone });
        
        if (!user) {
            console.log('❌ User not found:', phone);
            return res.status(401).json({ 
                success: false, 
                error: 'Invalid phone number or password' 
            });
        }
        
        // Compare hashed password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        
        if (!isPasswordValid) {
            console.log('❌ Invalid password for user:', phone);
            return res.status(401).json({ 
                success: false, 
                error: 'Invalid phone number or password' 
            });
        }
        
        // Get streak
        const streak = await Streak.findOne({ userId: user._id });
        
        console.log('✅ Login successful for user:', user._id);
        console.log('📊 Streak data:', streak);
        
        res.json({
            success: true,
            message: 'Login successful',
            userId: user._id,
            user: {
                _id: user._id,
                name: user.name,
                phone: user.phone,
                gender: user.gender,
                age: user.age
            },
            streak: {
                currentStreak: streak?.currentStreak || 0,
                highestStreak: streak?.highestStreak || 0,
                workoutCount: streak?.workoutCount || 0,
                lastWorkoutDate: streak?.lastWorkoutDate || null
            }
        });
        
    } catch (error) {
        console.error('❌ Login Error:', error.message);
        res.status(500).json({ 
            success: false, 
            error: 'Server error: ' + error.message
        });
    }
};

// ===============================
// UPDATE STREAK (MISSING FUNCTION - ADDED)
// ===============================
exports.updateStreak = async (req, res) => {
    try {
        const { userId } = req.body;
        
        console.log('📈 Update streak request for userId:', userId);
        
        if (!userId) {
            return res.status(400).json({ 
                success: false, 
                error: 'User ID is required' 
            });
        }
        
        let streak = await Streak.findOne({ userId });
        
        if (!streak) {
            // Create new streak
            streak = new Streak({
                userId,
                currentStreak: 1,
                highestStreak: 1,
                lastWorkoutDate: new Date(),
                workoutCount: 1
            });
            
            await streak.save();
            console.log('✅ New streak created:', streak);
        } else {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            if (streak.lastWorkoutDate) {
                const lastDate = new Date(streak.lastWorkoutDate);
                lastDate.setHours(0, 0, 0, 0);
                
                const yesterday = new Date(today);
                yesterday.setDate(yesterday.getDate() - 1);
                
                // Check if already worked out today
                if (lastDate.getTime() === today.getTime()) {
                    return res.json({
                        success: true,
                        message: 'Already worked out today',
                        streak: {
                            currentStreak: streak.currentStreak,
                            highestStreak: streak.highestStreak,
                            workoutCount: streak.workoutCount
                        }
                    });
                }
                
                // Check if worked out yesterday
                if (lastDate.getTime() === yesterday.getTime()) {
                    streak.currentStreak += 1;
                } else {
                    streak.currentStreak = 1;
                }
            } else {
                streak.currentStreak = 1;
            }
            
            // Update highest streak
            if (streak.currentStreak > streak.highestStreak) {
                streak.highestStreak = streak.currentStreak;
            }
            
            streak.lastWorkoutDate = new Date();
            streak.workoutCount += 1;
            
            await streak.save();
            console.log('✅ Streak updated:', streak);
        }
        
        res.json({
            success: true,
            message: 'Streak updated successfully',
            streak: {
                currentStreak: streak.currentStreak,
                highestStreak: streak.highestStreak,
                workoutCount: streak.workoutCount,
                lastWorkoutDate: streak.lastWorkoutDate
            }
        });
        
    } catch (error) {
        console.error('❌ Streak Update Error:', error.message);
        res.status(500).json({ 
            success: false, 
            error: 'Server error: ' + error.message
        });
    }
};

// ===============================
// GET USER STREAK
// ===============================
exports.getStreak = async (req, res) => {
    try {
        const { userId } = req.params;
        
        console.log('🔍 Getting streak for userId:', userId);
        
        const streak = await Streak.findOne({ userId });
        
        if (!streak) {
            console.log('📭 No streak found for userId:', userId);
            return res.json({
                success: true,
                streak: {
                    currentStreak: 0,
                    highestStreak: 0,
                    workoutCount: 0,
                    lastWorkoutDate: null
                }
            });
        }
        
        console.log('✅ Streak found:', streak);
        
        res.json({
            success: true,
            streak: {
                currentStreak: streak.currentStreak,
                highestStreak: streak.highestStreak,
                workoutCount: streak.workoutCount,
                lastWorkoutDate: streak.lastWorkoutDate
            }
        });
        
    } catch (error) {
        console.error('❌ Get Streak Error:', error.message);
        res.status(500).json({ 
            success: false, 
            error: 'Server error: ' + error.message
        });
    }
};

// ===============================
// GET ALL DATA
// ===============================
exports.getAllData = async (req, res) => {
    try {
        const users = await User.find().select('-password');
        const streaks = await Streak.find();
        
        console.log('📊 Total Users:', users.length);
        console.log('📊 Total Streaks:', streaks.length);
        
        res.json({
            success: true,
            message: 'Database test successful',
            database: 'bfit-app',
            usersCount: users.length,
            streaksCount: streaks.length,
            users: users,
            streaks: streaks
        });
        
    } catch (error) {
        console.error('❌ Test Error:', error.message);
        res.status(500).json({ 
            success: false, 
            error: 'Server error: ' + error.message
        });
    }
};