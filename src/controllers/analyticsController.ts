import { Request, RequestHandler } from 'express';
import { analyticsRepository } from '../repositories/analyticsRepository';
import {
  TaskStatisticsModel,
  UserPerformanceMetricsModel,
  TaskExportRowModel
} from '../models/analyticsModel';
import { TaskStatus } from '../models/taskModel';

export const getTaskOverview: RequestHandler = async (req, res) => {
  const userId = (req as Request & { userId: number }).userId;

  try {
    const taskRows = await analyticsRepository.getTasksForStatistics(userId);

    const total = taskRows.length;

    const byStatus: Record<string, number> = {};
    const byPriority: Record<string, number> = {};

    for (const row of taskRows) {
      byStatus[row.status] = (byStatus[row.status] || 0) + 1;
      byPriority[row.priority] = (byPriority[row.priority] || 0) + 1;
    }

    const statisticsData = {
      total,
      byStatus,
      byPriority
    };

    const statistics = new TaskStatisticsModel(statisticsData);

    res.json({
      statistics: statistics.toJSON()
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ message: 'Failed to fetch task statistics', detail });
  }
};

export const getUserPerformance: RequestHandler = async (req, res) => {
  const userId = (req as Request & { userId: number }).userId;

  const { userId: targetUserId } = req.params;
  const targetUserIdNum = parseInt(targetUserId, 10);

  if (targetUserIdNum !== userId) {
    res.status(403).json({ message: 'You can only view your own performance metrics' });
    return;
  }

  try {
    const taskRows = await analyticsRepository.getUserTasksForMetrics(targetUserIdNum);

    if (taskRows === null) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const uniqueTaskIds = new Set(taskRows.map(row => row.id));
    const totalTasks = uniqueTaskIds.size;

    const tasksCreatedById = new Set(taskRows.filter(row => row.created_by === targetUserIdNum).map(row => row.id));
    const tasksAssignedById = new Set(taskRows.filter(row => row.assigned_to === targetUserIdNum).map(row => row.id));
    
    const tasksCreated = tasksCreatedById.size;
    const tasksAssigned = tasksAssignedById.size;
    
    const tasksCompleted = taskRows.filter(row => row.status === TaskStatus.COMPLETED).length;

    const completionRate = totalTasks > 0 ? (tasksCompleted / totalTasks) * 100 : 0;

    const tasksByStatus: Record<string, number> = {};
    const tasksByPriority: Record<string, number> = {};
    
    for (const row of taskRows) {
      tasksByStatus[row.status] = (tasksByStatus[row.status] || 0) + 1;
      tasksByPriority[row.priority] = (tasksByPriority[row.priority] || 0) + 1;
    }

    const metricsData = {
      userId: targetUserIdNum,
      totalTasks,
      tasksCreated,
      tasksAssigned,
      tasksCompleted,
      completionRate: Math.round(completionRate * 100) / 100,
      tasksByStatus,
      tasksByPriority
    };

    const metrics = new UserPerformanceMetricsModel(metricsData);
    res.json({ metrics: metrics.toJSON() });
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ message: 'Failed to fetch user performance metrics', detail });
  }
};

export const exportTasks: RequestHandler = async (req, res) => {
  const userId = (req as Request & { userId: number }).userId;

  try {
    const tasksData = await analyticsRepository.getAllTasksForExport(userId);
    const tasks = tasksData.map(task => new TaskExportRowModel(task));

    if (tasks.length === 0) {
      res.status(404).json({ message: 'No tasks found to export' });
      return;
    }

    const headers = TaskExportRowModel.getCSVHeaders();

    const escapeCSV = (str: string): string => {
      const s = String(str || '');
      if (s.includes(',') || s.includes('"') || s.includes('\n')) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    };

    const rows = tasks.map((task) => {
      const row = task.toCSVRow();
      return row.map(cell => escapeCSV(cell)).join(',');
    });

    const csv = [headers.map(h => escapeCSV(h)).join(','), ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="tasks_${Date.now()}.csv"`);
    res.send(csv);
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ message: 'Failed to export tasks', detail });
  }
};

