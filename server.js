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
// MONGODB CONNECTION (WITH UPDATED PASSWORD)
// ======================
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://BFIT:Ozain2425@cluster0.1sifp5t.mongodb.net/bfit-app?retryWrites=true&w=majority';

console.log('🔗 Connecting to MongoDB Atlas...');
console.log('📁 Database Name: bfit-app');
console.log('👤 Username: BFIT');
console.log('🔑 Password: Ozain2425');

mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 10000, // 10 seconds
    socketTimeoutMS: 45000, // 45 seconds
})
.then(() => {
    console.log('✅ MongoDB Atlas Connected Successfully!');
    console.log('📊 Connected to database:', mongoose.connection.db.databaseName);
    console.log('👤 Connection User:', mongoose.connection.user || 'Not specified');
})
.catch(err => {
    console.log('❌ MongoDB Connection FAILED!');
    console.log('📌 Error Message:', err.message);
    console.log('🔍 Full Error:', err);
    console.log('🔍 Connection String Being Used:', MONGODB_URI.replace(/:(.*)@/, ':****@'));
    console.log('\n🔧 Troubleshooting Steps:');
    console.log('1. ✅ Check MongoDB Atlas username/password');
    console.log('2. ✅ Verify IP Whitelist (0.0.0.0/0)');
    console.log('3. ✅ Check network connectivity');
    console.log('4. ✅ Verify connection string format');
    console.log('5. ✅ Ensure database "bfit-app" exists');
    console.log('6. ✅ Check if cluster is active and running');
    
    // Don't exit, continue without DB for now
});

// MongoDB Connection Events
mongoose.connection.on('error', err => {
    console.log('❌ MongoDB Connection Error:', err.message);
});

mongoose.connection.on('disconnected', () => {
    console.log('⚠️ MongoDB Disconnected');
});

mongoose.connection.on('reconnected', () => {
    console.log('🔄 MongoDB Reconnected');
});

// ======================
// ROUTES
// ======================
app.use('/api', authRoutes);

// ======================
// HEALTH CHECK ROUTES
// ======================

// Root Route with deployment info
app.get('/', (req, res) => {
    const frontendURL = 'https://b-fit-gym.vercel.app';
    const backendURL = 'https://b-fit-backend-jy2e.onrender.com';
    const dbStatus = mongoose.connection.readyState;
    let dbStatusText = '';
    let dbStatusColor = '';
    
    switch(dbStatus) {
        case 0: dbStatusText = '❌ DISCONNECTED'; dbStatusColor = '#ff4444'; break;
        case 1: dbStatusText = '✅ CONNECTED'; dbStatusColor = '#00ff88'; break;
        case 2: dbStatusText = '🔄 CONNECTING'; dbStatusColor = '#ffaa00'; break;
        case 3: dbStatusText = '⚠️ DISCONNECTING'; dbStatusColor = '#ffaa00'; break;
        default: dbStatusText = '❓ UNKNOWN'; dbStatusColor = '#888888';
    }
    
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>B-FIT API Server</title>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    background: linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%);
                    color: #fff;
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 20px;
                }
                
                .container {
                    max-width: 1000px;
                    width: 100%;
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 20px;
                    padding: 40px;
                    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
                    border: 1px solid rgba(255, 215, 0, 0.1);
                    backdrop-filter: blur(10px);
                }
                
                .header {
                    text-align: center;
                    margin-bottom: 40px;
                }
                
                h1 {
                    color: #FFD700;
                    font-size: 2.8rem;
                    margin-bottom: 10px;
                    background: linear-gradient(90deg, #FFD700, #FFA500);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    text-shadow: 0 2px 10px rgba(255, 215, 0, 0.3);
                }
                
                .status-badge {
                    display: inline-block;
                    background: #00ff88;
                    color: #000;
                    padding: 5px 15px;
                    border-radius: 20px;
                    font-weight: bold;
                    margin-top: 10px;
                    animation: pulse 2s infinite;
                }
                
                @keyframes pulse {
                    0% { opacity: 1; }
                    50% { opacity: 0.8; }
                    100% { opacity: 1; }
                }
                
                .deployment-info {
                    background: rgba(0, 0, 0, 0.3);
                    border-radius: 15px;
                    padding: 25px;
                    margin: 30px 0;
                    border-left: 4px solid #FFD700;
                }
                
                .url-box {
                    background: rgba(255, 255, 255, 0.1);
                    padding: 15px;
                    border-radius: 10px;
                    margin: 15px 0;
                    font-family: 'Courier New', monospace;
                    word-break: break-all;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }
                
                .status-box {
                    background: rgba(255, 255, 255, 0.1);
                    padding: 15px;
                    border-radius: 10px;
                    margin: 15px 0;
                    font-family: 'Courier New', monospace;
                    border-left: 4px solid ${dbStatusColor};
                }
                
                .api-section {
                    background: rgba(0, 100, 200, 0.1);
                    border-radius: 15px;
                    padding: 25px;
                    margin: 30px 0;
                }
                
                .api-list {
                    margin-top: 15px;
                }
                
                .api-item {
                    background: rgba(255, 255, 255, 0.05);
                    padding: 12px 20px;
                    margin: 10px 0;
                    border-radius: 8px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-left: 3px solid #FFD700;
                }
                
                .method {
                    background: #FFD700;
                    color: #000;
                    padding: 4px 12px;
                    border-radius: 4px;
                    font-weight: bold;
                    font-size: 0.9rem;
                }
                
                .button-group {
                    display: flex;
                    gap: 15px;
                    flex-wrap: wrap;
                    justify-content: center;
                    margin-top: 30px;
                }
                
                .btn {
                    padding: 12px 30px;
                    border-radius: 8px;
                    text-decoration: none;
                    font-weight: bold;
                    display: inline-flex;
                    align-items: center;
                    gap: 10px;
                    transition: all 0.3s ease;
                    min-width: 200px;
                    justify-content: center;
                }
                
                .btn-primary {
                    background: #FFD700;
                    color: #000;
                }
                
                .btn-secondary {
                    background: transparent;
                    color: #FFD700;
                    border: 2px solid #FFD700;
                }
                
                .btn:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 10px 20px rgba(255, 215, 0, 0.2);
                }
                
                .footer {
                    text-align: center;
                    margin-top: 40px;
                    padding-top: 20px;
                    border-top: 1px solid rgba(255, 255, 255, 0.1);
                    color: #888;
                }
                
                @media (max-width: 768px) {
                    .container {
                        padding: 20px;
                    }
                    
                    h1 {
                        font-size: 2rem;
                    }
                    
                    .btn {
                        min-width: 100%;
                    }
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🚀 B-FIT GYM APP API SERVER</h1>
                    <p>High-Performance Backend for Fitness Tracking</p>
                    <div class="status-badge">
                        ✅ SERVER IS RUNNING
                    </div>
                </div>
                
                <div class="deployment-info">
                    <h2>🌐 DEPLOYMENT INFORMATION</h2>
                    <br>
                    <strong>Frontend (Vercel):</strong>
                    <div class="url-box">${frontendURL}</div>
                    
                    <strong>Backend API (Render):</strong>
                    <div class="url-box">${backendURL}</div>
                    
                    <strong>Database Status:</strong>
                    <div class="status-box">
                        <strong>Status:</strong> ${dbStatusText}<br>
                        <strong>Database:</strong> bfit-app<br>
                        <strong>Connection State:</strong> ${dbStatus}
                    </div>
                    
                    <strong>Environment:</strong>
                    <div class="url-box">${process.env.NODE_ENV || 'development'}</div>
                    
                    <strong>MongoDB Connection:</strong>
                    <div class="url-box">mongodb+srv://BFIT:****@cluster0.1sifp5t.mongodb.net/bfit-app</div>
                </div>
                
                <div class="api-section">
                    <h2>📚 API ENDPOINTS</h2>
                    <div class="api-list">
                        <div class="api-item">
                            <span>User Registration</span>
                            <span class="method">POST</span>
                        </div>
                        <div class="url-box">${backendURL}/api/auth/register</div>
                        
                        <div class="api-item">
                            <span>User Login</span>
                            <span class="method">POST</span>
                        </div>
                        <div class="url-box">${backendURL}/api/auth/login</div>
                        
                        <div class="api-item">
                            <span>Update Workout Streak</span>
                            <span class="method">POST</span>
                        </div>
                        <div class="url-box">${backendURL}/api/streak/update</div>
                        
                        <div class="api-item">
                            <span>Get User Streak</span>
                            <span class="method">GET</span>
                        </div>
                        <div class="url-box">${backendURL}/api/streak/:userId</div>
                        
                        <div class="api-item">
                            <span>Get All Data</span>
                            <span class="method">GET</span>
                        </div>
                        <div class="url-box">${backendURL}/api/auth/all-data</div>
                        
                        <div class="api-item">
                            <span>Health Check</span>
                            <span class="method">GET</span>
                        </div>
                        <div class="url-box">${backendURL}/api/health</div>
                        
                        <div class="api-item">
                            <span>Database Test</span>
                            <span class="method">GET</span>
                        </div>
                        <div class="url-box">${backendURL}/api/test</div>
                    </div>
                </div>
                
                <div class="button-group">
                    <a href="${frontendURL}" target="_blank" class="btn btn-primary">
                        <span>👉 Open Frontend App</span>
                    </a>
                    <a href="${backendURL}/api/health" target="_blank" class="btn btn-secondary">
                        <span>🔧 API Health Check</span>
                    </a>
                    <a href="${backendURL}/api/test" target="_blank" class="btn btn-secondary">
                        <span>📊 Database Test</span>
                    </a>
                </div>
                
                <div class="footer">
                    <p>Made with ❤️ by OBAIDULLAH SHAIKH</p>
                    <p>📧 Backend URL: ${backendURL}</p>
                    <p>🕐 Server Time: ${new Date().toLocaleString()}</p>
                    <p>🔐 MongoDB Password: Updated to Ozain2425</p>
                </div>
            </div>
        </body>
        </html>
    `);
});

// Health Check Route
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
        status: 'healthy',
        message: 'B-FIT Gym App API Server is operational',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: {
            status: dbMessage,
            name: 'MongoDB Atlas',
            connectionState: dbStatus,
            uri: 'mongodb+srv://BFIT:****@cluster0.1sifp5t.mongodb.net/bfit-app',
            cluster: 'cluster0.1sifp5t.mongodb.net'
        },
        environment: process.env.NODE_ENV || 'development',
        deployment: {
            frontend: 'https://b-fit-gym.vercel.app',
            backend: 'https://b-fit-backend-jy2e.onrender.com',
            platform: 'Render'
        },
        memory: {
            rss: `${Math.round(process.memoryUsage().rss / 1024 / 1024)} MB`,
            heapTotal: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)} MB`,
            heapUsed: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`
        },
        mongodb: {
            password_updated: true,
            password_format: 'Ozain2425'
        }
    });
});

// Test Route
app.get('/api/test', async (req, res) => {
    try {
        // Test database connection
        const dbConnected = mongoose.connection.readyState === 1;
        
        if (!dbConnected) {
            return res.status(500).json({
                status: 'error',
                message: 'Database connection failed',
                database: {
                    connected: false,
                    error: 'MongoDB not connected',
                    connection_state: mongoose.connection.readyState,
                    connection_string: 'mongodb+srv://BFIT:Ozain2425@cluster0.1sifp5t.mongodb.net/bfit-app'
                }
            });
        }
        
        // Try to fetch data from database
        let User, Streak;
        try {
            // Try to get existing models
            User = mongoose.model('User');
            Streak = mongoose.model('Streak');
        } catch (e) {
            // If models don't exist, define them temporarily
            const userSchema = new mongoose.Schema({
                name: String,
                phone: String,
                password: String,
                gender: String,
                age: Number,
                createdAt: { type: Date, default: Date.now }
            });
            User = mongoose.model('User', userSchema);
            
            const streakSchema = new mongoose.Schema({
                userId: mongoose.Schema.Types.ObjectId,
                currentStreak: Number,
                highestStreak: Number,
                workoutCount: Number,
                lastWorkoutDate: Date
            });
            Streak = mongoose.model('Streak', streakSchema);
        }
        
        const users = await User.find().limit(5);
        const streaks = await Streak.find().limit(5);
        
        res.status(200).json({
            status: 'success',
            message: 'Database connection test successful',
            server: {
                name: 'B-FIT Gym App API',
                version: '2.0.0',
                environment: process.env.NODE_ENV || 'development',
                timestamp: new Date().toISOString(),
                mongodb_password: 'Ozain2425'
            },
            database: {
                connected: true,
                name: mongoose.connection.db.databaseName,
                collections: await mongoose.connection.db.listCollections().toArray(),
                users: users.length,
                streaks: streaks.length,
                sampleData: {
                    users: users.map(u => ({ 
                        id: u._id, 
                        name: u.name, 
                        phone: u.phone, 
                        gender: u.gender, 
                        age: u.age,
                        createdAt: u.createdAt 
                    })),
                    streaks: streaks.map(s => ({ 
                        userId: s.userId, 
                        currentStreak: s.currentStreak, 
                        highestStreak: s.highestStreak, 
                        workoutCount: s.workoutCount,
                        lastWorkoutDate: s.lastWorkoutDate 
                    }))
                }
            },
            endpoints: {
                register: 'POST /api/auth/register',
                login: 'POST /api/auth/login',
                updateStreak: 'POST /api/streak/update',
                getStreak: 'GET /api/streak/:userId',
                getAllData: 'GET /api/auth/all-data',
                health: 'GET /api/health',
                test: 'GET /api/test'
            }
        });
        
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Database test failed: ' + error.message,
            database: {
                connected: false,
                error: error.message,
                stack: error.stack
            }
        });
    }
});

// 404 Route
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'route_not_found',
        message: `The requested route ${req.originalUrl} does not exist.`,
        available_endpoints: [
            'GET /',
            'GET /api/health',
            'GET /api/test',
            'POST /api/auth/register',
            'POST /api/auth/login',
            'POST /api/streak/update',
            'GET /api/streak/:userId',
            'GET /api/auth/all-data'
        ],
        documentation: 'https://b-fit-backend-jy2e.onrender.com/',
        support: 'Check the root route for API documentation'
    });
});

// Error Handling Middleware
app.use((err, req, res, next) => {
    console.error('🔥 Server Error:', err.stack);
    
    res.status(500).json({
        status: 'error',
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'production' ? 'Something went wrong!' : err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

// ======================
// SERVER STARTUP
// ======================
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
    const frontendURL = 'https://b-fit-gym.vercel.app';
    const backendURL = `https://b-fit-backend-jy2e.onrender.com`;
    const localURL = `http://localhost:${PORT}`;
    const dbStatus = mongoose.connection.readyState;
    
    console.log(`
    ╔══════════════════════════════════════════════════════════════════╗
    ║                                                                  ║
    ║                🏋️‍♂️  B-FIT GYM APP BACKEND SERVER                ║
    ║                   ==========================                     ║
    ║                                                                  ║
    ║  ✅ Status:          SERVER STARTED SUCCESSFULLY                 ║
    ║  🔌 Port:            ${PORT}                                    ║
    ║  🕐 Time:            ${new Date().toLocaleTimeString()}          ║
    ║  📊 Database:        ${dbStatus === 1 ? '✅ CONNECTED' : dbStatus === 0 ? '❌ DISCONNECTED' : '🔄 CONNECTING'} ║
    ║  🔑 Password:        ✅ UPDATED TO Ozain2425                     ║
    ║                                                                  ║
    ║  🌐 DEPLOYMENT URLs:                                            ║
    ║                                                                  ║
    ║  🎯 Frontend (Vercel):  ${frontendURL}                          ║
    ║  ⚙️  Backend (Render):   ${backendURL}                          ║
    ║  🔧 Local:              ${localURL}                             ║
    ║                                                                  ║
    ║  📡 API ENDPOINTS:                                              ║
    ║                                                                  ║
    ║  • 🔐 Register:      POST ${backendURL}/api/auth/register       ║
    ║  • 🔓 Login:         POST ${backendURL}/api/auth/login          ║
    ║  • 📈 Update Streak: POST ${backendURL}/api/streak/update       ║
    ║  • 📊 Get Streak:    GET  ${backendURL}/api/streak/:userId      ║
    ║  • 📋 All Data:      GET  ${backendURL}/api/auth/all-data       ║
    ║  • 💓 Health Check:  GET  ${backendURL}/api/health              ║
    ║  • 🧪 Test:          GET  ${backendURL}/api/test                ║
    ║                                                                  ║
    ║  🚀 QUICK TEST:                                                ║
    ║                                                                  ║
    ║  🔗 Health Check:    ${backendURL}/api/health                   ║
    ║  🔗 Database Test:   ${backendURL}/api/test                     ║
    ║  🔗 Open Frontend:   ${frontendURL}                             ║
    ║  🔗 Open Backend:    ${backendURL}                              ║
    ║                                                                  ║
    ║  💻 Developer:       OBAIDULLAH SHAIKH                          ║
    ║  📅 Started:         ${new Date().toLocaleDateString()}          ║
    ║  🔧 MongoDB:         Password Updated to Ozain2425              ║
    ║                                                                  ║
    ╚══════════════════════════════════════════════════════════════════╝
    `);
    
    // Log additional info
    console.log('\n🔍 Additional Information:');
    console.log('📁 Database Name:', mongoose.connection.db?.databaseName || 'Not connected');
    console.log('👤 MongoDB Username:', 'BFIT');
    console.log('🔐 MongoDB Password:', 'Ozain2425 (Updated)');
    console.log('🌐 Environment:', process.env.NODE_ENV || 'development');
    console.log('💾 Memory Usage:', Math.round(process.memoryUsage().rss / 1024 / 1024), 'MB');
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('🛑 SIGTERM received. Shutting down gracefully...');
    server.close(() => {
        console.log('✅ Server closed');
        mongoose.connection.close(false, () => {
            console.log('✅ MongoDB connection closed');
            process.exit(0);
        });
    });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('🔥 Uncaught Exception:', err);
    console.log('🔄 Restarting server...');
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('🔥 Unhandled Rejection at:', promise, 'reason:', reason);
});