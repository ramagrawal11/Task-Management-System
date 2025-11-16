import { Request, RequestHandler } from 'express';
import { taskRepository } from '../repositories/taskRepository';
import { userRepository } from '../repositories/userRepository';
import type { CreateTaskInput, UpdateTaskInput } from '../entities/taskEntity';

export const createTask: RequestHandler = async (req, res) => {
  const userId = (req as Request & { userId: number }).userId;

  const { title, description, status, priority, dueDate, tags, assignedTo } = req.body as CreateTaskInput;

  if (assignedTo) {
    try {
      const user = await userRepository.findById(assignedTo);
      if (!user) {
        res.status(404).json({ message: 'Assigned user not found' });
        return;
      }
      if (!user.active) {
        res.status(400).json({ message: 'Cannot assign task to inactive user' });
        return;
      }
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ message: 'Failed to validate assigned user', detail });
      return;
    }
  }

  try {
    const task = await taskRepository.create({
      title,
      description,
      status,
      priority,
      dueDate,
      tags,
      assignedTo,
      createdBy: userId
    });

    res.status(201).json(task.toJSON());
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ message: 'Failed to create task', detail });
  }
};

export const getAllTasks: RequestHandler = async (req, res) => {

  const {
    status,
    priority,
    assignedTo,
    search,
    sortBy = 'created_at',
    sortOrder = 'desc',
    page = '1',
    limit = '10'
  } = req.query as {
    status?: string;
    priority?: string;
    assignedTo?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
    page?: string;
    limit?: string;
  };

  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 10;

  try {
    const filters = {
      status,
      priority,
      assignedTo: assignedTo ? parseInt(assignedTo, 10) : undefined,
      search
    };

    const sortOptions = {
      sortBy,
      sortOrder: sortOrder.toLowerCase() === 'asc' ? ('asc' as const) : ('desc' as const)
    };

    const pagination = {
      page: pageNum,
      limit: limitNum
    };

    const { tasks, total } = await taskRepository.findAll(filters, sortOptions, pagination);

    const formattedTasks = tasks.map(task => task.toJSON());

    res.json({
      tasks: formattedTasks,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ message: 'Failed to fetch tasks', detail });
  }
};

export const getTaskById: RequestHandler = async (req, res) => {

  const { id } = req.params;
  const taskId = parseInt(id, 10);

  if (Number.isNaN(taskId)) {
    res.status(400).json({ message: 'Invalid task ID' });
    return;
  }

  try {
    const task = await taskRepository.findById(taskId);

    if (!task) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }

    res.json(task.toJSON());
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ message: 'Failed to fetch task', detail });
  }
};

export const updateTask: RequestHandler = async (req, res) => {

  const { id } = req.params;
  const taskId = parseInt(id, 10);

  if (Number.isNaN(taskId)) {
    res.status(400).json({ message: 'Invalid task ID' });
    return;
  }

  const { title, description, status, priority, dueDate, tags, assignedTo } = req.body as UpdateTaskInput;

  if (assignedTo !== undefined && assignedTo !== null) {
    try {
      const user = await userRepository.findById(assignedTo);
      if (!user) {
        res.status(404).json({ message: 'Assigned user not found' });
        return;
      }
      if (!user.active) {
        res.status(400).json({ message: 'Cannot assign task to inactive user' });
        return;
      }
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ message: 'Failed to validate assigned user', detail });
      return;
    }
  }

  try {
    const existingTask = await taskRepository.findById(taskId);
    if (!existingTask) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }

    if (!existingTask.active) {
      res.status(403).json({ message: 'Cannot update inactive task' });
      return;
    }

    const task = await taskRepository.update(taskId, {
      title,
      description,
      status,
      priority,
      dueDate,
      tags,
      assignedTo
    });

    res.json(task.toJSON());
  } catch (error) {
    if (error instanceof Error && error.message === 'Task not found') {
      res.status(404).json({ message: error.message });
      return;
    }
    if (error instanceof Error && error.message === 'No valid updates provided') {
      res.status(400).json({ message: error.message });
      return;
    }
    const detail = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ message: 'Failed to update task', detail });
  }
};

export const deleteTask: RequestHandler = async (req, res) => {

  const { id } = req.params;
  const taskId = parseInt(id, 10);

  if (Number.isNaN(taskId)) {
    res.status(400).json({ message: 'Invalid task ID' });
    return;
  }

  try {
    const task = await taskRepository.findById(taskId);
    if (!task) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }

    if (!task.active) {
      res.status(403).json({ message: 'Cannot delete inactive task' });
      return;
    }

    await taskRepository.softDelete(taskId);
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    if (error instanceof Error && error.message === 'Task not found') {
      res.status(404).json({ message: error.message });
      return;
    }
    const detail = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ message: 'Failed to delete task', detail });
  }
};

export const bulkCreateTasks: RequestHandler = async (req, res) => {
  const userId = (req as Request & { userId: number }).userId;

  const { tasks } = req.body as { tasks: CreateTaskInput[] };

  const assignedToIds = tasks.map(t => t.assignedTo).filter((id): id is number => id !== undefined && id !== null);
  const uniqueAssignedToIds = [...new Set(assignedToIds)];

  if (uniqueAssignedToIds.length > 0) {
    try {
      const users = await userRepository.findByIds(uniqueAssignedToIds);
      const foundIds = new Set(users.map(u => u.id));
      const missingIds = uniqueAssignedToIds.filter(id => !foundIds.has(id));

      if (missingIds.length > 0) {
        res.status(404).json({ message: `Assigned users not found: ${missingIds.join(', ')}` });
        return;
      }

      const inactiveUsers = users.filter(u => !u.active);
      if (inactiveUsers.length > 0) {
        res.status(400).json({ message: `Cannot assign tasks to inactive users: ${inactiveUsers.map(u => u.id).join(', ')}` });
        return;
      }
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ message: 'Failed to validate assigned users', detail });
      return;
    }
  }

  try {
    const createdTasks = await taskRepository.bulkCreate(tasks, userId);
    const formattedTasks = createdTasks.map(task => task.toJSON());

    res.status(201).json({
      message: `Successfully created ${formattedTasks.length} task(s)`,
      tasks: formattedTasks
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ message: 'Failed to create tasks', detail });
  }
};
