const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Create HTTP server
const server = http.createServer(app);

// Middleware
app.use(cors({
  origin: ['http://192.168.18.108:5000', 'http://192.168.1.12:5000', 'http://localhost:5000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
app.use(express.json());

// Add error handling for CORS
app.use((err, req, res, next) => {
  if (err.name === 'CORSError') {
    console.error('CORS Error:', err);
    return res.status(403).json({ message: 'CORS error: Not allowed' });
  }
  next(err);
});

// MongoDB Connection Options
const mongoOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
  family: 4 // Use IPv4, skip trying IPv6
};

// Connect to MongoDB
mongoose.connect("mongodb+srv://zainmajid906:Dy4pA2keLrF22K41@cluster0.dc0a1la.mongodb.net/", mongoOptions)
  .then(() => {
    console.log('✅ MongoDB Connected Successfully!');
    console.log('📦 Database:', mongoose.connection.name);
    console.log('🔌 Host:', mongoose.connection.host);
    console.log('🚀 Port:', mongoose.connection.port);
  })
  .catch(err => {
    console.error('❌ MongoDB Connection Error:', err);
    process.exit(1); // Exit process with failure
  });

// Connection event handlers
mongoose.connection.on('connected', () => {
  console.log('🟢 Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('🔴 Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('🟡 Mongoose disconnected from MongoDB');
});

// Handle application termination
process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close();
    console.log('MongoDB connection closed through app termination');
    process.exit(0);
  } catch (err) {
    console.error('Error during MongoDB disconnection:', err);
    process.exit(1);
  }
});

// Routes
app.use('/api/auth/mechanic', require('./routes/mechanicAuth'));
app.use('/api/auth/user', require('./routes/userAuth'));
app.use('/api/issues', require('./routes/issueRoutes'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
}); 