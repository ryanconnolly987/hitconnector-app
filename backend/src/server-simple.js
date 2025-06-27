const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());

// Mock data
const mockUsers = [];
let userIdCounter = 1;

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'HitConnector API is running (Mock Mode)',
    timestamp: new Date().toISOString(),
  });
});

// Mock auth endpoints
app.post('/api/auth/signup', (req, res) => {
  const { email, password, userType, firstName, lastName } = req.body;
  
  // Check if user exists
  const existingUser = mockUsers.find(u => u.email === email);
  if (existingUser) {
    res.status(409).json({
      success: false,
      message: 'User with this email already exists'
    });
    return;
  }

  // Create mock user
  const user = {
    id: userIdCounter++,
    email,
    userType,
    firstName,
    lastName,
    createdAt: new Date().toISOString()
  };
  
  mockUsers.push({ ...user, password });

  // Mock token
  const token = `mock-token-${user.id}`;

  res.status(201).json({
    success: true,
    message: 'User created successfully',
    data: {
      user,
      token
    }
  });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password, userType } = req.body;
  
  const user = mockUsers.find(u => u.email === email && u.userType === userType);
  
  if (!user || user.password !== password) {
    res.status(401).json({
      success: false,
      message: 'Invalid email or password'
    });
    return;
  }

  const { password: _, ...userWithoutPassword } = user;
  const token = `mock-token-${user.id}`;

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: userWithoutPassword,
      token
    }
  });
});

app.get('/api/auth/me', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      message: 'No token provided'
    });
    return;
  }

  const token = authHeader.substring(7);
  const userId = token.replace('mock-token-', '');
  const user = mockUsers.find(u => u.id.toString() === userId);

  if (!user) {
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
    return;
  }

  const { password: _, ...userWithoutPassword } = user;
  res.json({
    success: true,
    data: userWithoutPassword
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Mock Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app; 