const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Instructor = sequelize.define('Instructor', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  uid: {
    type: DataTypes.STRING(6),
    allowNull: false,
    unique: true
  },
  name: {
    type: DataTypes.STRING(25),
    allowNull: false
  },
  maxLecturesPerWeek: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 3,
    field: 'max_lectures_per_week'
  },
  maxLabsPerWeek: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 3,
    field: 'max_labs_per_week'
  }
}, {
  tableName: 'instructors'
});

module.exports = Instructor;
