const express = require('express');
const router = express.Router();
const MessageService = require('../services/messageService');
const { verifyFirebaseToken } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');
const { messageLimiter } = require('../middleware/rateLimiter');

/**
 * @swagger
 * components:
 *   schemas:
 *     Message:
 *       type: object
 *       properties:
 *         messageId:
 *           type: string
 *           description: Unique message ID
 *         senderId:
 *           type: string
 *           description: Sender Firebase UID
 *         communityId:
 *           type: string
 *           description: Community ID (null for private messages)
 *         recipientId:
 *           type: string
 *           description: Recipient Firebase UID (null for community messages)
 *         content:
 *           type: object
 *           properties:
 *             text:
 *               type: string
 *             type:
 *               type: string
 *               enum: [text, image, file, audio, video]
 *             fileUrl:
 *               type: string
 *             fileName:
 *               type: string
 *             fileSize:
 *               type: number
 *         mentions:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *               displayName:
 *                 type: string
 *         replyTo:
 *           type: object
 *           properties:
 *             messageId:
 *               type: string
 *             senderId:
 *               type: string
 *             preview:
 *               type: string
 *         reactions:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *               emoji:
 *                 type: string
 *               timestamp:
 *                 type: string
 *                 format: date-time
 *         readBy:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *               readAt:
 *                 type: string
 *                 format: date-time
 *         edited:
 *           type: object
 *           properties:
 *             isEdited:
 *               type: boolean
 *             editedAt:
 *               type: string
 *               format: date-time
 *             originalContent:
 *               type: string
 *         priority:
 *           type: string
 *           enum: [normal, high, urgent]
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/messages:
 *   post:
 *     summary: Send a message
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: object
 *                 properties:
 *                   text:
 *                     type: string
 *                     maxLength: 2000
 *                   type:
 *                     type: string
 *                     enum: [text, image, file, audio, video]
 *                     default: text
 *                 required:
 *                   - text
 *               communityId:
 *                 type: string
 *                 description: Community ID (for community messages)
 *               recipientId:
 *                 type: string
 *                 description: Recipient Firebase UID (for private messages)
 *               mentions:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of mentioned user Firebase UIDs
 *               replyTo:
 *                 type: string
 *                 description: Message ID being replied to
 *               priority:
 *                 type: string
 *                 enum: [normal, high, urgent]
 *                 default: normal
 *             required:
 *               - content
 *     responses:
 *       201:
 *         description: Message sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Message'
 *                 message:
 *                   type: string
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       429:
 *         description: Rate limit exceeded
 */
router.post('/', verifyFirebaseToken, messageLimiter, validate(schemas.sendMessage), async (req, res) => {
  try {
    const message = await MessageService.sendMessage(req.user.uid, req.body);
    res.status(201).json({
      success: true,
      data: message,
      message: 'Message sent successfully'
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
 * /api/messages:
 *   get:
 *     summary: Get messages for community or private chat
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: communityId
 *         schema:
 *           type: string
 *         description: Community ID (for community messages)
 *       - in: query
 *         name: recipientId
 *         schema:
 *           type: string
 *         description: Recipient Firebase UID (for private messages)
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
 *           default: 50
 *         description: Messages per page
 *     responses:
 *       200:
 *         description: Messages retrieved successfully
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
 *                     $ref: '#/components/schemas/Message'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *       400:
 *         description: Missing required parameters
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 */
router.get('/', verifyFirebaseToken, async (req, res) => {
  try {
    const { communityId, recipientId, page = 1, limit = 50 } = req.query;
    
    if (!communityId && !recipientId) {
      return res.status(400).json({
        success: false,
        message: 'Either communityId or recipientId is required'
      });
    }

    const messages = await MessageService.getMessages(req.user.uid, {
      communityId,
      recipientId,
      page: parseInt(page),
      limit: parseInt(limit)
    });
    
    res.json({
      success: true,
      data: messages,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    const statusCode = error.message.includes('not found') ? 404 : 
                      error.message.includes('Not a member') ? 403 : 400;
    res.status(statusCode).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/messages/search:
 *   get:
 *     summary: Search messages
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query
 *       - in: query
 *         name: communityId
 *         schema:
 *           type: string
 *         description: Community ID to search within
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
 *         description: Results per page
 *     responses:
 *       200:
 *         description: Messages found
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
 *                     $ref: '#/components/schemas/Message'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *       400:
 *         description: Missing search query
 *       401:
 *         description: Unauthorized
 */
router.get('/search', verifyFirebaseToken, async (req, res) => {
  try {
    const { q: query, communityId, page = 1, limit = 20 } = req.query;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const messages = await MessageService.searchMessages(req.user.uid, {
      query,
      communityId,
      page: parseInt(page),
      limit: parseInt(limit)
    });
    
    res.json({
      success: true,
      data: messages,
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
 * /api/messages/{messageId}:
 *   put:
 *     summary: Edit a message
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: string
 *         description: Message ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: object
 *                 properties:
 *                   text:
 *                     type: string
 *                     maxLength: 2000
 *                 required:
 *                   - text
 *             required:
 *               - content
 *     responses:
 *       200:
 *         description: Message edited successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Message'
 *                 message:
 *                   type: string
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       404:
 *         description: Message not found
 */
router.put('/:messageId', verifyFirebaseToken, validate(schemas.editMessage), async (req, res) => {
  try {
    const message = await MessageService.editMessage(req.params.messageId, req.user.uid, req.body.content);
    res.json({
      success: true,
      data: message,
      message: 'Message edited successfully'
    });
  } catch (error) {
    const statusCode = error.message.includes('not found') ? 404 : 
                      error.message.includes('Only message sender') ? 403 : 400;
    res.status(statusCode).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/messages/{messageId}:
 *   delete:
 *     summary: Delete a message
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: string
 *         description: Message ID
 *     responses:
 *       200:
 *         description: Message deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       404:
 *         description: Message not found
 */
router.delete('/:messageId', verifyFirebaseToken, async (req, res) => {
  try {
    const result = await MessageService.deleteMessage(req.params.messageId, req.user.uid);
    res.json(result);
  } catch (error) {
    const statusCode = error.message.includes('not found') ? 404 : 
                      error.message.includes('Not authorized') ? 403 : 400;
    res.status(statusCode).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/messages/{messageId}/reactions:
 *   post:
 *     summary: Add reaction to message
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: string
 *         description: Message ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               emoji:
 *                 type: string
 *                 maxLength: 10
 *             required:
 *               - emoji
 *     responses:
 *       200:
 *         description: Reaction added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Message'
 *                 message:
 *                   type: string
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Message not found
 */
router.post('/:messageId/reactions', verifyFirebaseToken, validate(schemas.addReaction), async (req, res) => {
  try {
    const message = await MessageService.addReaction(req.params.messageId, req.user.uid, req.body.emoji);
    res.json({
      success: true,
      data: message,
      message: 'Reaction added successfully'
    });
  } catch (error) {
    const statusCode = error.message.includes('not found') ? 404 : 400;
    res.status(statusCode).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/messages/{messageId}/reactions:
 *   delete:
 *     summary: Remove reaction from message
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: string
 *         description: Message ID
 *     responses:
 *       200:
 *         description: Reaction removed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Message'
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Message not found
 */
router.delete('/:messageId/reactions', verifyFirebaseToken, async (req, res) => {
  try {
    const message = await MessageService.removeReaction(req.params.messageId, req.user.uid);
    res.json({
      success: true,
      data: message,
      message: 'Reaction removed successfully'
    });
  } catch (error) {
    const statusCode = error.message.includes('not found') ? 404 : 400;
    res.status(statusCode).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/messages/{messageId}/read:
 *   post:
 *     summary: Mark message as read
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: string
 *         description: Message ID
 *     responses:
 *       200:
 *         description: Message marked as read
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Message not found
 */
router.post('/:messageId/read', verifyFirebaseToken, async (req, res) => {
  try {
    const result = await MessageService.markAsRead(req.params.messageId, req.user.uid);
    res.json(result);
  } catch (error) {
    const statusCode = error.message.includes('not found') ? 404 : 400;
    res.status(statusCode).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
