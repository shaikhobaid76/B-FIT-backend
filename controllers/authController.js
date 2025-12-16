const User = require('../models/user');
const Streak = require('../models/Streak');

// Register User
exports.register = async (req, res) => {
    try {
        const { name, phone, password, gender, age } = req.body;
        
        // Validation
        if (!name || !phone || !password || !gender) {
            return res.status(400).json({ 
                status: 'error', 
                message: 'All fields are required' 
            });
        }
        
        // Check if user exists
        const existingUser = await User.findOne({ phone });
        if (existingUser) {
            return res.status(400).json({ 
                status: 'error', 
                message: 'Phone number already registered' 
            });
        }
        
        // Create user
        const user = new User({
            name,
            phone,
            password,
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
            status: 'success',
            message: 'User registered successfully',
            userId: savedUser._id,
            user: {
                id: savedUser._id,
                name: savedUser.name,
                phone: savedUser.phone,
                gender: savedUser.gender,
                age: savedUser.age
            }
        });
        
    } catch (error) {
        console.error('❌ Registration Error:', error.message);
        
        if (error.code === 11000) {
            return res.status(400).json({ 
                status: 'error', 
                message: 'Phone number already exists' 
            });
        }
        
        res.status(500).json({ 
            status: 'error', 
            message: 'Server error: ' + error.message
        });
    }
};

// Login User
exports.login = async (req, res) => {
    try {
        const { phone, password } = req.body;
        
        if (!phone || !password) {
            return res.status(400).json({ 
                status: 'error', 
                message: 'Phone and password are required' 
            });
        }
        
        // Find user
        const user = await User.findOne({ phone });
        
        if (!user) {
            return res.status(401).json({ 
                status: 'error', 
                message: 'Invalid phone number or password' 
            });
        }
        
        // Check password
        if (user.password !== password) {
            return res.status(401).json({ 
                status: 'error', 
                message: 'Invalid phone number or password' 
            });
        }
        
        // Get streak
        const streak = await Streak.findOne({ userId: user._id });
        
        res.json({
            status: 'success',
            message: 'Login successful',
            userId: user._id,
            user: {
                id: user._id,
                name: user.name,
                phone: user.phone,
                gender: user.gender,
                age: user.age
            },
            streak: {
                currentStreak: streak?.currentStreak || 0,
                highestStreak: streak?.highestStreak || 0,
                workoutCount: streak?.workoutCount || 0
            }
        });
        
    } catch (error) {
        console.error('❌ Login Error:', error.message);
        res.status(500).json({ 
            status: 'error', 
            message: 'Server error: ' + error.message
        });
    }
};

// Update Streak
exports.updateStreak = async (req, res) => {
    try {
        const { userId } = req.body;
        
        if (!userId) {
            return res.status(400).json({ 
                status: 'error', 
                message: 'User ID is required' 
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
                        status: 'success',
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
        }
        
        console.log('✅ STREAK UPDATED for user:', userId);
        
        res.json({
            status: 'success',
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
            status: 'error', 
            message: 'Server error: ' + error.message
        });
    }
};

// Get User Streak
exports.getStreak = async (req, res) => {
    try {
        const { userId } = req.params;
        
        const streak = await Streak.findOne({ userId });
        
        if (!streak) {
            return res.json({
                status: 'success',
                streak: {
                    currentStreak: 0,
                    highestStreak: 0,
                    workoutCount: 0,
                    lastWorkoutDate: null
                }
            });
        }
        
        res.json({
            status: 'success',
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
            status: 'error', 
            message: 'Server error: ' + error.message
        });
    }
};

// Get All Data
exports.getAllData = async (req, res) => {
    try {
        const users = await User.find();
        const streaks = await Streak.find();
        
        res.json({
            status: 'success',
            message: 'Database test successful',
            database: 'bfit-app',
            usersCount: users.length,
            streaksCount: streaks.length,
            users: users.map(user => ({
                id: user._id,
                name: user.name,
                phone: user.phone,
                gender: user.gender,
                age: user.age,
                createdAt: user.createdAt
            })),
            streaks: streaks.map(streak => ({
                userId: streak.userId,
                currentStreak: streak.currentStreak,
                highestStreak: streak.highestStreak,
                workoutCount: streak.workoutCount
            }))
        });
        
    } catch (error) {
        console.error('❌ Test Error:', error.message);
        res.status(500).json({ 
            status: 'error', 
            message: 'Server error: ' + error.message
        });
    }
};