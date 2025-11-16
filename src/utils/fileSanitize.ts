export function sanitizeFileName(fileName: string, maxLength: number = 255): string {
  if (!fileName || typeof fileName !== 'string') {
    return 'unnamed_file';
  }

  let sanitized = fileName
    .replace(/\.\./g, '')
    .replace(/[\/\\]/g, '_')
    .replace(/\0/g, '')
    .trim();

  const lastDotIndex = sanitized.lastIndexOf('.');
  let extension = '';
  let nameWithoutExt = sanitized;

  if (lastDotIndex > 0 && lastDotIndex < sanitized.length - 1) {
    extension = sanitized.substring(lastDotIndex);
    nameWithoutExt = sanitized.substring(0, lastDotIndex);
  }

  nameWithoutExt = nameWithoutExt.replace(/[^a-zA-Z0-9._-]/g, '_');

  nameWithoutExt = nameWithoutExt.replace(/_+/g, '_');

  nameWithoutExt = nameWithoutExt.replace(/^[._]+|[._]+$/g, '');

  sanitized = nameWithoutExt + extension;

  if (!sanitized || sanitized === extension) {
    sanitized = 'sanitized_file' + extension;
  }

  const maxNameLength = maxLength - extension.length;
  if (nameWithoutExt.length > maxNameLength) {
    nameWithoutExt = nameWithoutExt.substring(0, maxNameLength);
    sanitized = nameWithoutExt + extension;
  }

  return sanitized;
}

