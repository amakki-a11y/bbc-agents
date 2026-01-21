const prisma = require('../lib/prisma');
const path = require('path');
const fs = require('fs');
const { logUpload, logDelete, logDownload } = require('../services/activityLogger');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads/documents');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Upload document for an employee
const uploadDocument = async (req, res) => {
    try {
        const { employeeId } = req.params;
        const { documentType, title, description, expiryDate, isConfidential } = req.body;

        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        if (!documentType || !title) {
            // Clean up uploaded file if validation fails
            fs.unlinkSync(req.file.path);
            return res.status(400).json({ error: 'documentType and title are required' });
        }

        // Verify employee exists
        const employee = await prisma.employee.findUnique({
            where: { id: employeeId }
        });

        if (!employee) {
            fs.unlinkSync(req.file.path);
            return res.status(404).json({ error: 'Employee not found' });
        }

        const document = await prisma.employeeDocument.create({
            data: {
                employee_id: employeeId,
                documentType,
                title,
                description: description || null,
                fileUrl: `/uploads/documents/${req.file.filename}`,
                fileName: req.file.originalname,
                fileSize: req.file.size,
                mimeType: req.file.mimetype,
                expiryDate: expiryDate ? new Date(expiryDate) : null,
                isConfidential: isConfidential === 'true' || isConfidential === true,
                uploadedBy: req.employee?.id || null,
                status: 'active'
            }
        });

        // Log the upload activity
        await logUpload(
            req.user?.userId,
            'document',
            document.id,
            `Uploaded document: ${title} for employee ${employee.name}`,
            req,
            { documentType, fileName: req.file.originalname, employeeId }
        );

        res.status(201).json(document);
    } catch (error) {
        // Clean up file on error
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        console.error('Error uploading document:', error);
        res.status(500).json({ error: 'Failed to upload document' });
    }
};

// Get all documents for an employee
const getDocuments = async (req, res) => {
    try {
        const { employeeId } = req.params;
        const { documentType, status } = req.query;

        const where = {
            employee_id: employeeId,
            ...(documentType && { documentType }),
            ...(status && { status })
        };

        const documents = await prisma.employeeDocument.findMany({
            where,
            orderBy: { created_at: 'desc' }
        });

        res.json(documents);
    } catch (error) {
        console.error('Error fetching documents:', error);
        res.status(500).json({ error: 'Failed to fetch documents' });
    }
};

// Get single document
const getDocument = async (req, res) => {
    try {
        const { id } = req.params;

        const document = await prisma.employeeDocument.findUnique({
            where: { id },
            include: {
                employee: {
                    select: { id: true, name: true, email: true }
                }
            }
        });

        if (!document) {
            return res.status(404).json({ error: 'Document not found' });
        }

        res.json(document);
    } catch (error) {
        console.error('Error fetching document:', error);
        res.status(500).json({ error: 'Failed to fetch document' });
    }
};

// Download document
const downloadDocument = async (req, res) => {
    try {
        const { id } = req.params;

        const document = await prisma.employeeDocument.findUnique({
            where: { id },
            include: {
                employee: { select: { name: true } }
            }
        });

        if (!document) {
            return res.status(404).json({ error: 'Document not found' });
        }

        const filePath = path.join(__dirname, '../..', document.fileUrl);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'File not found on server' });
        }

        // Log download activity
        await logDownload(
            req.user?.userId,
            'document',
            document.id,
            `Downloaded document: ${document.title}`,
            req,
            { fileName: document.fileName }
        );

        res.download(filePath, document.fileName);
    } catch (error) {
        console.error('Error downloading document:', error);
        res.status(500).json({ error: 'Failed to download document' });
    }
};

// Delete document
const deleteDocument = async (req, res) => {
    try {
        const { id } = req.params;

        const document = await prisma.employeeDocument.findUnique({
            where: { id },
            include: {
                employee: { select: { name: true } }
            }
        });

        if (!document) {
            return res.status(404).json({ error: 'Document not found' });
        }

        // Delete file from filesystem
        const filePath = path.join(__dirname, '../..', document.fileUrl);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        // Delete from database
        await prisma.employeeDocument.delete({
            where: { id }
        });

        // Log delete activity
        await logDelete(
            req.user?.userId,
            'document',
            id,
            `Deleted document: ${document.title} for employee ${document.employee?.name}`,
            req,
            { documentType: document.documentType, fileName: document.fileName }
        );

        res.status(204).send();
    } catch (error) {
        console.error('Error deleting document:', error);
        res.status(500).json({ error: 'Failed to delete document' });
    }
};

// Update document metadata (not the file itself)
const updateDocument = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, documentType, expiryDate, status, isConfidential } = req.body;

        const document = await prisma.employeeDocument.update({
            where: { id },
            data: {
                ...(title && { title }),
                ...(description !== undefined && { description }),
                ...(documentType && { documentType }),
                ...(expiryDate !== undefined && { expiryDate: expiryDate ? new Date(expiryDate) : null }),
                ...(status && { status }),
                ...(isConfidential !== undefined && { isConfidential })
            }
        });

        res.json(document);
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'Document not found' });
        }
        console.error('Error updating document:', error);
        res.status(500).json({ error: 'Failed to update document' });
    }
};

module.exports = {
    uploadDocument,
    getDocuments,
    getDocument,
    downloadDocument,
    deleteDocument,
    updateDocument
};
