import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { promises as fsPromises } from 'fs';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(uploadsDir, file.fieldname);
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

// File filter for images
const imageFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Check if file is an image
  if (file.mimetype.startsWith('image/')) {
    // Allowed image types
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new AppError('Only JPEG, PNG, and WebP images are allowed', 400));
    }
  } else {
    cb(new AppError('Only image files are allowed', 400));
  }
};

// Configure multer middleware
const upload = multer({
  storage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 10 // Maximum 10 files per request
  }
});

// POST /api/upload/avatar - Upload user avatar
router.post('/avatar', 
  authenticate, 
  upload.single('avatar'), 
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.file) {
      throw new AppError('No file uploaded', 400);
    }

    const userId = req.user!.id;
    const file = req.file;

    // Generate file URL
    const fileUrl = `/uploads/avatar/${file.filename}`;

    // TODO: In production, you might want to upload to cloud storage (AWS S3, Cloudinary, etc.)
    // and return the cloud URL instead

    res.json({
      success: true,
      message: 'Avatar uploaded successfully',
      data: {
        url: fileUrl,
        filename: file.filename,
        originalName: file.originalname,
        size: file.size,
        mimetype: file.mimetype
      }
    });
  })
);

// POST /api/upload/studio-images - Upload studio images
router.post('/studio-images', 
  authenticate, 
  upload.array('images', 10), 
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const files = req.files as Express.Multer.File[];
    
    if (!files || files.length === 0) {
      throw new AppError('No files uploaded', 400);
    }

    const userId = req.user!.id;
    const uploadedFiles = files.map(file => ({
      url: `/uploads/images/${file.filename}`,
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype
    }));

    res.json({
      success: true,
      message: `${files.length} image(s) uploaded successfully`,
      data: {
        files: uploadedFiles
      }
    });
  })
);

// POST /api/upload/room-images - Upload room images
router.post('/room-images', 
  authenticate, 
  upload.array('images', 5), 
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const files = req.files as Express.Multer.File[];
    
    if (!files || files.length === 0) {
      throw new AppError('No files uploaded', 400);
    }

    const userId = req.user!.id;
    const uploadedFiles = files.map(file => ({
      url: `/uploads/images/${file.filename}`,
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype
    }));

    res.json({
      success: true,
      message: `${files.length} image(s) uploaded successfully`,
      data: {
        files: uploadedFiles
      }
    });
  })
);

// DELETE /api/upload/:type/:filename - Delete uploaded file
router.delete('/:type/:filename', 
  authenticate, 
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { type, filename } = req.params;
    const userId = req.user!.id;

    // Validate type
    const allowedTypes = ['avatar', 'images'];
    if (!allowedTypes.includes(type)) {
      throw new AppError('Invalid file type', 400);
    }

    // Validate filename (basic security check)
    if (!/^[a-zA-Z0-9\-_.]+$/.test(filename)) {
      throw new AppError('Invalid filename', 400);
    }

    const filePath = path.join(uploadsDir, type, filename);

    // Check if file exists
    try {
      await fsPromises.access(filePath);
    } catch (error) {
      throw new AppError('File not found', 404);
    }

    // TODO: In production, you might want to check if the user owns this file
    // by checking database records

    // Delete file
    try {
      await fsPromises.unlink(filePath);
    } catch (error) {
      throw new AppError('Failed to delete file', 500);
    }

    res.json({
      success: true,
      message: 'File deleted successfully'
    });
  })
);

// GET /api/upload/presigned-url - Get presigned URL for direct cloud upload
// This is useful for frontend direct uploads to cloud storage
router.post('/presigned-url', 
  authenticate, 
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { filename, contentType, fileType } = req.body;
    const userId = req.user!.id;

    // Validation
    if (!filename || !contentType || !fileType) {
      throw new AppError('Filename, content type, and file type are required', 400);
    }

    const allowedTypes = ['avatar', 'studio-image'];
    if (!allowedTypes.includes(fileType)) {
      throw new AppError('Invalid file type', 400);
    }

    // Validate content type
    const allowedContentTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedContentTypes.includes(contentType)) {
      throw new AppError('Invalid content type', 400);
    }

    // TODO: Implement presigned URL generation for cloud storage
    // This is a placeholder response
    res.json({
      success: true,
      message: 'Presigned URL feature not implemented yet',
      data: {
        uploadUrl: null,
        fields: {},
        fileUrl: null
      }
    });
  })
);

// Error handling middleware for multer
router.use((error: any, req: any, res: any, next: any) => {
  if (error instanceof multer.MulterError) {
    let message = 'File upload error';
    let statusCode = 400;

    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        message = 'File too large. Maximum size is 5MB';
        break;
      case 'LIMIT_FILE_COUNT':
        message = 'Too many files. Maximum 10 files allowed';
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        message = 'Unexpected file field';
        break;
      default:
        message = error.message;
    }

    return res.status(statusCode).json({
      success: false,
      message
    });
  }

  next(error);
});

export default router; 