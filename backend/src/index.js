const express = require('express');
const cors = require('cors');
require('dotenv').config();

const sequelize = require('./config/db');

// Import routes
const authRoutes = require('./routes/authRoutes');
const departmentRoutes = require('./routes/departmentRoutes');
const divisionRoutes = require('./routes/divisionRoutes');
const batchRoutes = require('./routes/batchRoutes');
const instructorRoutes = require('./routes/instructorRoutes');
const roomRoutes = require('./routes/roomRoutes');
const courseRoutes = require('./routes/courseRoutes');
const meetingTimeRoutes = require('./routes/meetingTimeRoutes');
const sectionRoutes = require('./routes/sectionRoutes');
const timetableRoutes = require('./routes/timetableRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/divisions', divisionRoutes);
app.use('/api/batches', batchRoutes);
app.use('/api/instructors', instructorRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/meeting-times', meetingTimeRoutes);
app.use('/api/sections', sectionRoutes);
app.use('/api/timetable', timetableRoutes);

// Base route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the Automatic Timetable Generator REST API!' });
});

// Sync and Start Server
async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('🟢 MySQL Connection has been established successfully.');
    
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('🔴 Unable to connect to the database:', error);
  }
}

startServer();
