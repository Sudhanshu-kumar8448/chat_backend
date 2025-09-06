const express = require('express');
const router = express.Router();
const ReportService = require('../services/reportService');
const { verifyFirebaseToken } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');

/**
 * @swagger
 * components:
 *   schemas:
 *     Report:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Report ID
 *         reporterId:
 *           type: string
 *           description: Reporter Firebase UID
 *         reportedUserId:
 *           type: string
 *           description: Reported user Firebase UID
 *         messageId:
 *           type: string
 *           description: Reported message ID
 *         communityId:
 *           type: string
 *           description: Community ID where report occurred
 *         type:
 *           type: string
 *           enum: [spam, harassment, inappropriate_content, fake_profile, other]
 *           description: Report type
 *         reason:
 *           type: string
 *           description: Report reason
 *         status:
 *           type: string
 *           enum: [pending, reviewed, resolved, dismissed]
 *           description: Report status
 *         reviewedBy:
 *           type: string
 *           description: Admin Firebase UID who reviewed
 *         reviewedAt:
 *           type: string
 *           format: date-time
 *           description: When report was reviewed
 *         action:
 *           type: string
 *           enum: [none, warning, temporary_ban, permanent_ban, content_removed]
 *           description: Action taken
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: When report was created
 */

/**
 * @swagger
 * /api/reports:
 *   post:
 *     summary: Create a new report
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reportedUserId:
 *                 type: string
 *                 description: Firebase UID of reported user
 *               messageId:
 *                 type: string
 *                 description: ID of reported message
 *               communityId:
 *                 type: string
 *                 description: Community ID where report occurred
 *               type:
 *                 type: string
 *                 enum: [spam, harassment, inappropriate_content, fake_profile, other]
 *                 description: Report type
 *               reason:
 *                 type: string
 *                 maxLength: 1000
 *                 description: Detailed reason for report
 *             required:
 *               - type
 *               - reason
 *     responses:
 *       201:
 *         description: Report created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Report'
 *                 message:
 *                   type: string
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post('/', verifyFirebaseToken, validate(schemas.createReport), async (req, res) => {
  try {
    const report = await ReportService.createReport(req.user.uid, req.body);
    res.status(201).json({
      success: true,
      data: report,
      message: 'Report submitted successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/reports/my:
 *   get:
 *     summary: Get user's reports
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Reports per page
 *     responses:
 *       200:
 *         description: User reports retrieved successfully
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
 *                     $ref: '#/components/schemas/Report'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 */
router.get('/my', verifyFirebaseToken, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    const reports = await ReportService.getUserReports(
      req.user.uid,
      parseInt(page),
      parseInt(limit)
    );
    
    res.json({
      success: true,
      data: reports,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/reports:
 *   get:
 *     summary: Get all reports (Admin only)
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, reviewed, resolved, dismissed]
 *         description: Filter by status
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [spam, harassment, inappropriate_content, fake_profile, other]
 *         description: Filter by type
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Reports per page
 *     responses:
 *       200:
 *         description: Reports retrieved successfully
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
 *                     $ref: '#/components/schemas/Report'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */
router.get('/', verifyFirebaseToken, async (req, res) => {
  try {
    // Note: In a real application, you would check if the user is an admin
    // For this example, we'll allow all authenticated users to access reports
    const { status, type, page = 1, limit = 20 } = req.query;
    
    const reports = await ReportService.getReports(req.user.uid, {
      status,
      type,
      page: parseInt(page),
      limit: parseInt(limit)
    });
    
    res.json({
      success: true,
      data: reports,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/reports/{id}/status:
 *   put:
 *     summary: Update report status (Admin only)
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Report ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, reviewed, resolved, dismissed]
 *                 description: New report status
 *               action:
 *                 type: string
 *                 enum: [none, warning, temporary_ban, permanent_ban, content_removed]
 *                 default: none
 *                 description: Action taken
 *             required:
 *               - status
 *     responses:
 *       200:
 *         description: Report status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Report'
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid status or action
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Report not found
 */
router.put('/:id/status', verifyFirebaseToken, async (req, res) => {
  try {
    const { status, action = 'none' } = req.body;
    
    if (!['pending', 'reviewed', 'resolved', 'dismissed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    if (!['none', 'warning', 'temporary_ban', 'permanent_ban', 'content_removed'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid action'
      });
    }

    const report = await ReportService.updateReportStatus(req.params.id, req.user.uid, status, action);
    
    res.json({
      success: true,
      data: report,
      message: 'Report status updated successfully'
    });
  } catch (error) {
    const statusCode = error.message.includes('not found') ? 404 : 400;
    res.status(statusCode).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
