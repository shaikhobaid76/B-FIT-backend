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
// MONGODB CONNECTION
// ======================
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://BFIT:Ozain2425@cluster0.1sifp5t.mongodb.net/bfit-app?retryWrites=true&w=majority&appName=Cluster0';

console.log('🔗 Connecting to MongoDB Atlas...');

mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
})
.then(() => {
    console.log('✅ MongoDB Atlas Connected Successfully!');
    console.log('📊 Database:', mongoose.connection.db.databaseName);
})
.catch(err => {
    console.error('❌ MongoDB Connection Error:', err.message);
});

// ======================
// ROUTES CONFIGURATION
// ======================

// ✅ CORRECT: Mount authRoutes under /api
app.use('/api', authRoutes);

// ======================
// HEALTH CHECK ROUTES
// ======================

// Root Route with deployment info
app.get('/', (req, res) => {
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
                    max-width: 800px;
                    width: 100%;
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 20px;
                    padding: 40px;
                    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
                }
                h1 {
                    color: #FFD700;
                    text-align: center;
                }
                .endpoint {
                    background: rgba(255, 255, 255, 0.1);
                    padding: 15px;
                    border-radius: 10px;
                    margin: 10px 0;
                    font-family: monospace;
                }
                .method {
                    background: #FFD700;
                    color: #000;
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-weight: bold;
                    margin-right: 10px;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>🚀 B-FIT GYM APP API SERVER</h1>
                <p>Server is running. Available endpoints:</p>
                
                <div class="endpoint">
                    <span class="method">GET</span> /api/health
                </div>
                <div class="endpoint">
                    <span class="method">GET</span> /api/test
                </div>
                <div class="endpoint">
                    <span class="method">POST</span> /api/register
                </div>
                <div class="endpoint">
                    <span class="method">POST</span> /api/login
                </div>
                <div class="endpoint">
                    <span class="method">GET</span> /api/all-data
                </div>
                <div class="endpoint">
                    <span class="method">POST</span> /api/streak/update
                </div>
                <div class="endpoint">
                    <span class="method">GET</span> /api/streak/:userId
                </div>
                
                <p style="margin-top: 30px; text-align: center;">
                    🔗 Frontend: <a href="https://b-fit-gym.vercel.app" style="color: #FFD700;">https://b-fit-gym.vercel.app</a>
                </p>
            </div>
        </body>
        </html>
    `);
});

// ✅ CORRECT: Health Check Route
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
            name: 'bfit-app',
            connectionState: dbStatus
        },
        deployment: {
            frontend: 'https://b-fit-gym.vercel.app',
            backend: 'https://b-fit-backend-jy2e.onrender.com',
            database: 'MongoDB Atlas'
        }
    });
});

// ✅ CORRECT: Test Route
app.get('/api/test', async (req, res) => {
    try {
        const User = mongoose.model('User');
        const Streak = mongoose.model('Streak');
        
        const users = await User.find().limit(5);
        const streaks = await Streak.find().limit(5);
        
        res.status(200).json({
            status: 'success',
            message: 'Database connection test successful',
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
});

// ======================
// 404 HANDLER
// ======================
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'route_not_found',
        message: `The requested route ${req.originalUrl} does not exist.`,
        available_endpoints: [
            'GET /',
            'GET /api/health',
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
    console.log(`
    ╔══════════════════════════════════════════════════════════════════╗
    ║                                                                  ║
    ║                🏋️‍♂️  B-FIT GYM APP BACKEND SERVER                ║
    ║                                                                  ║
    ║  ✅ Status:          SERVER STARTED SUCCESSFULLY                 ║
    ║  🔌 Port:            ${PORT}                                    ║
    ║  🕐 Time:            ${new Date().toLocaleTimeString()}          ║
    ║  📊 Database:        ${mongoose.connection.readyState === 1 ? '✅ CONNECTED' : '❌ DISCONNECTED'} ║
    ║                                                                  ║
    ║  🌐 URLs:                                                       ║
    ║  🎯 Frontend: https://b-fit-gym.vercel.app                       ║
    ║  ⚙️  Backend:  https://b-fit-backend-jy2e.onrender.com           ║
    ║  🔧 Local:     http://localhost:${PORT}                          ║
    ║                                                                  ║
    ║  📡 API ENDPOINTS:                                              ║
    ║  • GET  /api/health              Health check                   ║
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