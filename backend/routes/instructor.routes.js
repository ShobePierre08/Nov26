const path = require("path");
const fs = require("fs");
const multer = require("multer");
const express = require("express");
const router = express.Router();
const { verifyToken, authorizeRoles } = require("../middlewares/auth.middleware");
const InstructorController = require("../controllers/instructor.controller");

// -------------------- ANNOUNCEMENT ROUTES -------------------- //
const uploadsDir = path.join(__dirname, "..", "uploads", "announcements");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const safeName = path
      .basename(file.originalname)
      .replace(/[^a-zA-Z0-9._-]/g, "_");
    cb(null, `${timestamp}-${safeName}`);
  },
});

const allowedMimeTypes = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "video/mp4",
  "video/quicktime",
  "video/mkv",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
];

const fileFilter = (req, file, cb) => {
  if (allowedMimeTypes.includes(file.mimetype)) cb(null, true);
  else cb(new Error("Unsupported file type"), false);
};

const uploadAnnouncement = multer({
  storage,
  fileFilter,
  limits: { fileSize: 25 * 1024 * 1024, files: 6 },
});

router
  .route("/announcements")
  .post(
    verifyToken,
    authorizeRoles([2]),
    uploadAnnouncement.array("attachments", 6),
    InstructorController.createAnnouncement
  )
  .get(verifyToken, authorizeRoles([2]), InstructorController.getAnnouncements);

// Update and delete announcement routes
router
  .route("/announcements/:announcementId")
  .put(
    verifyToken,
    authorizeRoles([2]),
    uploadAnnouncement.array("attachments", 6),
    InstructorController.updateAnnouncement
  )
  .delete(verifyToken, authorizeRoles([2]), InstructorController.deleteAnnouncement);

router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ message: err.message });
  }
  if (err && err.message === "Unsupported file type") {
    return res.status(400).json({ message: err.message });
  }
  return next(err);
});

// -------------------- OTHER INSTRUCTOR ROUTES -------------------- //
router.get("/dashboard", verifyToken, authorizeRoles([2]), InstructorController.getDashboard);
router.get("/content_management", verifyToken, authorizeRoles([2]), InstructorController.getContentManagement);
router.get("/dragdropactivity", verifyToken, authorizeRoles([2]), InstructorController.getDragDropActivity);
router.get("/compiler", verifyToken, authorizeRoles([2]), InstructorController.getCompiler);

router.post("/classes", verifyToken, authorizeRoles([2]), InstructorController.createClass);
router.get("/subjects", verifyToken, authorizeRoles([2]), InstructorController.getSubject);
router.get("/subjects/:subjectId", verifyToken, authorizeRoles([2]), InstructorController.getSubject);
router.get("/subjects/:subjectId/activities", verifyToken, authorizeRoles([2]), InstructorController.getActivitiesBySubject);
router.get("/subjects/:subjectId/students", verifyToken, authorizeRoles([2]), InstructorController.getStudentsBySubject);
router.put("/subjects/:subjectId", verifyToken, authorizeRoles([2]), InstructorController.updateSubject);

router.get("/archived", verifyToken, authorizeRoles([2]), InstructorController.getArchivedSubjects);
router.put("/archive/:subjectId", verifyToken, authorizeRoles([2]), InstructorController.archiveSubject);
router.put("/restore/:subjectId", verifyToken, authorizeRoles([2]), InstructorController.restoreSubject);

module.exports = router;
