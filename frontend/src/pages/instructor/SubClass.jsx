import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import Header from "../../web_components/Header";
import Sidebar from "./Sidebar";
import AnnouncementComposer from "./components/AnnouncementComposer";
import AnnouncementsList from "./components/AnnouncementsList";
import ActivityBuilder from "./components/ActivityBuilder";

function SubClass() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);
  const [isAnnouncementOpen, setIsAnnouncementOpen] = useState(false);
  const [isShareInviteOpen, setIsShareInviteOpen] = useState(false);
  const [isCreateActivityOpen, setIsCreateActivityOpen] = useState(false);
  const [announcementText, setAnnouncementText] = useState("");
  const [instructorName] = useState(
    () => localStorage.getItem("username") || "Instructor"
  );
  const [announcements, setAnnouncements] = useState([]);
  const [activities, setActivities] = useState([]);
  const [students, setStudents] = useState([]);
  const [isEditingActivity, setIsEditingActivity] = useState(false);
  const [editingActivityData, setEditingActivityData] = useState(null);
  const [isPosting, setIsPosting] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [subjectData, setSubjectData] = useState(null);
  const [loadingSubject, setLoadingSubject] = useState(false);
  const [activityName, setActivityName] = useState("");
  const [openDateTime, setOpenDateTime] = useState("");
  const [dueDateTime, setDueDateTime] = useState("");
  const [timeLimit, setTimeLimit] = useState("While the activity is still open");
  const [title, setTitle] = useState("");
  const [instructions, setInstructions] = useState("");
  const [isCreatingActivity, setIsCreatingActivity] = useState(false);
  const createMenuRef = useRef(null);
  const photoVideoInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const editFileInputRef = useRef(null);
  const [selectedAttachments, setSelectedAttachments] = useState([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [editingText, setEditingText] = useState("");
  const [editingAttachments, setEditingAttachments] = useState([]);
  const [activeTab, setActiveTab] = useState(() => location.state?.initialTab || "announcements");
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [activeActivityTab, setActiveActivityTab] = useState("instructions");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentGrade, setStudentGrade] = useState("");
  const [studentSubmissions, setStudentSubmissions] = useState({});
  const [studentFeedback, setStudentFeedback] = useState("");
  const API_BASE_URL = "http://localhost:5000";

  // Derived counts for UI
  const turnedInCount = Object.keys(studentSubmissions || {}).length;
  const gradedCount = Object.values(studentSubmissions || {}).filter(
    (s) => s && s.grade !== null && s.grade !== undefined
  ).length;

  const classInfo = useMemo(() => {
    const defaults = {
      id: Date.now(),
      className: "Untitled Class",
      section: "Section details",
      subject: "Subject",
      code: Math.random().toString(36).slice(2, 8).toUpperCase(),
    };
    const localData = { ...defaults, ...(location.state?.classData || {}) };
    
    // Merge with API data if available (API data takes priority)
    if (subjectData) {
      return {
        ...localData,
        subject_id: subjectData.subject_id,
        instructor_id: subjectData.instructor_id,
        title: subjectData.title || localData.className,
        className: subjectData.title || localData.className,
        description: subjectData.description || localData.subject,
        subject: subjectData.description || localData.subject,
        // Map description to section for display
        section: subjectData.description || localData.section || "Section details",
        class_code: subjectData.class_code || localData.code,
        code: subjectData.class_code || localData.code,
        created_at: subjectData.created_at,
      };
    }
    
    return localData;
  }, [location.state, subjectData]);

  // Fetch subject data from API
  useEffect(() => {
    const fetchSubjectData = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }
      const subjectId = classInfo.subject_id || classInfo.id;
      const classCode = classInfo.class_code || classInfo.code;
      if (!subjectId && !classCode) {
        console.log("No subject ID or class code available");
        return;
      }
      setLoadingSubject(true);
      try {
        let url;
        if (subjectId) {
          url = `http://localhost:5000/instructor/subjects/${subjectId}`;
        } else {
          url = `http://localhost:5000/instructor/subjects?class_code=${classCode}`;
        }
        const response = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.data && response.data.subject) {
          setSubjectData(response.data.subject);
          console.log("Subject data imported:", response.data.subject);
        }
      } catch (error) {
        console.error("Error fetching subject data:", error);
        // Don't show error alert if subject not found - use local data instead
        if (error.response?.status !== 404) {
          console.error("Failed to import subject data from database");
        }
      } finally {
        setLoadingSubject(false);
      }
    };
    fetchSubjectData();
  }, []);

  // Fetch announcements when subject data is available
  useEffect(() => {
    if (subjectData || classInfo.subject_id || classInfo.id) {
      fetchAnnouncements();
      fetchActivities();
      fetchStudents();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjectData, classInfo.subject_id, classInfo.id]);

  useEffect(() => {
    function handleOutsideClick(event) {
      if (
        createMenuRef.current &&
        !createMenuRef.current.contains(event.target)
      ) {
        setIsCreateMenuOpen(false);
      }
    }

    if (isCreateMenuOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isCreateMenuOpen]);

  const createMenuItems = [
    { label: "Assignment", description: "Share updates with everyone" },
    { label: "Quiz Announcement", description: "Ask short formative questions" },
    { label: "Reuse Activity", description: "Bring back a previous post" },
  ];

  const goToFeature = (title, description) => {
    navigate("/instructor/feature", {
      state: {
        title,
        description,
        ctaLabel: "Back to Class",
      },
    });
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(classInfo.code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch (err) {
      console.error("Failed to copy code:", err);
    }
  };

  const handleCopyInviteLink = async () => {
    const inviteLink = `${window.location.origin}/join?code=${classInfo.code}`;
    const inviteDetails = `Join ${classInfo.className || "my class"}!\n\nClass Code: ${classInfo.code}\n\nJoin Link: ${inviteLink}`;
    
    try {
      await navigator.clipboard.writeText(inviteDetails);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (err) {
      console.error("Failed to copy invite:", err);
    }
  };

  const handlePostAnnouncement = async () => {
    if (!announcementText.trim()) {
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      alert("Session expired. Please log in again.");
      navigate("/login");
      return;
    }

    const subjectId = classInfo.subject_id || classInfo.id;
    if (!subjectId) {
      alert("Cannot post: Subject ID not found.");
      return;
    }

    const formData = new FormData();
    formData.append("subject_id", subjectId);
    formData.append("content", announcementText.trim());
    
    console.log("FormData before appending files:");
    console.log("  subject_id:", subjectId);
    console.log("  content:", announcementText.trim());
    console.log("  files to upload:", selectedAttachments.length);
    
    selectedAttachments.forEach((attachment, index) => {
      console.log(`  appending file ${index}:`, attachment.file.name, "size:", attachment.file.size);
      formData.append("attachments", attachment.file);
    });

    setIsPosting(true);
    try {
      const response = await axios.post(
        "http://localhost:5000/instructor/announcements",
        formData,
        {
          headers: { 
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("Announcement response:", response.data);

      const createdAnnouncement = response.data?.announcement;
      
      console.log("Created announcement object:", createdAnnouncement);
      console.log("Attachments in response:", createdAnnouncement?.attachments);

      if (!createdAnnouncement) {
        console.error("No announcement returned from server");
        alert("Error: No announcement data returned from server");
        setIsPosting(false);
        return;
      }

      const newAnnouncement = {
        announcement_id: createdAnnouncement.announcement_id,
        content: createdAnnouncement.content,
        created_at: createdAnnouncement.created_at || new Date().toISOString(),
        instructor_name: createdAnnouncement.instructor_name || instructorName,
        attachments: createdAnnouncement.attachments || [],
      };

      console.log("Final announcement to display:", newAnnouncement);

      setAnnouncements((prev) => [newAnnouncement, ...prev]);
      setIsAnnouncementOpen(false);
      setAnnouncementText("");
      setSelectedAttachments([]);
    } catch (error) {
      console.error("Error posting announcement:", error);
      console.error("Error response:", error.response?.data);
      alert(error.response?.data?.message || "Failed to post announcement. Please try again.");
    } finally {
      setIsPosting(false);
    }
  };

  const fetchAnnouncements = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const subjectId = classInfo.subject_id || classInfo.id;
    if (!subjectId) return;

    try {
      const response = await axios.get(
        `http://localhost:5000/instructor/announcements?subject_id=${subjectId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );


      if (response.data && Array.isArray(response.data.announcements)) {
        setAnnouncements(response.data.announcements);
      } else {
        setAnnouncements([]);
      }
    } catch (error) {
      console.error("Error fetching announcements:", error);
    }
  };

  const fetchActivities = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const subjectId = classInfo.subject_id || classInfo.id;
    if (!subjectId) return;

    try {
      const response = await axios.get(
        `http://localhost:5000/activity`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data && Array.isArray(response.data)) {
        // Filter activities by subject_id
        const filteredActivities = response.data.filter(activity => activity.subject_id === subjectId);

        // Fetch attachments for each activity (parallel)
        const activitiesWithAttachments = await Promise.all(
          filteredActivities.map(async (activity) => {
            try {
              const attRes = await axios.get(
                `http://localhost:5000/activity/${activity.activity_id}/attachments`,
                { headers: { Authorization: `Bearer ${token}` } }
              );
              activity.attachments = Array.isArray(attRes.data) ? attRes.data : attRes.data?.attachments || [];
            } catch (err) {
              activity.attachments = activity.attachments || [];
            }
            return activity;
          })
        );

        setActivities(activitiesWithAttachments);
      } else {
        setActivities([]);
      }
    } catch (error) {
      console.error("Error fetching activities:", error);
    }
  };

  const fetchStudents = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const subjectId = classInfo.subject_id || classInfo.id;
    if (!subjectId) return;

    try {
      const response = await axios.get(
        `http://localhost:5000/instructor/subjects/${subjectId}/students`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data && Array.isArray(response.data.students)) {
        const studentsResp = response.data.students;
        // fetch avatars for students in parallel
        try {
          const token = localStorage.getItem('token');
          const avatarPromises = studentsResp.map(s => fetch(`http://localhost:5000/user/${s.user_id}/avatar`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.ok ? r.json().catch(() => null) : null).catch(() => null));
          const avatarResults = await Promise.all(avatarPromises);
          const studentsWithAvatars = studentsResp.map((s, i) => {
            const res = avatarResults[i];
            const avatarPath = res && res.avatar && res.avatar.file_path ? (res.avatar.file_path.startsWith('http') ? res.avatar.file_path : `http://localhost:5000${res.avatar.file_path}`) : null;
            return { ...s, avatarUrl: avatarPath };
          });
          setStudents(studentsWithAvatars);
        } catch (err) {
          console.error('Failed to fetch student avatars', err);
          setStudents(studentsResp);
        }
        
        // Mock submission data for each student (for demo purposes)
        const mockSubmissions = {};
        response.data.students.forEach((student, idx) => {
          if (idx % 2 === 0) {
            // Some students have submissions
            mockSubmissions[student.user_id] = [
              {
                name: `assignment_${student.username}.pdf`,
                type: 'pdf',
                size: '2.4 MB',
                url: '#'
              },
              {
                name: `report_${student.username}.docx`,
                type: 'document',
                size: '1.1 MB',
                url: '#'
              }
            ];
          }
        });
        setStudentSubmissions(mockSubmissions);
      } else {
        setStudents([]);
      }
    } catch (error) {
      console.error("Error fetching students:", error);
      setStudents([]);
    }
  };

  const handleDeleteAnnouncement = async (announcementId) => {
    if (!window.confirm("Are you sure you want to delete this announcement?")) {
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      alert("Session expired. Please log in again.");
      navigate("/login");
      return;
    }

    try {
      await axios.delete(
        `http://localhost:5000/instructor/announcements/${announcementId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setAnnouncements((prev) =>
        prev.filter((a) => a.announcement_id !== announcementId)
      );
    } catch (error) {
      console.error("Error deleting announcement:", error);
      alert(error.response?.data?.message || "Failed to delete announcement. Please try again.");
    }
  };

  const handleDeleteActivity = async (activityId) => {
    if (!window.confirm("Are you sure you want to delete this activity?")) {
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      alert("Session expired. Please log in again.");
      navigate("/login");
      return;
    }

    try {
      await axios.delete(
        `http://localhost:5000/activity/${activityId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setActivities((prev) =>
        prev.filter((a) => a.activity_id !== activityId)
      );
      alert("Activity deleted successfully!");
    } catch (error) {
      console.error("Error deleting activity:", error);
      alert(error.response?.data?.message || "Failed to delete activity. Please try again.");
    }
  };

  const handleEditActivity = (activity) => {
    let config = activity.config_json;
    if (typeof config === 'string') {
      try {
        config = JSON.parse(config);
      } catch (e) {
        config = {};
      }
    }

    setEditingActivityData({
      activity_id: activity.activity_id,
      title: activity.title,
      description: activity.description,
      activity_name: config.activity_name || "",
      instructions: config.instructions || "",
      open_date_time: config.open_date_time || "",
      due_date_time: config.due_date_time || "",
      time_limit: config.time_limit || "While the activity is still open",
    });
    // Load existing attachments for this activity and populate editingAttachments
    (async () => {
      const token = localStorage.getItem("token");
      try {
        if (token) {
          const res = await axios.get(`${API_BASE_URL}/activity/${activity.activity_id}/attachments`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const attachments = Array.isArray(res.data) ? res.data : res.data?.attachments || [];
          const mapped = attachments.map((att) => ({
            id: String(att.id || att.attachment_id || att.stored_name || `${Date.now()}-${Math.random()}`),
            file: att,
            mimeType: att.mime_type,
            isExisting: true,
          }));
          setEditingAttachments(mapped);
        } else {
          setEditingAttachments([]);
        }
      } catch (err) {
        console.error('Failed to load activity attachments for edit', err);
        setEditingAttachments([]);
      } finally {
        setIsEditingActivity(true);
      }
    })();
  };

  const openActivity = async (activity) => {
    const token = localStorage.getItem("token");
    if (!token) {
      setTimeout(() => setSelectedActivity(activity), 0);
      return;
    }

    try {
      const subRes = await axios.get(
        `${API_BASE_URL}/activity/${activity.activity_id}/submissions`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const submissions = subRes.data?.submissions || [];
      const submissionsByStudent = {};
      submissions.forEach((sub) => {
        submissionsByStudent[sub.student_id] = {
          submission_id: sub.submission_id,
          submission_text: sub.submission_text,
          submitted_at: sub.submitted_at,
          grade: sub.grade,
          feedback: sub.feedback,
          attachments: sub.attachments || []
        };
      });
      setStudentSubmissions(submissionsByStudent);
    } catch (err) {
      console.error("Error fetching submissions:", err);
    }

    setTimeout(() => setSelectedActivity({ ...activity }), 0);
  };

  const handleSelectStudent = (student) => {
    setSelectedStudent(student);
    const submission = studentSubmissions[student.user_id];
    if (submission) {
      setStudentGrade(submission.grade ? submission.grade.toString() : "");
      setStudentFeedback(submission.feedback || "");
    } else {
      setStudentGrade("");
      setStudentFeedback("");
    }
  };

  const handleSaveGrade = async () => {
    if (!selectedStudent || !selectedActivity) {
      alert("Please select a student and activity.");
      return;
    }

    const submission = studentSubmissions[selectedStudent.user_id];
    if (!submission) {
      alert("No submission found for this student.");
      return;
    }

    if (!studentGrade && !studentFeedback) {
      alert("Please enter a grade or feedback.");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      alert("Session expired. Please log in again.");
      navigate("/login");
      return;
    }

    try {
      const response = await axios.put(
        `${API_BASE_URL}/activity/${selectedActivity.activity_id}/submissions/${submission.submission_id}/grade`,
        {
          grade: studentGrade ? parseFloat(studentGrade) : null,
          feedback: studentFeedback
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert("Grade saved successfully!");

      // Update the local submission data
      setStudentSubmissions((prev) => ({
        ...prev,
        [selectedStudent.user_id]: {
          ...prev[selectedStudent.user_id],
          grade: studentGrade ? parseFloat(studentGrade) : null,
          feedback: studentFeedback
        }
      }));

      // Close the tab/modal
      setSelectedActivity(null);
      setSelectedStudent(null);
    } catch (error) {
      console.error("Error saving grade:", error);
      alert(error.response?.data?.message || "Failed to save grade. Please try again.");
    }
  };

  const handleSaveActivityEdit = async () => {
    if (!editingActivityData || !editingActivityData.title) {
      alert("Please enter an activity title.");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      alert("Session expired. Please log in again.");
      navigate("/login");
      return;
    }

    try {
      // Build FormData to allow uploading new files and keeping existing ones
      const formData = new FormData();
      formData.append('title', editingActivityData.title);
      formData.append('description', editingActivityData.description || '');
      formData.append('config_json', JSON.stringify({
        activity_name: editingActivityData.activity_name,
        instructions: editingActivityData.instructions,
        open_date_time: editingActivityData.open_date_time,
        due_date_time: editingActivityData.due_date_time,
        time_limit: editingActivityData.time_limit,
      }));

      // Append new files (only items where file is an instance of File)
      editingAttachments.forEach((att) => {
        if (att.file instanceof File) {
          formData.append('attachments', att.file);
        }
      });

      // Provide list of existing attachment ids to keep (server will delete others)
      const keepAttachmentIds = editingAttachments
        .filter((att) => !(att.file instanceof File))
        .map((att) => att.id)
        .filter(Boolean);

      if (keepAttachmentIds.length > 0) {
        formData.append('keepAttachmentIds', keepAttachmentIds.join(','));
      }

      const response = await axios.put(
        `http://localhost:5000/activity/${editingActivityData.activity_id}`,
        formData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Update local activities with returned attachments (if provided)
      const updatedAttachments = response.data?.attachments || [];

      setActivities((prev) =>
        prev.map((a) =>
          a.activity_id === editingActivityData.activity_id
            ? {
                ...a,
                title: editingActivityData.title,
                description: editingActivityData.description,
                config_json: JSON.parse(typeof a.config_json === 'string' ? a.config_json : JSON.stringify(a.config_json)),
                attachments: updatedAttachments,
              }
            : a
        )
      );

      setIsEditingActivity(false);
      setEditingActivityData(null);
      setEditingAttachments([]);
      alert('Activity updated successfully!');
    } catch (error) {
      console.error('Error updating activity:', error);
      alert(error.response?.data?.message || 'Failed to update activity. Please try again.');
    }
  };

  const handleCancelActivityEdit = () => {
    setIsEditingActivity(false);
    setEditingActivityData(null);
    setEditingAttachments([]);
  };

  const handleEditAnnouncement = (announcement) => {
    setEditingAnnouncement(announcement);
    setEditingText(announcement.content);
    // Convert existing attachments to have proper id and file properties
    const attachmentsWithIds = (announcement.attachments || []).map((att) => ({
      id: String(att.attachment_id || att.posting_id), // Use the actual DB ID
      file: att, // existing attachment object, not a File
      mimeType: att.mime_type,
      isExisting: true, // Mark as existing for easier identification
    }));
    setEditingAttachments(attachmentsWithIds);
    setIsEditMode(true);
  };

  const handleSaveEdit = async () => {
    if (!editingText.trim() || !editingAnnouncement) {
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      alert("Session expired. Please log in again.");
      navigate("/login");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("content", editingText.trim());
      
      // Add only new file attachments (not existing ones)
      editingAttachments.forEach((attachment) => {
        if (attachment.file instanceof File) {
          formData.append("attachments", attachment.file);
        }
      });

      // Add IDs of attachments to keep (existing ones that weren't removed)
      const keepAttachmentIds = editingAttachments
        .filter((att) => !(att.file instanceof File)) // Only existing attachments
        .map((att) => att.id)
        .filter(id => id); // Filter out empty IDs
      
      if (keepAttachmentIds.length > 0) {
        formData.append("keepAttachmentIds", keepAttachmentIds.join(","));
      }

      const response = await axios.put(
        `http://localhost:5000/instructor/announcements/${editingAnnouncement.announcement_id}`,
        formData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const updatedAnnouncement = response.data?.announcement || editingAnnouncement;

      setAnnouncements((prev) =>
        prev.map((a) =>
          a.announcement_id === editingAnnouncement.announcement_id
            ? { 
                ...a, 
                content: editingText.trim(),
                attachments: updatedAnnouncement.attachments || [], 
                updated_at: response.data?.announcement?.updated_at 
              }
            : a
        )
      );

      setIsEditMode(false);
      setEditingAnnouncement(null);
      setEditingText("");
      setEditingAttachments([]);
    } catch (error) {
      console.error("Error updating announcement:", error);
      alert(error.response?.data?.message || "Failed to update announcement. Please try again.");
    }
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setEditingAnnouncement(null);
    setEditingText("");
    setEditingAttachments([]);
  };

  const handleEditAttachmentSelect = (fileList) => {
    if (!fileList || !fileList.length) {
      return;
    }
    
    const MAX_ATTACHMENTS = 6;
    const filesArray = [...fileList];
    
    setEditingAttachments((prev) => {
      const availableSlots = MAX_ATTACHMENTS - prev.length;
      if (availableSlots <= 0) {
        alert("You can attach up to 6 files per post.");
        return prev;
      }
      
      const newAttachments = filesArray.slice(0, availableSlots).map((file) => ({
        id: `${Date.now()}-${Math.random()}`,
        file: file,
        mimeType: file.type,
      }));
      
      return [...prev, ...newAttachments];
    });
    
    if (editFileInputRef.current) {
      editFileInputRef.current.value = "";
    }
  };

  const handleEditAttachmentRemove = (id) => {
    setEditingAttachments((prev) => prev.filter((item) => item.id !== id));
  };

  const formatFileSize = (bytes) => {
    if (!bytes && bytes !== 0) return "";
    if (bytes < 1024) return `${bytes} B`;
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    const mb = kb / 1024;
    return `${mb.toFixed(1)} MB`;
  };

  const getAttachmentIcon = (mimeType) => {
    if (!mimeType) return "📄";
    if (mimeType.startsWith("image/")) return "🖼️";
    if (mimeType.startsWith("video/")) return "🎥";
    if (mimeType.includes("pdf")) return "📄";
    if (
      mimeType.includes("word") ||
      mimeType.includes("presentation") ||
      mimeType.includes("excel")
    ) {
      return "📄";
    }
    return "📎";
  };

  // Given an array of attachments, return latest and history arrays
  // latest: the attachments that were uploaded most recently (by timestamp fields)
  // history: all other attachments
  const splitCurrentAndHistory = (attachments = []) => {
    if (!attachments || attachments.length === 0) return { latest: [], history: [] };

    const getTimestamp = (a = {}) => {
      // Several possible timestamp keys we might encounter from API
      const keys = ["uploaded_at", "created_at", "updated_at", "submitted_at", "timestamp", "time"];
      for (const k of keys) {
        if (a[k]) {
          const n = Date.parse(a[k]);
          if (!isNaN(n)) return n;
        }
      }
      return null;
    };

    // Try to extract timestamps. If we find any valid timestamp, use the newest timestamp as latest set
    const ts = attachments.map(getTimestamp);
    const hasAny = ts.some((t) => t !== null);

    if (hasAny) {
      const maxT = Math.max(...ts.map((t) => (t === null ? -Infinity : t)));
      const latest = attachments.filter((a) => (getTimestamp(a) || -Infinity) === maxT);
      const history = attachments.filter((a) => (getTimestamp(a) || -Infinity) !== maxT);
      return { latest, history };
    }

    // Fallback: treat last item as latest, rest as history
    if (attachments.length === 1) return { latest: attachments, history: [] };
    return { latest: [attachments[attachments.length - 1]], history: attachments.slice(0, -1) };
  };

  const handleAttachmentSelect = (fileList) => {
    console.log("=== handleAttachmentSelect called ===");
    console.log("fileList:", fileList);
    console.log("fileList.length:", fileList?.length);
    
    if (!fileList || !fileList.length) {
      console.warn("No files or empty list");
      return;
    }
    
    const MAX_ATTACHMENTS = 6;
    console.log("Files selected:", fileList.length);
    
    // Convert FileList to array using spread operator (more reliable than Array.from)
    const filesArray = [...fileList];
    console.log("Files array after spread:", filesArray.length);
    
    // Log each file
    for (let i = 0; i < filesArray.length; i++) {
      const file = filesArray[i];
      console.log(`File ${i}:`, {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified,
      });
    }
    
    setSelectedAttachments((prev) => {
      console.log("Previous attachments:", prev.length);
      const availableSlots = MAX_ATTACHMENTS - prev.length;
      if (availableSlots <= 0) {
        alert("You can attach up to 6 files per post.");
        return prev;
      }

      const incoming = filesArray.slice(0, availableSlots);
      console.log("Incoming files after slice:", incoming.length);
      const next = [...prev];

      incoming.forEach((file, idx) => {
        console.log(`Processing file ${idx}:`, file.name);
        const isDuplicate = next.some(
          (item) =>
            item.file.name === file.name &&
            item.file.size === file.size &&
            item.file.lastModified === file.lastModified
        );
        console.log(`File ${idx} is duplicate?`, isDuplicate);
        if (!isDuplicate) {
          const newItem = {
            id: `${file.name}-${file.size}-${file.lastModified}-${Math.random()
              .toString(36)
              .slice(2, 8)}`,
            file,
            mimeType: file.type,
          };
          console.log(`Adding file ${idx} with id:`, newItem.id);
          next.push(newItem);
        }
      });

      console.log("Final attachments count:", next.length);
      return next;
    });
  };

  const handleAttachmentRemove = (id) => {
    setSelectedAttachments((prev) => prev.filter((item) => item.id !== id));
  };

  // Preview state for attachment lightbox
  const [attachmentPreview, setAttachmentPreview] = useState(null);

  const handleDrop = (event) => {
    event.preventDefault();
    if (event.dataTransfer?.files?.length) {
      handleAttachmentSelect(event.dataTransfer.files);
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const triggerPhotoVideoPicker = () => {
    photoVideoInputRef.current?.click();
  };

  const triggerFilePicker = () => {
    fileInputRef.current?.click();
  };

  const quickActions = [
    {
      label: "Image",
      icon: "🖼",
      onClick: triggerPhotoVideoPicker,
    },
    {
      label: "Attachment",
      icon: "📎",
      onClick: triggerFilePicker,
    },
    {
      label: "Video",
      icon: "🎥",
      onClick: triggerPhotoVideoPicker,
    },
    {
      label: "Activity",
      icon: "⭐",
      onClick: () =>
        goToFeature(
          "Interactive Activity",
          "Host quick polls and activities to keep your class engaged. This feature is coming soon."
        ),
    },
    {
      label: "Schedule",
      icon: "⏰",
      onClick: () =>
        goToFeature(
          "Scheduled Post",
          "Plan announcements in advance and have them publish automatically."
        ),
    },
  ];

  const handleCreateActivity = async (attachments = []) => {
    if (!activityName || !openDateTime || !dueDateTime || !title) {
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      alert("Session expired. Please log in again.");
      navigate("/login");
      return;
    }

    const subjectId = classInfo.subject_id || classInfo.id;
    if (!subjectId) {
      alert("Cannot create activity: Subject ID not found.");
      return;
    }

    setIsCreatingActivity(true);
    try {
      // Format datetime strings for API
      const openDate = new Date(openDateTime);
      const dueDate = new Date(dueDateTime);

      // Prepare payload as FormData so attachments (if any) are uploaded
      const formData = new FormData();
      formData.append("subject_id", subjectId);
      formData.append("activity_name", title); // activity TYPE (CodeLab / Sim Pc / ...)
      formData.append("title", activityName); // activity display title (longer user input)
      formData.append("instructions", instructions || "");
      formData.append("open_date_time", openDate.toISOString());
      formData.append("due_date_time", dueDate.toISOString());
      formData.append("time_limit", timeLimit || "");

      // Attach files
      if (attachments && attachments.length > 0) {
        attachments.forEach((file) => {
          formData.append("attachments", file);
        });
      }

      console.log("Creating activity with form data, files:", attachments?.length || 0);

      const response = await axios.post("http://localhost:5000/activity", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("Activity created:", response.data);
      alert("Activity created successfully!");
      
      // Defer ALL state updates to next tick to avoid "setState during render" warning
      // when parent is updated by child component (ActivityBuilder)
      setTimeout(() => {
        // Immediately add created activity to the list (with attachments if returned)
        if (response.data?.activity) {
          const createdActivity = response.data.activity;
          // Ensure activity has attachments array
          if (!createdActivity.attachments) {
            createdActivity.attachments = [];
          }
          setActivities((prev) => [createdActivity, ...prev]);
        }

        // Reset form and close modal
        setIsCreateActivityOpen(false);
        setActivityName("");
        setOpenDateTime("");
        setDueDateTime("");
        setTimeLimit("While the activity is still open");
        setTitle("");
        setInstructions("");
      }, 0);

      // Refresh activities list to stay in sync with backend (in background)
      await fetchActivities();
    } catch (error) {
      console.error("Error creating activity:", error);
      alert(error.response?.data?.message || "Failed to create activity. Please try again.");
    } finally {
      setIsCreatingActivity(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-[#cfe3fa] via-[#e6f0ff] to-white">
      <Header
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        showMenu={false}
      />

      <div className="flex flex-1 md:grid md:grid-cols-[auto_1fr] md:gap-0">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className="flex-1 px-6 sm:px-10 py-18 space-y-10">
          {/* Back to Classes & Welcome Section Combined */}
          <div className="relative flex flex-col items-center justify-center text-center">
            <button
              onClick={() =>
                navigate("/instructor/dashboard", {
                  state: { newClass: classInfo },
                })
              }
              className="absolute left-0 text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              ← Back to classes
            </button>
            <h1 className="text-4xl font-bold text-gray-800">
              Welcome, Prof. <span className="text-blue-600">{instructorName}</span>!
            </h1>
          </div>

          {/* Class Info and Actions */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h2 className="text-3xl font-semibold text-gray-800">
                {classInfo.className}
              </h2>
              <p className="text-gray-500">
                {classInfo.section || classInfo.description || "No description"}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() =>
                  goToFeature(
                    "Class Settings",
                    "Manage class preferences, update course details, and configure collaboration options in one place."
                  )
                }
                className="px-4 py-2 rounded-lg border border-blue-500 text-blue-600 font-medium hover:bg-blue-50 transition"
              >
                Class settings
              </button>
              <button
                onClick={() => setIsShareInviteOpen(true)}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold shadow hover:bg-blue-700 transition"
              >
                Share invite
              </button>
            </div>
          </div>

          <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#2d7bf3] via-[#37b0ff] to-[#8adFFF] text-white shadow-xl">
            <div className="absolute inset-0">
              <div className="absolute -top-24 -left-20 h-64 w-64 rounded-full bg-white/20 blur-2xl" />
              <div className="absolute -bottom-16 right-10 h-56 w-56 rounded-full bg-white/15 blur-2xl" />
              <div className="absolute left-24 top-10 h-24 w-24 rounded-3xl border border-white/25 rotate-12" />
              <div className="absolute right-16 bottom-16 h-20 w-20 rounded-full bg-white/20" />
            </div>
            <div className="relative z-10 p-8 lg:p-12 flex flex-col gap-8">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
                <div>
                  <p className="uppercase tracking-[0.25em] text-white/80 text-xs">
                    stream overview
                  </p>
                  <h2 className="mt-3 text-3xl font-semibold leading-snug">
                    Start the conversation and keep your class aligned
                  </h2>
                  <p className="mt-3 text-white/80 text-sm max-w-2xl">
                    Announcements posted here appear for everyone instantly. Pin
                    key updates, schedule reminders, or share quick resources to
                    set the tone for your course.
                  </p>
                </div>
                <div className="bg-white/15 rounded-3xl p-6 w-full sm:w-auto sm:min-w-[220px]">
                  <p className="text-white/70 uppercase tracking-wide text-xs">
                    class code
                  </p>
                  <p className="mt-3 text-3xl font-semibold tracking-[0.35em]">
                    {classInfo.code}
                  </p>
                  <button
                    onClick={handleCopyCode}
                    className={`mt-6 w-full rounded-xl py-2 text-sm font-medium transition ${
                      copiedCode
                        ? "bg-green-500/30 text-white"
                        : "bg-white/20 hover:bg-white/30"
                    }`}
                  >
                    {copiedCode ? "Copied!" : "Copy code"}
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Actions bar outside the banner */}
          <div className="mt-4 lg:mt-6">
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setActiveTab("newsfeed")}
                className={`px-6 py-2 rounded-full text-sm font-semibold border transition-transform duration-200 ${
                  activeTab === "newsfeed"
                    ? "bg-[#2d7bf3] text-white border-[#2d7bf3] shadow-lg shadow-blue-200/40"
                    : "bg-white text-[#2d7bf3] border-white/40 shadow-lg shadow-black/10 hover:shadow-xl hover:-translate-y-0.5"
                }`}
              >
                Newsfeed
              </button>
              <button
                onClick={() => setActiveTab("classwork")}
                className={`px-6 py-2 rounded-full text-sm font-semibold border transition-transform duration-200 ${
                  activeTab === "classwork"
                    ? "bg-[#2d7bf3] text-white border-[#2d7bf3] shadow-lg shadow-blue-200/40"
                    : "bg-white text-[#2d7bf3] border-white/40 shadow-lg shadow-black/10 hover:shadow-xl hover:-translate-y-0.5"
                }`}
              >
                Classwork
              </button>
              <button
                onClick={() => setActiveTab("people")}
                className={`px-6 py-2 rounded-full text-sm font-semibold border transition-transform duration-200 ${
                  activeTab === "people"
                    ? "bg-[#2d7bf3] text-white border-[#2d7bf3] shadow-lg shadow-blue-200/40"
                    : "bg-white text-[#2d7bf3] border-white/40 shadow-lg shadow-black/10 hover:shadow-xl hover:-translate-y-0.5"
                }`}
              >
                Class People
              </button>
              <button
                onClick={() => setActiveTab("grades")}
                className={`px-6 py-2 rounded-full text-sm font-semibold transition-transform duration-200 ${
                  activeTab === "grades"
                    ? "bg-[#2d7bf3] text-white shadow-lg shadow-blue-200/40"
                    : "bg-white text-[#2d7bf3] shadow-lg shadow-black/10 hover:shadow-xl hover:-translate-y-0.5"
                }`}
              >
                Grades
              </button>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === "grades" && (
            <section className="rounded-3xl bg-white shadow-lg border border-white/60 px-6 py-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Grades Center</h3>
              <p className="text-gray-500 mb-6">Track student performance, provide timely feedback, and analyze class trends across assignments.</p>
              {students.length > 0 ? (
                <div className="space-y-3">
                  <div className="text-sm text-gray-600 mb-4">
                    <span className="font-semibold text-gray-700">{students.length}</span> student{students.length !== 1 ? 's' : ''} joined
                  </div>
                  <div className="grid gap-3">
                    {students.map((student) => (
                      <button
                        key={student.user_id}
                        className={`flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-blue-50 transition w-full text-left ${selectedStudent?.user_id === student.user_id ? 'ring-2 ring-blue-400 bg-blue-50' : ''}`}
                        onClick={async () => {
                          if (selectedStudent?.user_id === student.user_id) {
                            setSelectedStudent(null);
                          } else {
                            setSelectedStudent(student);
                            // Fetch all submissions for this student across all activities
                            const token = localStorage.getItem("token");
                            if (!token) return;
                            const submissionsByActivity = {};
                            for (const activity of activities) {
                              try {
                                const subRes = await axios.get(
                                  `${API_BASE_URL}/activity/${activity.activity_id}/submissions`,
                                  { headers: { Authorization: `Bearer ${token}` } }
                                );
                                const submissions = subRes.data?.submissions || [];
                                const studentSubmission = submissions.find(sub => sub.student_id === student.user_id);
                                submissionsByActivity[activity.activity_id] = studentSubmission || null;
                              } catch (err) {
                                submissionsByActivity[activity.activity_id] = null;
                              }
                            }
                            setStudentSubmissions(submissionsByActivity);
                          }
                        }}
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex-shrink-0 w-10 h-10 rounded-full overflow-hidden flex items-center justify-center">
                            {student.avatarUrl ? (
                              <img src={student.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold text-sm">
                                {student.username.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-800 truncate">
                              {student.username}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {student.email}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="inline-flex px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                            Student
                          </span>
                          <span className="text-xs text-gray-500">
                            Joined {new Date(student.joined_at).toLocaleDateString()}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                  {/* Student details and activities section */}
                  {selectedStudent && (
                    <div className="mt-8 rounded-2xl border border-gray-200 bg-gray-50 p-6">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-14 h-14 rounded-full overflow-hidden flex items-center justify-center">
                          {selectedStudent.avatarUrl ? (
                            <img src={selectedStudent.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-14 h-14 rounded-full bg-blue-500 text-white flex items-center justify-center text-xl font-bold">
                              {selectedStudent.username.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">{selectedStudent.username}</p>
                          <p className="text-xs text-gray-500">{selectedStudent.email}</p>
                        </div>
                        <div className="pl-6 border-l border-gray-200 ml-4">
                          <h4 className="text-lg font-semibold text-gray-800">{classInfo.className}</h4>
                          <p className="text-xs text-gray-500">{classInfo.section}</p>
                        </div>
                      </div>
                      <hr className="my-6 border-gray-300" />
                      {/* Activities for selected student */}
                      <div className="space-y-4">
                        {activities.length > 0 ? (
                          activities.map((activity, idx) => {
                            const submission = studentSubmissions[activity.activity_id];
                            return (
                              <div key={activity.activity_id || idx}>
                                <div className="font-semibold text-gray-800 mb-1">{activity.title || `ACTIVITY ${idx + 1}`}</div>
                                <div className={`text-sm mb-4 ${submission ? 'text-green-600' : 'text-gray-500'}`}> 
                                  {submission ? (
                                    <div className="flex items-center gap-3">
                                      <div>
                                        <span className="mr-2">✔ Submitted</span>
                                        {submission.submitted_at && (
                                          <span className="text-xs">{new Date(submission.submitted_at).toLocaleDateString()}</span>
                                        )}
                                      </div>
                                      {submission && submission.grade !== null && submission.grade !== undefined && submission.grade !== '' ? (
                                        <div className="bg-green-100 text-green-800 px-3 py-1 rounded font-semibold text-sm">
                                          {Number.isFinite(Number(submission.grade)) ? Number(submission.grade).toFixed(2) : submission.grade}
                                        </div>
                                      ) : null}
                                    </div>
                                  ) : (
                                    <>No submission</>
                                  )}
                                </div>
                                {idx < activities.length - 1 && (
                                  <hr className="my-2 border-gray-200" />
                                )}
                              </div>
                            );
                          })
                        ) : (
                          <div className="text-gray-500">No activities found.</div>
                        )}
                      </div>
                      <button
                        className="mt-6 px-6 py-2 rounded-lg bg-gray-200 text-gray-700 font-medium hover:bg-gray-300 transition"
                        onClick={() => setSelectedStudent(null)}
                      >
                        Back
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-2">No students joined yet</p>
                  <p className="text-sm text-gray-400">
                    Students will appear here once they join your class using the class code
                  </p>
                </div>
              )}
            </section>
          )}

          {activeTab === "people" && (
            <section className="rounded-3xl bg-white shadow-lg border border-white/60 px-6 py-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-6">Class People</h3>
              
              {students.length > 0 ? (
                <div className="space-y-3">
                  <div className="text-sm text-gray-600 mb-4">
                    <span className="font-semibold text-gray-700">{students.length}</span> student{students.length !== 1 ? 's' : ''} enrolled
                  </div>
                  <div className="grid gap-3">
                    {students.map((student) => (
                      <div
                        key={student.user_id}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex-shrink-0 w-10 h-10 rounded-full overflow-hidden flex items-center justify-center">
                            {student.avatarUrl ? (
                              <img src={student.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold text-sm">
                                {student.username.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-800 truncate">
                              {student.username}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {student.email}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="inline-flex px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                            Student
                          </span>
                          <span className="text-xs text-gray-500">
                            Joined {new Date(student.joined_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-2">No students enrolled yet</p>
                  <p className="text-sm text-gray-400">
                    Students will appear here once they join your class using the class code
                  </p>
                </div>
              )}
            </section>
          )}

          {activeTab === "classwork" && (
            <section className="rounded-3xl bg-white shadow-lg border border-white/60 px-6 py-6">
              <div className="flex items-start justify-between">
                <div className="relative" ref={createMenuRef}>
                  <button
                    onClick={() => setIsCreateMenuOpen((prev) => !prev)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white shadow-lg transition transform hover:-translate-y-0.5"
                    style={{
                      background: "linear-gradient(90deg,#2d7bf3 0%,#37b0ff 50%,#8adfff 100%)",
                      boxShadow: "0 10px 25px rgba(45,123,243,0.18)",
                    }}
                  >
                    <span className="text-lg font-bold leading-none">+</span>
                    <span>Classwork Activities</span>
                  </button>

                  {isCreateMenuOpen && (
                    <div className="absolute left-0 mt-3 w-72 rounded-3xl border border-blue-100 bg-white/95 backdrop-blur-sm shadow-2xl shadow-blue-200/40 overflow-hidden z-20">
                      <div className="bg-gradient-to-r from-[#e7f1ff] to-white px-5 py-4"></div>
                      <div className="divide-y divide-blue-50">
                        {createMenuItems.map((item) => (
                          <button
                            key={item.label}
                            onClick={() => {
                              if (item.label === "Assignment") {
                                setIsCreateActivityOpen(true);
                                setIsCreateMenuOpen(false);
                              }
                            }}
                            className="w-full text-left px-5 py-4 hover:bg-blue-50/70 transition-colors duration-150"
                          >
                            <p className="text-sm font-semibold text-gray-800">{item.label}</p>
                            <p className="text-xs text-gray-500 mt-1">{item.description}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {activities.length > 0 ? (
                <div className="mt-6 space-y-4">
                  {activities.map((activity) => {
                    let config = activity.config_json;
                    // Parse config_json if it's a string
                    if (typeof config === 'string') {
                      try {
                        config = JSON.parse(config);
                      } catch (e) {
                        config = {};
                      }
                    }
                    
                    return (
                      <div
                        key={activity.activity_id}
                        onClick={() => openActivity(activity)}
                        className="border-l-4 border-green-500 rounded-2xl p-5 bg-white shadow-sm hover:shadow-md hover:bg-blue-50 transition cursor-pointer relative ring-1 ring-gray-200"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-3">
                              <h4 className="font-semibold text-gray-800">{activity.title}</h4>
                            </div>
                            
                            {/* Activity Type Buttons */}
                            <div className="flex flex-wrap gap-2 mb-3">
                              {["CodeLab", "Sim Pc", "Quiz", "Experiment"].map((type) => (
                                <button
                                  key={type}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    // Just toggle, don't redirect
                                  }}
                                  className={`px-3 py-1 rounded-lg text-sm font-medium transition cursor-pointer ${
                                    config.activity_name === type
                                      ? "bg-blue-600 text-white"
                                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                  }`}
                                >
                                  {type}
                                </button>
                              ))}
                            </div>
                            
                            <div className="mt-2 flex gap-6 text-sm">
                              {config.open_date_time && (
                                <div className="flex items-center gap-2">
                                  <span className="text-green-600">📅</span>
                                  <div>
                                    <p className="text-xs text-gray-500">Opens</p>
                                    <p className="text-gray-700">{new Date(config.open_date_time).toLocaleString()}</p>
                                  </div>
                                </div>
                              )}
                              {config.due_date_time && (
                                <div className="flex items-center gap-2">
                                  <span className="text-red-600">📅</span>
                                  <div>
                                    <p className="text-xs text-gray-500">Due</p>
                                    <p className="text-gray-700">{new Date(config.due_date_time).toLocaleString()}</p>
                                  </div>
                                </div>
                              )}
                            </div>
                            
                            {config.instructions && (
                              <p className="text-sm text-gray-600 mt-3">{config.instructions}</p>
                            )}
                          </div>
                          <div className="ml-4 flex gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditActivity(activity);
                              }}
                              className="text-gray-500 hover:text-blue-600 transition"
                            >
                              ✎ Edit
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteActivity(activity.activity_id);
                              }}
                              className="text-gray-500 hover:text-red-600 transition"
                            >
                              ✕ Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-6 text-center">
                  <p className="text-gray-500">No activities yet. Create one to get started.</p>
                </div>
              )}
            </section>
          )}

          {activeTab === "newsfeed" && (
          <section className="grid gap-8 xl:grid-cols-[1.8fr_1fr]">
            <div className="space-y-6">
              <div className="rounded-3xl bg-white shadow-lg border border-white/60 px-6 py-6">
                <div
                  onClick={() => setIsAnnouncementOpen(true)}
                  className="flex flex-col bg-gray-50 border border-gray-200 rounded-full px-5 py-3 cursor-pointer hover:bg-gray-100 transition-all"
                >
                  <span className="text-xs text-gray-400 font-medium leading-none mb-1">
                    Announcement
                  </span>
                  <span className="text-gray-500 text-sm">
                    What&apos;s on your mind
                  </span>
                </div>

                <div className="flex gap-3 px-2 mt-4">
                </div>

                <input
                  type="file"
                  ref={photoVideoInputRef}
                  accept="image/*,video/*"
                  multiple
                  className="hidden"
                  onChange={(event) => {
                    handleAttachmentSelect(event.target.files);
                    event.target.value = "";
                  }}
                />
                <input
                  type="file"
                  ref={fileInputRef}
                  multiple
                  className="hidden"
                  onChange={(event) => {
                    handleAttachmentSelect(event.target.files);
                    event.target.value = "";
                  }}
                />

                {/* Announcements List */}
                <AnnouncementsList
                  announcements={announcements}
                  API_BASE_URL={API_BASE_URL}
                  getAttachmentIcon={getAttachmentIcon}
                  onDelete={handleDeleteAnnouncement}
                  onEdit={handleEditAnnouncement}
                />
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-3xl bg-white shadow-lg border border-white/60 px-6 py-6">
                <h3 className="text-lg font-semibold text-gray-800">
                  Upcoming
                </h3>
                <p className="mt-3 text-sm text-gray-500">
                  No scheduled tasks yet. Create an activity to fill this list.
                </p>
                <button
                  onClick={() =>
                    goToFeature(
                      "Assignment Planner",
                      "Design assignments, set schedules, and align expectations before publishing to your class."
                    )
                  }
                  className="mt-5 w-full rounded-xl bg-blue-600 text-white py-3 text-sm font-semibold hover:bg-blue-700 transition"
                >
                  Plan assignment
                </button>
              </div>
            </div>
          </section>
          )}

          {activeTab === "announcements" && (
            <section className="rounded-3xl bg-white shadow-lg border border-white/60 px-6 py-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Announcements</h3>
              <p className="text-gray-500">View announcements in the Newsfeed tab.</p>
            </section>
          )}
        </main>

      {/* Announcement Composer Modal */}
      {/* Announcement Composer Modal */}
      <AnnouncementComposer
        isOpen={isAnnouncementOpen}
        onClose={() => {
          setIsAnnouncementOpen(false);
          setAnnouncementText("");
          setSelectedAttachments([]);
        }}
        classInfo={classInfo}
        instructorName={instructorName}
        onAnnouncementPosted={(newAnnouncement) => {
          setAnnouncements((prev) => [newAnnouncement, ...prev]);
        }}
        selectedAttachments={selectedAttachments}
        setSelectedAttachments={setSelectedAttachments}
        announcementText={announcementText}
        setAnnouncementText={setAnnouncementText}
        isPosting={isPosting}
        setIsPosting={setIsPosting}
        photoVideoInputRef={photoVideoInputRef}
        fileInputRef={fileInputRef}
        getAttachmentIcon={getAttachmentIcon}
        formatFileSize={formatFileSize}
      />

      {/* Create Activity Modal */}
      <ActivityBuilder
        isOpen={isCreateActivityOpen}
        onClose={() => setIsCreateActivityOpen(false)}
        activityName={activityName}
        setActivityName={setActivityName}
        openDateTime={openDateTime}
        setOpenDateTime={setOpenDateTime}
        dueDateTime={dueDateTime}
        setDueDateTime={setDueDateTime}
        timeLimit={timeLimit}
        setTimeLimit={setTimeLimit}
        title={title}
        setTitle={setTitle}
        instructions={instructions}
        setInstructions={setInstructions}
        isCreatingActivity={isCreatingActivity}
        onCreateActivity={handleCreateActivity}
        onReset={() => {
          setActivityName("");
          setOpenDateTime("");
          setDueDateTime("");
          setTimeLimit("While the activity is still open");
          setTitle("");
          setInstructions("");
        }}
      />

      {/* Share Invite Modal */}
      {isShareInviteOpen && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 bg-black/50"
          onClick={() => setIsShareInviteOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">
                Share Invite
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Invite students to join your class
              </p>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Class Code Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Class Code
                </label>
                <div className="flex items-center gap-3">
                  <div className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg font-mono text-lg font-semibold text-gray-800">
                    {classInfo.code}
                  </div>
                  <button
                    onClick={handleCopyCode}
                    className={`px-4 py-3 rounded-lg font-medium transition ${
                      copiedCode
                        ? "bg-green-100 text-green-700"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
                  >
                    {copiedCode ? "Copied!" : "Copy"}
                  </button>
                </div>
              </div>

              {/* Invite Link Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Invite Link
                </label>
                <div className="flex items-center gap-3">
                  <div className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 truncate">
                    {window.location.origin}/join?code={classInfo.code}
                  </div>
                  <button
                    onClick={handleCopyInviteLink}
                    className={`px-4 py-3 rounded-lg font-medium transition ${
                      copiedLink
                        ? "bg-green-100 text-green-700"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
                  >
                    {copiedLink ? "Copied!" : "Copy"}
                  </button>
                </div>
              </div>

              {/* Class Info */}
              <div className="pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Class:</span>{" "}
                  {classInfo.className || "Untitled Class"}
                </p>
                {classInfo.subject && (
                  <p className="text-sm text-gray-600 mt-1">
                    <span className="font-medium">Subject:</span>{" "}
                    {classInfo.subject}
                  </p>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setIsShareInviteOpen(false)}
                className="px-6 py-2 rounded-lg bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Announcement Modal */}
      {isEditMode && editingAnnouncement && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 bg-black/20 backdrop-blur-sm"
          style={{ animation: 'fadeIn 0.2s ease-out' }}
          onClick={handleCancelEdit}
        >
          <div
            className="bg-white rounded-3xl shadow-[0_25px_60px_rgba(15,23,42,0.18)] w-full max-w-2xl mx-4 overflow-hidden border border-indigo-50 max-h-[90vh] flex flex-col"
            style={{ animation: 'popUp 0.3s ease-out' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-[#f5f2ff] to-white border-b border-indigo-100 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold tracking-[0.3em] text-indigo-400">
                  INSTRUCTOR POST
                </p>
                <h2 className="text-lg font-semibold text-slate-800 mt-1">
                  Edit post
                </h2>
              </div>
              <button
                type="button"
                onClick={handleCancelEdit}
                className="h-9 w-9 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-500 hover:text-slate-700 hover:shadow transition"
              >
                <span className="text-lg leading-none">&times;</span>
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="overflow-y-auto flex-1">
              {/* User Row */}
              <div className="px-6 pt-5 pb-3 flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-semibold text-lg">
                  {instructorName
                    .split(" ")
                    .map((n) => n.charAt(0))
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-slate-800">{instructorName}</p>
                  <p className="text-xs text-slate-400">
                    What&apos;s happening in {classInfo.className}?
                  </p>
                </div>
              </div>

              {/* Text Input Area */}
              <div className="px-6 pb-4">
                <textarea
                  value={editingText}
                  onChange={(e) => setEditingText(e.target.value)}
                  placeholder={`Share an update with ${classInfo.className}`}
                  className="w-full min-h-[180px] px-4 py-3 border-2 border-indigo-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-300 text-gray-800 placeholder-gray-400 resize-none text-base bg-indigo-50/40"
                  autoFocus
                />
              </div>

              {editingAttachments.length > 0 && (
                <div className="px-6 pb-4">
                  {/* File List */}
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-indigo-600 uppercase tracking-[0.25em] mb-3">
                      Files ({editingAttachments.length}/6)
                    </p>
                    {editingAttachments.map((attachment) => {
                      const isNewFile = attachment.file instanceof File;
                      const fileName = isNewFile ? attachment.file.name : attachment.file?.file_name;
                      const fileSize = isNewFile ? attachment.file.size : attachment.file?.file_size;
                      const mimeType = isNewFile ? attachment.file.type : attachment.file?.mime_type;
                      const isImage = mimeType?.startsWith("image/");
                      const isVideo = mimeType?.startsWith("video/");
                      const previewUrl = isNewFile && (isImage || isVideo) ? URL.createObjectURL(attachment.file) : null;

                      return (
                        <div
                          key={attachment.id}
                          className="rounded-xl border border-indigo-100 bg-indigo-50/60 overflow-hidden"
                        >
                          {/* Preview */}
                          {previewUrl && (isImage || isVideo) && (
                            <div className="relative w-full bg-black/5 max-h-40 overflow-hidden">
                              {isImage && (
                                <img
                                  src={previewUrl}
                                  alt={fileName}
                                  className="w-full h-40 object-cover"
                                />
                              )}
                              {isVideo && (
                                <video
                                  src={previewUrl}
                                  className="w-full h-40 object-cover"
                                  controls
                                />
                              )}
                            </div>
                          )}

                          {/* File Info */}
                          <div className="flex items-center justify-between px-4 py-3 text-sm text-slate-700">
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="text-lg" aria-hidden>
                                {getAttachmentIcon(mimeType)}
                              </span>
                              <div className="min-w-0">
                                <p className="font-medium truncate">{fileName}</p>
                                <p className="text-xs text-indigo-400">
                                  {formatFileSize(fileSize)}
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleEditAttachmentRemove(attachment.id)}
                              className="text-xs font-semibold text-indigo-500 hover:text-indigo-700 transition ml-2 flex-shrink-0"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Formatting Toolbar */}
              <div className="px-6 pb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    title="Add attachment"
                    onClick={() => editFileInputRef.current?.click()}
                    className="px-4 py-2 rounded-lg border border-indigo-200 text-indigo-600 font-medium text-sm hover:bg-indigo-50 transition"
                  >
                    Add attachment
                  </button>
                </div>
              </div>

              <input
                ref={editFileInputRef}
                type="file"
                multiple
                onChange={(e) => handleEditAttachmentSelect(e.target.files)}
                className="hidden"
              />
            </div>

            {/* Footer */}
            <div className="px-6 py-4 flex items-center justify-end gap-3 bg-indigo-50/40 border-t border-indigo-100">
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-4 py-2 text-indigo-500 font-semibold hover:bg-white rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!editingText.trim()}
                onClick={handleSaveEdit}
                className={`px-6 py-2 rounded-lg font-medium transition ${
                  editingText.trim()
                    ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-200"
                    : "bg-indigo-100 text-indigo-300 cursor-not-allowed"
                }`}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Activity Modal */}
      {isEditingActivity && editingActivityData && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 overflow-y-auto"
          onClick={handleCancelActivityEdit}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl mx-4 my-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-white flex items-center justify-between p-6 border-b border-gray-200 rounded-t-2xl z-10">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleCancelActivityEdit}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <svg
                    className="w-5 h-5 text-gray-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>
                <h2 className="text-xl font-semibold text-gray-800">Edit Activity</h2>
              </div>
            </div>

            <div className="p-6 space-y-8 max-h-[calc(100vh-180px)] overflow-y-auto">
              {/* Step 1: Activity Name */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-semibold text-sm">
                    1
                  </span>
                  <h3 className="text-lg font-semibold text-gray-800">
                    Enter the name.
                  </h3>
                </div>
                <div>
                  <input
                    type="text"
                    value={editingActivityData.title}
                    onChange={(e) => setEditingActivityData({...editingActivityData, title: e.target.value})}
                    placeholder="Activity name*"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800"
                  />
                </div>
              </div>

              {/* Step 2: Add Attachment */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-semibold text-sm">
                    2
                  </span>
                  <h3 className="text-lg font-semibold text-gray-800">
                    Add Attachment.
                  </h3>
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => editFileInputRef.current?.click()}
                      className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
                    >
                      Add attachment
                    </button>
                    <p className="text-sm text-gray-500">You can add files that students will use for this activity.</p>
                  </div>

                  {editingAttachments.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {editingAttachments.map((attachment, idx) => {
                        const isNewFile = attachment.file instanceof File;
                        const fileName = isNewFile ? attachment.file.name : attachment.file?.file_name || attachment.file?.original_name;
                        const fileSize = isNewFile ? attachment.file.size : attachment.file?.file_size;
                        return (
                          <div key={attachment.id || idx} className="flex items-center justify-between p-2 bg-gray-50 border border-gray-200 rounded-lg">
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="text-sm text-gray-600 truncate">{fileName}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleEditAttachmentRemove(attachment.id)}
                              className="text-sm text-red-600 hover:underline"
                            >
                              Remove
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <input
                    ref={editFileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) => handleEditAttachmentSelect(e.target.files)}
                  />
                </div>
              </div>

              {/* Step 3: Time Restrictions */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-semibold text-sm">
                    3
                  </span>
                  <h3 className="text-lg font-semibold text-gray-800">
                    Set the time restrictions for your activity.
                  </h3>
                </div>
                <div className="space-y-6">
                  {/* Open date and time */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Open date and time*
                    </label>
                    <div className="relative">
                      <input
                        type="datetime-local"
                        value={editingActivityData.open_date_time?.slice(0, 16) || ""}
                        onChange={(e) => setEditingActivityData({...editingActivityData, open_date_time: new Date(e.target.value).toISOString()})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800"
                      />
                      <svg
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <p className="mt-2 text-sm text-gray-500">
                      This will be the date and time when your students can start the activity.
                    </p>
                  </div>

                  {/* Due date and time */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Due date and time*
                    </label>
                    <div className="relative">
                      <input
                        type="datetime-local"
                        value={editingActivityData.due_date_time?.slice(0, 16) || ""}
                        onChange={(e) => setEditingActivityData({...editingActivityData, due_date_time: new Date(e.target.value).toISOString()})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800"
                      />
                      <svg
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <p className="mt-2 text-sm text-gray-500">
                      This will be the date and time when your students cannot access the activity anymore.
                    </p>
                  </div>

                  {/* Time limit */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Time limit
                    </label>
                    <select
                      value={editingActivityData.time_limit}
                      onChange={(e) => setEditingActivityData({...editingActivityData, time_limit: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800"
                    >
                      <option>While the activity is still open</option>
                      <option>15 minutes</option>
                      <option>30 minutes</option>
                      <option>1 hour</option>
                      <option>2 hours</option>
                      <option>No limit</option>
                    </select>
                    <p className="mt-2 text-sm text-gray-500">
                      This will limit how long your students can take the activity after starting it.
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 4: Set the activity you want for student */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-semibold text-sm">
                    4
                  </span>
                  <h3 className="text-lg font-semibold text-gray-800">
                    Set the activity you want for student.
                  </h3>
                </div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Activity Type *
                </label>
                <div className="flex flex-wrap gap-3">
                  {["CodeLab", "Sim Pc", "Quiz", "Experiment"].map((activity) => (
                    <button
                      type="button"
                      key={activity}
                      onClick={() => setEditingActivityData({...editingActivityData, activity_name: activity})}
                      className={`px-4 py-2 rounded-lg font-medium transition inline-flex items-center gap-2 ${
                        editingActivityData.activity_name === activity
                          ? "bg-blue-600 text-white shadow-lg"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {activity}
                    </button>
                  ))}
                </div>
                <p className="mt-3 text-xs text-gray-500">*Required</p>
              </div>

              {/* Step 5: Instructions */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-semibold text-sm">
                    5
                  </span>
                  <h3 className="text-lg font-semibold text-gray-800">
                    Add instructions for your activity.
                  </h3>
                </div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Instructions (optional)
                </label>
                <div className="border border-gray-300 rounded-lg">
                  <textarea
                    value={editingActivityData.instructions}
                    onChange={(e) => setEditingActivityData({...editingActivityData, instructions: e.target.value})}
                    placeholder="Instructions (optional)"
                    rows="8"
                    className="w-full px-4 py-3 border-0 rounded-t-lg focus:outline-none text-gray-800 resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3 bg-gray-50 rounded-b-2xl">
              <button
                onClick={handleCancelActivityEdit}
                className="px-6 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 font-medium hover:bg-gray-100 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveActivityEdit}
                className="px-6 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition shadow-lg"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Activity Details Modal */}
      {selectedActivity && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setSelectedActivity(null)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-2xl mx-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with tabs */}
            <div className="border-b border-gray-200">
              <div className="px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-800">{selectedActivity.title}</h2>
                <button
                  onClick={() => setSelectedActivity(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>
              <div className="flex border-t border-gray-200">
                <button
                  onClick={() => {
                    setActiveActivityTab("instructions");
                    setSelectedStudent(null);
                  }}
                  className={`px-6 py-3 border-b-2 font-medium text-sm transition ${
                    activeActivityTab === "instructions"
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-gray-600 hover:text-gray-800"
                  }`}
                >
                  Instructions
                </button>
                <button
                  onClick={() => setActiveActivityTab("student-work")}
                  className={`px-6 py-3 border-b-2 font-medium text-sm transition ${
                    activeActivityTab === "student-work"
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-gray-600 hover:text-gray-800"
                  }`}
                >
                  Student work
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="max-h-[calc(100vh-300px)] overflow-y-auto">
              {activeActivityTab === "instructions" ? (
                <div className="p-6 space-y-6">
                  {(() => {
                    let cfg = selectedActivity.config_json;
                    if (typeof cfg === 'string') {
                      try { cfg = JSON.parse(cfg); } catch (e) { cfg = {}; }
                    }
                    
                    return (
                      <div className="space-y-6">
                        {/* Return button and status */}
                        <div className="flex items-center justify-between">
                          <button className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-300">
                            Return
                          </button>
                          <div className="flex items-center gap-4 text-sm">
                            <button className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 font-medium">
                              ⊙
                            </button>
                            <div className="flex items-center gap-2">
                              <span className="text-gray-600">📧</span>
                            </div>
                            <select className="px-3 py-1 rounded-lg bg-gray-100 text-gray-700 font-medium">
                              <option>100</option>
                              <option>90</option>
                              <option>80</option>
                            </select>
                          </div>
                        </div>

                        {/* Title and activity type */}
                        <div>
                          <h3 className="text-lg font-semibold text-gray-800 mb-3">{selectedActivity.title}</h3>
                          <div className="flex flex-wrap gap-2 mb-4">
                            {["CodeLab", "Sim Pc", "Quiz", "Experiment"].map((type) => (
                              <span
                                key={type}
                                className={`px-3 py-1 rounded-lg text-sm font-medium ${
                                  cfg.activity_name === type
                                    ? "bg-blue-600 text-white"
                                    : "bg-gray-100 text-gray-700"
                                }`}
                              >
                                {type}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Open and Due dates */}
                        <div className="flex gap-6 text-sm">
                          {cfg.open_date_time && (
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Opens</p>
                              <p className="text-gray-800 font-medium">{new Date(cfg.open_date_time).toLocaleString()}</p>
                            </div>
                          )}
                          {cfg.due_date_time && (
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Due</p>
                              <p className="text-gray-800 font-medium">{new Date(cfg.due_date_time).toLocaleString()}</p>
                            </div>
                          )}
                        </div>

                        {/* Instructions */}
                        {cfg.instructions && (
                          <div>
                            <p className="text-sm text-gray-600 whitespace-pre-line">{cfg.instructions}</p>
                          </div>
                        )}

                        {/* Attachments (show below instructions) */}
                        {selectedActivity?.attachments && selectedActivity.attachments.length > 0 && (
                          <div className="mt-6">
                            <h4 className="text-sm font-semibold text-gray-800 mb-3">Attachments</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {selectedActivity.attachments.map((att, idx) => (
                                (() => {
                                  // Build a reliable href to the served uploads folder.
                                  // Build preview URL and a download URL so preview and download are separate
                                  let fileUrl = '#';
                                  let downloadUrl = '#';
                                  if (att.file_path && typeof att.file_path === 'string') {
                                    if (att.file_path.startsWith('http')) {
                                      fileUrl = att.file_path;
                                      downloadUrl = att.file_path;
                                    } else if (att.file_path.startsWith('/')) {
                                      fileUrl = `${API_BASE_URL}${att.file_path}`;
                                    } else if (att.file_path.includes('uploads')) {
                                      fileUrl = `${API_BASE_URL}/${att.file_path}`;
                                    } else {
                                      fileUrl = `${API_BASE_URL}/${att.file_path}`;
                                    }
                                  } else if (att.url && typeof att.url === 'string') {
                                    fileUrl = att.url.startsWith('http') ? att.url : `${API_BASE_URL}${att.url.startsWith('/') ? '' : '/'}${att.url}`;
                                  } else if (att.stored_name && typeof att.stored_name === 'string') {
                                    fileUrl = `${API_BASE_URL}/uploads/activity_files/${att.stored_name}`;
                                    downloadUrl = `${API_BASE_URL}/activity/download/${encodeURIComponent(att.stored_name)}`;
                                  }
                                  if (!downloadUrl || downloadUrl === '#') {
                                    if (att.stored_name && typeof att.stored_name === 'string') {
                                      downloadUrl = `${API_BASE_URL}/activity/download/${encodeURIComponent(att.stored_name)}`;
                                    } else {
                                      downloadUrl = fileUrl;
                                    }
                                  }
                                  const isImage = att.mime_type && att.mime_type.startsWith('image/');
                                  const isVideo = att.mime_type && att.mime_type.startsWith('video/');

                                  return (
                                    <div key={att.id || att.stored_name || `${idx}-${att.original_name || att.file_name}`} className="border rounded-lg p-3 bg-gray-50 flex items-center gap-3">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          // If image or video, show in modal; else open in new tab
                                          if (isImage || isVideo) {
                                            setAttachmentPreview({ type: isImage ? 'image' : 'video', src: fileUrl, name: att.original_name || att.file_name });
                                          } else {
                                            window.open(downloadUrl, '_blank', 'noopener');
                                          }
                                        }}
                                        className="flex-shrink-0 rounded-md overflow-hidden"
                                      >
                                        {isImage ? (
                                          <img src={fileUrl} alt={att.original_name || att.file_name} className="w-24 h-16 object-cover rounded-md" />
                                        ) : isVideo ? (
                                          <video src={fileUrl} className="w-24 h-16 object-cover rounded-md" />
                                        ) : (
                                          <div className="w-12 h-12 rounded-md bg-white flex items-center justify-center text-xl">📎</div>
                                        )}
                                      </button>

                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-800 truncate">{att.original_name || att.file_name || att.name}</p>
                                        <p className="text-xs text-gray-500">{att.mime_type || ''} {att.file_size ? `• ${formatFileSize(att.file_size)}` : ''}</p>
                                      </div>

                                      <a href={downloadUrl} target="_blank" rel="noreferrer" download className="ml-3 px-3 py-1 rounded-lg bg-blue-100 text-blue-700 text-xs font-medium">Download</a>
                                    </div>
                                  );
                                })()
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <div className="p-6">
                  {!selectedStudent ? (
                    <div className="space-y-4">
                      {/* Student Work Header */}
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-800">{selectedActivity.title}</h3>
                          <p className="text-sm text-gray-500 mt-1">Review and grade student submissions</p>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="flex gap-6 mb-6">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-gray-800">{Object.keys(studentSubmissions).length}</p>
                          <p className="text-xs text-gray-500 mt-1">Turned in</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-gray-800">{students.length}</p>
                          <p className="text-xs text-gray-500 mt-1">Assigned</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-gray-800">{gradedCount}</p>
                          <p className="text-xs text-gray-500 mt-1">Graded</p>
                        </div>
                      </div>

                      {/* Student List */}
                      <div className="border-t border-gray-200 pt-4">
                        <div className="flex items-center justify-between mb-4">
                          <label className="flex items-center gap-2">
                            <input type="checkbox" className="w-4 h-4" />
                            <span className="text-sm font-medium text-gray-700">All students</span>
                          </label>
                          <select className="px-3 py-1 border border-gray-300 rounded-lg text-sm">
                            <option>Sort by status</option>
                            <option>Turned in</option>
                            <option>Not turned in</option>
                            <option>Graded</option>
                          </select>
                        </div>

                        {/* Student submissions */}
                        <div className="space-y-3 mt-4">
                          {students.length > 0 ? (
                            students.map((student) => {
                              const hasSubmission = studentSubmissions[student.user_id];
                              return (
                                <div
                                  key={student.user_id}
                                  onClick={() => handleSelectStudent(student)}
                                  className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg hover:bg-blue-50 cursor-pointer transition"
                                >
                                  <div className="flex items-center gap-3">
                                    <input type="checkbox" className="w-4 h-4" />
                                    <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center">
                                      {student.avatarUrl ? (
                                        <img
                                          src={student.avatarUrl}
                                          alt={`${student.username} avatar`}
                                          className="w-full h-full object-cover"
                                        />
                                      ) : (
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-white flex items-center justify-center font-semibold text-sm">
                                          {student.username ? student.username.charAt(0).toUpperCase() : "S"}
                                        </div>
                                      )}
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium text-gray-800">{student.username}</p>
                                      {hasSubmission ? (
                                        <p className="text-xs text-green-600 font-medium">✓ Submitted {new Date(hasSubmission.submitted_at).toLocaleDateString()}</p>
                                      ) : (
                                        <p className="text-xs text-gray-500">Not submitted</p>
                                      )}
                                    </div>
                                  </div>
                                  <span className="px-3 py-1 rounded-lg bg-white border border-gray-200 text-gray-700 text-sm font-medium">
                                    {hasSubmission && hasSubmission.grade !== null && hasSubmission.grade !== undefined
                                      ? hasSubmission.grade
                                      : '-'}
                                  </span>
                                </div>
                              );
                            })
                          ) : (
                            <p className="text-center text-gray-500 py-8">No students in this class</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Back button */}
                      <button
                        onClick={() => setSelectedStudent(null)}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition"
                      >
                        ← Back
                      </button>

                      {/* Student detail */}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">{selectedStudent.username}</h3>
                        <div className="flex items-center gap-3 mb-6 p-4 bg-gray-50 rounded-lg">
                          <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center bg-gray-100">
                            {selectedStudent?.avatarUrl ? (
                              <img
                                src={selectedStudent.avatarUrl}
                                alt={`${selectedStudent.username} avatar`}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-white flex items-center justify-center font-semibold">
                                {selectedStudent.username.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">{selectedStudent.username}</p>
                            <p className="text-sm text-gray-500">{selectedStudent.email}</p>
                          </div>
                        </div>

                        {/* Student Submission Files */}
                        <div className="border-t border-gray-200 pt-4 mt-4">
                          <h4 className="text-sm font-semibold text-gray-800 mb-3">Student Submission</h4>
                          {studentSubmissions[selectedStudent.user_id] ? (
                            <div className="space-y-4">
                              {/* Submission Text */}
                              {studentSubmissions[selectedStudent.user_id].submission_text && (
                                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{studentSubmissions[selectedStudent.user_id].submission_text}</p>
                                </div>
                              )}

                              {/* Submission Attachments */}
                              {(() => {
                                const attachments = studentSubmissions[selectedStudent.user_id].attachments || [];
                                const { latest, history } = splitCurrentAndHistory(attachments);

                                return (
                                  <>
                                    {latest && latest.length > 0 && (
                                      <div className="space-y-2">
                                        <h5 className="text-xs font-semibold text-gray-700 uppercase">Attached Files</h5>
                                        {latest.map((file, idx) => {
                                    let href = '#';
                                    // Build href from url, file_path, or stored_name
                                    if (file.url && typeof file.url === 'string') {
                                      if (file.url.startsWith('http')) {
                                        href = file.url;
                                      } else if (file.url.startsWith('/')) {
                                        href = `${API_BASE_URL}${file.url}`;
                                      } else if (file.url.includes('uploads')) {
                                        href = `${API_BASE_URL}/${file.url}`;
                                      } else {
                                        href = `${API_BASE_URL}/${file.url}`;
                                      }
                                    } else if (file.file_path && typeof file.file_path === 'string') {
                                      if (file.file_path.startsWith('http')) {
                                        href = file.file_path;
                                      } else if (file.file_path.startsWith('/')) {
                                        href = `${API_BASE_URL}${file.file_path}`;
                                      } else {
                                        href = `${API_BASE_URL}/${file.file_path}`;
                                      }
                                    } else if (file.stored_name && typeof file.stored_name === 'string') {
                                      href = `${API_BASE_URL}/uploads/activity_files/${file.stored_name}`;
                                    }

                                    const isImage = file.mime_type && file.mime_type.startsWith('image/');
                                    const isVideo = file.mime_type && file.mime_type.startsWith('video/');
                                    const isPdf = file.mime_type && file.mime_type.includes('pdf');
                                    const icon = isImage ? '🖼️' : isVideo ? '🎥' : isPdf ? '📄' : '📎';
                                    
                                    return (
                                      <div
                                        key={idx}
                                        className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition"
                                      >
                                        <button
                                          type="button"
                                          onClick={() => {
                                            if (isImage || isVideo) {
                                              setAttachmentPreview({ type: isImage ? 'image' : 'video', src: href, name: file.original_name });
                                            } else {
                                              window.open(href, '_blank', 'noopener');
                                            }
                                          }}
                                          className="flex items-center gap-3 flex-1 min-w-0 text-left hover:opacity-80 transition"
                                        >
                                          <span className="text-lg" aria-hidden>{icon}</span>
                                          <div className="min-w-0 flex-1">
                                            <p className="text-sm font-medium text-gray-800 truncate">{file.original_name}</p>
                                            <p className="text-xs text-gray-500">{file.mime_type || ''}</p>
                                          </div>
                                        </button>
                                        <a
                                          href={href}
                                          download
                                          className="ml-2 px-3 py-1 rounded-lg bg-blue-100 text-blue-600 text-xs font-medium hover:bg-blue-200 transition flex-shrink-0"
                                        >
                                          Download
                                        </a>
                                      </div>
                                    );
                                        })}
                                      </div>
                                    )}

                              {/* --- Attached File History (new) --- */}
                                    {history && history.length > 0 && (
                                      <div className="space-y-2 mt-4">
                                        <h5 className="text-xs font-semibold text-gray-700 uppercase">History</h5>
                                        {history.map((file, idx) => {
                                    // reuse same href logic as the current attachments list
                                    let href = '#';
                                    if (file.url && typeof file.url === 'string') {
                                      if (file.url.startsWith('http')) {
                                        href = file.url;
                                      } else if (file.url.startsWith('/')) {
                                        href = `${API_BASE_URL}${file.url}`;
                                      } else {
                                        href = `${API_BASE_URL}/${file.url}`;
                                      }
                                    } else if (file.file_path && typeof file.file_path === 'string') {
                                      if (file.file_path.startsWith('http')) {
                                        href = file.file_path;
                                      } else if (file.file_path.startsWith('/')) {
                                        href = `${API_BASE_URL}${file.file_path}`;
                                      } else {
                                        href = `${API_BASE_URL}/${file.file_path}`;
                                      }
                                    } else if (file.stored_name && typeof file.stored_name === 'string') {
                                      href = `${API_BASE_URL}/uploads/activity_files/${file.stored_name}`;
                                    }

                                    const isImage = file.mime_type && file.mime_type.startsWith('image/');
                                    const isVideo = file.mime_type && file.mime_type.startsWith('video/');
                                    const isPdf = file.mime_type && file.mime_type.includes('pdf');
                                    const icon = isImage ? '🖼️' : isVideo ? '🎥' : isPdf ? '📄' : '📎';

                                    return (
                                      <div key={`history-${idx}`} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-lg">
                                        {/* History entries are read-only (non-clickable) and have no download action */}
                                        <div className="flex items-center gap-3 flex-1 min-w-0 text-left">
                                          <span className="text-lg text-gray-400" aria-hidden>{icon}</span>
                                          <div className="min-w-0 flex-1">
                                            <p className="text-sm font-medium text-gray-600 truncate">{file.original_name}</p>
                                            <p className="text-xs text-gray-400">{formatFileSize(file.file_size) || file.mime_type || ''}</p>
                                          </div>
                                        </div>
                                        <div className="ml-2 px-3 py-1 rounded-lg bg-transparent text-gray-400 text-xs font-medium flex-shrink-0">Unavailable</div>
                                      </div>
                                    );
                                      })}
                                      </div>
                                    )}
                                  </>
                                );
                              })()}

                              {/* Submitted Date */}
                              {studentSubmissions[selectedStudent.user_id].submitted_at && (
                                <p className="text-xs text-gray-500">
                                  Submitted on {new Date(studentSubmissions[selectedStudent.user_id].submitted_at).toLocaleString()}
                                </p>
                              )}
                            </div>
                          ) : (
                            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-center">
                              <p className="text-sm text-gray-500">No submission yet</p>
                            </div>
                          )}
                        </div>

                        {/* Grading section */}
                        <div className="space-y-4 mt-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Grade</label>
                            <div className="flex gap-2">
                              <input
                                type="number"
                                value={studentGrade}
                                onChange={(e) => setStudentGrade(e.target.value)}
                                placeholder="0"
                                min="0"
                                max="100"
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                              />
                              <span className="flex items-center px-3 py-2 bg-gray-100 rounded-lg text-gray-700 font-medium">/100</span>
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Feedback</label>
                            <textarea
                              value={studentFeedback}
                              onChange={(e) => setStudentFeedback(e.target.value)}
                              placeholder="Add feedback for the student..."
                              rows="4"
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                            />
                          </div>

                          <div className="flex gap-3 pt-4">
                            <button onClick={handleSaveGrade} className="flex-1 px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition">
                              Save Grade
                            </button>
                            <button
                              onClick={() => { setSelectedStudent(null); setStudentGrade(''); setStudentFeedback(''); }}
                              className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer with action buttons */}
            <div className="px-6 py-4 border-t border-gray-200 flex gap-3 justify-end bg-gray-50">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditActivity(selectedActivity);
                  setSelectedActivity(null);
                }}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition"
              >
                Edit
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm('Delete this activity?')) {
                    handleDeleteActivity(selectedActivity.activity_id);
                    setSelectedActivity(null);
                  }
                }}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-100 transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Attachment Preview Modal */}
      {attachmentPreview && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60" onClick={() => setAttachmentPreview(null)}>
          <div className="max-w-[90vw] max-h-[90vh] bg-white rounded-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-3 border-b flex items-center justify-between">
              <div className="text-sm font-medium">{attachmentPreview.name}</div>
              <button onClick={() => setAttachmentPreview(null)} className="px-3 py-1 rounded bg-gray-100">Close</button>
            </div>
            <div className="p-4">
              {attachmentPreview.type === 'image' ? (
                <img src={attachmentPreview.src} alt={attachmentPreview.name} className="max-w-full max-h-[75vh] object-contain" />
              ) : (
                <video src={attachmentPreview.src} controls className="max-w-full max-h-[75vh]" />
              )}
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

export default SubClass;

