const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const MeetingTime = sequelize.define('MeetingTime', {
  pid: {
    type: DataTypes.STRING(4),
    primaryKey: true,
    allowNull: false
  },
  time: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  day: {
    type: DataTypes.ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'),
    allowNull: false
  },
  slotType: {
    type: DataTypes.ENUM('LECTURE', 'LAB'),
    allowNull: false,
    defaultValue: 'LECTURE',
    field: 'slot_type'
  }
}, {
  tableName: 'meeting_times',
  indexes: [
    {
      unique: true,
      fields: ['day', 'time', 'slot_type']
    }
  ]
});

module.exports = MeetingTime;
