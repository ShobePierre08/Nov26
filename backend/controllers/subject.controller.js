// controllers/subjectController.js
const db = require("../config/db");

// ✅ Helper to generate class codes
function generateClassCode(length = 8) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

// ✅ Create a new subject
exports.createSubject = (req, res) => {
  const { instructor_id, title, description } = req.body;
  const class_code = generateClassCode();

  const sql = `INSERT INTO subjects (instructor_id, title, description, class_code) VALUES (?, ?, ?, ?)`;
  db.query(sql, [instructor_id, title, description, class_code], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({
      message: "Subject created successfully",
      subject_id: result.insertId,
      class_code,
    });
  });
};

// ✅ Get all subjects for an instructor
exports.getSubjectsByInstructor = (req, res) => {
  const { instructor_id } = req.params;

  const sql = `SELECT * FROM subjects WHERE instructor_id = ?`;
  db.query(sql, [instructor_id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};

// ✅ Get subject details by class code (for joining)
exports.getSubjectByCode = (req, res) => {
  const { class_code } = req.params;

  const sql = `SELECT * FROM subjects WHERE class_code = ?`;
  db.query(sql, [class_code], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) return res.status(404).json({ error: "Class not found" });
    res.json(results[0]);
  });
};

// ✅ Delete a subject
exports.deleteSubject = (req, res) => {
  const { subject_id } = req.params;

  db.query(`DELETE FROM subjects WHERE subject_id = ?`, [subject_id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Subject deleted successfully" });
  });
};
