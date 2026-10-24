const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Department = require('./Department');
const Division = require('./Division');
const Batch = require('./Batch');
const Course = require('./Course');
const MeetingTime = require('./MeetingTime');
const Room = require('./Room');
const Instructor = require('./Instructor');
const Section = require('./Section');

const TimetableSlot = sequelize.define('TimetableSlot', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  sectionId: {
    type: DataTypes.STRING(25),
    allowNull: false,
    field: 'section_id',
    references: {
      model: Section,
      key: 'section_id'
    },
    onDelete: 'CASCADE'
  },
  divisionId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'division_id',
    references: {
      model: Division,
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  batchId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'batch_id',
    references: {
      model: Batch,
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  courseNumber: {
    type: DataTypes.STRING(8),
    allowNull: true,
    field: 'course_number',
    references: {
      model: Course,
      key: 'course_number'
    },
    onDelete: 'CASCADE'
  },
  meetingTimeId: {
    type: DataTypes.STRING(4),
    allowNull: false,
    field: 'meeting_time_id',
    references: {
      model: MeetingTime,
      key: 'pid'
    },
    onDelete: 'CASCADE'
  },
  roomId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'room_id',
    references: {
      model: Room,
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  instructorId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'instructor_id',
    references: {
      model: Instructor,
      key: 'id'
    },
    onDelete: 'CASCADE'
  }
}, {
  tableName: 'timetable_slots'
});

// Relationships
TimetableSlot.belongsTo(Section, { foreignKey: 'sectionId', as: 'section' });
TimetableSlot.belongsTo(Division, { foreignKey: 'divisionId', as: 'division' });
TimetableSlot.belongsTo(Batch, { foreignKey: 'batchId', as: 'batch' });
TimetableSlot.belongsTo(Course, { foreignKey: 'courseNumber', as: 'course' });
TimetableSlot.belongsTo(MeetingTime, { foreignKey: 'meetingTimeId', as: 'meetingTime' });
TimetableSlot.belongsTo(Room, { foreignKey: 'roomId', as: 'room' });
TimetableSlot.belongsTo(Instructor, { foreignKey: 'instructorId', as: 'instructor' });

module.exports = TimetableSlot;
