const axios = require('axios');

exports.getDashboard = (req, res) => {
  res.send({ message: 'Welcome to Dashboard!' });
};

exports.getCompiler = async (req, res) => {
  const { language, code, stdin } = req.body;

  if (!language || !code) {
    return res.status(400).json({ error: "Language and code are required." });
  }

  try {
    const response = await axios.post("https://emkc.org/api/v2/piston/execute", {
      language,
      version: "*",
      files: [{ name: "main." + language, content: code }],
      stdin: stdin || "",
    });

    res.json({
      message: "Execution successful",
      output: response.data.run.output,
      status: response.data.run.code,
    });
  } catch (error) {
    console.error("Piston API Error:", error.response?.data || error.message);
    res.status(500).json({
      error: "Code execution failed",
      details: error.response?.data || error.message,
    });
  }
};

exports.getDragDropActivity = (req, res) => {
  res.send({ message: 'Drag and Drop!' });
};

exports.getTodo = (req, res) => {
  const db = require('../config/db');
  const studentId = req.userId;

  // Query activities for subjects the student is enrolled in
  // Exclude activities where the student already has a submission (they've already submitted)
  const sql = `
    SELECT a.*, s.title AS subject_title, s.subject_id
    FROM activities a
    JOIN subjects s ON a.subject_id = s.subject_id
    JOIN student_subjects ss ON ss.subject_id = s.subject_id
    LEFT JOIN activity_submissions sub ON sub.activity_id = a.activity_id AND sub.student_id = ?
    WHERE ss.student_id = ? AND sub.submission_id IS NULL
    ORDER BY a.created_at DESC
  `;

  db.query(sql, [studentId, studentId], (err, results) => {
    if (err) {
      console.error('DB error while fetching todo activities:', err);
      return res.status(500).json({ message: 'Database error' });
    }

    // parse config_json where needed
    const parsed = (results || []).map((r) => {
      let config = r.config_json;
      if (typeof config === 'string') {
        try {
          config = JSON.parse(config);
        } catch (e) {
          config = {};
        }
      }
      return { ...r, config_json: config };
    });

    return res.json({ activities: parsed });
  });
};

exports.getQuiz = (req, res) => {
  res.send({ message: 'You can now take the quiz!' });
};

exports.getArchived = (req, res) => {
  res.send({ message: 'Archived Subjects!' });
};

exports.getSetting = (req, res) => {
  res.send({ message: 'User Settings Access granted!' });
};

exports.getActiveClasses = (req, res) => {
  const db = require('../config/db');
  const studentId = req.userId;

  const sql = `
    SELECT s.subject_id, s.title, s.description, s.class_code, s.created_at, s.instructor_id, u.username as instructor_name
    FROM student_subjects ss
    JOIN subjects s ON ss.subject_id = s.subject_id
    JOIN users u ON s.instructor_id = u.user_id
    WHERE ss.student_id = ? AND s.is_archived = 0
    ORDER BY ss.joined_at DESC
  `;

  db.query(sql, [studentId], (err, results) => {
    if (err) {
      console.error('DB error while fetching active classes:', err);
      return res.status(500).json({ message: 'Database error' });
    }

    return res.json({ activeClasses: results || [] });
  });
};

exports.getSubject = (req, res) => {
  const db = require('../config/db');
  const subjectId = req.params.subjectId;
  const classCode = req.query.class_code;

  if (!subjectId && !classCode) {
    return res.status(400).json({ message: 'subjectId or class_code is required' });
  }

  let sql, params;
  if (subjectId) {
    sql = `SELECT s.*, u.username as instructor_name FROM subjects s JOIN users u ON s.instructor_id = u.user_id WHERE s.subject_id = ? LIMIT 1`;
    params = [subjectId];
  } else {
    sql = `SELECT s.*, u.username as instructor_name FROM subjects s JOIN users u ON s.instructor_id = u.user_id WHERE s.class_code = ? LIMIT 1`;
    params = [classCode];
  }

  db.query(sql, params, (err, results) => {
    if (err) {
      console.error('DB error while fetching subject:', err);
      return res.status(500).json({ message: 'Database error' });
    }

    if (!results || results.length === 0) {
      return res.status(404).json({ message: 'Subject not found' });
    }

    return res.json({ subject: results[0] });
  });
};

exports.joinClass = (req, res) => {
  const db = require('../config/db');
  const studentId = req.userId;
  const { classCode } = req.body;

  if (!classCode) {
    return res.status(400).json({ message: 'classCode is required' });
  }

  // Find subject by class_code
  const findSql = 'SELECT * FROM subjects WHERE class_code = ? LIMIT 1';
  db.query(findSql, [classCode], (err, results) => {
    if (err) {
      console.error('DB error while finding subject:', err);
      return res.status(500).json({ message: 'Database error' });
    }

    if (!results || results.length === 0) {
      return res.status(404).json({ message: 'Class not found' });
    }

    const subject = results[0];

    // Check if student already joined
    const checkSql = 'SELECT * FROM student_subjects WHERE student_id = ? AND subject_id = ? LIMIT 1';
    db.query(checkSql, [studentId, subject.subject_id], (err2, rows2) => {
      if (err2) {
        console.error('DB error while checking student_subjects:', err2);
        return res.status(500).json({ message: 'Database error' });
      }

      if (rows2 && rows2.length > 0) {
        // already joined
        return res.json({ message: 'Already joined', subject });
      }

      // Insert into student_subjects
      const insertSql = 'INSERT INTO student_subjects (student_id, subject_id) VALUES (?, ?)';
      db.query(insertSql, [studentId, subject.subject_id], (err3, insertRes) => {
        if (err3) {
          console.error('DB error while inserting student_subjects:', err3);
          return res.status(500).json({ message: 'Database error' });
        }

        return res.json({ message: 'Joined class successfully', subject });
      });
    });
  });
};

exports.leaveClass = (req, res) => {
  const db = require('../config/db');
  const studentId = req.userId;
  const { subjectId } = req.body;

  if (!subjectId) {
    return res.status(400).json({ message: 'subjectId is required' });
  }

  const checkSql = 'SELECT * FROM student_subjects WHERE student_id = ? AND subject_id = ? LIMIT 1';
  db.query(checkSql, [studentId, subjectId], (err, rows) => {
    if (err) {
      console.error('DB error while checking enrollment:', err);
      return res.status(500).json({ message: 'Database error' });
    }

    if (!rows || rows.length === 0) {
      return res.status(404).json({ message: 'Enrollment not found' });
    }

    const deleteSql = 'DELETE FROM student_subjects WHERE student_id = ? AND subject_id = ?';
    db.query(deleteSql, [studentId, subjectId], (err2, delRes) => {
      if (err2) {
        console.error('DB error while deleting enrollment:', err2);
        return res.status(500).json({ message: 'Database error' });
      }

      return res.json({ message: 'Unenrolled successfully' });
    });
  });
};

exports.getAnnouncements = (req, res) => {
  const db = require('../config/db');
  const studentId = req.userId;
  const subjectId = req.query.subject_id;

  if (!subjectId) {
    return res.status(400).json({ message: 'subject_id is required' });
  }

  // verify student is enrolled in subject
  const checkSql = 'SELECT * FROM student_subjects WHERE student_id = ? AND subject_id = ? LIMIT 1';
  db.query(checkSql, [studentId, subjectId], async (err, rows) => {
    if (err) {
      console.error('DB error while checking enrollment for announcements:', err);
      return res.status(500).json({ message: 'Database error' });
    }

    if (!rows || rows.length === 0) {
      return res.status(403).json({ message: 'Access denied or not enrolled in this class' });
    }

    try {
      // reuse the attachment logic similar to instructor controller
      const runQuery = (sql, params = []) =>
        new Promise((resolve, reject) => {
          db.query(sql, params, (e, results) => {
            if (e) return reject(e);
            resolve(results);
          });
        });

      const announcements = await runQuery(
        `SELECT a.*, u.username AS instructor_name
           FROM announcements a
           LEFT JOIN users u ON a.instructor_id = u.user_id
          WHERE a.subject_id = ?
          ORDER BY a.created_at DESC`,
        [subjectId]
      );

      if (!announcements || announcements.length === 0) {
        return res.json({ message: 'No announcements found.', announcements: [] });
      }

      const ids = announcements.map((a) => a.announcement_id);
      const attachments = await runQuery(
        `SELECT posting_id AS attachment_id, announcement_id, asset_type, original_name AS file_name,
                stored_name, file_path, mime_type, file_size, uploaded_at
           FROM Posting_teacher
          WHERE announcement_id IN (?)`,
        [ids]
      );

      const attachmentsByAnnouncement = attachments.reduce((acc, record) => {
        if (!acc[record.announcement_id]) acc[record.announcement_id] = [];
        acc[record.announcement_id].push(record);
        return acc;
      }, {});

      const payload = announcements.map((row) => ({
        ...row,
        attachments: attachmentsByAnnouncement[row.announcement_id] || [],
      }));

      return res.json({ message: 'Announcements retrieved successfully.', announcements: payload });
    } catch (error) {
      console.error('Error fetching announcements for student:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  });
};

// ✅ READ Activities for Student (read-only, filtered by subject)
exports.getActivities = (req, res) => {
  const db = require('../config/db');
  const studentId = req.userId;
  const subjectId = req.query.subject_id;

  if (!subjectId) {
    return res.status(400).json({ message: 'subject_id is required' });
  }

  // verify student is enrolled in subject
  const checkSql = 'SELECT * FROM student_subjects WHERE student_id = ? AND subject_id = ? LIMIT 1';
  db.query(checkSql, [studentId, subjectId], (err, rows) => {
    if (err) {
      console.error('DB error while checking enrollment for activities:', err);
      return res.status(500).json({ message: 'Database error' });
    }

    if (!rows || rows.length === 0) {
      return res.status(403).json({ message: 'Access denied or not enrolled in this class' });
    }

    const sql = 'SELECT * FROM activities WHERE subject_id = ? ORDER BY created_at DESC';
    db.query(sql, [subjectId], (e, results) => {
      if (e) {
        console.error('DB error while fetching activities for student:', e);
        return res.status(500).json({ message: 'Database error' });
      }

      // parse config_json if stored as string
      const parsed = (results || []).map((r) => {
        let config = r.config_json;
        if (typeof config === 'string') {
          try {
            config = JSON.parse(config);
          } catch (parseErr) {
            config = {};
          }
        }
        return { ...r, config_json: config };
      });

      return res.json(parsed);
    });
  });
};

// GET /student/class-members/:subjectId
// Fetch all students (including current user) enrolled in a specific class
exports.getClassMembers = (req, res) => {
  const db = require('../config/db');
  const studentId = req.userId;
  const { subjectId } = req.params;

  if (!subjectId) {
    return res.status(400).json({ message: "Subject ID is required." });
  }

  // Verify student is enrolled in this subject
  const verifySql = `
    SELECT ss.id FROM student_subjects ss 
    WHERE ss.student_id = ? AND ss.subject_id = ?
  `;

  db.query(verifySql, [studentId, subjectId], (verifyErr, verifyResults) => {
    if (verifyErr) {
      console.error("Error verifying enrollment:", verifyErr);
      return res.status(500).json({ message: "Database error." });
    }

    if (verifyResults.length === 0) {
      return res.status(403).json({ message: "You are not enrolled in this class." });
    }

    // Fetch all students enrolled in this subject
    const studentsSql = `
      SELECT u.user_id, u.username, u.email, u.role_id, ss.joined_at
      FROM users u
      INNER JOIN student_subjects ss ON u.user_id = ss.student_id
      WHERE u.role_id = 3 AND ss.subject_id = ?
      ORDER BY ss.joined_at DESC
    `;

    db.query(studentsSql, [subjectId], (studentsErr, studentsRows) => {
      if (studentsErr) {
        console.error("Error fetching class members:", studentsErr);
        return res.status(500).json({ message: "Failed to fetch class members." });
      }

      res.json({
        message: "Class members retrieved successfully.",
        count: studentsRows.length,
        members: studentsRows || [],
      });
    });
  });
};

