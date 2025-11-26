// GET student's own submission for an activity (with grade/feedback)
exports.getMySubmission = (req, res) => {
  try {
    const activity_id = req.params.id;
    const student_id = req.userId;
    
    console.log(`getMySubmission: activity_id=${activity_id}, student_id=${student_id}`);
    
    if (!activity_id || !student_id) {
      return res.status(400).json({ message: "Missing activity_id or student_id" });
    }
    
    const sql = `SELECT submission_id, activity_id, student_id, submission_text, submitted_at, updated_at, grade, feedback FROM activity_submissions WHERE activity_id = ? AND student_id = ? LIMIT 1`;
    
    db.query(sql, [activity_id, student_id], (err, rows) => {
      if (err) {
        console.error('Database error in getMySubmission:', err.code, err.sqlMessage || err.message);
        console.error('SQL:', sql);
        console.error('Params:', [activity_id, student_id]);
        // Gracefully return null for any DB error on submission fetch
        return res.json({ submission: null });
      }
      
      if (!rows || rows.length === 0) {
        return res.json({ submission: null });
      }

      const submission = rows[0];
      // fetch any attachments for this submission
      const attachSql = `SELECT attachment_id, submission_id, original_name, stored_name, file_path, mime_type, file_size, uploaded_at FROM activity_submission_attachments WHERE submission_id = ? ORDER BY uploaded_at DESC`;
      db.query(attachSql, [submission.submission_id], (aErr, attachments) => {
        if (aErr) {
          console.error('Failed to fetch submission attachments:', aErr);
          submission.attachments = [];
        } else if (attachments && attachments.length > 0) {
          submission.attachments = attachments.map((att) => ({
            ...att,
            url: att.file_path,
          }));
        } else {
          submission.attachments = [];
        }

        return res.json({ submission });
      });
    });
  } catch (error) {
    console.error('Error in getMySubmission:', error);
    res.json({ submission: null });
  }
};
const db = require('../config/db');
const path = require('path');
const fs = require('fs');


// ✅ CREATE Activity
exports.createActivity = (req, res) => {
  try {
    const { subject_id, activity_name, title, instructions, open_date_time, due_date_time, time_limit } = req.body;
    const instructor_id = req.userId;

    if (!subject_id || !activity_name || !title) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Store activity types and scheduling info in config_json
    const config_json = {
      activity_name,
      instructions: instructions || null,
      open_date_time,
      due_date_time,
      time_limit
    };

    // Map UI activity_name to DB `type` enum
    const typeMap = {
      'Sim Pc': 'dragdrop',
      'CodeLab': 'coding',
      'Quiz': 'quiz',
      'Experiment': 'other'
    };
    const activityType = typeMap[activity_name] || 'other';

    const sql = `INSERT INTO activities (subject_id, instructor_id, title, description, type, config_json, created_at, updated_at)
                 VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`;

    db.query(sql, [subject_id, instructor_id, title, activity_name, activityType, JSON.stringify(config_json)], (err, result) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ message: "Failed to create activity", error: err.message });
      }
      const activityId = result.insertId;

      // If files were uploaded via multer, save their metadata in activities_classwork
      const files = req.files || [];
      if (files.length > 0) {
        const attachSql = `INSERT INTO activities_classwork (activity_id, asset_type, original_name, stored_name, file_path, due_date_time, mime_type, file_size, uploaded_by, uploaded_at)
               VALUES ?`;
        // Use forward slashes for URLs (not path.join which adds backslashes on Windows)
        const values = files.map((f) => [activityId, 'FILE', f.originalname, f.filename, `/uploads/activity_files/${f.filename}`, due_date_time || null, f.mimetype, f.size, instructor_id || null, new Date()]);

        db.query(attachSql, [values], (aErr, aRes) => {
          if (aErr) {
            console.error('Failed to save classwork attachment metadata:', aErr);
            // return activity created, but warn about attachments
            return res.status(201).json({
              message: 'Activity created, but failed to save attachments',
              activity_id: activityId,
              activity: {
                activity_id: activityId,
                subject_id,
                instructor_id,
                title,
                description: activity_name,
                config_json,
                attachments: files.map(f => ({ original_name: f.originalname, stored_name: f.filename }))
              }
            });
          }

          // Return created activity including attachments metadata
          const attachmentsMeta = files.map((f) => ({
            original_name: f.originalname,
            stored_name: f.filename,
            file_path: `/uploads/activity_files/${f.filename}`,
            url: `/uploads/activity_files/${f.filename}`,
            mime_type: f.mimetype,
            file_size: f.size,
          }));

          return res.status(201).json({
            message: 'Activity created successfully',
            activity_id: activityId,
            activity: {
              activity_id: activityId,
              subject_id,
              instructor_id,
              title,
              description: activity_name,
              type: activityType,
              config_json,
              attachments: attachmentsMeta,
            }
          });
        });
      } else {
        // No attachments
        res.status(201).json({ 
          message: "Activity created successfully", 
          activity_id: activityId,
          activity: {
            activity_id: activityId,
            subject_id,
            instructor_id,
            title,
            description: activity_name,
            type: activityType,
            config_json
          }
        });
      }
    });
  } catch (error) {
    console.error('Error in createActivity:', error);
    res.status(500).json({ message: "Failed to create activity", error: error.message });
  }
};

// ✅ READ All Activities
exports.getActivities = (req, res) => {
  const sql = `SELECT * FROM activities`;
  db.query(sql, (err, rows) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ message: "Failed to fetch activities", error: err.message });
    }
    // Parse config_json for each row so frontend receives an object
    const parsed = (rows || []).map((r) => {
      let cfg = r.config_json;
      if (typeof cfg === 'string') {
        try {
          cfg = JSON.parse(cfg);
        } catch (e) {
          cfg = {};
        }
      }
      return { ...r, config_json: cfg };
    });
    res.json(parsed);
  });
};

// ✅ READ Activity by ID
exports.getActivityById = (req, res) => {
  const { id } = req.params;
  const sql = `SELECT * FROM activities WHERE activity_id = ?`;
  db.query(sql, [id], (err, rows) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ message: "Failed to fetch activity", error: err.message });
    }
    if (rows.length === 0) {
      return res.status(404).json({ message: "Activity not found" });
    }
    const row = rows[0];
    let cfg = row.config_json;
    if (typeof cfg === 'string') {
      try {
        cfg = JSON.parse(cfg);
      } catch (e) {
        cfg = {};
      }
    }
    row.config_json = cfg;
    res.json(row);
  });
};

// ✅ READ Attachments for an activity (from activities_classwork)
exports.getActivityAttachments = (req, res) => {
  const { id } = req.params;
  const sql = `SELECT id, activity_id, asset_type, original_name, stored_name, file_path, due_date_time, mime_type, file_size, uploaded_by, uploaded_at FROM activities_classwork WHERE activity_id = ? ORDER BY uploaded_at DESC`;
  db.query(sql, [id], (err, rows) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ message: "Failed to fetch attachments", error: err.message });
    }
    res.json(rows || []);
  });
};

// ✅ UPDATE Activity
exports.updateActivity = (req, res) => {
  const { id } = req.params;
  const { title, description } = req.body;
  // config_json may be sent as a string or object
  let config_json = req.body.config_json || req.body.config || null;
  try {
    if (typeof config_json === 'string' && config_json.trim() !== '') {
      config_json = JSON.parse(config_json);
    }
  } catch (e) {
    // leave as string if parse fails
  }

  // Update activity metadata first
  const sql = `UPDATE activities SET title=?, description=?, config_json=?, updated_at=NOW() WHERE activity_id=?`;
  db.query(sql, [title, description, JSON.stringify(config_json), id], (err, result) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ message: "Failed to update activity", error: err.message });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Activity not found" });
    }

    // Now handle attachments: remove those not kept, insert newly uploaded files
    const keepIdsRaw = req.body.keepAttachmentIds || req.body.keep_attachments || '';
    const keepIds = keepIdsRaw ? keepIdsRaw.split(',').map((s) => s.trim()).filter(Boolean) : [];
    const files = req.files || [];

    const uploadDir = path.join(__dirname, '..', 'uploads', 'activity_files');

    const processAttachments = async () => {
      try {
        // Delete attachments that are NOT in keepIds
        if (keepIds.length > 0) {
          const placeholders = keepIds.map(() => '?').join(',');
          const selSql = `SELECT id, stored_name FROM activities_classwork WHERE activity_id = ? AND id NOT IN (${placeholders})`;
          db.query(selSql, [id, ...keepIds], (sErr, rows) => {
            if (!sErr && rows && rows.length > 0) {
              rows.forEach((r) => {
                try {
                  const filePath = path.join(uploadDir, r.stored_name);
                  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
                } catch (unlinkErr) {
                  console.error('Failed to unlink file', unlinkErr);
                }
              });
            }
            const delSql = `DELETE FROM activities_classwork WHERE activity_id = ? AND id NOT IN (${placeholders})`;
            db.query(delSql, [id, ...keepIds], (dErr) => {
              if (dErr) console.error('Failed to delete old attachments', dErr);
              // Insert any newly uploaded files
              if (files.length > 0) {
                const values = files.map((f) => [id, 'FILE', f.originalname, f.filename, `/uploads/activity_files/${f.filename}`, /*due_date_time*/ null, f.mimetype, f.size, req.userId || null, new Date()]);
                const attachSql = `INSERT INTO activities_classwork (activity_id, asset_type, original_name, stored_name, file_path, due_date_time, mime_type, file_size, uploaded_by, uploaded_at) VALUES ?`;
                db.query(attachSql, [values], (aErr) => {
                  if (aErr) console.error('Failed to save new attachments', aErr);
                  // Return updated attachments list
                  const listSql = `SELECT id, activity_id, asset_type, original_name, stored_name, file_path, due_date_time, mime_type, file_size, uploaded_by, uploaded_at FROM activities_classwork WHERE activity_id = ? ORDER BY uploaded_at DESC`;
                  db.query(listSql, [id], (lErr, atts) => {
                    if (lErr) {
                      console.error('Failed to fetch attachments', lErr);
                      return res.json({ message: 'Activity updated, but failed to fetch attachments' });
                    }
                    return res.json({ message: 'Activity updated successfully', attachments: atts || [] });
                  });
                });
              } else {
                // No new files, just return updated list
                const listSql = `SELECT id, activity_id, asset_type, original_name, stored_name, file_path, due_date_time, mime_type, file_size, uploaded_by, uploaded_at FROM activities_classwork WHERE activity_id = ? ORDER BY uploaded_at DESC`;
                db.query(listSql, [id], (lErr, atts) => {
                  if (lErr) {
                    console.error('Failed to fetch attachments', lErr);
                    return res.json({ message: 'Activity updated, but failed to fetch attachments' });
                  }
                  return res.json({ message: 'Activity updated successfully', attachments: atts || [] });
                });
              }
            });
          });
        } else {
          // No keepIds: remove all existing attachments for this activity
          const selSql = `SELECT id, stored_name FROM activities_classwork WHERE activity_id = ?`;
          db.query(selSql, [id], (sErr, rows) => {
            if (!sErr && rows && rows.length > 0) {
              rows.forEach((r) => {
                try {
                  const filePath = path.join(uploadDir, r.stored_name);
                  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
                } catch (unlinkErr) {
                  console.error('Failed to unlink file', unlinkErr);
                }
              });
            }
            const delSql = `DELETE FROM activities_classwork WHERE activity_id = ?`;
            db.query(delSql, [id], (dErr) => {
              if (dErr) console.error('Failed to delete old attachments', dErr);
              // Insert new files if any
              if (files.length > 0) {
                const values = files.map((f) => [id, 'FILE', f.originalname, f.filename, `/uploads/activity_files/${f.filename}`, /*due_date_time*/ null, f.mimetype, f.size, req.userId || null, new Date()]);
                const attachSql = `INSERT INTO activities_classwork (activity_id, asset_type, original_name, stored_name, file_path, due_date_time, mime_type, file_size, uploaded_by, uploaded_at) VALUES ?`;
                db.query(attachSql, [values], (aErr) => {
                  if (aErr) console.error('Failed to save new attachments', aErr);
                  const listSql = `SELECT id, activity_id, asset_type, original_name, stored_name, file_path, due_date_time, mime_type, file_size, uploaded_by, uploaded_at FROM activities_classwork WHERE activity_id = ? ORDER BY uploaded_at DESC`;
                  db.query(listSql, [id], (lErr, atts) => {
                    if (lErr) {
                      console.error('Failed to fetch attachments', lErr);
                      return res.json({ message: 'Activity updated, but failed to fetch attachments' });
                    }
                    return res.json({ message: 'Activity updated successfully', attachments: atts || [] });
                  });
                });
              } else {
                const listSql = `SELECT id, activity_id, asset_type, original_name, stored_name, file_path, due_date_time, mime_type, file_size, uploaded_by, uploaded_at FROM activities_classwork WHERE activity_id = ? ORDER BY uploaded_at DESC`;
                db.query(listSql, [id], (lErr, atts) => {
                  if (lErr) {
                    console.error('Failed to fetch attachments', lErr);
                    return res.json({ message: 'Activity updated, but failed to fetch attachments' });
                  }
                  return res.json({ message: 'Activity updated successfully', attachments: atts || [] });
                });
              }
            });
          });
        }
      } catch (procErr) {
        console.error('Error processing attachments during activity update', procErr);
        return res.status(500).json({ message: 'Activity updated but failed processing attachments', error: procErr.message });
      }
    };

    processAttachments();
  });
};

// ✅ DELETE Activity
exports.deleteActivity = (req, res) => {
  const { id } = req.params;
  const sql = `DELETE FROM activities WHERE activity_id=?`;
  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ message: "Failed to delete activity", error: err.message });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Activity not found" });
    }
    res.json({ message: "Activity deleted successfully" });
  });
};

// ✅ SUBMIT Activity - Student submits work
exports.submitActivity = (req, res) => {
  try {
    const { id } = req.params;
    const student_id = req.userId;
    const { submission_text, checkpoint_data } = req.body;

    if (!id || !student_id) {
      return res.status(400).json({ message: "Missing activity_id or student_id" });
    }

    // First check whether the student already has a submission for this activity
    const checkSql = `SELECT submission_id FROM activity_submissions WHERE activity_id = ? AND student_id = ? LIMIT 1`;
    // Determine whether submission is late by checking activity's config_json.due_date_time
    const activitySql = `SELECT config_json FROM activities WHERE activity_id = ? LIMIT 1`;
    db.query(activitySql, [id], (aErr, aRows) => {
      if (aErr) {
        console.error('Failed to fetch activity for lateness check:', aErr);
        // fallback to insert without is_late
        db.query(submissionSql, [id, student_id, submission_text || ''], (err, result) => {
          if (err) {
            console.error('Failed to insert submission:', err);
            return res.status(500).json({ message: "Failed to submit activity", error: err.message });
          }

          const submissionId = result.insertId;
          const files = req.files || [];
          if (files.length > 0) {
            const attachSql = `INSERT INTO activity_submission_attachments (submission_id, original_name, stored_name, file_path, mime_type, file_size, uploaded_at)
                               VALUES ?`;
            const values = files.map((f) => [submissionId, f.originalname, f.filename, `/uploads/activity_files/${f.filename}`, f.mimetype, f.size, new Date()]);

            db.query(attachSql, [values], (aErr2, aRes) => {
              if (aErr2) {
                console.error('Failed to save submission attachment metadata:', aErr2);
                return res.status(201).json({
                  message: 'Submission created, but failed to save attachments',
                  submission_id: submissionId,
                  activity_id: id,
                  student_id
                });
              }

              return res.status(201).json({
                message: 'Submission submitted successfully',
                submission_id: submissionId,
                activity_id: id,
                student_id
              });
            });
          } else {
            res.status(201).json({
              message: 'Submission submitted successfully',
              submission_id: submissionId,
              activity_id: id,
              student_id
            });
          }
        });
        return;
      }

      let isLate = 0;
      try {
        const cfg = JSON.parse(aRows[0].config_json || '{}');
        if (cfg && cfg.due_date_time) {
          const due = new Date(cfg.due_date_time);
          const now = new Date();
          if (now > due) isLate = 1;
        }
      } catch (parseErr) {
        // ignore parse errors
      }

      // Now check for existing submission to support resubmission (update)
      db.query(checkSql, [id, student_id], (cErr, cRows) => {
        if (cErr) {
          console.error('Failed to check existing submission:', cErr);
          return res.status(500).json({ message: 'Failed to submit activity', error: cErr.message });
        }

        const files = req.files || [];

        if (cRows && cRows.length > 0) {
          // Update existing submission
          const existingSubmissionId = cRows[0].submission_id;
          const updateSql = `UPDATE activity_submissions SET submission_text = ?, checkpoint_data = ?, updated_at = NOW() WHERE submission_id = ?`;
          db.query(updateSql, [submission_text || '', checkpoint_data || null, existingSubmissionId], (uErr, uRes) => {
            if (uErr) {
              console.error('Failed to update submission:', uErr);
              return res.status(500).json({ message: 'Failed to submit activity', error: uErr.message });
            }

            // add any newly uploaded attachments (append to existing ones)
            if (files.length > 0) {
              const attachSql = `INSERT INTO activity_submission_attachments (submission_id, original_name, stored_name, file_path, mime_type, file_size, uploaded_at) VALUES ?`;
              const values = files.map((f) => [existingSubmissionId, f.originalname, f.filename, `/uploads/activity_files/${f.filename}`, f.mimetype, f.size, new Date()]);
              db.query(attachSql, [values], (aErr) => {
                if (aErr) {
                  console.error('Failed to save submission attachment metadata (on update):', aErr);
                  return res.status(200).json({ message: 'Submission updated, but failed to save attachments', submission_id: existingSubmissionId, activity_id: id, student_id });
                }
                return res.status(200).json({ message: 'Submission updated successfully', submission_id: existingSubmissionId, activity_id: id, student_id });
              });
            } else {
              return res.status(200).json({ message: 'Submission updated successfully', submission_id: existingSubmissionId, activity_id: id, student_id });
            }
          });
        } else {
          // Insert new submission record
          const submissionSqlWithLate = `INSERT INTO activity_submissions (activity_id, student_id, submission_text, checkpoint_data, submitted_at)
                           VALUES (?, ?, ?, ?, NOW())`;

          db.query(submissionSqlWithLate, [id, student_id, submission_text || '', checkpoint_data || null], (err, result) => {
            if (err) {
              console.error('Failed to insert submission:', err);
              return res.status(500).json({ message: 'Failed to submit activity', error: err.message });
            }

            const submissionId = result.insertId;

            // If files were uploaded via multer, save their metadata in activity_submission_attachments
            if (files.length > 0) {
              const attachSql = `INSERT INTO activity_submission_attachments (submission_id, original_name, stored_name, file_path, mime_type, file_size, uploaded_at)
                             VALUES ?`;
              const values = files.map((f) => [submissionId, f.originalname, f.filename, `/uploads/activity_files/${f.filename}`, f.mimetype, f.size, new Date()]);

              db.query(attachSql, [values], (aErr, aRes) => {
                if (aErr) {
                  console.error('Failed to save submission attachment metadata:', aErr);
                  // return submission created, but warn about attachments
                  return res.status(201).json({ message: 'Submission created, but failed to save attachments', submission_id: submissionId, activity_id: id, student_id });
                }

                return res.status(201).json({ message: 'Submission submitted successfully', submission_id: submissionId, activity_id: id, student_id });
              });
            } else {
              // No attachments
              return res.status(201).json({ message: 'Submission submitted successfully', submission_id: submissionId, activity_id: id, student_id });
            }
          });
        }
      });
    });
  } catch (error) {
    console.error('Error in submitActivity:', error);
    res.status(500).json({ message: "Failed to submit activity", error: error.message });
  }
};

// ✅ GET Submissions for an activity (Instructor view)
exports.getActivitySubmissions = (req, res) => {
  try {
    const { id } = req.params;
    const instructor_id = req.userId;

    if (!id) {
      return res.status(400).json({ message: "Missing activity_id" });
    }

    // First, verify this activity belongs to the instructor
    const verifySql = `SELECT instructor_id FROM activities WHERE activity_id = ?`;
    db.query(verifySql, [id], (vErr, vRes) => {
      if (vErr) {
        console.error('Database error:', vErr);
        return res.status(500).json({ message: "Failed to verify activity", error: vErr.message });
      }

      if (vRes.length === 0) {
        return res.status(404).json({ message: "Activity not found" });
      }

      if (vRes[0].instructor_id !== instructor_id) {
        return res.status(403).json({ message: "Unauthorized: You are not the instructor for this activity" });
      }

      // Fetch all submissions for this activity with student info
      const submissionSql = `
        SELECT 
          asu.submission_id,
          asu.activity_id,
          asu.student_id,
          asu.submission_text,
          asu.submitted_at,
          asu.updated_at,
          asu.grade,
          asu.feedback,
          u.username,
          u.email,
          COUNT(asaa.attachment_id) as attachment_count
        FROM activity_submissions asu
        LEFT JOIN users u ON asu.student_id = u.user_id
        LEFT JOIN activity_submission_attachments asaa ON asu.submission_id = asaa.submission_id
        WHERE asu.activity_id = ?
        GROUP BY asu.submission_id, asu.activity_id, asu.student_id, asu.submission_text, asu.submitted_at, asu.updated_at, asu.grade, asu.feedback, u.username, u.email
        ORDER BY asu.submitted_at DESC
      `;

      db.query(submissionSql, [id], (err, submissions) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ message: "Failed to fetch submissions", error: err.message });
        }

        // For each submission, fetch the attachments
        if (submissions.length === 0) {
          return res.json({ submissions: [] });
        }

        let processedCount = 0;
        const submissionsWithAttachments = submissions.map((sub) => ({
          submission_id: sub.submission_id,
          activity_id: sub.activity_id,
          student_id: sub.student_id,
          submission_text: sub.submission_text,
          submitted_at: sub.submitted_at,
          updated_at: sub.updated_at,
          grade: sub.grade,
          feedback: sub.feedback,
          username: sub.username,
          email: sub.email,
          attachments: []
        }));

        submissions.forEach((submission, idx) => {
          const attachmentSql = `
            SELECT attachment_id, submission_id, original_name, stored_name, file_path, mime_type, file_size, uploaded_at
            FROM activity_submission_attachments
            WHERE submission_id = ?
            ORDER BY uploaded_at DESC
          `;

          db.query(attachmentSql, [submission.submission_id], (aErr, attachments) => {
            if (!aErr && attachments.length > 0) {
              submissionsWithAttachments[idx].attachments = attachments.map((att) => ({
                ...att,
                url: att.file_path  // Return just the relative path, frontend will construct full URL
              }));
            }

            processedCount++;
            if (processedCount === submissions.length) {
              res.json({ submissions: submissionsWithAttachments });
            }
          });
        });
      });
    });
  } catch (error) {
    console.error('Error in getActivitySubmissions:', error);
    res.status(500).json({ message: "Failed to fetch submissions", error: error.message });
  }
};

// ✅ SAVE Grade for a submission (Instructor view)
exports.saveGrade = (req, res) => {
  try {
    const { submission_id } = req.params;
    const instructor_id = req.userId;
    const { grade, feedback } = req.body;

    if (!submission_id) {
      return res.status(400).json({ message: "Missing submission_id" });
    }

    if (grade === null && !feedback) {
      return res.status(400).json({ message: "Please provide either a grade or feedback" });
    }

    // First, verify this submission belongs to an activity taught by this instructor
    const verifySql = `
      SELECT a.instructor_id 
      FROM activity_submissions asu
      JOIN activities a ON asu.activity_id = a.activity_id
      WHERE asu.submission_id = ?
    `;

    db.query(verifySql, [submission_id], (vErr, vRes) => {
      if (vErr) {
        console.error('Database error:', vErr);
        return res.status(500).json({ message: "Failed to verify submission", error: vErr.message });
      }

      if (vRes.length === 0) {
        return res.status(404).json({ message: "Submission not found" });
      }

      if (vRes[0].instructor_id !== instructor_id) {
        return res.status(403).json({ message: "Unauthorized: You are not the instructor for this submission" });
      }

      // Update the submission with grade and feedback
      const updateSql = `
        UPDATE activity_submissions 
        SET grade = ?, feedback = ?, updated_at = NOW()
        WHERE submission_id = ?
      `;

      db.query(updateSql, [grade || null, feedback || null, submission_id], (err, result) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ message: "Failed to save grade", error: err.message });
        }

        if (result.affectedRows === 0) {
          return res.status(404).json({ message: "Submission not found" });
        }

        res.json({ message: "Grade saved successfully", submission_id, grade, feedback });
      });
    });
  } catch (error) {
    console.error('Error in saveGrade:', error);
    res.status(500).json({ message: "Failed to save grade", error: error.message });
  }
};

// ✅ SAVE Checkpoint for an activity (DragDrop game progress)
exports.saveCheckpoint = (req, res) => {
  try {
    const { id } = req.params;
    const student_id = req.userId;
    const { component, progress, isCompleted, checkpointData } = req.body;

    if (!id || !student_id) {
      return res.status(400).json({ message: "Missing activity_id or student_id" });
    }

    // First check whether the student already has a submission for this activity
    const checkSql = `SELECT submission_id FROM activity_submissions WHERE activity_id = ? AND student_id = ? LIMIT 1`;
    
    db.query(checkSql, [id, student_id], (cErr, cRows) => {
      if (cErr) {
        console.error('Failed to check existing submission:', cErr);
        return res.status(500).json({ message: 'Failed to save checkpoint', error: cErr.message });
      }

      if (cRows && cRows.length > 0) {
        // Update existing submission with checkpoint data
        const existingSubmissionId = cRows[0].submission_id;
        const updateSql = `UPDATE activity_submissions SET checkpoint_data = ?, updated_at = NOW() WHERE submission_id = ?`;
        
        db.query(updateSql, [checkpointData, existingSubmissionId], (uErr, uRes) => {
          if (uErr) {
            console.error('Failed to update checkpoint:', uErr);
            return res.status(500).json({ message: 'Failed to save checkpoint', error: uErr.message });
          }
          return res.status(200).json({ message: 'Checkpoint saved successfully', component, progress, isCompleted });
        });
      } else {
        // Insert new submission record with checkpoint data
        const submissionSql = `INSERT INTO activity_submissions (activity_id, student_id, checkpoint_data, submitted_at)
                             VALUES (?, ?, ?, NOW())`;

        db.query(submissionSql, [id, student_id, checkpointData], (err, result) => {
          if (err) {
            console.error('Failed to insert submission with checkpoint:', err);
            return res.status(500).json({ message: 'Failed to save checkpoint', error: err.message });
          }

          const submissionId = result.insertId;
          return res.status(201).json({ 
            message: 'Checkpoint saved successfully', 
            submission_id: submissionId,
            component, 
            progress, 
            isCompleted 
          });
        });
      }
    });
  } catch (error) {
    console.error('Error in saveCheckpoint:', error);
    res.status(500).json({ message: "Failed to save checkpoint", error: error.message });
  }
};

