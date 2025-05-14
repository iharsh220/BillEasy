const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { Worker } = require('bullmq');
const { File, Job } = require('../models');
const logger = require('../utils/logger');
const zlib = require('zlib');
const util = require('util');
require('dotenv').config();

// Promisify zlib functions
const gzipAsync = util.promisify(zlib.gzip);

// Redis connection options
const redisOptions = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT) || 6379
};

const calculateFileHash = (filePath) => {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);

    stream.on('error', err => reject(err));
    stream.on('data', chunk => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
  });
};

const compressFile = async (filePath) => {
  try {
    // Read the file
    const fileContent = fs.readFileSync(filePath);

    // Compress the file
    const compressedContent = await gzipAsync(fileContent);

    // Create compressed file path
    const compressedFilePath = `${filePath}.gz`;

    // Write compressed file
    fs.writeFileSync(compressedFilePath, compressedContent);

    return compressedFilePath;
  } catch (error) {
    logger.error(`Error compressing file: ${error.message}`);
    throw error;
  }
};

const detectMimeType = (filename) => {
  const ext = path.extname(filename).toLowerCase();

  const mimeTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.ppt': 'application/vnd.ms-powerpoint',
    '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    '.txt': 'text/plain',
    '.csv': 'text/csv',
    '.html': 'text/html',
    '.json': 'application/json',
    '.xml': 'application/xml',
    '.zip': 'application/zip',
    '.rar': 'application/x-rar-compressed',
    '.7z': 'application/x-7z-compressed',
    '.gz': 'application/gzip'
  };

  return mimeTypes[ext] || 'application/octet-stream';
};

const processFile = async (job) => {
  const { fileId, jobId } = job.data;
  let compressedFilePath = null;

  try {
    logger.info(`Starting processing for file ${fileId}, job ${jobId}`);

    // Update job status to processing
    await Job.update(
      { status: 'processing', startedAt: new Date() },
      { where: { id: jobId } }
    );

    // Update file status to processing
    await File.update(
      { status: 'processing' },
      { where: { id: fileId } }
    );

    // Get file from database
    const file = await File.findByPk(fileId);

    if (!file) {
      throw new Error('File not found');
    }

    logger.info(`Processing file: ${file.originalFilename}`, { fileId, jobId });

    // Calculate file hash
    const fileHash = await calculateFileHash(file.storagePath);
    logger.debug(`File hash calculated: ${fileHash}`, { fileId });

    // Compress the file
    compressedFilePath = await compressFile(file.storagePath);
    logger.debug(`File compressed: ${compressedFilePath}`, { fileId });

    // Get file stats
    const originalStats = fs.statSync(file.storagePath);
    const compressedStats = fs.statSync(compressedFilePath);

    // Calculate compression ratio
    const compressionRatio = (1 - (compressedStats.size / originalStats.size)) * 100;

    // Detect MIME type
    const mimeType = detectMimeType(file.originalFilename);

    // Create extracted data
    const extractedData = JSON.stringify({
      hash: fileHash,
      size: {
        original: originalStats.size,
        compressed: compressedStats.size,
        compressionRatio: compressionRatio.toFixed(2) + '%'
      },
      mimeType,
      fileExtension: path.extname(file.originalFilename),
      lastModified: originalStats.mtime,
      compressedPath: compressedFilePath,
      processedAt: new Date().toISOString()
    });

    logger.info(`File processing completed for file ${fileId}`, {
      originalSize: originalStats.size,
      compressedSize: compressedStats.size,
      compressionRatio: compressionRatio.toFixed(2) + '%'
    });

    // Update file with extracted data
    await File.update(
      {
        status: 'processed',
        extractedData
      },
      { where: { id: fileId } }
    );

    // Update job status to completed
    await Job.update(
      {
        status: 'completed',
        completedAt: new Date()
      },
      { where: { id: jobId } }
    );

    return { success: true, fileId, jobId };
  } catch (error) {
    logger.error(`Error processing file ${fileId}:`, { error: error.message, stack: error.stack });

    // Update file status to failed
    await File.update(
      { status: 'failed' },
      { where: { id: fileId } }
    );

    // Update job status to failed
    await Job.update(
      {
        status: 'failed',
        errorMessage: error.message,
        completedAt: new Date()
      },
      { where: { id: jobId } }
    );

    throw error;
  }
};

// Create worker
const worker = new Worker('fileProcessing', processFile, { connection: redisOptions });

// Handle worker events
worker.on('completed', job => {
  logger.info(`Job ${job.id} completed for file ${job.data.fileId}`);
});

worker.on('failed', (job, err) => {
  logger.error(`Job ${job.id} failed for file ${job.data.fileId}:`, {
    error: err.message,
    stack: err.stack
  });
});

worker.on('active', job => {
  logger.info(`Job ${job.id} started processing file ${job.data.fileId}`);
});

worker.on('stalled', job => {
  logger.warn(`Job ${job.id} stalled for file ${job.data.fileId}`);
});

module.exports = worker;
