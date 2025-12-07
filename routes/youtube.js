const express = require('express');
const pool = require('../config/database');
const auth = require('../middleware/auth');
require('dotenv').config();

const router = express.Router();

// Helper function to extract video ID from YouTube URL
function extractVideoId(url) {
  if (!url) return null;
  
  // Remove whitespace
  url = url.trim();
  
  // Handle various YouTube URL formats
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/v\/([^&\n?#]+)/,
    /youtube\.com\/.*[?&]v=([^&\n?#]+)/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  // If no pattern matches, check if it's already just a video ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(url)) {
    return url;
  }
  
  return null;
}

// Get YouTube video settings (public endpoint)
router.get('/api/v1/youtube-video', async (req, res) => {
  try {
    const [videos] = await pool.query('SELECT * FROM youtube_video WHERE id = 1');
    
    if (videos.length === 0) {
      return res.status(404).json({ error: 'YouTube video not found' });
    }
    
    res.json(videos[0]);
  } catch (error) {
    console.error('Error fetching YouTube video:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update YouTube video settings (Admin only)
router.put('/api/v1/youtube-video', auth, async (req, res) => {
  try {
    // Check if user is Admin
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ error: 'Access denied. Admin role required.' });
    }

    const { video_url } = req.body;

    if (!video_url) {
      return res.status(400).json({ error: 'Video URL is required' });
    }

    // Extract video ID from URL
    const videoId = extractVideoId(video_url);
    
    if (!videoId) {
      return res.status(400).json({ error: 'Invalid YouTube URL. Please provide a valid YouTube video URL.' });
    }

    // Update the video (id is always 1)
    await pool.query(
      'UPDATE youtube_video SET video_id = ?, video_url = ? WHERE id = 1',
      [videoId, video_url]
    );

    res.json({
      id: 1,
      video_id: videoId,
      video_url: video_url,
      message: 'YouTube video updated successfully'
    });
  } catch (error) {
    console.error('Error updating YouTube video:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

