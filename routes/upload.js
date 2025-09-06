const express = require('express');
const router = express.Router();
const FileService = require('../services/fileService');
const { verifyFirebaseToken } = require('../middleware/auth');
const { uploadLimiter } = require('../middleware/rateLimiter');
const path = require('path');

/**
 * @swagger
 * components:
 *   schemas:
 *     FileUpload:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         data:
 *           type: object
 *           properties:
 *             filename:
 *               type: string
 *               description: Uploaded file name
 *             originalName:
 *               type: string
 *               description: Original file name
 *             fileUrl:
 *               type: string
 *               description: File URL
 *             fileSize:
 *               type: number
 *               description: File size in bytes
 *             fileType:
 *               type: string
 *               enum: [image, video, audio, file]
 *               description: File type category
 *             mimetype:
 *               type: string
 *               description: File MIME type
 */

/**
 * @swagger
 * /api/upload:
 *   post:
 *     summary: Upload a file
 *     tags: [File Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: File to upload
 *             required:
 *               - file
 *     responses:
 *       200:
 *         description: File uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FileUpload'
 *       400:
 *         description: No file uploaded or invalid file type
 *       401:
 *         description: Unauthorized
 *       413:
 *         description: File too large
 *       429:
 *         description: Rate limit exceeded
 */
router.post('/', verifyFirebaseToken, uploadLimiter, (req, res) => {
  FileService.uploadSingle(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({
          success: false,
          message: 'File too large. Maximum size is 10MB.'
        });
      }
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const fileType = FileService.getFileType(req.file.mimetype);
    const fileUrl = FileService.getFileUrl(req.file.filename, fileType === 'file' ? 'misc' : fileType + 's');

    res.json({
      success: true,
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        fileUrl: fileUrl,
        fileSize: req.file.size,
        fileType: fileType,
        mimetype: req.file.mimetype
      },
      message: 'File uploaded successfully'
    });
  });
});

/**
 * @swagger
 * /api/upload/multiple:
 *   post:
 *     summary: Upload multiple files
 *     tags: [File Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Files to upload (max 5)
 *             required:
 *               - files
 *     responses:
 *       200:
 *         description: Files uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       filename:
 *                         type: string
 *                       originalName:
 *                         type: string
 *                       fileUrl:
 *                         type: string
 *                       fileSize:
 *                         type: number
 *                       fileType:
 *                         type: string
 *                       mimetype:
 *                         type: string
 *                 message:
 *                   type: string
 *       400:
 *         description: No files uploaded or invalid file type
 *       401:
 *         description: Unauthorized
 *       413:
 *         description: File too large
 *       429:
 *         description: Rate limit exceeded
 */
router.post('/multiple', verifyFirebaseToken, uploadLimiter, (req, res) => {
  FileService.uploadMultiple(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({
          success: false,
          message: 'One or more files are too large. Maximum size is 10MB per file.'
        });
      }
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    const uploadedFiles = req.files.map(file => {
      const fileType = FileService.getFileType(file.mimetype);
      const fileUrl = FileService.getFileUrl(file.filename, fileType === 'file' ? 'misc' : fileType + 's');

      return {
        filename: file.filename,
        originalName: file.originalname,
        fileUrl: fileUrl,
        fileSize: file.size,
        fileType: fileType,
        mimetype: file.mimetype
      };
    });

    res.json({
      success: true,
      data: uploadedFiles,
      message: `${uploadedFiles.length} files uploaded successfully`
    });
  });
});

// Serve uploaded files
router.use('/files', express.static(process.env.UPLOAD_PATH || './uploads'));

module.exports = router;
