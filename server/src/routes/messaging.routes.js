const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const authenticateToken = require('../middleware/auth.middleware');
const {
  sendMessage,
  sendToManager,
  sendToHR,
  sendToDepartment,
  escalateIssue,
  getInbox,
  getSentMessages,
  readMessage,
  replyToMessage,
  getMessageableContacts,
  checkCanMessage
} = require('../controllers/messaging.controller');

// All routes require authentication
router.use(authenticateToken);

// Send a direct message to another employee
router.post('/send',
  [
    body('toEmployeeId').notEmpty().withMessage('Recipient employee ID is required'),
    body('content').notEmpty().trim().withMessage('Message content is required'),
    body('subject').optional().trim(),
    body('messageType').optional().isIn(['direct', 'request', 'announcement', 'escalation']),
    body('priority').optional().isIn(['low', 'normal', 'high', 'urgent'])
  ],
  sendMessage
);

// Send message to manager
router.post('/send-to-manager',
  [
    body('content').notEmpty().trim().withMessage('Message content is required'),
    body('subject').optional().trim(),
    body('priority').optional().isIn(['low', 'normal', 'high', 'urgent']),
    body('isEscalation').optional().isBoolean()
  ],
  sendToManager
);

// Send message to HR
router.post('/send-to-hr',
  [
    body('content').notEmpty().trim().withMessage('Message content is required'),
    body('subject').optional().trim(),
    body('priority').optional().isIn(['low', 'normal', 'high', 'urgent'])
  ],
  sendToHR
);

// Send announcement to department (managers only)
router.post('/send-to-department',
  [
    body('content').notEmpty().trim().withMessage('Announcement content is required'),
    body('subject').optional().trim(),
    body('priority').optional().isIn(['low', 'normal', 'high', 'urgent'])
  ],
  sendToDepartment
);

// Escalate an issue
router.post('/escalate',
  [
    body('content').notEmpty().trim().withMessage('Issue description is required'),
    body('subject').optional().trim(),
    body('escalateHigher').optional().isBoolean()
  ],
  escalateIssue
);

// Get inbox (received messages)
router.get('/inbox',
  [
    query('unreadOnly').optional().isBoolean(),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 })
  ],
  getInbox
);

// Get sent messages
router.get('/sent',
  [
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 })
  ],
  getSentMessages
);

// Read a specific message
router.get('/read/:messageId',
  [
    param('messageId').notEmpty().withMessage('Message ID is required')
  ],
  readMessage
);

// Reply to a message
router.post('/reply/:messageId',
  [
    param('messageId').notEmpty().withMessage('Message ID is required'),
    body('content').notEmpty().trim().withMessage('Reply content is required')
  ],
  replyToMessage
);

// Get messageable contacts based on hierarchy
router.get('/contacts', getMessageableContacts);

// Check if can message a specific employee
router.get('/can-message/:targetEmployeeId',
  [
    param('targetEmployeeId').notEmpty().withMessage('Target employee ID is required')
  ],
  checkCanMessage
);

module.exports = router;
