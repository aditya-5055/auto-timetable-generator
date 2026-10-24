const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Room = sequelize.define('Room', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  rNumber: {
    type: DataTypes.STRING(6),
    allowNull: false,
    unique: true,
    field: 'r_number'
  },
  seatingCapacity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    field: 'seating_capacity'
  },
  roomType: {
    type: DataTypes.ENUM('LECTURE', 'LAB'),
    allowNull: false,
    defaultValue: 'LECTURE',
    field: 'room_type'
  }
}, {
  tableName: 'rooms',
  validate: {
    capacityCheck() {
      if (this.roomType === 'LECTURE' && this.seatingCapacity < 80) {
        throw new Error('Lecture rooms must have a seating capacity of at least 80.');
      }
      if (this.roomType === 'LAB' && this.seatingCapacity < 22) {
        throw new Error('Lab rooms must have a seating capacity of at least 22.');
      }
    }
  }
});

module.exports = Room;
