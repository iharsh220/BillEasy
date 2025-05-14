const express = require('express');
const { uploadFile, getFileById, getAllFiles } = require('../controllers/fileController');
const { authenticate } = require('../middlewares/auth');
const { upload, handleMulterError } = require('../middlewares/upload');
const { uploadLimiter } = require('../middlewares/rateLimiter');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// POST /upload - Upload a file
router.post('/upload', uploadLimiter, upload.single('file'), handleMulterError, uploadFile);

// GET /files/:id - Get file by ID
router.get('/files/:id', getFileById);

// GET /files - Get all files for authenticated user
router.get('/files', getAllFiles);

module.exports = router;
