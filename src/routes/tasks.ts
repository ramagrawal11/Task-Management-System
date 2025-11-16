import { Router } from 'express';
import {
  createTask,
  getAllTasks,
  getTaskById,
  updateTask,
  deleteTask,
  bulkCreateTasks
} from '../controllers/taskController';
import authenticate from '../middleware/auth';
import { taskCreationLimiter } from '../middleware/rateLimit';
import {
  validateCreateTask,
  validateUpdateTask,
  validateBulkCreateTasks,
  validateTaskId,
  validateTaskQueryParams
} from '../middleware/validation';

const router = Router();

/**
 * @swagger
 * /api/tasks:
 *   post:
 *     tags: [Tasks]
 *     summary: Create a new task
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [pending, in_progress, completed, cancelled]
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, urgent]
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               assignedTo:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Task created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Task'
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */
router.post('/', authenticate, taskCreationLimiter, validateCreateTask, createTask);

/**
 * @swagger
 * /api/tasks:
 *   get:
 *     tags: [Tasks]
 *     summary: Get all tasks with filtering, sorting, and pagination
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, in_progress, completed, cancelled]
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [low, medium, high, urgent]
 *       - in: query
 *         name: assignedTo
 *         schema:
 *           type: integer
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: createdAt
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: Tasks retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 tasks:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Task'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *       500:
 *         description: Server error
 */
router.get('/', authenticate, validateTaskQueryParams, getAllTasks);

/**
 * @swagger
 * /api/tasks/{id}:
 *   get:
 *     tags: [Tasks]
 *     summary: Get a single task by ID
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
 *         description: Task retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Task'
 *       404:
 *         description: Task not found
 *       500:
 *         description: Server error
 */
router.get('/:id', authenticate, validateTaskId, getTaskById);

/**
 * @swagger
 * /api/tasks/{id}:
 *   put:
 *     tags: [Tasks]
 *     summary: Update a task
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
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [pending, in_progress, completed, cancelled]
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, urgent]
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               assignedTo:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Task updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Task'
 *       404:
 *         description: Task not found
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Server error
 */
router.put('/:id', authenticate, validateTaskId, validateUpdateTask, updateTask);

/**
 * @swagger
 * /api/tasks/{id}:
 *   delete:
 *     tags: [Tasks]
 *     summary: Delete a task (soft delete)
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
 *         description: Task deleted successfully
 *       404:
 *         description: Task not found
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Server error
 */
router.delete('/:id', authenticate, validateTaskId, deleteTask);

/**
 * @swagger
 * /api/tasks/bulk:
 *   post:
 *     tags: [Tasks]
 *     summary: Bulk create tasks
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tasks
 *             properties:
 *               tasks:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - title
 *                   properties:
 *                     title:
 *                       type: string
 *                     description:
 *                       type: string
 *                     status:
 *                       type: string
 *                       enum: [pending, in_progress, completed, cancelled]
 *                     priority:
 *                       type: string
 *                       enum: [low, medium, high, urgent]
 *                     dueDate:
 *                       type: string
 *                       format: date-time
 *                     tags:
 *                       type: array
 *                       items:
 *                         type: string
 *                     assignedTo:
 *                       type: integer
 *     responses:
 *       201:
 *         description: Tasks created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 created:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Task'
 *                 failed:
 *                   type: array
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */
router.post('/bulk', authenticate, taskCreationLimiter, validateBulkCreateTasks, bulkCreateTasks);

export default router;

