const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const db = require('../config/db');
const { verifyToken } = require('../middlewares/auth.middleware');

// Ensure avatars upload directory exists
const uploadsDir = path.join(__dirname, '..', 'uploads', 'avatars');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const safeName = path.basename(file.originalname).replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${timestamp}-${safeName}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// POST /user/avatar
router.post('/avatar', verifyToken, upload.single('avatar'), (req, res) => {
  const userId = req.userId;
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

  const { originalname, filename, mimetype, size } = req.file;
  const filePath = `/uploads/avatars/${filename}`;

  // Start by marking existing avatars as not current
  const updateSql = 'UPDATE user_avatars SET is_current = 0 WHERE user_id = ?';
  db.query(updateSql, [userId], (uErr) => {
    if (uErr) {
      console.error('Failed to update existing avatars:', uErr);
      // continue anyway
    }

    const insertSql = `INSERT INTO user_avatars (user_id, original_name, stored_name, file_path, mime_type, file_size, is_current, uploaded_at)
      VALUES (?, ?, ?, ?, ?, ?, 1, NOW())`;
    db.query(insertSql, [userId, originalname, filename, filePath, mimetype, size], (iErr, result) => {
      if (iErr) {
        console.error('Failed to insert avatar record:', iErr);
        return res.status(500).json({ message: 'Failed to save avatar metadata' });
      }

      return res.json({
        message: 'Avatar uploaded',
        avatar: {
          avatar_id: result.insertId,
          user_id: userId,
          original_name: originalname,
          stored_name: filename,
          file_path: filePath,
          mime_type: mimetype,
          file_size: size,
          is_current: 1,
        },
      });
    });
  });
});

// GET /user/:userId/avatar - return current avatar for a user
router.get('/:userId/avatar', (req, res) => {
  const userId = req.params.userId;
  const sql = 'SELECT file_path, stored_name, original_name, mime_type, file_size, uploaded_at FROM user_avatars WHERE user_id = ? AND is_current = 1 ORDER BY uploaded_at DESC LIMIT 1';
  db.query(sql, [userId], (err, results) => {
    if (err) {
      console.error('Error fetching avatar:', err);
      return res.status(500).json({ message: 'Database error' });
    }
    if (!results || results.length === 0) return res.json({ avatar: null });
    return res.json({ avatar: results[0] });
  });
});

// GET /user/me/avatar - return current avatar for the authenticated user
router.get('/me/avatar', verifyToken, (req, res) => {
  const userId = req.userId;
  const sql = 'SELECT file_path, stored_name, original_name, mime_type, file_size, uploaded_at FROM user_avatars WHERE user_id = ? AND is_current = 1 ORDER BY uploaded_at DESC LIMIT 1';
  db.query(sql, [userId], (err, results) => {
    if (err) {
      console.error('Error fetching avatar for current user:', err);
      return res.status(500).json({ message: 'Database error' });
    }
    if (!results || results.length === 0) return res.json({ avatar: null });
    return res.json({ avatar: results[0] });
  });
});

module.exports = router;
