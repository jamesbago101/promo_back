const fs = require('fs');
const path = require('path');
const { deleteFileViaFTP, isFTPEnabled } = require('./ftpUtils');
require('dotenv').config();

// Get upload directory from .env or use default
function getCommunityArtDir() {
  const uploadDirPath = process.env.UPLOAD_DIR || path.join(__dirname, '..', '..', 'The Promotheans', 'assets', 'community_art');
  const backendRoot = path.join(__dirname, '..');
  
  // If it's an absolute Unix path (starts with /), use it directly
  // Otherwise resolve relative paths
  if (uploadDirPath.startsWith('/')) {
    // Unix absolute path - use as-is (for production/hosting)
    return uploadDirPath;
  } else if (path.isAbsolute(uploadDirPath)) {
    // Windows absolute path - use as-is
    return uploadDirPath;
  } else {
    // Relative path - resolve it
    return path.resolve(backendRoot, uploadDirPath);
  }
}

const COMMUNITY_ART_DIR = getCommunityArtDir();

/**
 * Delete an image file from the community_art directory
 * @param {string} imagePath - Relative path like "assets/community_art/filename.jpg"
 * @returns {Promise<boolean>} - True if deleted successfully, false otherwise
 */
async function deleteCommunityArtImage(imagePath) {
  if (!imagePath) {
    return false;
  }

  // If FTP is enabled, delete via FTP
  if (isFTPEnabled()) {
    try {
      // Ensure path is in correct format (assets/community_art/filename.jpg)
      let remotePath = imagePath;
      if (!remotePath.startsWith('assets/')) {
        // Extract just the filename and construct path
        const filename = imagePath.includes('community_art/') 
          ? imagePath.split('community_art/')[1]
          : path.basename(imagePath);
        remotePath = `assets/community_art/${filename}`;
      }
      await deleteFileViaFTP(remotePath);
      return true;
    } catch (error) {
      console.error('FTP delete error:', error.message);
      return false;
    }
  }

  // Otherwise, delete from local file system
  return new Promise((resolve) => {
    // Extract filename from path
    let filename;
    if (imagePath.includes('community_art/')) {
      filename = imagePath.split('community_art/')[1];
    } else if (imagePath.includes('/')) {
      filename = path.basename(imagePath);
    } else {
      filename = imagePath;
    }

    // Use path.join for relative paths, but preserve Unix paths
    const filePath = COMMUNITY_ART_DIR.startsWith('/') 
      ? `${COMMUNITY_ART_DIR}/${filename}`.replace(/\\/g, '/')
      : path.join(COMMUNITY_ART_DIR, filename);

    // Check if file exists before trying to delete
    if (!fs.existsSync(filePath)) {
      console.log(`Image file not found: ${filePath}`);
      resolve(false);
      return;
    }

    try {
      fs.unlinkSync(filePath);
      console.log(`✅ Deleted image: ${filePath}`);
      resolve(true);
    } catch (error) {
      console.error(`❌ Error deleting image ${filePath}:`, error.message);
      resolve(false);
    }
  });
}

/**
 * Get the full path to a community art image
 * @param {string} imagePath - Relative path like "assets/community_art/filename.jpg"
 * @returns {string} - Full file system path
 */
function getCommunityArtImagePath(imagePath) {
  if (!imagePath) return null;

  // Extract filename from path
  let filename;
  if (imagePath.includes('community_art/')) {
    filename = imagePath.split('community_art/')[1];
  } else if (imagePath.includes('/')) {
    filename = path.basename(imagePath);
  } else {
    filename = imagePath;
  }

  return path.join(COMMUNITY_ART_DIR, filename);
}

module.exports = {
  deleteCommunityArtImage,
  getCommunityArtImagePath,
  COMMUNITY_ART_DIR
};

