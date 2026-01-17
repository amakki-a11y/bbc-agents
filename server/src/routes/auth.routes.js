const express = require('express');
const { check } = require('express-validator');
const { register, login } = require('../controllers/auth.controller');
const validate = require('../middleware/validate');

const router = express.Router();

router.post('/register', [
    check('firstName').trim().notEmpty().withMessage('First name is required').escape(),
    check('lastName').trim().notEmpty().withMessage('Last name is required').escape(),
    check('email').isEmail().withMessage('Invalid email address').normalizeEmail(),
    check('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    validate
], register);

router.post('/login', [
    check('email').isEmail().withMessage('Invalid email address').normalizeEmail(),
    check('password').exists().withMessage('Password is required'),
    validate
], login);

module.exports = router;
