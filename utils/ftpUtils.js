const ftp = require('basic-ftp');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

/**
 * Upload a file to Hostinger via FTP
 * @param {string} localFilePath - Full path to the local file
 * @param {string} remotePath - Remote path relative to FTP root (e.g., "assets/community_art/filename.jpg")
 * @returns {Promise<boolean>} - True if uploaded successfully
 */
async function uploadFileViaFTP(localFilePath, remotePath) {
  const client = new ftp.Client();
  client.ftp.verbose = process.env.NODE_ENV === 'development'; // Show FTP logs in development

  try {
    // FTP connection configuration from .env
    const useSecure = process.env.FTP_SECURE === 'true';
    const defaultPort = useSecure ? 990 : 21; // FTPS uses port 990, FTP uses 21
    
    const ftpConfig = {
      host: process.env.FTP_HOST || 'ftp.theprometheans.io',
      user: process.env.FTP_USER || 'u336403169.therealprometheans',
      password: process.env.FTP_PASSWORD || '',
      secure: useSecure, // Use FTPS if true
      port: parseInt(process.env.FTP_PORT) || defaultPort
    };

    // Connect to FTP server
    await client.access(ftpConfig);
    console.log('✅ Connected to FTP server');

    // Ensure remote directory exists
    const remoteDir = path.dirname(remotePath).replace(/\\/g, '/');
    if (remoteDir && remoteDir !== '.') {
      try {
        await client.ensureDir(remoteDir);
        console.log(`✅ Ensured remote directory exists: ${remoteDir}`);
      } catch (error) {
        console.error(`⚠️  Error ensuring directory ${remoteDir}:`, error.message);
        // Continue anyway - might already exist
      }
    }

    // Upload the file
    const remoteFileName = path.basename(remotePath);
    await client.uploadFrom(localFilePath, remoteFileName);
    console.log(`✅ Uploaded file via FTP: ${remotePath}`);

    return true;
  } catch (error) {
    console.error('❌ FTP upload error:', error.message);
    throw error;
  } finally {
    client.close();
  }
}

/**
 * Delete a file from Hostinger via FTP
 * @param {string} remotePath - Remote path relative to FTP root (e.g., "assets/community_art/filename.jpg")
 * @returns {Promise<boolean>} - True if deleted successfully
 */
async function deleteFileViaFTP(remotePath) {
  const client = new ftp.Client();
  client.ftp.verbose = process.env.NODE_ENV === 'development';

  try {
    const useSecure = process.env.FTP_SECURE === 'true';
    const defaultPort = useSecure ? 990 : 21;
    
    const ftpConfig = {
      host: process.env.FTP_HOST || 'ftp.theprometheans.io',
      user: process.env.FTP_USER || 'u336403169.therealprometheans',
      password: process.env.FTP_PASSWORD || '',
      secure: useSecure,
      port: parseInt(process.env.FTP_PORT) || defaultPort
    };

    await client.access(ftpConfig);

    // Navigate to the directory
    const remoteDir = path.dirname(remotePath).replace(/\\/g, '/');
    if (remoteDir && remoteDir !== '.') {
      await client.cd(remoteDir);
    }

    // Delete the file
    const remoteFileName = path.basename(remotePath);
    await client.remove(remoteFileName);
    console.log(`✅ Deleted file via FTP: ${remotePath}`);

    return true;
  } catch (error) {
    // File might not exist - that's okay
    if (error.code === 550) {
      console.log(`ℹ️  File not found on FTP (may already be deleted): ${remotePath}`);
      return false;
    }
    console.error('❌ FTP delete error:', error.message);
    throw error;
  } finally {
    client.close();
  }
}

/**
 * Check if FTP is enabled in .env
 * @returns {boolean}
 */
function isFTPEnabled() {
  return process.env.USE_FTP === 'true' && 
         process.env.FTP_HOST && 
         process.env.FTP_USER && 
         process.env.FTP_PASSWORD;
}

module.exports = {
  uploadFileViaFTP,
  deleteFileViaFTP,
  isFTPEnabled
};

