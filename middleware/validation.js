const Joi = require('joi');

// Validation schemas
const schemas = {
  // User validation
  updateProfile: Joi.object({
    displayName: Joi.string().min(1).max(50).trim(),
    bio: Joi.string().max(500).allow(''),
    status: Joi.string().valid('online', 'offline', 'away', 'busy')
  }),

  // Community validation
  createCommunity: Joi.object({
    name: Joi.string().required().min(1).max(100).trim(),
    description: Joi.string().max(500).allow(''),
    tags: Joi.array().items(Joi.string().max(30)).max(10),
    isPrivate: Joi.boolean().default(false)
  }),

  updateCommunity: Joi.object({
    name: Joi.string().min(1).max(100).trim(),
    description: Joi.string().max(500).allow(''),
    tags: Joi.array().items(Joi.string().max(30)).max(10),
    isPrivate: Joi.boolean()
  }),

  // Message validation
  sendMessage: Joi.object({
    content: Joi.object({
      text: Joi.string().max(2000).allow(''),
      type: Joi.string().valid('text', 'image', 'file', 'audio', 'video').default('text')
    }).required(),
    communityId: Joi.string().allow(null),
    recipientId: Joi.string().allow(null),
    mentions: Joi.array().items(Joi.string()),
    replyTo: Joi.string().allow(null),
    priority: Joi.string().valid('normal', 'high', 'urgent').default('normal')
  }),

  editMessage: Joi.object({
    content: Joi.object({
      text: Joi.string().required().max(2000)
    }).required()
  }),

  // Reaction validation
  addReaction: Joi.object({
    emoji: Joi.string().required().max(10)
  }),

  // Report validation
  createReport: Joi.object({
    reportedUserId: Joi.string(),
    messageId: Joi.string(),
    communityId: Joi.string(),
    type: Joi.string().required().valid('spam', 'harassment', 'inappropriate_content', 'fake_profile', 'other'),
    reason: Joi.string().required().max(1000)
  })
};

// Validation middleware
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      allowUnknown: false,
      stripUnknown: true
    });

    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }

    req.body = value;
    next();
  };
};

module.exports = {
  schemas,
  validate
};
