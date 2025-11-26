-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Nov 26, 2025 at 07:55 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `lms_system`
--

-- --------------------------------------------------------

--
-- Table structure for table `activities`
--

CREATE TABLE `activities` (
  `activity_id` int(11) NOT NULL,
  `subject_id` int(11) DEFAULT NULL,
  `instructor_id` int(11) DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `type` enum('dragdrop','quiz','coding','other') NOT NULL DEFAULT 'dragdrop',
  `config_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`config_json`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `activities`
--

INSERT INTO `activities` (`activity_id`, `subject_id`, `instructor_id`, `title`, `description`, `type`, `config_json`, `created_at`, `updated_at`) VALUES
(1, 10, 1, 'Build PC', 'Sim Pc', 'dragdrop', '{\"activity_name\":\"Sim Pc\",\"instructions\":\"Build PC\",\"open_date_time\":\"2025-11-25T18:49:00.000Z\",\"due_date_time\":\"2025-11-26T18:49:00.000Z\",\"time_limit\":\"2 hours\"}', '2025-11-25 18:49:38', '2025-11-25 18:49:38'),
(2, 10, 1, 'Code CHUM', 'CodeLab', 'coding', '{\"activity_name\":\"CodeLab\",\"instructions\":\"ad\",\"open_date_time\":\"2025-11-25T19:18:00.000Z\",\"due_date_time\":\"2025-11-26T19:18:00.000Z\",\"time_limit\":\"1 hour\"}', '2025-11-25 19:18:13', '2025-11-25 19:18:13'),
(5, 10, 1, 'Testing', 'Experiment', 'other', '{\"activity_name\":\"Experiment\",\"instructions\":\"sss\",\"open_date_time\":\"2025-11-25T19:45:00.000Z\",\"due_date_time\":\"2025-11-26T19:45:00.000Z\",\"time_limit\":\"2 hours\"}', '2025-11-25 19:47:49', '2025-11-25 19:47:49'),
(12, 15, 1, '123', 'Quiz', 'quiz', '{\"activity_name\":\"Quiz\",\"instructions\":\"123\",\"open_date_time\":\"2025-11-26T18:51:00.000Z\",\"due_date_time\":\"2025-11-27T18:51:00.000Z\",\"time_limit\":\"1 hour\"}', '2025-11-26 18:51:48', '2025-11-26 18:51:48'),
(13, 15, 1, '321', 'Sim Pc', 'dragdrop', '{\"activity_name\":\"Sim Pc\",\"instructions\":\"321\",\"open_date_time\":\"2025-11-26T18:51:00.000Z\",\"due_date_time\":\"2025-11-27T18:52:00.000Z\",\"time_limit\":\"2 hours\"}', '2025-11-26 18:52:10', '2025-11-26 18:52:10');

-- --------------------------------------------------------

--
-- Table structure for table `activities_classwork`
--

CREATE TABLE `activities_classwork` (
  `id` int(11) NOT NULL,
  `activity_id` int(11) NOT NULL,
  `asset_type` enum('PHOTO_VIDEO','FILE') NOT NULL DEFAULT 'FILE',
  `original_name` varchar(255) NOT NULL,
  `stored_name` varchar(255) NOT NULL,
  `file_path` varchar(255) NOT NULL,
  `due_date_time` datetime DEFAULT NULL,
  `mime_type` varchar(100) DEFAULT NULL,
  `file_size` bigint(20) UNSIGNED DEFAULT 0,
  `uploaded_by` int(11) DEFAULT NULL,
  `uploaded_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `activities_classwork`
--

INSERT INTO `activities_classwork` (`id`, `activity_id`, `asset_type`, `original_name`, `stored_name`, `file_path`, `due_date_time`, `mime_type`, `file_size`, `uploaded_by`, `uploaded_at`) VALUES
(1, 5, 'FILE', 'IAAS2_Midterm Activity No 1.docx', '1764100069038-131108225-IAAS2_Midterm Activity No 1.docx', '/uploads/activity_files/1764100069038-131108225-IAAS2_Midterm Activity No 1.docx', '2025-11-26 19:45:00', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 337604, 1, '2025-11-26 03:47:49');

-- --------------------------------------------------------

--
-- Table structure for table `activity_items`
--

CREATE TABLE `activity_items` (
  `item_id` int(11) NOT NULL,
  `activity_id` int(11) NOT NULL,
  `question_text` text DEFAULT NULL,
  `answer_key` text DEFAULT NULL,
  `points` decimal(5,2) DEFAULT 1.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `activity_submissions`
--

CREATE TABLE `activity_submissions` (
  `submission_id` int(11) NOT NULL,
  `activity_id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `submission_text` longtext DEFAULT NULL,
  `grade` decimal(5,2) DEFAULT NULL,
  `feedback` text DEFAULT NULL,
  `checkpoint_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`checkpoint_data`)),
  `submitted_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `activity_submissions`
--

INSERT INTO `activity_submissions` (`submission_id`, `activity_id`, `student_id`, `submission_text`, `grade`, `feedback`, `checkpoint_data`, `submitted_at`, `updated_at`) VALUES
(1, 1, 2, 'SimPC activity completed. Time taken: 00:00:10', NULL, NULL, NULL, '2025-11-26 03:42:13', '2025-11-26 04:00:13'),
(2, 5, 2, '2121', NULL, NULL, NULL, '2025-11-26 03:48:37', '2025-11-26 03:48:37'),
(3, 2, 2, 'CodeLab activity completed. Time taken: 00:01:24\r\n\r\n--- Code Submitted ---\r\nprint(\"hello world\")\r\n\r\n--- Final Output ---\r\nhello world', NULL, NULL, NULL, '2025-11-26 04:22:25', '2025-11-26 04:22:25'),
(9, 12, 2, '321', NULL, NULL, NULL, '2025-11-27 02:52:31', '2025-11-27 02:52:31'),
(10, 13, 2, 'SimPC activity completed. Time taken: 00:00:20', NULL, NULL, '{\"cpu\":{\"completed\":true,\"progress\":100,\"timestamp\":\"2025-11-26T18:52:41.645Z\"},\"cmos\":{\"completed\":true,\"progress\":100,\"timestamp\":\"2025-11-26T18:52:53.421Z\"},\"ram\":{\"completed\":true,\"progress\":100,\"timestamp\":\"2025-11-26T18:52:47.525Z\"}}', '2025-11-27 02:52:41', '2025-11-27 02:52:56');

-- --------------------------------------------------------

--
-- Table structure for table `activity_submission_attachments`
--

CREATE TABLE `activity_submission_attachments` (
  `attachment_id` int(11) NOT NULL,
  `submission_id` int(11) NOT NULL,
  `original_name` varchar(255) DEFAULT NULL,
  `stored_name` varchar(255) DEFAULT NULL,
  `file_path` varchar(500) DEFAULT NULL,
  `mime_type` varchar(100) DEFAULT NULL,
  `file_size` int(11) DEFAULT NULL,
  `uploaded_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `activity_submission_attachments`
--

INSERT INTO `activity_submission_attachments` (`attachment_id`, `submission_id`, `original_name`, `stored_name`, `file_path`, `mime_type`, `file_size`, `uploaded_at`) VALUES
(1, 2, 'IAAS2_Midterm Activity No 1.docx', '1764100117534-194156734-IAAS2_Midterm Activity No 1.docx', '/uploads/activity_files/1764100117534-194156734-IAAS2_Midterm Activity No 1.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 337604, '2025-11-26 03:48:37'),
(5, 9, 'Untitled.png', '1764183151773-235564349-Untitled.png', '/uploads/activity_files/1764183151773-235564349-Untitled.png', 'image/png', 517297, '2025-11-27 02:52:31');

-- --------------------------------------------------------

--
-- Table structure for table `announcements`
--

CREATE TABLE `announcements` (
  `announcement_id` int(10) UNSIGNED NOT NULL,
  `subject_id` int(10) UNSIGNED NOT NULL,
  `instructor_id` int(10) UNSIGNED NOT NULL,
  `content` text NOT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `announcements`
--

INSERT INTO `announcements` (`announcement_id`, `subject_id`, `instructor_id`, `content`, `created_at`) VALUES
(1, 11, 3, 'asd', '2025-11-12 18:13:45'),
(2, 16, 5, 'Testing this is for the Announcement!!!!!', '2025-11-26 04:54:54');

-- --------------------------------------------------------

--
-- Table structure for table `files`
--

CREATE TABLE `files` (
  `file_id` int(11) NOT NULL,
  `uploaded_by` int(11) NOT NULL,
  `activity_id` int(11) DEFAULT NULL,
  `file_name` varchar(255) NOT NULL,
  `file_path` varchar(255) NOT NULL,
  `file_type` varchar(50) DEFAULT NULL,
  `uploaded_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `notification_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `message` text NOT NULL,
  `type` enum('system','activity','submission','feedback') DEFAULT 'system',
  `is_read` tinyint(1) DEFAULT 0,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `posting_teacher`
--

CREATE TABLE `posting_teacher` (
  `posting_id` int(10) UNSIGNED NOT NULL,
  `announcement_id` int(10) UNSIGNED NOT NULL,
  `asset_type` enum('PHOTO_VIDEO','FILE') NOT NULL,
  `original_name` varchar(255) NOT NULL,
  `stored_name` varchar(255) NOT NULL,
  `file_path` varchar(255) NOT NULL,
  `mime_type` varchar(100) DEFAULT NULL,
  `file_size` bigint(20) UNSIGNED DEFAULT 0,
  `uploaded_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `posting_teacher`
--

INSERT INTO `posting_teacher` (`posting_id`, `announcement_id`, `asset_type`, `original_name`, `stored_name`, `file_path`, `mime_type`, `file_size`, `uploaded_at`) VALUES
(1, 2, 'PHOTO_VIDEO', 'R.jfif', '1764104094032-R.jfif', 'uploads/announcements/1764104094032-R.jfif', 'image/jpeg', 81128, '2025-11-26 04:54:54');

-- --------------------------------------------------------

--
-- Table structure for table `roles`
--

CREATE TABLE `roles` (
  `role_id` int(11) NOT NULL,
  `role_name` varchar(50) NOT NULL,
  `description` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `roles`
--

INSERT INTO `roles` (`role_id`, `role_name`, `description`) VALUES
(1, 'admin', NULL),
(2, 'instructor', NULL),
(3, 'student', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `student_subjects`
--

CREATE TABLE `student_subjects` (
  `id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `subject_id` int(11) NOT NULL,
  `joined_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `student_subjects`
--

INSERT INTO `student_subjects` (`id`, `student_id`, `subject_id`, `joined_at`) VALUES
(2, 2, 15, '2025-11-26 04:46:07');

-- --------------------------------------------------------

--
-- Table structure for table `subjects`
--

CREATE TABLE `subjects` (
  `subject_id` int(11) NOT NULL,
  `instructor_id` int(11) NOT NULL,
  `title` varchar(150) NOT NULL,
  `description` text DEFAULT NULL,
  `class_code` varchar(10) NOT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `is_archived` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `subjects`
--

INSERT INTO `subjects` (`subject_id`, `instructor_id`, `title`, `description`, `class_code`, `created_at`, `is_archived`) VALUES
(10, 1, 'Shobe', 'testing', 'Y0KMPVBQCS', '2025-11-12 00:38:56', 1),
(11, 3, 'Ivell', '123', 'V0MTQSAQ40', '2025-11-12 02:47:50', 0),
(12, 3, 'Ivell', 'Testing', 'IHRSY5EY70', '2025-11-12 15:37:11', 0),
(13, 1, 'Subject 2', 'Test Subject 2', 'ISRW3BJ1Q3', '2025-11-26 04:33:21', 0),
(14, 1, 'Subject 3', 'Test Subject 3', 'ML3SYBT7YC', '2025-11-26 04:34:15', 0),
(15, 1, 'Subject 1', 'Test Subject 1', 'CWSFMGJKRS', '2025-11-26 04:43:42', 0);

-- --------------------------------------------------------

--
-- Table structure for table `submissions`
--

CREATE TABLE `submissions` (
  `submission_id` int(11) NOT NULL,
  `activity_id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `submission_data` text DEFAULT NULL,
  `grade` decimal(5,2) DEFAULT NULL,
  `feedback` text DEFAULT NULL,
  `submitted_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `user_id` int(11) NOT NULL,
  `role_id` int(11) NOT NULL,
  `username` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`user_id`, `role_id`, `username`, `email`, `password`, `created_at`, `updated_at`) VALUES
(1, 2, 'shobe', 'shobe@gmail.com', '$2b$10$uPneKGkXvMvlHBQHvQewV.dSvdPQZrbmDCwcXjYVWg/XygEJ7aTSa', '2025-10-28 05:43:52', '2025-10-28 05:43:52'),
(2, 3, 'sebastian', 'seb@gmail.com', '$2b$10$fDcrqN2o8D6jm1zg2G6WAOTru6zNmmCH7ye8HBtJ4xGBy.jlGMEVa', '2025-11-03 14:20:00', '2025-11-03 14:20:00'),
(3, 2, 'Ivell', 'ivell@gmail.com', '$2b$10$epPsxKICZV9buskzta74XuJ8A2Ib6N6883Orc9P0DjNx.5S7NOk82', '2025-11-11 20:41:56', '2025-11-11 23:26:57'),
(4, 3, 'Juan Pedro', 'juan@gmail.com', '$2b$10$sDHDSwRO8nOIJjbgt2qpc.WFzRgnM1LyRF1encsCYEReQkZnSLXA.', '2025-11-26 04:51:40', '2025-11-26 04:51:40'),
(5, 2, 'Pedro Juan', 'pedro@gmail.com', '$2b$10$H9XAUoSVpdkbyF4ynhmHNuQ6LQlHu6W7E6X6DQuFhGoNW7L19NPlK', '2025-11-26 04:52:20', '2025-11-26 04:52:20'),
(6, 3, 'PETER', 'peter@gmail.com', '$2b$10$WPqtFH8AcKuzEtU4acCdAO53YUoOCsABwHrWcDNKaObL2Y8zR1BPC', '2025-11-26 05:08:44', '2025-11-26 05:08:44');

-- --------------------------------------------------------

--
-- Table structure for table `user_avatars`
--

CREATE TABLE `user_avatars` (
  `avatar_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `original_name` varchar(255) NOT NULL,
  `stored_name` varchar(255) NOT NULL,
  `file_path` varchar(500) NOT NULL,
  `mime_type` varchar(100) DEFAULT NULL,
  `file_size` bigint(20) UNSIGNED DEFAULT 0,
  `is_current` tinyint(1) DEFAULT 0,
  `uploaded_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `user_avatars`
--

INSERT INTO `user_avatars` (`avatar_id`, `user_id`, `original_name`, `stored_name`, `file_path`, `mime_type`, `file_size`, `is_current`, `uploaded_at`) VALUES
(5, 2, 'cpu.jpg', '1764098819551-cpu.jpg', '/uploads/avatars/1764098819551-cpu.jpg', 'image/jpeg', 192547, 1, '2025-11-26 03:26:59'),
(6, 5, 'Muya.png', '1764104035934-Muya.png', '/uploads/avatars/1764104035934-Muya.png', 'image/png', 92489, 1, '2025-11-26 04:53:56'),
(7, 4, 'Muya.png', '1764104272991-Muya.png', '/uploads/avatars/1764104272991-Muya.png', 'image/png', 92489, 1, '2025-11-26 04:57:53'),
(8, 6, 'cpu.jpg', '1764104961435-cpu.jpg', '/uploads/avatars/1764104961435-cpu.jpg', 'image/jpeg', 192547, 1, '2025-11-26 05:09:21');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `activities`
--
ALTER TABLE `activities`
  ADD PRIMARY KEY (`activity_id`),
  ADD KEY `subject_id` (`subject_id`),
  ADD KEY `instructor_id` (`instructor_id`);

--
-- Indexes for table `activities_classwork`
--
ALTER TABLE `activities_classwork`
  ADD PRIMARY KEY (`id`),
  ADD KEY `activity_id` (`activity_id`),
  ADD KEY `uploaded_by` (`uploaded_by`);

--
-- Indexes for table `activity_items`
--
ALTER TABLE `activity_items`
  ADD PRIMARY KEY (`item_id`),
  ADD KEY `activity_id` (`activity_id`);

--
-- Indexes for table `activity_submissions`
--
ALTER TABLE `activity_submissions`
  ADD PRIMARY KEY (`submission_id`),
  ADD UNIQUE KEY `unique_submission` (`activity_id`,`student_id`),
  ADD KEY `idx_activity` (`activity_id`),
  ADD KEY `idx_student` (`student_id`);

--
-- Indexes for table `activity_submission_attachments`
--
ALTER TABLE `activity_submission_attachments`
  ADD PRIMARY KEY (`attachment_id`),
  ADD KEY `idx_submission` (`submission_id`);

--
-- Indexes for table `announcements`
--
ALTER TABLE `announcements`
  ADD PRIMARY KEY (`announcement_id`);

--
-- Indexes for table `files`
--
ALTER TABLE `files`
  ADD PRIMARY KEY (`file_id`),
  ADD KEY `uploaded_by` (`uploaded_by`),
  ADD KEY `activity_id` (`activity_id`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`notification_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `posting_teacher`
--
ALTER TABLE `posting_teacher`
  ADD PRIMARY KEY (`posting_id`),
  ADD KEY `announcement_id` (`announcement_id`);

--
-- Indexes for table `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`role_id`);

--
-- Indexes for table `student_subjects`
--
ALTER TABLE `student_subjects`
  ADD PRIMARY KEY (`id`),
  ADD KEY `student_id` (`student_id`),
  ADD KEY `subject_id` (`subject_id`);

--
-- Indexes for table `subjects`
--
ALTER TABLE `subjects`
  ADD PRIMARY KEY (`subject_id`),
  ADD UNIQUE KEY `class_code` (`class_code`),
  ADD KEY `instructor_id` (`instructor_id`);

--
-- Indexes for table `submissions`
--
ALTER TABLE `submissions`
  ADD PRIMARY KEY (`submission_id`),
  ADD KEY `activity_id` (`activity_id`),
  ADD KEY `student_id` (`student_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `role_id` (`role_id`);

--
-- Indexes for table `user_avatars`
--
ALTER TABLE `user_avatars`
  ADD PRIMARY KEY (`avatar_id`),
  ADD KEY `idx_user` (`user_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `activities`
--
ALTER TABLE `activities`
  MODIFY `activity_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `activities_classwork`
--
ALTER TABLE `activities_classwork`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `activity_items`
--
ALTER TABLE `activity_items`
  MODIFY `item_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `activity_submissions`
--
ALTER TABLE `activity_submissions`
  MODIFY `submission_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `activity_submission_attachments`
--
ALTER TABLE `activity_submission_attachments`
  MODIFY `attachment_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `announcements`
--
ALTER TABLE `announcements`
  MODIFY `announcement_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `files`
--
ALTER TABLE `files`
  MODIFY `file_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `notification_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `posting_teacher`
--
ALTER TABLE `posting_teacher`
  MODIFY `posting_id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `roles`
--
ALTER TABLE `roles`
  MODIFY `role_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `student_subjects`
--
ALTER TABLE `student_subjects`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `subjects`
--
ALTER TABLE `subjects`
  MODIFY `subject_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT for table `submissions`
--
ALTER TABLE `submissions`
  MODIFY `submission_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `user_avatars`
--
ALTER TABLE `user_avatars`
  MODIFY `avatar_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `activities`
--
ALTER TABLE `activities`
  ADD CONSTRAINT `fk_instructor` FOREIGN KEY (`instructor_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_subject` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`subject_id`) ON DELETE CASCADE;

--
-- Constraints for table `activities_classwork`
--
ALTER TABLE `activities_classwork`
  ADD CONSTRAINT `activities_classwork_ibfk_1` FOREIGN KEY (`activity_id`) REFERENCES `activities` (`activity_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `activities_classwork_ibfk_2` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL;

--
-- Constraints for table `activity_items`
--
ALTER TABLE `activity_items`
  ADD CONSTRAINT `activity_items_ibfk_1` FOREIGN KEY (`activity_id`) REFERENCES `activities` (`activity_id`) ON DELETE CASCADE;

--
-- Constraints for table `activity_submissions`
--
ALTER TABLE `activity_submissions`
  ADD CONSTRAINT `activity_submissions_ibfk_1` FOREIGN KEY (`activity_id`) REFERENCES `activities` (`activity_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `activity_submissions_ibfk_2` FOREIGN KEY (`student_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `activity_submission_attachments`
--
ALTER TABLE `activity_submission_attachments`
  ADD CONSTRAINT `activity_submission_attachments_ibfk_1` FOREIGN KEY (`submission_id`) REFERENCES `activity_submissions` (`submission_id`) ON DELETE CASCADE;

--
-- Constraints for table `files`
--
ALTER TABLE `files`
  ADD CONSTRAINT `files_ibfk_1` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `files_ibfk_2` FOREIGN KEY (`activity_id`) REFERENCES `activities` (`activity_id`) ON DELETE CASCADE;

--
-- Constraints for table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `posting_teacher`
--
ALTER TABLE `posting_teacher`
  ADD CONSTRAINT `fk_posting_teacher_announcement` FOREIGN KEY (`announcement_id`) REFERENCES `announcements` (`announcement_id`) ON DELETE CASCADE;

--
-- Constraints for table `student_subjects`
--
ALTER TABLE `student_subjects`
  ADD CONSTRAINT `student_subjects_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `student_subjects_ibfk_2` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`subject_id`) ON DELETE CASCADE;

--
-- Constraints for table `subjects`
--
ALTER TABLE `subjects`
  ADD CONSTRAINT `subjects_ibfk_1` FOREIGN KEY (`instructor_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `submissions`
--
ALTER TABLE `submissions`
  ADD CONSTRAINT `submissions_ibfk_1` FOREIGN KEY (`activity_id`) REFERENCES `activities` (`activity_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `submissions_ibfk_2` FOREIGN KEY (`student_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `user_avatars`
--
ALTER TABLE `user_avatars`
  ADD CONSTRAINT `user_avatars_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
