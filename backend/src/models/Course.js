const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Instructor = require('./Instructor');

const Course = sequelize.define('Course', {
  courseNumber: {
    type: DataTypes.STRING(8),
    primaryKey: true,
    allowNull: false,
    field: 'course_number'
  },
  courseName: {
    type: DataTypes.STRING(40),
    allowNull: false,
    field: 'course_name'
  },
  maxNumbStudents: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 88,
    field: 'max_numb_students'
  },
  courseType: {
    type: DataTypes.ENUM('LECTURE', 'LAB'),
    allowNull: false,
    defaultValue: 'LECTURE',
    field: 'course_type'
  },
  isElective: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'is_elective'
  }
}, {
  tableName: 'courses'
});

// Many-to-Many relationship definition
Course.belongsToMany(Instructor, {
  through: 'course_instructors',
  foreignKey: 'course_number',
  otherKey: 'instructor_id',
  timestamps: false,
  as: 'instructors'
});

Instructor.belongsToMany(Course, {
  through: 'course_instructors',
  foreignKey: 'instructor_id',
  otherKey: 'course_number',
  timestamps: false,
  as: 'courses'
});

module.exports = Course;
