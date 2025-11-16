import { Request, RequestHandler } from 'express';
import multer from 'multer';
import { fileRepository } from '../repositories/fileRepository';
import { taskRepository } from '../repositories/taskRepository';
import { uploadFileToS3, getFileUrlFromS3, deleteFileFromS3, generateS3Key } from '../utils/s3Upload';
import { sanitizeFileName } from '../utils/fileSanitize';
import { File } from '../models/fileModel';

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      'text/csv',
      'application/csv',
      'text/comma-separated-values',
      'application/vnd.ms-excel',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'video/mp4'
    ];

    const isImage = file.mimetype.startsWith('image/');
    const isVideo = file.mimetype.startsWith('video/');

    if (isImage || isVideo || allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} is not allowed. Allowed types: CSV, Images, Word documents, and Videos`));
    }
  }
});

export const uploadMiddleware = upload.array('files', 10); // Allow up to 10 files

export const uploadFiles: RequestHandler = async (req, res) => {
  const userId = (req as Request & { userId: number }).userId;

  const { taskId } = req.params;
  const taskIdNum = parseInt(taskId, 10);

  const files = req.files as Express.Multer.File[];

  try {

    const task = await taskRepository.findById(taskIdNum);
    if (!task) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }

    if (!task.active) {
      res.status(403).json({ message: 'Cannot upload files to inactive task' });
      return;
    }

    const uploadedFiles: ReturnType<File['toJSON']>[] = [];
    const errors: string[] = [];

    for (const file of files) {
      try {
        const sanitizedFileName = sanitizeFileName(file.originalname);

        const s3Key = generateS3Key(taskIdNum, userId, sanitizedFileName);
        
        await uploadFileToS3(s3Key, file.buffer, file.mimetype);

        const fileModel = await fileRepository.create({
          taskId: taskIdNum,
          userId,
          fileName: sanitizedFileName,
          originalName: file.originalname,
          fileSize: file.size,
          mimeType: file.mimetype,
          s3Key
        });

        // Generate download URL
        const downloadUrl = await getFileUrlFromS3(s3Key);

        uploadedFiles.push(fileModel.toJSON(downloadUrl));
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`${file.originalname}: ${errorMessage}`);
      }
    }

    if (uploadedFiles.length === 0) {
      res.status(500).json({
        message: 'Failed to upload files',
        errors
      });
      return;
    }

    res.status(201).json({
      message: `Successfully uploaded ${uploadedFiles.length} file(s)`,
      files: uploadedFiles,
      ...(errors.length > 0 && { errors })
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ message: 'Failed to upload files', detail });
  }
};

export const getFile: RequestHandler = async (req, res) => {
  const { id } = req.params;
  const fileId = parseInt(id, 10);

  try {
    const fileModel = await fileRepository.findById(fileId);

    if (!fileModel) {
      res.status(404).json({ message: 'File not found' });
      return;
    }

    const downloadUrl = await getFileUrlFromS3(fileModel.s3Key);

    res.json(fileModel.toJSON(downloadUrl));
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ message: 'Failed to fetch file', detail });
  }
};

export const getTaskFiles: RequestHandler = async (req, res) => {
  const { taskId } = req.params;
  const taskIdNum = parseInt(taskId, 10);

  try {
    const task = await taskRepository.findById(taskIdNum);
    if (!task) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }

    const fileModels = await fileRepository.findByTaskId(taskIdNum);
    
    const files = await Promise.all(
      fileModels.map(async (fileModel) => {
        const downloadUrl = await getFileUrlFromS3(fileModel.s3Key);
        return fileModel.toJSON(downloadUrl);
      })
    );

    res.json({ files });
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ message: 'Failed to fetch files', detail });
  }
};

export const deleteFile: RequestHandler = async (req, res) => {
  const userId = (req as Request & { userId: number }).userId;

  const { id } = req.params;
  const fileId = parseInt(id, 10);

  try {
    const fileModel = await fileRepository.findById(fileId);

    if (!fileModel) {
      res.status(404).json({ message: 'File not found' });
      return;
    }

    if (fileModel.userId !== userId) {
      res.status(403).json({ message: 'You can only delete your own files' });
      return;
    }

    try {
      await deleteFileFromS3(fileModel.s3Key);
    } catch (s3Error) {
      console.error('Error deleting file from S3:', s3Error);
    }

    await fileRepository.softDelete(fileId);

    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    if (error instanceof Error && error.message === 'File not found') {
      res.status(404).json({ message: error.message });
      return;
    }
    const detail = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ message: 'Failed to delete file', detail });
  }
};

