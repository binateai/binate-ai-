import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request, Response } from 'express';

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads/receipts');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp and original extension
    const userId = req.user?.id || 'unknown';
    const timestamp = Date.now();
    const fileExtension = path.extname(file.originalname);
    const sanitizedFilename = path.basename(file.originalname, fileExtension)
      .replace(/[^a-zA-Z0-9]/g, '_'); // Remove special characters
    
    const filename = `receipt_${userId}_${timestamp}_${sanitizedFilename}${fileExtension}`;
    cb(null, filename);
  }
});

// Generate public URL for a file
export function getPublicFileUrl(filename: string): string {
  return `/uploads/receipts/${filename}`;
}

// File filter to accept only images
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, WEBP images and PDF files are allowed.'));
  }
};

// Create upload middleware
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB file size limit
  }
});

// Function to download a file
export function downloadFile(req: Request, res: Response): void {
  const { filename } = req.params;
  
  // Sanitize the filename to prevent path traversal attacks
  const sanitizedFilename = path.basename(filename);
  const filePath = path.join(process.cwd(), 'uploads/receipts', sanitizedFilename);
  
  // Check if file exists
  if (!fs.existsSync(filePath)) {
    res.status(404).send('File not found');
    return;
  }
  
  // Security check - make sure the file belongs to the logged-in user
  if (req.user && req.user.id) {
    const userId = req.user.id;
    const filenameParts = sanitizedFilename.split('_');
    
    // Check if the file belongs to the logged-in user
    // Format is receipt_userId_timestamp_name.ext
    if (filenameParts.length >= 3 && filenameParts[1] !== userId.toString()) {
      res.status(403).send('Unauthorized access to file');
      return;
    }
  } else {
    res.status(401).send('Authentication required');
    return;
  }
  
  // Set content disposition and send file
  res.download(filePath);
}