import { Request, Response, NextFunction } from 'express';
import { body, param, query, ValidationChain, validationResult } from 'express-validator';
import multer from 'multer';
import { TaskStatus, TaskPriority } from '../models/taskModel';

export const handleValidationErrors = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.type === 'field' ? error.path : error.type,
      message: error.msg,
      value: 'value' in error ? error.value : undefined
    }));
    
    res.status(400).json({
      message: 'Validation failed',
      errors: errorMessages
    });
    return;
  }
  
  next();
};


export const validateRegister = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Email must be a valid email address')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6, max: 128 })
    .withMessage('Password must be between 6 and 128 characters')
    .matches(/[a-z]/)
    .withMessage('Password must contain at least one lowercase letter')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter')
    .matches(/[0-9]/)
    .withMessage('Password must contain at least one number')
    .matches(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/)
    .withMessage('Password must contain at least one special character'),
  body('fullName')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Full name is required and must be less than 255 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Full name can only contain letters and spaces'),
  handleValidationErrors
];

export const validateLogin = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Email must be a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors
];


export const validateCreateTask = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Title is required and must be less than 255 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 10000 })
    .withMessage('Description must be less than 10000 characters'),
  body('status')
    .optional()
    .isIn(Object.values(TaskStatus))
    .withMessage(`Status must be one of: ${Object.values(TaskStatus).join(', ')}`),
  body('priority')
    .optional()
    .isIn(Object.values(TaskPriority))
    .withMessage(`Priority must be one of: ${Object.values(TaskPriority).join(', ')}`),
  body('dueDate')
    .optional()
    .custom((value) => {
      if (value === null || value === '') {
        return true;
      }
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        throw new Error('Due date must be a valid date');
      }
      return true;
    }),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('tags.*')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Each tag must be between 1 and 50 characters'),
  body('assignedTo')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Assigned to must be a positive integer'),
  handleValidationErrors
];

export const validateUpdateTask = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Title must be less than 255 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 10000 })
    .withMessage('Description must be less than 10000 characters'),
  body('status')
    .optional()
    .isIn(Object.values(TaskStatus))
    .withMessage(`Status must be one of: ${Object.values(TaskStatus).join(', ')}`),
  body('priority')
    .optional()
    .isIn(Object.values(TaskPriority))
    .withMessage(`Priority must be one of: ${Object.values(TaskPriority).join(', ')}`),
  body('dueDate')
    .optional()
    .custom((value) => {
      if (value === null || value === '') {
        return true;
      }
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        throw new Error('Due date must be a valid date');
      }
      return true;
    }),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('tags.*')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Each tag must be between 1 and 50 characters'),
  body('assignedTo')
    .optional()
    .custom((value) => {
      if (value === null) {
        return true;
      }
      if (typeof value === 'number' && Number.isInteger(value) && value > 0) {
        return true;
      }
      throw new Error('Assigned to must be a positive integer or null');
    }),
  handleValidationErrors
];

export const validateBulkCreateTasks = [
  body('tasks')
    .isArray({ min: 1, max: 100 })
    .withMessage('Tasks must be an array with 1 to 100 items'),
  body('tasks.*.title')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Each task title is required and must be less than 255 characters'),
  body('tasks.*.description')
    .optional()
    .trim()
    .isLength({ max: 10000 })
    .withMessage('Each task description must be less than 10000 characters'),
  body('tasks.*.status')
    .optional()
    .isIn(Object.values(TaskStatus))
    .withMessage(`Each task status must be one of: ${Object.values(TaskStatus).join(', ')}`),
  body('tasks.*.priority')
    .optional()
    .isIn(Object.values(TaskPriority))
    .withMessage(`Each task priority must be one of: ${Object.values(TaskPriority).join(', ')}`),
  body('tasks.*.dueDate')
    .optional()
    .custom((value) => {
      if (value === null || value === '') {
        return true;
      }
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        throw new Error('Each task due date must be a valid date');
      }
      return true;
    }),
  body('tasks.*.tags')
    .optional()
    .isArray()
    .withMessage('Each task tags must be an array'),
  body('tasks.*.tags.*')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Each tag must be between 1 and 50 characters'),
  body('tasks.*.assignedTo')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Each task assigned to must be a positive integer'),
  handleValidationErrors
];


export const validateCreateComment = [
  body('content')
    .trim()
    .isLength({ min: 1, max: 5000 })
    .withMessage('Content is required and must be less than 5000 characters'),
  handleValidationErrors
];

export const validateUpdateComment = [
  body('content')
    .optional()
    .trim()
    .isLength({ min: 1, max: 5000 })
    .withMessage('Content must be between 1 and 5000 characters'),
  body()
    .custom((value) => {
      if (!value.content) {
        throw new Error('Content must be provided');
      }
      return true;
    }),
  handleValidationErrors
];


const validateIdParam = (paramName: string, entityName: string) => [
  param(paramName)
    .isInt({ min: 1 })
    .withMessage(`${entityName} ID must be a positive integer`),
  handleValidationErrors
];

export const validateTaskId = validateIdParam('id', 'Task');
export const validateTaskIdParam = validateIdParam('taskId', 'Task');
export const validateCommentId = validateIdParam('id', 'Comment');
export const validateFileId = validateIdParam('id', 'File');
export const validateUserId = validateIdParam('userId', 'User');


export const validateTaskQueryParams = [
  query('status')
    .optional()
    .isIn(Object.values(TaskStatus))
    .withMessage(`Status must be one of: ${Object.values(TaskStatus).join(', ')}`),
  query('priority')
    .optional()
    .isIn(Object.values(TaskPriority))
    .withMessage(`Priority must be one of: ${Object.values(TaskPriority).join(', ')}`),
  query('assignedTo')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Assigned to must be a positive integer'),
  query('search')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Search query must be less than 255 characters'),
  query('sortBy')
    .optional()
    .isIn(['created_at', 'updated_at', 'due_date', 'title', 'priority', 'status'])
    .withMessage('Sort by must be one of: created_at, updated_at, due_date, title, priority, status'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be either asc or desc'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  handleValidationErrors
];

export const validateAnalyticsQueryParams = [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be in format (YYYY-MM-DD)'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be format (YYYY-MM-DD)')
    .custom((value, { req }) => {
      if (value && req.query && req.query.startDate) {
        const startDate = new Date(req.query.startDate as string);
        const endDate = new Date(value);
        if (startDate > endDate) {
          throw new Error('startDate must be before endDate');
        }
      }
      return true;
    }),
  handleValidationErrors
];

export const validateFilesUpload = (req: Request, res: Response, next: NextFunction): void => {
  const files = req.files as Express.Multer.File[] | undefined;

  if (!files || files.length === 0) {
    res.status(400).json({ message: 'No files provided' });
    return;
  }

  next();
};

export const handleMulterErrors = (err: Error, req: Request, res: Response, next: NextFunction): void => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({ message: 'File size exceeds the 10MB limit' });
      return;
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      res.status(400).json({ message: 'Too many files. Maximum 10 files allowed' });
      return;
    }
    res.status(400).json({ message: `Upload error: ${err.message}` });
    return;
  }
  
  if (err.message.includes('not allowed')) {
    res.status(400).json({ message: err.message });
    return;
  }

  next(err);
};

