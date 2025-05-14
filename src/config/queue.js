const { Queue } = require('bullmq');
require('dotenv').config();

// Redis connection options
const redisOptions = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT) || 6379
};

// Create file processing queue
const fileProcessingQueue = new Queue('fileProcessing', {
  connection: redisOptions,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000
    },
    removeOnComplete: true,
    removeOnFail: false
  }
});

module.exports = {
  fileProcessingQueue
};
