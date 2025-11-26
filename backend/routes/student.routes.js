const express = require('express');
const router = express.Router();
const { verifyToken, authorizeRoles } = require('../middlewares/auth.middleware');
const StudentController = require('../controllers/student.controller');

router.get('/dashboard', verifyToken, authorizeRoles([3]), StudentController.getDashboard);
router.get('/dragdrop', verifyToken, authorizeRoles([3]), StudentController.getCompiler);
router.get('/todo', verifyToken, authorizeRoles([3]), StudentController.getTodo);
router.get('/quiz', verifyToken, authorizeRoles([3]), StudentController.getQuiz);
router.get('/archived', verifyToken, authorizeRoles([3]), StudentController.getArchived);
router.get('/setting', verifyToken, authorizeRoles([3]), StudentController.getSetting);
router.get('/active-classes', verifyToken, authorizeRoles([3]), StudentController.getActiveClasses);
router.get('/subjects', verifyToken, authorizeRoles([3]), StudentController.getSubject);
router.get('/subjects/:subjectId', verifyToken, authorizeRoles([3]), StudentController.getSubject);
router.get('/subjects/:subjectId/members', verifyToken, authorizeRoles([3]), StudentController.getClassMembers);
router.post('/join-class', verifyToken, authorizeRoles([3]), StudentController.joinClass);
router.post('/leave-class', verifyToken, authorizeRoles([3]), StudentController.leaveClass);
router.get('/announcements', verifyToken, authorizeRoles([3]), StudentController.getAnnouncements);
router.get('/activities', verifyToken, authorizeRoles([3]), StudentController.getActivities);

module.exports = router;
