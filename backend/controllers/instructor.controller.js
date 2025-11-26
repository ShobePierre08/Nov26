
const db = require('../config/db');
const path = require("path");
const fs = require("fs");

// ---------------------------DASHBOARD-------------------- //
exports.getContentManagement = (req, res) => {
  res.send({ message: 'Instructor Content Management Access Granted!' });
};

exports.getDragDropActivity = (req, res) => {
  res.send({ message: 'Drag and Drop!' });
};

// GET /instructor/dashboard
exports.getDashboard = async (req, res) => {
  const instructorId = req.userId;

  const sql = `
    SELECT * FROM subjects 
    WHERE instructor_id = ? AND (is_archived = FALSE OR is_archived IS NULL)
  `;

  db.query(sql, [instructorId], (err, results) => {
    if (err) {
      console.error("Error fetching dashboard:", err);
      return res.status(500).json({ message: "Failed to load dashboard." });
    }

    res.json({
      message: "Welcome Instructor!",
      classes: results,
    });
  });
};

// ---------------------------FEATURES-------------------- //
exports.getCompiler = (req, res) => {
  res.send({ message: 'Welcome to the CodeLab!' });
};

exports.getActivitiesBySubject = async (req, res) => {
  const instructorId = req.userId;
  const { subjectId } = req.params;

  // Verify the subject belongs to the instructor
  const subjectSql = `SELECT * FROM subjects WHERE subject_id = ? AND instructor_id = ?`;
  db.query(subjectSql, [subjectId, instructorId], (subjectErr, subjectRows) => {
    if (subjectErr) {
      console.error("Error fetching subject:", subjectErr);
      return res.status(500).json({ message: "Failed to load activities." });
    }
    const subject = subjectRows && subjectRows[0];
    if (!subject) {
      return res.status(404).json({ message: "Subject not found or access denied." });
    }

    // Only fetch activities for subjects owned by this instructor
    const activitiesSql = `SELECT * FROM activities WHERE subject_id = ?`;
    db.query(activitiesSql, [subjectId], (activitiesErr, activitiesRows) => {
      if (activitiesErr) {
        console.error("Error fetching activities:", activitiesErr);
        return res.status(500).json({ message: "Failed to load activities." });
      }

      return res.json({
        subject,
        activities: activitiesRows || [],
        readOnly: !!subject.is_archived,
      });
    });
  });
};

// ---------------------------SUBJECTS-------------------- //
// POST /instructor/create-class
exports.createClass = async (req, res) => {
  try {
    const { title, description } = req.body;
    const instructorId = req.userId;

    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }

    // generate class code (10 chars A-Z0-9 to match schema length)
    const generateClassCode = (length = 10) => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let code = '';
      for (let i = 0; i < length; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
      }
      return code;
    };

    let class_code = generateClassCode();

    // ensure uniqueness (retry a few times)
    const insertSubject = () =>
      new Promise((resolve, reject) => {
        const sql =
          'INSERT INTO subjects (instructor_id, title, description, class_code) VALUES (?, ?, ?, ?)';
        db.query(sql, [instructorId, title, description || null, class_code], (err, result) => {
          if (err) return reject(err);
          resolve(result);
        });
      });

    let attempts = 0;
    while (attempts < 5) {
      try {
        const result = await insertSubject();
        // Fetch the created row to include all attributes including created_at
        const fetchSql = 'SELECT subject_id, instructor_id, title, description, class_code, created_at FROM subjects WHERE subject_id = ?';
        db.query(fetchSql, [result.insertId], (fetchErr, rows) => {
          if (fetchErr) {
            return res.status(201).json({
              message: 'Subject created',
              subject_id: result.insertId,
              instructor_id: instructorId,
              title,
              description: description || null,
              class_code,
            });
          }
          const subject = rows && rows[0] ? rows[0] : {
            subject_id: result.insertId,
            instructor_id: instructorId,
            title,
            description: description || null,
            class_code,
          };
          return res.status(201).json({ message: 'Subject created', subject });
        });
        return;
      } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          class_code = generateClassCode();
          attempts++;
          continue;
        }
        return res.status(500).json({ message: 'Database error', error: err });
      }
    }

    return res.status(500).json({ message: 'Failed to generate unique class code' });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error });
  }
};

// GET /instructor/subject/:subjectId or /instructor/subject?class_code=XXX
exports.getSubject = async (req, res) => {
  try {
    const instructorId = req.userId;
    const { subjectId } = req.params;
    const { class_code } = req.query;

    let sql;
    let params;

    if (subjectId) {
      sql = 'SELECT * FROM subjects WHERE subject_id = ? AND instructor_id = ?';
      params = [subjectId, instructorId];
    } else if (class_code) {
      sql = 'SELECT * FROM subjects WHERE class_code = ? AND instructor_id = ?';
      params = [class_code, instructorId];
    } else {
      return res.status(400).json({ message: 'Subject ID or class_code is required' });
    }

    db.query(sql, params, (err, results) => {
      if (err) {
        return res.status(500).json({ message: 'Database error', error: err });
      }
      
      if (results.length === 0) {
        return res.status(404).json({ message: 'Subject not found' });
      }

      // Also include instructor's active and archived subjects (as in getSubjects)
      const activeSql = 'SELECT * FROM subjects WHERE instructor_id = ? AND is_archived = FALSE';
      const archivedSql = 'SELECT * FROM subjects WHERE instructor_id = ? AND is_archived = TRUE';

      db.query(activeSql, [instructorId], (activeErr, activeResults) => {
        if (activeErr) {
          return res.status(500).json({ message: 'Database error', error: activeErr });
        }
        db.query(archivedSql, [instructorId], (archivedErr, archivedResults) => {
          if (archivedErr) {
            return res.status(500).json({ message: 'Database error', error: archivedErr });
          }

          return res.json({
            message: 'Subject retrieved successfully',
            subject: results[0],
            active: activeResults,
            archived: archivedResults,
          });
        });
      });
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error });
  }
};

// PUT /instructor/subject/:subjectId
exports.updateSubject = async (req, res) => {
  try {
    const instructorId = req.userId;
    const { subjectId } = req.params;
    const { title, description } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }

    // First verify the subject exists and belongs to the instructor
    const checkSql = 'SELECT * FROM subjects WHERE subject_id = ? AND instructor_id = ?';
    db.query(checkSql, [subjectId, instructorId], (checkErr, checkResults) => {
      if (checkErr) {
        return res.status(500).json({ message: 'Database error', error: checkErr });
      }

      if (checkResults.length === 0) {
        return res.status(404).json({ message: 'Subject not found or access denied' });
      }

      // Update the subject
      const updateSql = 'UPDATE subjects SET title = ?, description = ? WHERE subject_id = ? AND instructor_id = ?';
      db.query(updateSql, [title, description || null, subjectId, instructorId], (updateErr, updateResults) => {
        if (updateErr) {
          return res.status(500).json({ message: 'Database error', error: updateErr });
        }

        // Fetch the updated subject
        const fetchSql = 'SELECT * FROM subjects WHERE subject_id = ?';
        db.query(fetchSql, [subjectId], (fetchErr, fetchResults) => {
          if (fetchErr) {
            return res.status(500).json({ message: 'Database error', error: fetchErr });
          }

          return res.json({
            message: 'Subject updated successfully',
            subject: fetchResults[0],
          });
        });
      });
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error });
  }
};

// * ---------------------------ARCHIVED-------------------- *//
// ✅ Archive a subject
exports.archiveSubject = async (req, res) => {
  const instructorId = req.userId;
  const { subjectId } = req.params;

  if (!subjectId) {
    return res.status(400).json({ message: "Subject ID is required." });
  }

  const sql = `
    UPDATE subjects 
    SET is_archived = TRUE 
    WHERE subject_id = ? AND instructor_id = ?
  `;

  db.query(sql, [subjectId, instructorId], (err, result) => {
    if (err) {
      console.error("❌ Error archiving subject:", err);
      return res.status(500).json({ message: "Database error while archiving subject." });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Subject not found or unauthorized." });
    }

    res.json({ message: "✅ Subject archived successfully." });
  });
};

// ✅ Restore an archived subject
exports.restoreSubject = async (req, res) => {
  const instructorId = req.userId;
  const { subjectId } = req.params;

  if (!subjectId) {
    return res.status(400).json({ message: "Subject ID is required." });
  }

  const sql = `
    UPDATE subjects 
    SET is_archived = FALSE 
    WHERE subject_id = ? AND instructor_id = ?
  `;

  db.query(sql, [subjectId, instructorId], (err, result) => {
    if (err) {
      console.error("❌ Error restoring subject:", err);
      return res.status(500).json({ message: "Database error while restoring subject." });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Subject not found or unauthorized." });
    }

    res.json({ message: "✅ Subject restored successfully." });
  });
};

// ✅ Get all archived subjects for this instructor
exports.getArchivedSubjects = async (req, res) => {
  const instructorId = req.userId;

  const sql = `
    SELECT subject_id, title, description, class_code, created_at
    FROM subjects
    WHERE instructor_id = ? AND is_archived = TRUE
    ORDER BY created_at DESC
  `;

  db.query(sql, [instructorId], (err, results) => {
    if (err) {
      console.error("❌ Error fetching archived subjects:", err);
      return res.status(500).json({ message: "Database error." });
    }

    res.json({
      message: "✅ Archived subjects retrieved successfully.",
      count: results.length,
      archived: results,
    });
  });
};

// ---------------------------CLASS PEOPLE/STUDENTS-------------------- //
// GET /instructor/subjects/:subjectId/students
// Fetch all students (role_id = 3) enrolled in a specific class
exports.getStudentsBySubject = async (req, res) => {
  try {
    const instructorId = req.userId;
    const { subjectId } = req.params;

    if (!subjectId) {
      return res.status(400).json({ message: "Subject ID is required." });
    }

    // Verify the subject belongs to the instructor
    const subjectSql = `SELECT subject_id FROM subjects WHERE subject_id = ? AND instructor_id = ?`;
    db.query(subjectSql, [subjectId, instructorId], (subjectErr, subjectRows) => {
      if (subjectErr) {
        console.error("Error verifying subject:", subjectErr);
        return res.status(500).json({ message: "Database error." });
      }

      if (subjectRows.length === 0) {
        return res.status(404).json({ message: "Subject not found or access denied." });
      }

      // Fetch all students (role_id = 3) enrolled in this subject
      const studentsSql = `
        SELECT u.user_id, u.username, u.email, u.role_id, ss.joined_at
        FROM users u
        INNER JOIN student_subjects ss ON u.user_id = ss.student_id
        WHERE u.role_id = 3 AND ss.subject_id = ?
        ORDER BY ss.joined_at DESC
      `;

      db.query(studentsSql, [subjectId], (studentsErr, studentsRows) => {
        if (studentsErr) {
          console.error("Error fetching students:", studentsErr);
          return res.status(500).json({ message: "Failed to fetch students." });
        }

        res.json({
          message: "Students retrieved successfully.",
          count: studentsRows.length,
          students: studentsRows || [],
        });
      });
    });
  } catch (error) {
    console.error("getStudentsBySubject error:", error);
    return res.status(500).json({ message: "Server error.", error });
  }
};

// ---------------------------ANNOUNCEMENT-------------------- //
/**
 * helper to wrap mysql2 callback API in a promise
 */
const runQuery = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.query(sql, params, (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });

/**
 * POST /instructor/announcement
 * Expects:
 *   - subject_id  (body)
 *   - content     (body)
 *   - attachments (req.files handled by multer)
 */
exports.createAnnouncement = async (req, res) => {
  try {
    const instructorId = req.userId; // set by auth middleware
    const { subject_id, content } = req.body;
    const files = req.files || [];

    console.log("=== CREATE ANNOUNCEMENT ===");
    console.log("Instructor ID:", instructorId);
    console.log("Subject ID:", subject_id);
    console.log("Content length:", content?.length);
    console.log("Files received:", files.length);
    if (files.length > 0) {
      console.log("File details:", files.map(f => ({
        originalname: f.originalname,
        filename: f.filename,
        mimetype: f.mimetype,
        size: f.size
      })));
    }

    if (!subject_id || !content) {
      return res.status(400).json({ message: "Subject ID and content are required." });
    }

    // make sure the subject belongs to the instructor
    const subjectRows = await runQuery(
      "SELECT subject_id FROM subjects WHERE subject_id = ? AND instructor_id = ?",
      [subject_id, instructorId]
    );
    if (subjectRows.length === 0) {
      return res.status(404).json({ message: "Subject not found or access denied." });
    }

    // create the announcement record
    const insertResult = await runQuery(
      "INSERT INTO announcements (subject_id, instructor_id, content) VALUES (?, ?, ?)",
      [subject_id, instructorId, content]
    );
    const announcementId = insertResult[0]?.insertId || insertResult.insertId;
    
    console.log("Announcement created with ID:", announcementId);

    if (!announcementId) {
      return res.status(500).json({ message: "Failed to create announcement." });
    }

    // persist any uploaded attachments
    if (files.length) {
      console.log("Uploading files:", files.map(f => f.originalname));
      await Promise.all(
        files.map((file) =>
          runQuery(
            `INSERT INTO Posting_teacher 
               (announcement_id, asset_type, original_name, stored_name, file_path, mime_type, file_size)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              announcementId,
              file.mimetype.startsWith("image/") || file.mimetype.startsWith("video/")
                ? "PHOTO_VIDEO"
                : "FILE",
              file.originalname,
              file.filename, // whatever multer saved as
              path.join("uploads", "announcements", file.filename).replace(/\\/g, "/"),
              file.mimetype,
              file.size,
            ]
          )
        )
      );
      console.log("Files uploaded successfully");
    }

    // return the newly created announcement + attachments
    const announcementResult = await runQuery(
      `SELECT a.*, u.username AS instructor_name
         FROM announcements a
         LEFT JOIN users u ON a.instructor_id = u.user_id
        WHERE a.announcement_id = ?`,
      [announcementId]
    );
    
    const announcement = announcementResult?.[0] || null;
    
    if (!announcement) {
      console.error("Announcement not found after creation:", announcementId);
      return res.status(500).json({ message: "Failed to retrieve created announcement." });
    }

    const attachmentResults = await runQuery(
      `SELECT posting_id AS attachment_id, announcement_id, asset_type, original_name AS file_name,
              stored_name, file_path, mime_type, file_size, uploaded_at
         FROM Posting_teacher
        WHERE announcement_id = ?`,
      [announcementId]
    );
    
    const attachments = attachmentResults || [];

    console.log("Final response:", { announcementId, attachmentCount: attachments.length });

    console.log("Announcement response:", { announcement, attachmentsCount: attachments.length });

    return res.status(201).json({
      message: "Announcement created successfully.",
      announcement: {
        ...announcement,
        attachments,
      },
    });
  } catch (error) {
    console.error("createAnnouncement error:", error);
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ message: "File exceeds size limit." });
    }
    if (error.message === "Unsupported file type") {
      return res.status(400).json({ message: error.message });
    }
    return res.status(500).json({ message: "Server error.", error });
  }
};

/**
 * GET /instructor/announcements?subject_id=123
 */
exports.getAnnouncements = async (req, res) => {
  try {
    const instructorId = req.userId;
    const { subject_id } = req.query;

    if (!subject_id) {
      return res.status(400).json({ message: "Subject ID is required." });
    }

    const subjectRows = await runQuery(
      "SELECT subject_id FROM subjects WHERE subject_id = ? AND instructor_id = ?",
      [subject_id, instructorId]
    );
    if (subjectRows.length === 0) {
      return res.status(404).json({ message: "Subject not found or access denied." });
    }

    const announcements = await runQuery(
      `SELECT a.*, u.username AS instructor_name
         FROM announcements a
         LEFT JOIN users u ON a.instructor_id = u.user_id
        WHERE a.subject_id = ?
        ORDER BY a.created_at DESC`,
      [subject_id]
    );

    if (!announcements.length) {
      return res.json({ message: "No announcements found.", announcements: [] });
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

    return res.json({
      message: "Announcements retrieved successfully.",
      announcements: payload,
    });
  } catch (error) {
    console.error("getAnnouncements error:", error);
    return res.status(500).json({ message: "Server error.", error });
  }
};

/**
 * PUT /instructor/announcements/:announcementId
 * Update announcement content
 */
exports.updateAnnouncement = async (req, res) => {
  try {
    const instructorId = req.userId;
    const { announcementId } = req.params;
    const { content, keepAttachmentIds } = req.body;
    const files = req.files || [];

    console.log("=== UPDATE ANNOUNCEMENT ===");
    console.log("Announcement ID:", announcementId);
    console.log("Instructor ID:", instructorId);
    console.log("Content length:", content?.length);
    console.log("Files received:", files.length);
    console.log("Keep attachment IDs:", keepAttachmentIds);

    if (!content) {
      return res.status(400).json({ message: "Content is required." });
    }

    // Verify the announcement belongs to this instructor
    const announcementRows = await runQuery(
      "SELECT announcement_id FROM announcements WHERE announcement_id = ? AND instructor_id = ?",
      [announcementId, instructorId]
    );

    if (announcementRows.length === 0) {
      return res.status(404).json({ message: "Announcement not found or access denied." });
    }

    // Update the announcement
    await runQuery(
      "UPDATE announcements SET content = ? WHERE announcement_id = ?",
      [content, announcementId]
    );

    // Delete attachments that were removed (those not in keepAttachmentIds)
    const attachmentIdsToKeep = keepAttachmentIds ? keepAttachmentIds.split(",").map(id => parseInt(id, 10)).filter(id => !isNaN(id)) : [];

    if (attachmentIdsToKeep.length === 0) {
      // Delete all existing attachments
      console.log("Deleting all existing attachments");
      await runQuery(
        "DELETE FROM Posting_teacher WHERE announcement_id = ?",
        [announcementId]
      );
    } else {
      // Delete only the attachments not in the keep list
      console.log("Keeping attachment IDs:", attachmentIdsToKeep);
      const placeholders = attachmentIdsToKeep.map(() => "?").join(",");
      await runQuery(
        `DELETE FROM Posting_teacher WHERE announcement_id = ? AND posting_id NOT IN (${placeholders})`,
        [announcementId, ...attachmentIdsToKeep]
      );
    }

    // Handle new attachments if provided
    if (files.length > 0) {
      console.log("Uploading new files:", files.map(f => f.originalname));
      await Promise.all(
        files.map((file) =>
          runQuery(
            `INSERT INTO Posting_teacher 
             (announcement_id, asset_type, original_name, stored_name, file_path, mime_type, file_size)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              announcementId,
              file.mimetype.startsWith("image/") || file.mimetype.startsWith("video/")
                ? "PHOTO_VIDEO"
                : "FILE",
              file.originalname,
              file.filename,
              path.join("uploads", "announcements", file.filename).replace(/\\/g, "/"),
              file.mimetype,
              file.size,
            ]
          )
        )
      );
      console.log("Files uploaded successfully");
    }

    // Fetch and return updated announcement
    const updated = await runQuery(
      `SELECT a.*, u.username AS instructor_name
         FROM announcements a
         LEFT JOIN users u ON a.instructor_id = u.user_id
        WHERE a.announcement_id = ?`,
      [announcementId]
    );

    if (!updated || updated.length === 0) {
      return res.status(404).json({ message: "Announcement not found." });
    }

    const attachments = await runQuery(
      `SELECT posting_id AS attachment_id, announcement_id, asset_type, original_name AS file_name,
              stored_name, file_path, mime_type, file_size, uploaded_at
         FROM Posting_teacher
        WHERE announcement_id = ?`,
      [announcementId]
    );

    console.log("Update response:", { announcementId, attachmentCount: attachments.length });

    return res.json({
      message: "Announcement updated successfully.",
      announcement: {
        ...updated[0],
        attachments: attachments || [],
      },
    });
  } catch (error) {
    console.error("updateAnnouncement error:", error);
    return res.status(500).json({ message: "Server error.", error: error.message });
  }
};

/**
 * DELETE /instructor/announcements/:announcementId
 * Delete an announcement and its attachments
 */
exports.deleteAnnouncement = async (req, res) => {
  try {
    const instructorId = req.userId;
    const { announcementId } = req.params;

    // Verify the announcement belongs to this instructor
    const announcementRows = await runQuery(
      "SELECT announcement_id FROM announcements WHERE announcement_id = ? AND instructor_id = ?",
      [announcementId, instructorId]
    );

    if (announcementRows.length === 0) {
      return res.status(404).json({ message: "Announcement not found or access denied." });
    }

    // Get attachment file paths for deletion
    const attachments = await runQuery(
      `SELECT file_path FROM Posting_teacher WHERE announcement_id = ?`,
      [announcementId]
    );

    // Delete from database
    await runQuery(
      "DELETE FROM Posting_teacher WHERE announcement_id = ?",
      [announcementId]
    );

    await runQuery(
      "DELETE FROM announcements WHERE announcement_id = ?",
      [announcementId]
    );

    // Delete files from disk
    attachments.forEach((attachment) => {
      const filePath = path.join(__dirname, "..", attachment.file_path);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    });

    return res.json({ message: "Announcement deleted successfully." });
  } catch (error) {
    console.error("deleteAnnouncement error:", error);
    return res.status(500).json({ message: "Server error.", error });
  }
};



