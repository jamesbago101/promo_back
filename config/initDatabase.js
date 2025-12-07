const pool = require('./database');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function initDatabase() {
  try {
    // Create tables
    await pool.query(`
      CREATE TABLE IF NOT EXISTS news (
        id INT AUTO_INCREMENT PRIMARY KEY,
        date DATE NOT NULL,
        timezone VARCHAR(10) DEFAULT '(UTC)',
        category VARCHAR(100) NOT NULL,
        title VARCHAR(500) NOT NULL,
        excerpt TEXT NOT NULL,
        link VARCHAR(500),
        featured BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_date (date),
        INDEX idx_category (category),
        INDEX idx_featured (featured)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS community_arts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        image VARCHAR(500) NOT NULL,
        title VARCHAR(500) DEFAULT '',
        category VARCHAR(200) NOT NULL,
        artist VARCHAR(200) NOT NULL,
        xHandle VARCHAR(200),
        xUrl VARCHAR(500),
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_category (category),
        INDEX idx_artist (artist)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        user_role ENUM('Admin', 'Editor') DEFAULT 'Editor',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Add user_role column if it doesn't exist (for existing databases)
    try {
      await pool.query('ALTER TABLE admin_users ADD COLUMN user_role ENUM("Admin", "Editor") DEFAULT "Editor"');
      console.log('✅ Added user_role column to admin_users table');
    } catch (error) {
      // Column might already exist, ignore error
      if (!error.message.includes('Duplicate column name')) {
        console.log('ℹ️  user_role column check:', error.message);
      }
    }

    // Create categories tables
    await pool.query(`
      CREATE TABLE IF NOT EXISTS news_categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS art_categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(200) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Create YouTube video settings table (single record with fixed ID = 1)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS youtube_video (
        id INT PRIMARY KEY DEFAULT 1,
        video_id VARCHAR(50) NOT NULL,
        video_url VARCHAR(500) NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CHECK (id = 1)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Insert default YouTube video if it doesn't exist
    const [existingVideo] = await pool.query('SELECT * FROM youtube_video WHERE id = 1');
    if (existingVideo.length === 0) {
      await pool.query(
        'INSERT INTO youtube_video (id, video_id, video_url) VALUES (1, ?, ?)',
        ['zlMFsDJNneE', 'https://www.youtube.com/watch?v=zlMFsDJNneE']
      );
      console.log('✅ Default YouTube video created');
    }

    // Create or update default admin user
    const [users] = await pool.query('SELECT * FROM admin_users WHERE username = ?', ['admin']);
    
    if (users.length === 0) {
      // Create new admin user
      const defaultPassword = process.env.ADMIN_PASSWORD || 'admin123';
      const passwordHash = await bcrypt.hash(defaultPassword, 10);
      
      await pool.query(
        'INSERT INTO admin_users (username, password_hash, user_role) VALUES (?, ?, ?)',
        ['admin', passwordHash, 'Admin']
      );
      
      console.log('✅ Default admin user created');
      console.log('   Username: admin');
      console.log('   Password: ' + defaultPassword);
      console.log('   Role: Admin');
      console.log('   ⚠️  Please change the password after first login!');
    } else {
      // Update existing admin user to ensure it has Admin role
      await pool.query(
        'UPDATE admin_users SET user_role = ? WHERE username = ?',
        ['Admin', 'admin']
      );
      
      console.log('✅ Admin user exists and has Admin role');
    }

    // Create community_art directory if it doesn't exist
    const communityArtDir = path.join(__dirname, '..', '..', 'The Promotheans', 'assets', 'community_art');
    if (!fs.existsSync(communityArtDir)) {
      fs.mkdirSync(communityArtDir, { recursive: true });
      console.log('✅ Created community_art directory:', communityArtDir);
    }

    console.log('✅ Database tables initialized successfully');
  } catch (error) {
    console.error('❌ Database initialization error:', error);
    throw error;
  }
}

// Run initialization if called directly
if (require.main === module) {
  initDatabase()
    .then(() => {
      console.log('✅ Database initialization complete');
      process.exit(0);
    })
    .catch(err => {
      console.error('❌ Initialization failed:', err);
      process.exit(1);
    });
}

module.exports = initDatabase;
