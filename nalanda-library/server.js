require('dotenv').config();
const app = require('./src/app');
const connectDB = require('./src/config/database');

const PORT = process.env.PORT || 5000;

// Connect to database
connectDB();

// Start server
const server = app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║      🏛️  Nalanda Library Management System API 🏛️       ║
║                                                           ║
║  Server running in ${process.env.NODE_ENV || 'development'} mode                    ║
║  Port: ${PORT}                                           ║
║  Database: MongoDB                                        ║
║                                                           ║
║  Health Check: http://localhost:${PORT}/health           ║
║  API Base URL: http://localhost:${PORT}/api              ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.error('Unhandled Promise Rejection:', err);
    server.close(() => {
        process.exit(1);
    });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    server.close(() => {
        process.exit(1);
    });
});