const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Department = require('./Department');
const Division = require('./Division');
const Batch = require('./Batch');
const Course = require('./Course');
const MeetingTime = require('./MeetingTime');
const Room = require('./Room');
const Instructor = require('./Instructor');

const Section = sequelize.define('Section', {
  sectionId: {
    type: DataTypes.STRING(25),
    primaryKey: true,
    allowNull: false,
    field: 'section_id'
  },
  departmentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'department_id',
    references: {
      model: Department,
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  numClassInWeek: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    field: 'num_class_in_week'
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
    allowNull: true,
    field: 'meeting_time_id',
    references: {
      model: MeetingTime,
      key: 'pid'
    },
    onDelete: 'SET NULL'
  },
  roomId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'room_id',
    references: {
      model: Room,
      key: 'id'
    },
    onDelete: 'SET NULL'
  },
  instructorId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'instructor_id',
    references: {
      model: Instructor,
      key: 'id'
    },
    onDelete: 'SET NULL'
  },
  isElective: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'is_elective'
  },
  electiveGroup: {
    type: DataTypes.STRING(10),
    allowNull: true,
    field: 'elective_group'
  }
}, {
  tableName: 'sections'
});

// Relationships
Section.belongsTo(Department, { foreignKey: 'departmentId', as: 'department' });
Section.belongsTo(Division, { foreignKey: 'divisionId', as: 'division' });
Section.belongsTo(Batch, { foreignKey: 'batchId', as: 'batch' });
Section.belongsTo(Course, { foreignKey: 'courseNumber', as: 'course' });
Section.belongsTo(MeetingTime, { foreignKey: 'meetingTimeId', as: 'meetingTime' });
Section.belongsTo(Room, { foreignKey: 'roomId', as: 'room' });
Section.belongsTo(Instructor, { foreignKey: 'instructorId', as: 'instructor' });

module.exports = Section;
