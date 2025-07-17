require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/mongo');

const app = express();

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check route
app.get('/health', (req, res) => {
  res.json({ 
    message: 'Server is running',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    port: PORT,
    environment: process.env.NODE_ENV || 'development'
  });
});

const PORT = process.env.PORT || 3334;

// Initialize the application
const initializeApp = async () => {
  try {
    // Connect to MongoDB first
    await connectDB();
    
    // Load routes after database connection is established
    app.use('/api/auth', require('./routes/auth'));
    app.use('/api/admin', require('./routes/admin'));
    app.use('/api/owner', require('./routes/owner'));
    app.use('/api/company', require('./routes/company'));
    app.use('/api/employees', require('./routes/employee'));
    app.use('/api/hotels', require('./routes/hotels'));
    
    // Start the server
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (error) {
    console.error('Failed to initialize application:', error);
    process.exit(1);
  }
};

// Start the application
initializeApp();
