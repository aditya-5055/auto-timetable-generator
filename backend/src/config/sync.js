const sequelize = require('./db');

// Import all models to ensure they are registered with the Sequelize instance
const Department = require('../models/Department');
const Division = require('../models/Division');
const Batch = require('../models/Batch');
const Instructor = require('../models/Instructor');
const Room = require('../models/Room');
const Course = require('../models/Course');
const MeetingTime = require('../models/MeetingTime');
const Section = require('../models/Section');
const User = require('../models/User');
const TimetableSlot = require('../models/TimetableSlot');



async function syncDatabase() {
  try {
    // 1. Authenticate connection
    await sequelize.authenticate();
    console.log('🟢 Connection to MySQL database established successfully.');

    // 2. Synchronize models
    await sequelize.sync({ alter: true });
    console.log('✅ Database models successfully synchronized with MySQL.');
    process.exit(0);
  } catch (error) {
    console.error('🔴 Database sync failed:', error.message);
    process.exit(1);
  }
}

syncDatabase();
