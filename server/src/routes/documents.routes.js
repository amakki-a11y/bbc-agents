const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const authenticateToken = require('../middleware/auth.middleware');
const { check } = require('express-validator');
const validate = require('../middleware/validate');
const {
    uploadDocument,
    getDocuments,
    getDocument,
    downloadDocument,
    deleteDocument,
    updateDocument
} = require('../controllers/documents.controller');

// Configure multer storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../../uploads/documents'));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
        const ext = path.extname(file.originalname);
        cb(null, `${uniqueSuffix}${ext}`);
    }
});

// File filter for allowed types
const fileFilter = (req, file, cb) => {
    const allowedExtensions = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.gif', '.xls', '.xlsx', '.txt'];
    const allowedMimeTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg',
        'image/png',
        'image/gif',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain'
    ];

    const ext = path.extname(file.originalname).toLowerCase();
    const mimeType = file.mimetype;

    if (allowedExtensions.includes(ext) && allowedMimeTypes.includes(mimeType)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Allowed types: PDF, DOC, DOCX, JPG, PNG, GIF, XLS, XLSX, TXT'), false);
    }
};

const upload = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter
});

// Error handling middleware for multer
const handleMulterError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
        }
        return res.status(400).json({ error: err.message });
    } else if (err) {
        return res.status(400).json({ error: err.message });
    }
    next();
};

// All routes require authentication
router.use(authenticateToken);

// Upload document for employee
router.post('/employee/:employeeId',
    upload.single('file'),
    handleMulterError,
    uploadDocument
);

// Get all documents for an employee
router.get('/employee/:employeeId', getDocuments);

// Get single document
router.get('/:id', [
    check('id').notEmpty().withMessage('Document ID is required'),
    validate
], getDocument);

// Download document
router.get('/:id/download', [
    check('id').notEmpty().withMessage('Document ID is required'),
    validate
], downloadDocument);

// Update document metadata
router.put('/:id', [
    check('id').notEmpty().withMessage('Document ID is required'),
    validate
], updateDocument);

// Delete document
router.delete('/:id', [
    check('id').notEmpty().withMessage('Document ID is required'),
    validate
], deleteDocument);

module.exports = router;
