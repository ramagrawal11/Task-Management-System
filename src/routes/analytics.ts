import { Router } from 'express';
import {
  getTaskOverview,
  getUserPerformance,
  exportTasks
} from '../controllers/analyticsController';
import authenticate from '../middleware/auth';
import { analyticsLimiter } from '../middleware/rateLimit';
import {
  validateUserId
} from '../middleware/validation';

const router = Router();

/**
 * @swagger
 * /api/analytics/tasks/overview:
 *   get:
 *     tags: [Analytics]
 *     summary: Get task overview statistics for all tasks
 *     description: Returns aggregated statistics including total tasks, counts by status, and counts by priority
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Task overview statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statistics:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       description: Total number of active tasks
 *                     byStatus:
 *                       type: object
 *                       description: Count of tasks grouped by status (pending, in_progress, completed, cancelled)
 *                       additionalProperties:
 *                         type: integer
 *                     byPriority:
 *                       type: object
 *                       description: Count of tasks grouped by priority (low, medium, high, urgent)
 *                       additionalProperties:
 *                         type: integer
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/tasks/overview', authenticate, analyticsLimiter, getTaskOverview);

/**
 * @swagger
 * /api/analytics/users/{userId}/performance:
 *   get:
 *     tags: [Analytics]
 *     summary: Get user performance metrics
 *     description: Returns performance statistics for a specific user. Users can only view their own performance metrics.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID (must match authenticated user's ID)
 *     responses:
 *       200:
 *         description: User performance metrics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 metrics:
 *                   type: object
 *                   properties:
 *                     userId:
 *                       type: integer
 *                       description: User ID
 *                     totalTasks:
 *                       type: integer
 *                       description: Total tasks created by or assigned to the user
 *                     tasksCreated:
 *                       type: integer
 *                       description: Number of tasks created by the user
 *                     tasksAssigned:
 *                       type: integer
 *                       description: Number of tasks assigned to the user
 *                     tasksCompleted:
 *                       type: integer
 *                       description: Number of tasks completed by or assigned to the user
 *                     completionRate:
 *                       type: number
 *                       format: float
 *                       description: Percentage of tasks completed (0-100)
 *                     tasksByStatus:
 *                       type: object
 *                       description: Count of tasks grouped by status
 *                       additionalProperties:
 *                         type: integer
 *                     tasksByPriority:
 *                       type: object
 *                       description: Count of tasks grouped by priority
 *                       additionalProperties:
 *                         type: integer
 *       403:
 *         description: Forbidden - User can only view their own performance metrics
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/users/:userId/performance', authenticate, analyticsLimiter, validateUserId, getUserPerformance);

/**
 * @swagger
 * /api/analytics/tasks/export:
 *   get:
 *     tags: [Analytics]
 *     summary: Export all tasks data as CSV
 *     description: Exports all active tasks as a CSV file with task details including user information
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All tasks data exported successfully as CSV file
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *               format: binary
 *         headers:
 *           Content-Disposition:
 *             description: Attachment with filename containing timestamp
 *             schema:
 *               type: string
 *               example: 'attachment; filename="tasks_1234567890.csv"'
 *       404:
 *         description: No tasks found to export
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/tasks/export', authenticate, analyticsLimiter, exportTasks);

export default router;

