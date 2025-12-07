# How to Deploy Backend to Hostinger

## Overview
- **FTP is NOT used for**: Database connections or file uploads (these are direct)
- **FTP IS used for**: Uploading your backend code files to the server

## Deployment Methods

### Method 1: FTP/SFTP (Recommended for Hostinger)

#### Step 1: Prepare Your Code
1. Make sure all files are ready
2. **IMPORTANT**: Create/update `.env` file on the server with production values
3. Don't upload `node_modules/` (will install on server)

#### Step 2: Upload via FTP Client
Use an FTP client like:
- **FileZilla** (free, recommended)
- **WinSCP** (Windows)
- **Cyberduck** (Mac/Windows)

**FTP Connection Details:**
```
Host: ftp.theprometheans.io
Username: u336403169.therealprometheans
Password: therealPromotheans2025!
Port: 21 (FTP) or 22 (SFTP)
```

#### Step 3: Upload Files
1. Connect to your Hostinger FTP
2. Navigate to where you want backend (e.g., `/home/u336403169/domains/theprometheans.io/`)
3. Create folder: `promotheans_backend` (or your preferred name)
4. Upload all files EXCEPT:
   - `node_modules/` (don't upload - install on server)
   - `.env` (create manually on server with production values)
   - `.git/` (optional)

#### Step 4: Install Dependencies on Server
After uploading, SSH into your server and run:
```bash
cd /home/u336403169/domains/theprometheans.io/promotheans_backend
npm install --production
```

#### Step 5: Create .env File on Server
Create `.env` file on server with production values:
```env
DB_HOST=92.113.22.2
DB_USER=u336403169_promotheans
DB_PASSWORD=therealPromotheans2025!
DB_NAME=u336403169_promotheans_db

PORT=3001
NODE_ENV=production

JWT_SECRET=your_production_jwt_secret_here
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_secure_password

UPLOAD_DIR=/home/u336403169/domains/theprometheans.io/public_html/assets/community_art
MAX_FILE_SIZE=5242880

FRONTEND_URL=https://theprometheans.io
```

#### Step 6: Run the Server
```bash
npm start
```

Or use PM2 to keep it running:
```bash
npm install -g pm2
pm2 start server.js --name promotheans-backend
pm2 save
pm2 startup
```

---

### Method 2: cPanel File Manager

1. Log into Hostinger cPanel
2. Go to **File Manager**
3. Navigate to your domain folder
4. Upload files using **Upload** button
5. Extract if you uploaded a ZIP file
6. Follow steps 4-6 from Method 1

---

### Method 3: Git (If Hostinger Supports It)

Some Hostinger plans support Git:
1. SSH into server
2. Clone your repository:
```bash
cd /home/u336403169/domains/theprometheans.io/
git clone https://github.com/yourusername/promotheans_backend.git
cd promotheans_backend
npm install --production
```
3. Create `.env` file
4. Run server

---

## Important Notes

### File Structure on Hostinger:
```
/home/u336403169/domains/theprometheans.io/
  ├── promotheans_backend/     ← Your backend code here
  │   ├── server.js
  │   ├── package.json
  │   ├── .env                  ← Create this with production values
  │   ├── config/
  │   ├── routes/
  │   └── ...
  └── public_html/              ← Your frontend
      └── assets/
          └── community_art/     ← Images uploaded here
```

### Node.js on Hostinger

**Check if Node.js is available:**
- Some Hostinger plans include Node.js
- Check cPanel → **Node.js Selector** or **Node.js App**
- If not available, you may need to:
  - Upgrade to a plan with Node.js support
  - Use a VPS/dedicated server
  - Deploy to Railway/Heroku instead

### Running Node.js on Hostinger

If Node.js is available:
1. Use **Node.js Selector** in cPanel to:
   - Select Node.js version
   - Set application root
   - Set application URL
   - Set startup file: `server.js`

2. Or use SSH:
```bash
node server.js
# Or with PM2 (recommended for production)
pm2 start server.js
```

---

## Quick Checklist

- [ ] Upload backend files via FTP/cPanel
- [ ] Install dependencies: `npm install --production`
- [ ] Create `.env` file with production values
- [ ] Ensure Node.js is available on Hostinger
- [ ] Test database connection
- [ ] Test file uploads
- [ ] Set up process manager (PM2) to keep server running
- [ ] Configure domain/subdomain for backend API

---

## Alternative: Deploy to Railway (Easier)

If Hostinger doesn't support Node.js well, consider:
- **Railway** (recommended - we set this up earlier)
- **Heroku**
- **DigitalOcean App Platform**

These platforms handle Node.js deployment automatically via Git.

