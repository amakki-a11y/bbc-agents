const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth.middleware');
const {
    getTaskDetails,
    updateTaskAdvanced,
    addSubtask,
    toggleSubtask,
    addComment,
    addActionItem,
    updateActionItem,
    deleteActionItem
} = require('../controllers/detailed_task.controller');
const { check, param } = require('express-validator');
const validate = require('../middleware/validate');

router.use(authenticateToken);

// Custom validator for large numeric IDs (timestamp-based)
const isValidId = (value) => {
    const num = Number(value);
    return !isNaN(num) && Number.isFinite(num) && num > 0;
};

// Get task details
router.get('/:id', [
    param('id').custom(isValidId).withMessage('Invalid task ID'),
    validate
], getTaskDetails);

// Update task
router.put('/:id', [
    param('id').custom(isValidId).withMessage('Invalid task ID'),
    check('title').optional().trim().notEmpty().escape(),
    check('description').optional().trim().escape(),
    validate
], updateTaskAdvanced);

// Subtasks
router.post('/:taskId/subtasks', [
    param('taskId').custom(isValidId).withMessage('Invalid task ID'),
    check('title').trim().notEmpty().withMessage('Subtask title is required').escape(),
    validate
], addSubtask);

router.put('/subtasks/:id', [
    param('id').custom(isValidId).withMessage('Invalid subtask ID'),
    validate
], toggleSubtask);

// Comments
router.post('/:taskId/comments', [
    param('taskId').custom(isValidId).withMessage('Invalid task ID'),
    check('content').trim().notEmpty().withMessage('Comment content is required').escape(),
    validate
], addComment);

// Action Items
router.post('/:taskId/action-items', [
    param('taskId').custom(isValidId).withMessage('Invalid task ID'),
    check('content').trim().notEmpty().withMessage('Action item content is required').escape(),
    validate
], addActionItem);

router.put('/action-items/:id', [
    param('id').custom(isValidId).withMessage('Invalid action item ID'),
    check('is_complete').optional().isBoolean(),
    check('content').optional().trim().notEmpty().escape(),
    validate
], updateActionItem);

router.delete('/action-items/:id', [
    param('id').custom(isValidId).withMessage('Invalid action item ID'),
    validate
], deleteActionItem);

module.exports = router;
```

---

## **How to Update on GitHub:**

1. Go to: https://github.com/amakki-a11y/bbc-agents/blob/main/server/src/routes/detailed_task.routes.js

2. Click the **pencil icon ✏️** (Edit this file)

3. Select all: `Ctrl + A`

4. Paste the new code: `Ctrl + V`

5. Scroll down and click **"Commit changes"**
   - Add message: "Fix: Allow large timestamp-based task IDs"
   - Click **"Commit changes"**

---

## **After Committing:**

Ask Antigravity to pull the changes and restart the server:
```
Please pull the latest changes from GitHub and restart the backend server:

1. cd server
2. git pull origin main
3. npm run dev

Then test by clicking on a task - does Task Details page open now?
