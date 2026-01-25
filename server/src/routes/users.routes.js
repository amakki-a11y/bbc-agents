const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth.middleware');
const { checkPermission } = require('../middleware/checkPermission');
const { check } = require('express-validator');
const validate = require('../middleware/validate');
const {
    getUsers,
    getUser,
    getUnlinkedEmployees,
    linkUserToEmployee,
    unlinkUserFromEmployee,
    deleteUser
} = require('../controllers/users.controller');

router.use(authenticateToken);

// Get all users - requires users.view permission (admin only)
router.get('/', checkPermission('users.view'), getUsers);

// Get unlinked employees - requires users.view permission
router.get('/unlinked-employees', checkPermission('users.view'), getUnlinkedEmployees);

// Get single user - requires users.view permission
router.get('/:id', [
    checkPermission('users.view'),
    check('id').isInt().withMessage('User ID must be an integer'),
    validate
], getUser);

// Link user to employee - requires users.manage permission
router.post('/:id/link', [
    checkPermission('users.manage'),
    check('id').isInt().withMessage('User ID must be an integer'),
    check('employeeId').notEmpty().withMessage('Employee ID is required'),
    validate
], linkUserToEmployee);

// Unlink user from employee - requires users.manage permission
router.post('/:id/unlink', [
    checkPermission('users.manage'),
    check('id').isInt().withMessage('User ID must be an integer'),
    validate
], unlinkUserFromEmployee);

// Delete user - requires users.delete permission
router.delete('/:id', [
    checkPermission('users.delete'),
    check('id').isInt().withMessage('User ID must be an integer'),
    validate
], deleteUser);

module.exports = router;
