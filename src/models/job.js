const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Job = sequelize.define('Job', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  fileId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'file_id',
    references: {
      model: 'files',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  jobType: {
    type: DataTypes.STRING(50),
    allowNull: false,
    field: 'job_type'
  },
  status: {
    type: DataTypes.ENUM('queued', 'processing', 'completed', 'failed'),
    allowNull: false,
    defaultValue: 'queued'
  },
  errorMessage: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'error_message'
  },
  startedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'started_at'
  },
  completedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'completed_at'
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'created_at'
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'updated_at'
  }
}, {
  tableName: 'jobs',
  timestamps: true
});

module.exports = Job;
