const sequelize = require('../config/db');
const User = require('./user');
const File = require('./file');
const Job = require('./job');

// Define relationships
User.hasMany(File, { foreignKey: 'userId', as: 'files' });
File.belongsTo(User, { foreignKey: 'userId', as: 'user' });

File.hasMany(Job, { foreignKey: 'fileId', as: 'jobs' });
Job.belongsTo(File, { foreignKey: 'fileId', as: 'file' });

module.exports = {
  sequelize,
  User,
  File,
  Job
};
