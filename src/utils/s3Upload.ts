import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client, S3_BUCKET_NAME } from '../config/s3';
import { Readable } from 'stream';

export async function uploadFileToS3(
  key: string,
  body: Buffer | Readable,
  contentType: string
): Promise<void> {
  const command = new PutObjectCommand({
    Bucket: S3_BUCKET_NAME,
    Key: key,
    Body: body,
    ContentType: contentType
  });

  await s3Client.send(command);
}

export async function getFileUrlFromS3(key: string, expiresIn: number = 3600): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: S3_BUCKET_NAME,
    Key: key
  });

  return await getSignedUrl(s3Client, command, { expiresIn });
}

export async function deleteFileFromS3(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: S3_BUCKET_NAME,
    Key: key
  });

  await s3Client.send(command);
}

export function generateS3Key(taskId: number, userId: number, fileName: string): string {
  const timestamp = Date.now();
  return `tasks/${taskId}/users/${userId}/${timestamp}_${fileName}`;
}

