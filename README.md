# Promotheans Backend API

Backend API server for The Promotheans website with MySQL database integration.

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory with the following variables:

```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=promotheans_db

# Server Configuration
PORT=3001
NODE_ENV=development

# JWT Secret (CHANGE THIS TO A RANDOM STRING IN PRODUCTION)
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production

# Admin Configuration
ADMIN_USERNAME=admin
ADMIN_PASSWORD=change_this_password
```

### 3. Create MySQL Database
```sql
CREATE DATABASE promotheans_db;
```

### 4. Initialize Database Tables
The database tables will be automatically created when you start the server for the first time.

Alternatively, you can run:
```bash
node config/initDatabase.js
```

### 5. Start the Server
```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

## API Endpoints

### Public Endpoints

#### News
- `GET /api/v1/news` - Get all news items
- `GET /api/v1/news/:id` - Get single news item

#### Community Arts
- `GET /api/v1/community-arts` - Get all community arts
- `GET /api/v1/community-arts/:id` - Get single art item

### Protected Endpoints (Require Authentication)

#### Authentication
- `POST /api/v1/auth/verify-access` - Admin login (hidden route)
- `GET /api/v1/auth/check` - Verify token

#### News (Protected)
- `POST /api/v1/news` - Create news item
- `PUT /api/v1/news/:id` - Update news item
- `DELETE /api/v1/news/:id` - Delete news item

#### Community Arts (Protected)
- `POST /api/v1/community-arts` - Create art item
- `PUT /api/v1/community-arts/:id` - Update art item
- `DELETE /api/v1/community-arts/:id` - Delete art item

## Authentication

To access protected endpoints, include the JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## Security Features

1. **Hidden Admin Route**: The login endpoint uses an obfuscated path (`/api/v1/auth/verify-access`) instead of `/admin/login`
2. **JWT Authentication**: Secure token-based authentication
3. **Rate Limiting**: API endpoints are rate-limited to prevent abuse
4. **Password Hashing**: Passwords are hashed using bcrypt
5. **CORS Protection**: Configurable CORS settings

## Default Admin Credentials

After first initialization:
- Username: `admin`
- Password: (set in `.env` file, default: `admin123`)

**⚠️ IMPORTANT: Change the default password immediately after first login!**

