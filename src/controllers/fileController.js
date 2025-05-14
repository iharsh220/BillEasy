const path = require('path');
const { File, Job } = require('../models');
const { fileProcessingQueue } = require('../config/queue');

const uploadFile = async (req, res) => {
  try {
    // Check if file exists
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const { title, description } = req.body;
    const userId = req.user.id;

    // Create file record in database
    const file = await File.create({
      userId,
      originalFilename: req.file.originalname,
      storagePath: req.file.path,
      title: title || req.file.originalname,
      description,
      status: 'uploaded'
    });

    // Create job record
    const job = await Job.create({
      fileId: file.id,
      jobType: 'fileProcessing',
      status: 'queued'
    });

    // Add job to queue
    await fileProcessingQueue.add('processFile', {
      fileId: file.id,
      jobId: job.id,
      userId
    });

    return res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      data: {
        fileId: file.id,
        status: file.status
      }
    });
  } catch (error) {
    console.error('File upload error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get file by ID
 * @route GET /files/:id
 */
const getFileById = async (req, res) => {
  try {
    const fileId = req.params.id;
    const userId = req.user.id;

    // Find file by ID
    const file = await File.findByPk(fileId, {
      include: [
        {
          model: Job,
          as: 'jobs',
          attributes: ['id', 'status', 'errorMessage', 'startedAt', 'completedAt']
        }
      ]
    });

    // Check if file exists
    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    // Check if user owns the file
    if (file.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        id: file.id,
        originalFilename: file.originalFilename,
        title: file.title,
        description: file.description,
        status: file.status,
        extractedData: file.extractedData,
        uploadedAt: file.uploadedAt,
        jobs: file.jobs
      }
    });
  } catch (error) {
    console.error('Get file error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get all files for the authenticated user
 * @route GET /files
 */
const getAllFiles = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Find all files for user with pagination
    const { count, rows: files } = await File.findAndCountAll({
      where: { userId },
      limit,
      offset,
      order: [['createdAt', 'DESC']],
      attributes: ['id', 'originalFilename', 'title', 'description', 'status', 'uploadedAt']
    });

    // Calculate pagination info
    const totalPages = Math.ceil(count / limit);

    return res.status(200).json({
      success: true,
      data: {
        files,
        pagination: {
          totalItems: count,
          totalPages,
          currentPage: page,
          itemsPerPage: limit
        }
      }
    });
  } catch (error) {
    console.error('Get all files error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  uploadFile,
  getFileById,
  getAllFiles
};
