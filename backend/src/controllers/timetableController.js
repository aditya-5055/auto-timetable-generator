const { runScheduler, saveScheduleToDatabase } = require('../services/schedulerService');
const TimetableSlot = require('../models/TimetableSlot');
const Section = require('../models/Section');
const Division = require('../models/Division');
const Batch = require('../models/Batch');
const Course = require('../models/Course');
const MeetingTime = require('../models/MeetingTime');
const Room = require('../models/Room');
const Instructor = require('../models/Instructor');

exports.generateTimetable = async (req, res) => {
  try {
    console.log('🔄 Starting timetable generation request...');
    const result = await runScheduler();

    if (result.success) {
      // Save assignments to MySQL
      await saveScheduleToDatabase(result.schedule);
      
      return res.json({
        success: true,
        message: 'Perfect timetable generated and saved successfully!',
        timeTaken: result.timeTaken
      });
    } else {
      return res.status(422).json({
        success: false,
        message: 'Failed to clear all conflicts. Best-effort schedule computed.',
        timeTaken: result.timeTaken,
        conflicts: result.conflicts
      });
    }
  } catch (error) {
    console.error('generateTimetable error:', error);
    return res.status(500).json({ message: 'Internal server error during timetable generation' });
  }
};

exports.getTimetable = async (req, res) => {
  try {
    console.log('GET /api/timetable - Fetching scheduled slots...');
    const slots = await TimetableSlot.findAll({
      include: [
        { model: Section, as: 'section' },
        { model: Division, as: 'division' },
        { model: Batch, as: 'batch' },
        { model: Course, as: 'course' },
        { model: MeetingTime, as: 'meetingTime' },
        { model: Room, as: 'room' },
        { model: Instructor, as: 'instructor' }
      ]
    });
    return res.json(slots);
  } catch (error) {
    console.error('getTimetable error:', error);
    return res.status(500).json({ message: 'Internal server error while fetching timetable slots' });
  }
};
