import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';

// Import routes
import authRoutes from './routes/auth';
import studioRoutes from './routes/studios';
import bookingRoutes from './routes/bookings';
import userRoutes from './routes/users';
import reviewRoutes from './routes/reviews';
import uploadRoutes from './routes/upload';

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/logger';

// Import database connection
import { initDatabase } from './config/database';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(requestLogger);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'HitConnector API is running',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/studios', studioRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/users', userRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/upload', uploadRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Error handling middleware
app.use(errorHandler);

// Initialize database and start server
async function startServer() {
  try {
    await initDatabase();
    console.log('Database initialized successfully');

    const server = createServer(app);
    
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM received, shutting down gracefully');
      server.close(() => {
        console.log('Process terminated');
      });
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app; 