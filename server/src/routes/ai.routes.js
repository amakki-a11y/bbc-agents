const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth.middleware');
const { handleCommand } = require('../controllers/ai.controller');
const { check } = require('express-validator');
const validate = require('../middleware/validate');

router.use(authenticateToken);

router.post('/command', [
    check('command').trim().notEmpty().withMessage('Command is required'),
    validate
], handleCommand);

module.exports = router;
