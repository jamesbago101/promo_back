const express = require('express');
const pool = require('../config/database');
const authenticateToken = require('../middleware/auth');

const router = express.Router();

// ==================== NEWS CATEGORIES ====================

// Public: Get all news categories
router.get('/api/v1/news-categories', async (req, res) => {
  try {
    const [categories] = await pool.query(
      'SELECT * FROM news_categories ORDER BY name ASC'
    );
    res.json(categories);
  } catch (error) {
    console.error('Error fetching news categories:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Public: Get single news category
router.get('/api/v1/news-categories/:id', async (req, res) => {
  try {
    const [categories] = await pool.query(
      'SELECT * FROM news_categories WHERE id = ?',
      [req.params.id]
    );

    if (categories.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json(categories[0]);
  } catch (error) {
    console.error('Error fetching news category:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Protected: Create news category
router.post('/api/v1/news-categories', authenticateToken, async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Category name is required' });
    }

    const trimmedName = name.trim();

    // Check if category already exists
    const [existing] = await pool.query(
      'SELECT * FROM news_categories WHERE name = ?',
      [trimmedName]
    );

    if (existing.length > 0) {
      return res.status(409).json({ error: 'Category already exists' });
    }

    const [result] = await pool.query(
      'INSERT INTO news_categories (name) VALUES (?)',
      [trimmedName]
    );

    const [newCategory] = await pool.query(
      'SELECT * FROM news_categories WHERE id = ?',
      [result.insertId]
    );
    res.status(201).json(newCategory[0]);
  } catch (error) {
    console.error('Error creating news category:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Category already exists' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Protected: Update news category
router.put('/api/v1/news-categories/:id', authenticateToken, async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Category name is required' });
    }

    const trimmedName = name.trim();

    // Check if category exists
    const [existing] = await pool.query(
      'SELECT * FROM news_categories WHERE id = ?',
      [req.params.id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Check if another category with the same name exists
    const [duplicate] = await pool.query(
      'SELECT * FROM news_categories WHERE name = ? AND id != ?',
      [trimmedName, req.params.id]
    );

    if (duplicate.length > 0) {
      return res.status(409).json({ error: 'Category name already exists' });
    }

    // Update the category name and also update all existing news using the old name
    await pool.query('START TRANSACTION');
    
    try {
      await pool.query(
        'UPDATE news_categories SET name = ? WHERE id = ?',
        [trimmedName, req.params.id]
      );

      // Update all news that use the old category name
      await pool.query(
        'UPDATE news SET category = ? WHERE category = ?',
        [trimmedName, existing[0].name]
      );

      await pool.query('COMMIT');

      const [updated] = await pool.query(
        'SELECT * FROM news_categories WHERE id = ?',
        [req.params.id]
      );
      res.json(updated[0]);
    } catch (error) {
      await pool.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error updating news category:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Category name already exists' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Protected: Delete news category
router.delete('/api/v1/news-categories/:id', authenticateToken, async (req, res) => {
  try {
    // Check if category exists
    const [existing] = await pool.query(
      'SELECT * FROM news_categories WHERE id = ?',
      [req.params.id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Check if category is being used by any news items
    const [newsUsingCategory] = await pool.query(
      'SELECT COUNT(*) as count FROM news WHERE category = ?',
      [existing[0].name]
    );

    if (newsUsingCategory[0].count > 0) {
      return res.status(409).json({
        error: 'Cannot delete category. It is being used by news items.',
        usageCount: newsUsingCategory[0].count
      });
    }

    await pool.query('DELETE FROM news_categories WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting news category:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ==================== ART CATEGORIES ====================

// Public: Get all art categories
router.get('/api/v1/art-categories', async (req, res) => {
  try {
    const [categories] = await pool.query(
      'SELECT * FROM art_categories ORDER BY name ASC'
    );
    res.json(categories);
  } catch (error) {
    console.error('Error fetching art categories:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Public: Get single art category
router.get('/api/v1/art-categories/:id', async (req, res) => {
  try {
    const [categories] = await pool.query(
      'SELECT * FROM art_categories WHERE id = ?',
      [req.params.id]
    );

    if (categories.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json(categories[0]);
  } catch (error) {
    console.error('Error fetching art category:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Protected: Create art category
router.post('/api/v1/art-categories', authenticateToken, async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Category name is required' });
    }

    const trimmedName = name.trim();

    // Check if category already exists
    const [existing] = await pool.query(
      'SELECT * FROM art_categories WHERE name = ?',
      [trimmedName]
    );

    if (existing.length > 0) {
      return res.status(409).json({ error: 'Category already exists' });
    }

    const [result] = await pool.query(
      'INSERT INTO art_categories (name) VALUES (?)',
      [trimmedName]
    );

    const [newCategory] = await pool.query(
      'SELECT * FROM art_categories WHERE id = ?',
      [result.insertId]
    );
    res.status(201).json(newCategory[0]);
  } catch (error) {
    console.error('Error creating art category:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Category already exists' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Protected: Update art category
router.put('/api/v1/art-categories/:id', authenticateToken, async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Category name is required' });
    }

    const trimmedName = name.trim();

    // Check if category exists
    const [existing] = await pool.query(
      'SELECT * FROM art_categories WHERE id = ?',
      [req.params.id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Check if another category with the same name exists
    const [duplicate] = await pool.query(
      'SELECT * FROM art_categories WHERE name = ? AND id != ?',
      [trimmedName, req.params.id]
    );

    if (duplicate.length > 0) {
      return res.status(409).json({ error: 'Category name already exists' });
    }

    // Update the category name and also update all existing community_arts using the old name
    await pool.query('START TRANSACTION');
    
    try {
      await pool.query(
        'UPDATE art_categories SET name = ? WHERE id = ?',
        [trimmedName, req.params.id]
      );

      // Update all community_arts that use the old category name
      await pool.query(
        'UPDATE community_arts SET category = ? WHERE category = ?',
        [trimmedName, existing[0].name]
      );

      await pool.query('COMMIT');

      const [updated] = await pool.query(
        'SELECT * FROM art_categories WHERE id = ?',
        [req.params.id]
      );
      res.json(updated[0]);
    } catch (error) {
      await pool.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error updating art category:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Category name already exists' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Protected: Delete art category
router.delete('/api/v1/art-categories/:id', authenticateToken, async (req, res) => {
  try {
    // Check if category exists
    const [existing] = await pool.query(
      'SELECT * FROM art_categories WHERE id = ?',
      [req.params.id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Check if category is being used by any art items
    const [artsUsingCategory] = await pool.query(
      'SELECT COUNT(*) as count FROM community_arts WHERE category = ?',
      [existing[0].name]
    );

    if (artsUsingCategory[0].count > 0) {
      return res.status(409).json({
        error: 'Cannot delete category. It is being used by art items.',
        usageCount: artsUsingCategory[0].count
      });
    }

    await pool.query('DELETE FROM art_categories WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting art category:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

