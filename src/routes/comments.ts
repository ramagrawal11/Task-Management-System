import { Router } from 'express';
import {
  addComment,
  getTaskComments,
  updateComment,
  deleteComment
} from '../controllers/commentController';
import authenticate from '../middleware/auth';
import {
  validateCreateComment,
  validateUpdateComment,
  validateTaskIdParam,
  validateCommentId
} from '../middleware/validation';

const router = Router();

/**
 * @swagger
 * /api/comments/tasks/{taskId}:
 *   post:
 *     tags: [Comments]
 *     summary: Add a comment to a task
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
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *     responses:
 *       201:
 *         description: Comment added successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Comment'
 *       404:
 *         description: Task not found
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */
router.post('/tasks/:taskId', authenticate, validateTaskIdParam, validateCreateComment, addComment);

/**
 * @swagger
 * /api/comments/tasks/{taskId}:
 *   get:
 *     tags: [Comments]
 *     summary: Get all comments for a task
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
 *         description: Comments retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 comments:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Comment'
 *       404:
 *         description: Task not found
 *       500:
 *         description: Server error
 */
router.get('/tasks/:taskId', authenticate, validateTaskIdParam, getTaskComments);

/**
 * @swagger
 * /api/comments/{id}:
 *   put:
 *     tags: [Comments]
 *     summary: Update a comment
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *     responses:
 *       200:
 *         description: Comment updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Comment'
 *       404:
 *         description: Comment not found
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Server error
 */
router.put('/:id', authenticate, validateCommentId, validateUpdateComment, updateComment);

/**
 * @swagger
 * /api/comments/{id}:
 *   delete:
 *     tags: [Comments]
 *     summary: Delete a comment
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
 *         description: Comment deleted successfully
 *       404:
 *         description: Comment not found
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Server error
 */
router.delete('/:id', authenticate, validateCommentId, deleteComment);

export default router;

