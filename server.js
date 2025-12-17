require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');

const app = express();

// ======================
// MIDDLEWARE CONFIGURATION
// ======================
app.use(cors({
    origin: ['https://b-fit-gym.vercel.app', 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));


app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ======================
// MONGODB CONNECTION - FIXED
// ======================
// ✅ CORRECT CONNECTION STRING - NO appName parameter
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://BFIT:Ozain2425@cluster0.1sifp5t.mongodb.net/bfit-app?retryWrites=true&w=majority';

console.log('🔗 =========== MONGODB CONNECTION DEBUG ===========');
console.log('🔗 Connection string:', MONGODB_URI);
console.log('🔗 From .env file?', process.env.MONGODB_URI ? 'YES' : 'NO - using default');
console.log('🔗 ================================================');

mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 45000,
})
.then(() => {
    console.log('✅ MongoDB Atlas Connected Successfully!');
    console.log(`📊 Connected to Database: "${mongoose.connection.db.databaseName}"`);
    console.log(`📊 Connection State: ${mongoose.connection.readyState === 1 ? '✅ CONNECTED' : '❌ DISCONNECTED'}`);
    
    // Test if we can access collections
    mongoose.connection.db.listCollections().toArray((err, collections) => {
        if (err) {
            console.error('❌ Error listing collections:', err);
        } else {
            console.log('📋 Available collections:', collections.map(c => c.name).join(', ') || 'No collections found');
            
            // If no collections, create them
            if (collections.length === 0) {
                console.log('⚠️ No collections found. Creating default collections...');
                
                // Create User model if doesn't exist
                if (!mongoose.models.User) {
                    const userSchema = new mongoose.Schema({
                        name: { type: String, required: true },
                        phone: { type: String, required: true, unique: true },
                        password: { type: String, required: true },
                        gender: { type: String, required: true },
                        age: { type: Number, min: 10, max: 100 },
                        createdAt: { type: Date, default: Date.now }
                    });
                    mongoose.model('User', userSchema);
                    console.log('✅ Created User model');
                }
                
                // Create Streak model if doesn't exist
                if (!mongoose.models.Streak) {
                    const streakSchema = new mongoose.Schema({
                        userId: { type: mongoose.Schema.Types.ObjectId, required: true },
                        currentStreak: { type: Number, default: 0 },
                        highestStreak: { type: Number, default: 0 },
                        lastWorkoutDate: { type: Date },
                        workoutCount: { type: Number, default: 0 }
                    });
                    mongoose.model('Streak', streakSchema);
                    console.log('✅ Created Streak model');
                }
            }
        }
    });
})
.catch(err => {
    console.error('❌ MongoDB Connection Error:', err.message);
    console.error('❌ Full error details:', err);
});

// ======================
// DATABASE DEBUG ENDPOINT
// ======================
app.get('/api/debug-db', async (req, res) => {
    try {
        const dbName = mongoose.connection.db?.databaseName || 'Not connected';
        const readyState = mongoose.connection.readyState;
        
        // Try to get collections count
        let collections = [];
        let usersCount = 0;
        let streaksCount = 0;
        
        if (readyState === 1) { // Connected
            collections = await mongoose.connection.db.listCollections().toArray();
            
            // Try to count documents if models exist
            try {
                const User = mongoose.model('User');
                usersCount = await User.countDocuments();
            } catch (e) {
                usersCount = 'Model not initialized';
            }
            
            try {
                const Streak = mongoose.model('Streak');
                streaksCount = await Streak.countDocuments();
            } catch (e) {
                streaksCount = 'Model not initialized';
            }
        }
        
        res.json({
            success: true,
            timestamp: new Date().toISOString(),
            database: {
                name: dbName,
                readyState: readyState,
                stateDescription: readyState === 1 ? 'Connected' : 
                                 readyState === 0 ? 'Disconnected' :
                                 readyState === 2 ? 'Connecting' : 'Disconnecting'
            },
            collections: {
                count: collections.length,
                names: collections.map(c => c.name),
                users: usersCount,
                streaks: streaksCount
            },
            connection: {
                host: mongoose.connection.host,
                port: mongoose.connection.port,
                mongodbUri: process.env.MONGODB_URI ? 'Set in environment' : 'Using default'
            },
            server: {
                version: '2.0',
                uptime: process.uptime()
            }
        });
        
    } catch (error) {
        console.error('Debug endpoint error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message,
            stack: process.env.NODE_ENV === 'production' ? undefined : error.stack
        });
    }
});

// ======================
// HEALTH CHECK ROUTES
// ======================
app.get('/api/health', (req, res) => {
    const dbStatus = mongoose.connection.readyState;
    let dbMessage = '';
    
    switch(dbStatus) {
        case 0: dbMessage = '❌ Disconnected'; break;
        case 1: dbMessage = '✅ Connected'; break;
        case 2: dbMessage = '🔄 Connecting'; break;
        case 3: dbMessage = '⚠️ Disconnecting'; break;
        default: dbMessage = '❓ Unknown';
    }
    
    res.status(200).json({
        status: 'OK',
        message: 'B-FIT Server is running',
        timestamp: new Date().toISOString(),
        version: '2.0',
        database: {
            status: dbMessage,
            name: mongoose.connection.db?.databaseName || 'Unknown',
            connectionState: dbStatus
        },
        deployment: {
            frontend: 'https://b-fit-gym.vercel.app',
            backend: 'https://b-fit-backend-jy2e.onrender.com',
            database: 'MongoDB Atlas'
        }
    });
});

app.get('/api/test', async (req, res) => {
    try {
        const dbName = mongoose.connection.db?.databaseName;
        
        // Try to get User model
        let User, Streak;
        try {
            User = mongoose.model('User');
            Streak = mongoose.model('Streak');
        } catch (e) {
            return res.status(500).json({
                status: 'error',
                message: 'Database models not initialized. Check MongoDB connection.',
                error: e.message
            });
        }
        
        const users = await User.find().limit(5);
        const streaks = await Streak.find().limit(5);
        
        res.status(200).json({
            status: 'success',
            message: 'Database connection test successful',
            database: dbName || 'Unknown',
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
                workoutCount: streak.workoutCount,
                lastWorkoutDate: streak.lastWorkoutDate
            }))
        });
        
    } catch (error) {
        console.error('❌ Test Error:', error.message);
        res.status(500).json({ 
            status: 'error', 
            message: 'Database test failed',
            error: error.message,
            database: mongoose.connection.db?.databaseName || 'Not connected'
        });
    }
});

// ======================
// MAIN API ROUTES
// ======================
app.use('/api', authRoutes);

// ======================
// ROOT ROUTE
// ======================
app.get('/', (req, res) => {
    const dbStatus = mongoose.connection.readyState === 1 ? '✅ CONNECTED' : '❌ DISCONNECTED';
    const dbName = mongoose.connection.db?.databaseName || 'Not connected';
    
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>B-FIT API Server</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    background: linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%);
                    color: #fff;
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 20px;
                }
                .container {
                    max-width: 900px;
                    width: 100%;
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 20px;
                    padding: 40px;
                    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
                }
                h1 {
                    color: #FFD700;
                    text-align: center;
                    margin-bottom: 30px;
                }
                .status {
                    background: ${dbStatus.includes('✅') ? 'rgba(0, 255, 0, 0.1)' : 'rgba(255, 0, 0, 0.1)'};
                    padding: 15px;
                    border-radius: 10px;
                    margin-bottom: 20px;
                    border: 1px solid ${dbStatus.includes('✅') ? '#0f0' : '#f00'};
                }
                .endpoint {
                    background: rgba(255, 255, 255, 0.1);
                    padding: 15px;
                    border-radius: 10px;
                    margin: 10px 0;
                    font-family: monospace;
                    display: flex;
                    align-items: center;
                }
                .method {
                    background: #FFD700;
                    color: #000;
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-weight: bold;
                    margin-right: 10px;
                    min-width: 60px;
                    text-align: center;
                }
                .test-btn {
                    display: inline-block;
                    background: #FFD700;
                    color: #000;
                    padding: 8px 16px;
                    border-radius: 5px;
                    text-decoration: none;
                    font-weight: bold;
                    margin-top: 20px;
                }
                .test-btn:hover {
                    background: #ffed4e;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>🚀 B-FIT GYM APP API SERVER</h1>
                
                <div class="status">
                    <strong>Database Status:</strong> ${dbStatus}<br>
                    <strong>Database Name:</strong> ${dbName}<br>
                    <strong>Time:</strong> ${new Date().toLocaleTimeString()}
                </div>
                
                <p>Server is running. Available endpoints:</p>
                
                <div class="endpoint">
                    <span class="method">GET</span> /api/health - Health check
                </div>
                <div class="endpoint">
                    <span class="method">GET</span> /api/debug-db - Database debug info
                </div>
                <div class="endpoint">
                    <span class="method">GET</span> /api/test - Database test
                </div>
                <div class="endpoint">
                    <span class="method">POST</span> /api/register - User registration
                </div>
                <div class="endpoint">
                    <span class="method">POST</span> /api/login - User login
                </div>
                <div class="endpoint">
                    <span class="method">GET</span> /api/all-data - Get all user data
                </div>
                <div class="endpoint">
                    <span class="method">POST</span> /api/streak/update - Update streak
                </div>
                <div class="endpoint">
                    <span class="method">GET</span> /api/streak/:userId - Get user streak
                </div>
                
                <div style="margin-top: 30px; text-align: center;">
                    <a href="/api/debug-db" class="test-btn">Test Database Connection</a>
                    &nbsp;&nbsp;
                    <a href="/api/health" class="test-btn">Check Health</a>
                </div>
                
                <p style="margin-top: 30px; text-align: center; font-size: 14px; opacity: 0.8;">
                    🔗 Frontend: <a href="https://b-fit-gym.vercel.app" style="color: #FFD700;">https://b-fit-gym.vercel.app</a><br>
                    ⚙️ Backend: <a href="https://b-fit-backend-jy2e.onrender.com" style="color: #FFD700;">https://b-fit-backend-jy2e.onrender.com</a>
                </p>
            </div>
        </body>
        </html>
    `);
});

// ======================
// 404 HANDLER (MUST BE LAST!)
// ======================
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'route_not_found',
        message: `The requested route ${req.originalUrl} does not exist.`,
        available_endpoints: [
            'GET /',
            'GET /api/health',
            'GET /api/debug-db',
            'GET /api/test',
            'POST /api/register',
            'POST /api/login',
            'POST /api/streak/update',
            'GET /api/streak/:userId',
            'GET /api/all-data'
        ],
        documentation: 'https://b-fit-backend-jy2e.onrender.com/'
    });
});

// ======================
// ERROR HANDLER
// ======================
app.use((err, req, res, next) => {
    console.error('🔥 Server Error:', err.stack);
    
    res.status(500).json({
        status: 'error',
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'production' ? 'Something went wrong!' : err.message
    });
});

// ======================
// SERVER STARTUP
// ======================
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
    const dbStatus = mongoose.connection.readyState === 1 ? '✅ CONNECTED' : '❌ DISCONNECTED';
    const dbName = mongoose.connection.db?.databaseName || 'Unknown';
    
    console.log(`
    ╔══════════════════════════════════════════════════════════════════╗
    ║                                                                  ║
    ║                🏋️‍♂️  B-FIT GYM APP BACKEND SERVER                ║
    ║                                                                  ║
    ║  ✅ Status:          SERVER STARTED SUCCESSFULLY                 ║
    ║  🔌 Port:            ${PORT}                                    ║
    ║  🕐 Time:            ${new Date().toLocaleTimeString()}          ║
    ║  📊 Database:        ${dbStatus}                                ║
    ║  📋 DB Name:         ${dbName}                                  ║
    ║                                                                  ║
    ║  🌐 URLs:                                                       ║
    ║  🎯 Frontend: https://b-fit-gym.vercel.app                       ║
    ║  ⚙️  Backend:  https://b-fit-backend-jy2e.onrender.com           ║
    ║  🔧 Local:     http://localhost:${PORT}                          ║
    ║                                                                  ║
    ║  📡 API ENDPOINTS:                                              ║
    ║  • GET  /api/health              Health check                   ║
    ║  • GET  /api/debug-db            Database debug info            ║
    ║  • GET  /api/test                Database test                  ║
    ║  • POST /api/register            User registration             ║
    ║  • POST /api/login               User login                    ║
    ║  • GET  /api/all-data            Get all user data             ║
    ║  • POST /api/streak/update       Update streak                 ║
    ║  • GET  /api/streak/:userId      Get user  streak               ║
    ║                                                                  ║
    ╚══════════════════════════════════════════════════════════════════╝
    `);
});