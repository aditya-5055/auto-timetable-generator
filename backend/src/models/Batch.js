const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Division = require('./Division');

const Batch = sequelize.define('Batch', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  batchName: {
    type: DataTypes.STRING(10),
    allowNull: false,
    field: 'batch_name'
  },
  divisionId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'division_id',
    references: {
      model: Division,
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  studentCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 22,
    field: 'student_count'
  }
}, {
  tableName: 'batches',
  indexes: [
    {
      unique: true,
      fields: ['division_id', 'batch_name']
    }
  ]
});

// Relationships
Division.hasMany(Batch, { foreignKey: 'divisionId', as: 'batches' });
Batch.belongsTo(Division, { foreignKey: 'divisionId', as: 'division' });

module.exports = Batch;
