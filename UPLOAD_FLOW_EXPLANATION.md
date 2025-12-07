# Image Upload Flow Explanation

## How Images Are Uploaded to Your Hosting

### Current Setup (Local Development):
```
Your Backend: D:\Projects\promotheans_backend\
UPLOAD_DIR: ../The Promotheans/assets/community_art
Result: D:\Projects\The Promotheans\assets\community_art\
```

### For Hostinger Shared Hosting:

**Your Hosting Structure:**
```
/home/yourusername/
  ├── promotheans_backend/    (your backend folder)
  └── public_html/            (your website root)
      └── assets/
          └── community_art/  (where images should go)
```

## Upload Process:

1. **Frontend sends image** → `POST /api/v1/upload/community-art`
2. **Backend receives** → Multer middleware processes the file
3. **Backend reads UPLOAD_DIR** from `.env` file
4. **Backend saves file** to the directory specified in UPLOAD_DIR
5. **Backend returns path** → `assets/community_art/filename.jpg`
6. **Frontend uses path** → Displays image from `public_html/assets/community_art/`

## Configuration for Hostinger:

### ⭐ EASIEST: Relative Path (Recommended)
**If your backend folder is at the same level as `public_html`:**
```env
UPLOAD_DIR=../public_html/assets/community_art
```

**If your backend is inside `public_html` (e.g., `public_html/api/` or `public_html/backend/`):**
```env
UPLOAD_DIR=../assets/community_art
```
or
```env
UPLOAD_DIR=./assets/community_art
```

### Option 2: Absolute Path (If relative doesn't work)
```env
UPLOAD_DIR=/home/yourusername/public_html/assets/community_art
```
**To find your username:**
- Log into cPanel
- Look at the top right corner - it shows your username
- OR check File Manager - the path shows `/home/username/...`
- This is your **cPanel account username** (not FTP account username)

## Important Notes:

1. **Directory Permissions**: Make sure the backend can write to `public_html/assets/community_art`
   - Usually needs `755` or `775` permissions
   - Check in cPanel File Manager

2. **Path in Database**: The backend returns `assets/community_art/filename.jpg`
   - This is a relative path from `public_html`
   - Your frontend should use this path directly

3. **MAX_FILE_SIZE**: Currently set to 5MB (5242880 bytes)
   - You can increase if needed
   - Also check PHP upload limits in hosting if using PHP

## Testing:

After uploading, check:
- File exists in: `public_html/assets/community_art/`
- File is accessible via: `https://yourdomain.com/assets/community_art/filename.jpg`
- Database stores: `assets/community_art/filename.jpg`

