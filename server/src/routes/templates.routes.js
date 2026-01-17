const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth.middleware');
const {
    getTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    instantiateTemplate
} = require('../controllers/templates.controller');

router.use(authenticateToken);

router.get('/', getTemplates);
router.post('/', createTemplate);
router.put('/:id', updateTemplate);
router.delete('/:id', deleteTemplate);
router.post('/:id/instantiate', instantiateTemplate);

module.exports = router;
