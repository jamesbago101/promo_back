const express = require('express');
const pool = require('../config/database');
const authenticateToken = require('../middleware/auth');
const { deleteCommunityArtImage } = require('../utils/fileUtils');

const router = express.Router();

// Helper function to clean artist name (remove trailing " ART")
const cleanArtistName = (artistName) => {
  if (!artistName) return artistName;
  return artistName.trim().replace(/\s+ART\s*$/i, '').trim();
};

// Public: Get all community arts
router.get('/api/v1/community-arts', async (req, res) => {
  try {
    const [arts] = await pool.query(
      'SELECT * FROM community_arts ORDER BY created_at DESC'
    );
    // Clean artist names (remove trailing " ART")
    const cleanedArts = arts.map(art => ({
      ...art,
      artist: cleanArtistName(art.artist)
    }));
    res.json(cleanedArts);
  } catch (error) {
    console.error('Error fetching community arts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Public: Get single art item
router.get('/api/v1/community-arts/:id', async (req, res) => {
  try {
    const [arts] = await pool.query(
      'SELECT * FROM community_arts WHERE id = ?',
      [req.params.id]
    );

    if (arts.length === 0) {
      return res.status(404).json({ error: 'Art item not found' });
    }

    // Clean artist name (remove trailing " ART")
    const cleanedArt = {
      ...arts[0],
      artist: cleanArtistName(arts[0].artist)
    };

    res.json(cleanedArt);
  } catch (error) {
    console.error('Error fetching art item:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Protected: Create art item
router.post('/api/v1/community-arts', authenticateToken, async (req, res) => {
  try {
    const { image, title, category, artist, xHandle, xUrl, description } = req.body;

    if (!image || !category || !artist) {
      return res.status(400).json({ error: 'Missing required fields: image, category, artist' });
    }

    // Clean artist name (remove trailing " ART")
    const cleanedArtist = cleanArtistName(artist);

    const [result] = await pool.query(
      'INSERT INTO community_arts (image, title, category, artist, xHandle, xUrl, description) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [image, title || '', category, cleanedArtist, xHandle || null, xUrl || null, description || null]
    );

    const [newItem] = await pool.query('SELECT * FROM community_arts WHERE id = ?', [result.insertId]);
    // Ensure artist name is clean in response
    const cleanedItem = {
      ...newItem[0],
      artist: cleanArtistName(newItem[0].artist)
    };
    res.status(201).json(cleanedItem);
  } catch (error) {
    console.error('Error creating art item:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Protected: Update art item
router.put('/api/v1/community-arts/:id', authenticateToken, async (req, res) => {
  try {
    const { image, title, category, artist, xHandle, xUrl, description } = req.body;

    // Check if art item exists
    const [existing] = await pool.query('SELECT * FROM community_arts WHERE id = ?', [req.params.id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Art item not found' });
    }

    const oldImage = existing[0].image;
    const newImage = image;

    // If image is being changed, delete the old image
    if (oldImage && newImage && oldImage !== newImage) {
      await deleteCommunityArtImage(oldImage);
    }

    // Clean artist name (remove trailing " ART")
    const cleanedArtist = cleanArtistName(artist);

    await pool.query(
      'UPDATE community_arts SET image = ?, title = ?, category = ?, artist = ?, xHandle = ?, xUrl = ?, description = ? WHERE id = ?',
      [image, title || '', category, cleanedArtist, xHandle || null, xUrl || null, description || null, req.params.id]
    );

    const [updated] = await pool.query('SELECT * FROM community_arts WHERE id = ?', [req.params.id]);
    // Ensure artist name is clean in response
    const cleanedItem = {
      ...updated[0],
      artist: cleanArtistName(updated[0].artist)
    };
    res.json(cleanedItem);
  } catch (error) {
    console.error('Error updating art item:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Protected: Delete art item
router.delete('/api/v1/community-arts/:id', authenticateToken, async (req, res) => {
  try {
    const [existing] = await pool.query('SELECT * FROM community_arts WHERE id = ?', [req.params.id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Art item not found' });
    }

    const imagePath = existing[0].image;

    // Delete the record from database
    await pool.query('DELETE FROM community_arts WHERE id = ?', [req.params.id]);

    // Delete the associated image file
    if (imagePath) {
      await deleteCommunityArtImage(imagePath);
    }

    res.json({ success: true, message: 'Art item and associated image deleted successfully' });
  } catch (error) {
    console.error('Error deleting art item:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

