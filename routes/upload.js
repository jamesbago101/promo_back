const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const authenticateToken = require('../middleware/auth');
const { uploadFileViaFTP, isFTPEnabled } = require('../utils/ftpUtils');
require('dotenv').config();

const router = express.Router();

// Configure storage for community art images
const communityArtStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Use UPLOAD_DIR from .env or default path
    const uploadDirPath = process.env.UPLOAD_DIR || '../The Promotheans/assets/community_art';
    const backendRoot = path.join(__dirname, '..'); // Go up from routes/ to backend root
    
    // If it's an absolute Unix path (starts with /), use it directly
    // Otherwise resolve relative paths
    let uploadDir;
    if (uploadDirPath.startsWith('/')) {
      // Unix absolute path - use as-is (for production/hosting)
      uploadDir = uploadDirPath;
    } else if (path.isAbsolute(uploadDirPath)) {
      // Windows absolute path - use as-is
      uploadDir = uploadDirPath;
    } else {
      // Relative path - resolve it
      uploadDir = path.resolve(backendRoot, uploadDirPath);
    }
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate filename based on artist, category, and timestamp
    const artist = (req.body.artist || 'unknown').trim();
    const category = (req.body.category || 'art').trim();
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    
    // Sanitize names for filename
    const sanitize = (str) => {
      if (!str) return 'unknown';
      return str.replace(/[^a-z0-9]/gi, '_').toLowerCase().substring(0, 30);
    };
    const artistClean = sanitize(artist);
    const categoryClean = sanitize(category).substring(0, 20);
    
    const filename = `${artistClean}_${categoryClean}_${timestamp}${ext}`;
    cb(null, filename);
  }
});

// File filter for images only
const imageFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({
  storage: communityArtStorage,
  fileFilter: imageFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 // Use MAX_FILE_SIZE from .env or default 5MB
  }
});

// Error handler for multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 5MB.' });
    }
    return res.status(400).json({ error: 'Upload error: ' + err.message });
  }
  if (err) {
    return res.status(400).json({ error: err.message || 'Upload failed' });
  }
  next();
};

// Upload endpoint for community art images
router.post('/api/v1/upload/community-art', authenticateToken, (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      console.error('Upload middleware error:', err);
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: 'File too large. Maximum size is 5MB.' });
        }
        return res.status(400).json({ error: 'Upload error: ' + err.message });
      }
      return res.status(400).json({ error: err.message || 'Upload failed' });
    }
    next();
  });
}, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const relativePath = `assets/community_art/${req.file.filename}`;

    // If FTP is enabled, upload via FTP to Hostinger
    if (isFTPEnabled()) {
      try {
        await uploadFileViaFTP(req.file.path, relativePath);
        // Delete local temp file after FTP upload
        fs.unlinkSync(req.file.path);
        console.log('✅ Local temp file deleted after FTP upload');
      } catch (ftpError) {
        // If FTP fails, keep local file and return error
        console.error('FTP upload failed:', ftpError.message);
        return res.status(500).json({ 
          error: 'Failed to upload file to server via FTP: ' + ftpError.message 
        });
      }
    }
    // If FTP is not enabled, file stays in local directory (existing behavior)
    
    res.json({
      success: true,
      path: relativePath,
      filename: req.file.filename,
      size: req.file.size,
      uploadedVia: isFTPEnabled() ? 'FTP' : 'local'
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed: ' + error.message });
  }
});

module.exports = router;

