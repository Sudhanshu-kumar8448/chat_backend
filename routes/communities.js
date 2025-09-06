const express = require('express');
const router = express.Router();
const CommunityService = require('../services/communityService');
const { verifyFirebaseToken } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');
const { communityLimiter } = require('../middleware/rateLimiter');

/**
 * @swagger
 * components:
 *   schemas:
 *     Community:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Community ID
 *         name:
 *           type: string
 *           description: Community name
 *         description:
 *           type: string
 *           description: Community description
 *         image:
 *           type: string
 *           description: Community image URL
 *         creator:
 *           type: string
 *           description: Creator Firebase UID
 *         admins:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of admin Firebase UIDs
 *         members:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *               joinedAt:
 *                 type: string
 *                 format: date-time
 *               role:
 *                 type: string
 *                 enum: [member, admin, moderator]
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *         isPrivate:
 *           type: boolean
 *         memberCount:
 *           type: number
 *         lastActivity:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/communities:
 *   post:
 *     summary: Create a new community
 *     tags: [Communities]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *               description:
 *                 type: string
 *                 maxLength: 500
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 maxItems: 10
 *               isPrivate:
 *                 type: boolean
 *                 default: false
 *             required:
 *               - name
 *     responses:
 *       201:
 *         description: Community created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Community'
 *                 message:
 *                   type: string
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       429:
 *         description: Rate limit exceeded
 */

/**
 * @swagger
 * /api/communities:
 *   get:
 *     summary: Get all public communities
 *     tags: [Communities]
 *     responses:
 *       200:
 *         description: List of public communities
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
 *                     $ref: '#/components/schemas/Community'
 *                 count:
 *                   type: number
 */
router.get('/', async (req, res) => {
  try {
    const communities = await CommunityService.getPublicCommunities();
    res.json({
      success: true,
      data: communities,
      count: communities.length,
      message: 'Public communities retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching public communities:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch communities',
      error: error.message
    });
  }
});

router.post('/', verifyFirebaseToken, communityLimiter, validate(schemas.createCommunity), async (req, res) => {
  try {
    const community = await CommunityService.createCommunity(req.user.uid, req.body);
    res.status(201).json({
      success: true,
      data: community,
      message: 'Community created successfully'
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
 * /api/communities/search:
 *   get:
 *     summary: Search communities
 *     tags: [Communities]
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
 *         description: Communities found
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
 *                     $ref: '#/components/schemas/Community'
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
router.get('/search', verifyFirebaseToken, async (req, res) => {
  try {
    const { q: query, page = 1, limit = 20 } = req.query;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const communities = await CommunityService.searchCommunities(query, req.user.uid, parseInt(page), parseInt(limit));
    
    res.json({
      success: true,
      data: communities,
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
 * /api/communities/my:
 *   get:
 *     summary: Get user's communities
 *     tags: [Communities]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User communities retrieved successfully
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
 *                     $ref: '#/components/schemas/Community'
 *       401:
 *         description: Unauthorized
 */
router.get('/my', verifyFirebaseToken, async (req, res) => {
  try {
    const communities = await CommunityService.getUserCommunities(req.user.uid);
    res.json({
      success: true,
      data: communities
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
 * /api/communities/{id}:
 *   get:
 *     summary: Get community by ID
 *     tags: [Communities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Community ID
 *     responses:
 *       200:
 *         description: Community retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Community'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       404:
 *         description: Community not found
 */
router.get('/:id', verifyFirebaseToken, async (req, res) => {
  try {
    const community = await CommunityService.getCommunityById(req.params.id, req.user.uid);
    res.json({
      success: true,
      data: community
    });
  } catch (error) {
    const statusCode = error.message.includes('not found') ? 404 : 
                      error.message.includes('Access denied') ? 403 : 400;
    res.status(statusCode).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/communities/{id}:
 *   put:
 *     summary: Update community
 *     tags: [Communities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Community ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *               description:
 *                 type: string
 *                 maxLength: 500
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 maxItems: 10
 *               isPrivate:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Community updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Community'
 *                 message:
 *                   type: string
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       404:
 *         description: Community not found
 */
router.put('/:id', verifyFirebaseToken, validate(schemas.updateCommunity), async (req, res) => {
  try {
    const community = await CommunityService.updateCommunity(req.params.id, req.user.uid, req.body);
    res.json({
      success: true,
      data: community,
      message: 'Community updated successfully'
    });
  } catch (error) {
    const statusCode = error.message.includes('not found') ? 404 : 
                      error.message.includes('Only admins') ? 403 : 400;
    res.status(statusCode).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/communities/{id}/join:
 *   post:
 *     summary: Join community
 *     tags: [Communities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Community ID
 *     responses:
 *       200:
 *         description: Joined community successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Community'
 *                 message:
 *                   type: string
 *       400:
 *         description: Already a member or other error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Community not found
 */
router.post('/:id/join', verifyFirebaseToken, async (req, res) => {
  try {
    const community = await CommunityService.joinCommunity(req.params.id, req.user.uid);
    res.json({
      success: true,
      data: community,
      message: 'Joined community successfully'
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
 * /api/communities/{id}/leave:
 *   post:
 *     summary: Leave community
 *     tags: [Communities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Community ID
 *     responses:
 *       200:
 *         description: Left community successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Cannot leave community
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Community not found
 */
router.post('/:id/leave', verifyFirebaseToken, async (req, res) => {
  try {
    const result = await CommunityService.leaveCommunity(req.params.id, req.user.uid);
    res.json(result);
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
 * /api/communities/{id}/members/{userId}/role:
 *   put:
 *     summary: Update member role
 *     tags: [Communities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Community ID
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User Firebase UID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [member, admin, moderator]
 *             required:
 *               - role
 *     responses:
 *       200:
 *         description: Member role updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Community'
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid role or other error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       404:
 *         description: Community or user not found
 */
router.put('/:id/members/:userId/role', verifyFirebaseToken, async (req, res) => {
  try {
    const { role } = req.body;
    
    if (!['member', 'admin', 'moderator'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role'
      });
    }

    const community = await CommunityService.updateMemberRole(req.params.id, req.user.uid, req.params.userId, role);
    res.json({
      success: true,
      data: community,
      message: 'Member role updated successfully'
    });
  } catch (error) {
    const statusCode = error.message.includes('not found') ? 404 : 
                      error.message.includes('Only admins') ? 403 : 400;
    res.status(statusCode).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/communities/{id}/members/{userId}:
 *   delete:
 *     summary: Remove member from community
 *     tags: [Communities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Community ID
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User Firebase UID
 *     responses:
 *       200:
 *         description: Member removed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Cannot remove member
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       404:
 *         description: Community or user not found
 */
router.delete('/:id/members/:userId', verifyFirebaseToken, async (req, res) => {
  try {
    const result = await CommunityService.removeMember(req.params.id, req.user.uid, req.params.userId);
    res.json(result);
  } catch (error) {
    const statusCode = error.message.includes('not found') ? 404 : 
                      error.message.includes('Only admins') ? 403 : 400;
    res.status(statusCode).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
