const express = require('express');
const router = express.Router();
const clientsController = require('../controllers/clients.controller');
const authMiddleware = require('../middleware/auth.middleware');

// All routes require authentication
router.use(authMiddleware);

// Statistics (must be before :id routes)
router.get('/stats', clientsController.getClientStats);

// Tags
router.get('/tags', clientsController.getTags);

// Export
router.get('/export', clientsController.exportClients);

// CRUD
router.get('/', clientsController.getClients);
router.post('/', clientsController.createClient);
router.get('/:id', clientsController.getClient);
router.put('/:id', clientsController.updateClient);
router.delete('/:id', clientsController.deleteClient);

// Special actions
router.post('/:id/move', clientsController.moveClientStatus);

// Interactions
router.get('/:id/interactions', clientsController.getInteractions);
router.post('/:id/interactions', clientsController.addInteraction);

// Notes
router.post('/:id/notes', clientsController.addNote);
router.delete('/:id/notes/:noteId', clientsController.deleteNote);

// Tasks
router.get('/:id/tasks', clientsController.getTasks);
router.post('/:id/tasks', clientsController.addTask);
router.put('/:id/tasks/:taskId', clientsController.updateTask);

// Tags
router.post('/:id/tags', clientsController.addTagToClient);
router.delete('/:id/tags/:tagId', clientsController.removeTagFromClient);

// Bulk operations
router.post('/import', clientsController.importClients);

module.exports = router;
