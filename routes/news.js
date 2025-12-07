const express = require('express');
const pool = require('../config/database');
const authenticateToken = require('../middleware/auth');

const router = express.Router();

// Public: Get all news items
router.get('/api/v1/news', async (req, res) => {
  try {
    const [news] = await pool.query(
      'SELECT id, DATE_FORMAT(date, "%M %d, %Y") as date, timezone, category, title, excerpt, link, featured, created_at, updated_at FROM news ORDER BY date DESC, created_at DESC'
    );
    res.json(news);
  } catch (error) {
    console.error('Error fetching news:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Public: Get single news item
router.get('/api/v1/news/:id', async (req, res) => {
  try {
    const [news] = await pool.query(
      'SELECT id, DATE_FORMAT(date, "%Y-%m-%d") as date, DATE_FORMAT(date, "%M %d, %Y") as dateFormatted, timezone, category, title, excerpt, link, featured, created_at, updated_at FROM news WHERE id = ?',
      [req.params.id]
    );

    if (news.length === 0) {
      return res.status(404).json({ error: 'News item not found' });
    }

    res.json(news[0]);
  } catch (error) {
    console.error('Error fetching news item:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Protected: Create news item
router.post('/api/v1/news', authenticateToken, async (req, res) => {
  try {
    const { date, timezone, category, title, excerpt, link, featured } = req.body;

    if (!date || !category || !title || !excerpt) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const [result] = await pool.query(
      'INSERT INTO news (date, timezone, category, title, excerpt, link, featured) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [date, timezone || '(UTC)', category, title, excerpt, link || null, featured || false]
    );

    const [newItem] = await pool.query('SELECT * FROM news WHERE id = ?', [result.insertId]);
    res.status(201).json(newItem[0]);
  } catch (error) {
    console.error('Error creating news:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Protected: Update news item
router.put('/api/v1/news/:id', authenticateToken, async (req, res) => {
  try {
    const { date, timezone, category, title, excerpt, link, featured } = req.body;

    // Check if news item exists
    const [existing] = await pool.query('SELECT * FROM news WHERE id = ?', [req.params.id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'News item not found' });
    }

    await pool.query(
      'UPDATE news SET date = ?, timezone = ?, category = ?, title = ?, excerpt = ?, link = ?, featured = ? WHERE id = ?',
      [date, timezone || '(UTC)', category, title, excerpt, link || null, featured || false, req.params.id]
    );

    const [updated] = await pool.query('SELECT * FROM news WHERE id = ?', [req.params.id]);
    res.json(updated[0]);
  } catch (error) {
    console.error('Error updating news:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Protected: Delete news item
router.delete('/api/v1/news/:id', authenticateToken, async (req, res) => {
  try {
    const [existing] = await pool.query('SELECT * FROM news WHERE id = ?', [req.params.id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'News item not found' });
    }

    await pool.query('DELETE FROM news WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'News item deleted successfully' });
  } catch (error) {
    console.error('Error deleting news:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

