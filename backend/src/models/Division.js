const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Department = require('./Department');

const Division = sequelize.define('Division', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  divisionName: {
    type: DataTypes.STRING(20),
    allowNull: false,
    field: 'division_name'
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
  totalStudents: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 88,
    field: 'total_students'
  },
  electiveGroup: {
    type: DataTypes.STRING(10),
    allowNull: true,
    field: 'elective_group'
  }
}, {
  tableName: 'divisions',
  indexes: [
    {
      unique: true,
      fields: ['division_name', 'department_id']
    }
  ]
});

// Relationships
Department.hasMany(Division, { foreignKey: 'departmentId', as: 'divisions' });
Division.belongsTo(Department, { foreignKey: 'departmentId', as: 'department' });

module.exports = Division;
