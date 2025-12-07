const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const initDatabase = require('./config/initDatabase');
const authRoutes = require('./routes/auth');
const newsRoutes = require('./routes/news');
const communityArtsRoutes = require('./routes/communityArts');
const categoriesRoutes = require('./routes/categories');
const uploadRoutes = require('./routes/upload');
const usersRoutes = require('./routes/users');
const youtubeRoutes = require('./routes/youtube');

const app = express();
const PORT = process.env.PORT || 3001;

// Rate limiting for API endpoints
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apply rate limiting to API routes
app.use('/api/', apiLimiter);

// Routes
app.use(authRoutes);
app.use(newsRoutes);
app.use(communityArtsRoutes);
app.use(categoriesRoutes);
app.use(uploadRoutes);
app.use(usersRoutes);
app.use(youtubeRoutes);

// Health check endpoint
app.get('/api/v1/health', (req, res) => {
  res.json({ status: 'ok', message: 'Promotheans API is running' });
});

// Initialize database on startup
initDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📊 API endpoints available at http://localhost:${PORT}/api/v1/`);
      console.log(`🔐 Admin login: POST http://localhost:${PORT}/api/v1/auth/verify-access`);
    });
  })
  .catch(err => {
    console.error('❌ Failed to initialize database:', err);
    process.exit(1);
  });

module.exports = app;

