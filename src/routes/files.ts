import { Router } from 'express';
import {
  uploadFiles,
  uploadMiddleware,
  getFile,
  getTaskFiles,
  deleteFile
} from '../controllers/fileController';
import authenticate from '../middleware/auth';
import { fileUploadLimiter } from '../middleware/rateLimit';
import {
  validateTaskIdParam,
  validateFileId,
  validateFilesUpload,
  handleMulterErrors
} from '../middleware/validation';

const router = Router();

/**
 * @swagger
 * /api/files/tasks/{taskId}:
 *   post:
 *     tags: [Files]
 *     summary: Upload files to a task
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - files
 *             properties:
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Files uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 files:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/File'
 *       404:
 *         description: Task not found
 *       400:
 *         description: Validation error or file type not allowed
 *       500:
 *         description: Server error
 */
router.post('/tasks/:taskId', authenticate, fileUploadLimiter, validateTaskIdParam, uploadMiddleware, handleMulterErrors, validateFilesUpload, uploadFiles);

/**
 * @swagger
 * /api/files/tasks/{taskId}:
 *   get:
 *     tags: [Files]
 *     summary: Get all files for a task
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Files retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 files:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/File'
 *       404:
 *         description: Task not found
 *       500:
 *         description: Server error
 */
router.get('/tasks/:taskId', authenticate, validateTaskIdParam, getTaskFiles);

/**
 * @swagger
 * /api/files/{id}:
 *   get:
 *     tags: [Files]
 *     summary: Get file details and download URL
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: File retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/File'
 *       404:
 *         description: File not found
 *       500:
 *         description: Server error
 */
router.get('/:id', authenticate, validateFileId, getFile);

/**
 * @swagger
 * /api/files/{id}:
 *   delete:
 *     tags: [Files]
 *     summary: Delete a file
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: File deleted successfully
 *       404:
 *         description: File not found
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Server error
 */
router.delete('/:id', authenticate, validateFileId, deleteFile);

export default router;

