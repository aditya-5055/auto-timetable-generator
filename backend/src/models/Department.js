const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Department = sequelize.define('Department', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  deptName: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    field: 'dept_name'
  }
}, {
  tableName: 'departments'
});

module.exports = Department;
