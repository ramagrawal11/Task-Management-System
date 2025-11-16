import { Request, RequestHandler } from 'express';
import { commentRepository } from '../repositories/commentRepository';
import { taskRepository } from '../repositories/taskRepository';
import type { CreateCommentInput, UpdateCommentInput } from '../entities/commentEntity';

export const addComment: RequestHandler = async (req, res) => {
  const userId = (req as Request & { userId: number }).userId;

  const { taskId } = req.params;
  const taskIdNum = parseInt(taskId, 10);

  const { content } = req.body as CreateCommentInput;

  try {
    const task = await taskRepository.findById(taskIdNum);
    if (!task) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }

    if (!task.active) {
      res.status(403).json({ message: 'Cannot add comments to inactive task' });
      return;
    }

    const comment = await commentRepository.create({
      taskId: taskIdNum,
      userId,
      content: content.trim()
    });

    res.status(201).json(comment.toJSON());
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ message: 'Failed to create comment', detail });
  }
};

export const getTaskComments: RequestHandler = async (req, res) => {
  const { taskId } = req.params;
  const taskIdNum = parseInt(taskId, 10);

  try {
    const task = await taskRepository.findById(taskIdNum);
    if (!task) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }

    const comments = await commentRepository.findByTaskId(taskIdNum);
    const formattedComments = comments.map(comment => comment.toJSON());

    res.json({ comments: formattedComments });
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ message: 'Failed to fetch comments', detail });
  }
};

export const updateComment: RequestHandler = async (req, res) => {
  const userId = (req as Request & { userId: number }).userId;

  const { id } = req.params;
  const commentId = parseInt(id, 10);

  const { content } = req.body as UpdateCommentInput;

  try {
    const existingComment = await commentRepository.findById(commentId);
    if (!existingComment) {
      res.status(404).json({ message: 'Comment not found' });
      return;
    }

    if (existingComment.userId !== userId) {
      res.status(403).json({ message: 'You can only update your own comments' });
      return;
    }

    const comment = await commentRepository.update(commentId, {
      content: content ? content.trim() : undefined
    });

    res.json(comment.toJSON());
  } catch (error) {
    if (error instanceof Error && error.message === 'Comment not found') {
      res.status(404).json({ message: error.message });
      return;
    }
    if (error instanceof Error && error.message === 'No valid updates provided') {
      res.status(400).json({ message: error.message });
      return;
    }
    const detail = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ message: 'Failed to update comment', detail });
  }
};

export const deleteComment: RequestHandler = async (req, res) => {
  const userId = (req as Request & { userId: number }).userId;

  const { id } = req.params;
  const commentId = parseInt(id, 10);

  try {
    const existingComment = await commentRepository.findById(commentId);
    if (!existingComment) {
      res.status(404).json({ message: 'Comment not found' });
      return;
    }

    if (existingComment.userId !== userId) {
      res.status(403).json({ message: 'You can only delete your own comments' });
      return;
    }

    await commentRepository.softDelete(commentId);
    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    if (error instanceof Error && error.message === 'Comment not found') {
      res.status(404).json({ message: error.message });
      return;
    }
    const detail = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ message: 'Failed to delete comment', detail });
  }
};

