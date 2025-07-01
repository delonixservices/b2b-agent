require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/mongo');

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/owner', require('./routes/owner'));
app.use('/api/company', require('./routes/company'));
app.use('/api/employees', require('./routes/employee'));

// Health check route
app.get('/health', (req, res) => {
  res.json({ message: 'Server is running' });
});

const PORT = process.env.PORT || 3334;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
