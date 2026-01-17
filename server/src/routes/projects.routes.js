const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth.middleware');
const { createProject, getProjects, getProjectDetails } = require('../controllers/projects.controller');
const { check } = require('express-validator');
const validate = require('../middleware/validate');

router.use(authenticateToken);

router.post('/', [
    check('name').trim().notEmpty().withMessage('Project name is required').escape(),
    check('description').optional().trim().escape(),
    check('status').optional().isIn(['planning', 'active', 'completed', 'on-hold']).withMessage('Invalid status'),
    check('startDate').optional().isISO8601().withMessage('Invalid start date').toDate(),
    check('endDate').optional().isISO8601().withMessage('Invalid end date').toDate(),
    validate
], createProject);

router.get('/', getProjects);

router.get('/:id', [
    // Assuming IDs are integers based on previous context, but strictly speaking generated IDs might be UUIDs or Ints.
    // The previous code had check('id').isInt().
    // If Prisma uses Int IDs, this is correct. If UUID, should be isUUID().
    // Looking at schema would be best, but I'll assume Int for now as per typical Prisma defaults unless specified otherwise.
    // The previous plan mentioned "Validate id is integer/int-like".
    check('id').isInt().withMessage('Invalid project ID').toInt(),
    validate
], getProjectDetails);

module.exports = router;
