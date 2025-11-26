import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Header from "../../web_components/Header";
import HomeIcon from "@mui/icons-material/Home";
import SettingsIcon from "@mui/icons-material/Settings";
import ArchiveIcon from "@mui/icons-material/Archive";
import AssignmentIcon from "@mui/icons-material/Assignment";
import MenuIcon from "@mui/icons-material/Menu";
import NotificationsIcon from "@mui/icons-material/Notifications";
import CloseIcon from "@mui/icons-material/Close";

function StudentDashboard() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [showJoinModal, setShowJoinModal] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const [menuOpenFor, setMenuOpenFor] = useState(null);
  const [username, setUsername] = useState(localStorage.getItem("username") || "Student");
  const [isEditingName, setIsEditingName] = useState(false);
  const [editingName, setEditingName] = useState(username);
  const email = localStorage.getItem("email") || "";
  const initials = username
    .split(" ")
    .map((n) => n.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const fileInputRef = useRef(null);
  const storageKey = `profileImage_${username}`;
  const [profileImage, setProfileImage] = useState(() => localStorage.getItem(storageKey) || null);

  // On mount, if no profile image in localStorage, try fetching from server for current user
  React.useEffect(() => {
    const tryLoad = async () => {
      if (profileImage) return;
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const resp = await fetch('http://localhost:5000/user/me/avatar', { headers: { Authorization: `Bearer ${token}` } });
        if (!resp.ok) return;
        const data = await resp.json();
        const url = data.avatar?.file_path || null;
        if (url) {
          const abs = url.startsWith('http') ? url : `http://localhost:5000${url}`;
          try { localStorage.setItem(storageKey, abs); } catch {}
          setProfileImage(abs);
        }
      } catch (err) {
        // ignore
      }
    };
    tryLoad();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!menuOpenFor) return;
    const handleDocClick = (e) => {
      if (!e.target.closest('[data-menu-ignore]')) {
        setMenuOpenFor(null);
      }
    };
    document.addEventListener('mousedown', handleDocClick);
    return () => document.removeEventListener('mousedown', handleDocClick);
  }, [menuOpenFor]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const fetchActiveClasses = async () => {
      try {
        const response = await axios.get(
          "http://localhost:5000/student/active-classes",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setClasses(response.data?.activeClasses || []);
      } catch (err) {
        console.error("❌ Error fetching active classes:", err);
        if (err.response?.status === 401) {
          alert("Session expired. Please log in again.");
          localStorage.removeItem("token");
          navigate("/login");
        } else {
          alert(err.response?.data?.message || "Failed to load classes.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchActiveClasses();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const handleJoinClass = async () => {
    if (!joinCode.trim()) {
      alert("Please enter a class code.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        "http://localhost:5000/student/join-class",
        { classCode: joinCode },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const subject = response.data?.subject;
      if (subject) {
        // Navigate to student subclass view with the subject data
        setShowJoinModal(false);
        setJoinCode("");
        navigate('/student/subclass', { state: { classData: subject } });
        return;
      }

      alert(response.data?.message || "Successfully joined the class!");
      setShowJoinModal(false);
      setJoinCode("");
    } catch (err) {
      console.error("❌ Error joining class:", err);
      alert(err.response?.data?.message || "Failed to join class.");
    }
  };

  const toggleMenu = (id) => {
    setMenuOpenFor((prev) => (prev === id ? null : id));
  };

  const handleUnenroll = async (cls) => {
    const id = cls.subject_id || cls.class_id || cls.id;
    const confirmLeave = window.confirm('Are you sure you want to unenroll from this class?');
    if (!confirmLeave) return;

    try {
      const token = localStorage.getItem('token');
      // Try to call backend leave endpoint (may not exist yet)
      await axios.post(
        'http://localhost:5000/student/leave-class',
        { subjectId: id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Remove from local state
      setClasses((prev) => prev.filter((c) => (c.subject_id || c.class_id || c.id) !== id));
      setMenuOpenFor(null);
      alert('You have been unenrolled from the class.');
    } catch (err) {
      console.error('❌ Error unenrolling from class:', err);
      // If backend doesn't exist or fails, still remove locally as fallback
      if (!err.response) {
        setClasses((prev) => prev.filter((c) => (c.subject_id || c.class_id || c.id) !== id));
        setMenuOpenFor(null);
        alert('Local unenroll applied (server call failed).');
      } else {
        alert(err.response?.data?.message || 'Failed to unenroll.');
      }
    }
  };

  useEffect(() => {
    if (showJoinModal && inputRef.current) {
      // small timeout to ensure modal is in DOM
      setTimeout(() => inputRef.current.focus(), 50);
    }
  }, [showJoinModal]);

  useEffect(() => {
    // Mocked notifications for UI; replace with API call when available
    // keep initial mock empty; real data will be fetched after classes load
    setNotifications([]);
  }, []);

  useEffect(() => {
    // when notifications change, update unread count
    const count = notifications.filter((n) => !n.read).length;
    setUnreadCount(count);
  }, [notifications]);

  useEffect(() => {
    // fetch announcements and activities for each active class and merge into notifications
    const token = localStorage.getItem('token');
    if (!token) return;
    if (!classes || classes.length === 0) return;

    const fetchForClass = async (cls) => {
      try {
        const subjectId = cls.subject_id || cls.class_id || cls.id;
        const annP = axios.get(`http://localhost:5000/student/announcements?subject_id=${subjectId}`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: { announcements: [] } }));
        const actP = axios.get(`http://localhost:5000/student/activities?subject_id=${subjectId}`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: [] }));

        const [annRes, actRes] = await Promise.all([annP, actP]);

        const anns = (annRes.data?.announcements || []).map((a) => ({
          id: `ann-${a.announcement_id}`,
          type: 'announcement',
          subjectId: subjectId,
          creatorName: a.instructor_name || cls.instructor_name || 'Instructor',
          creatorId: a.instructor_id || cls.instructor_id || null,
          title: a.instructor_name ? `${a.instructor_name} posted` : 'New announcement',
          message: (a.content || '').slice(0, 200),
          time: a.created_at || a.updated_at || new Date().toISOString(),
          raw: a,
          read: false,
          clickedCount: 0,
        }));

        const acts = (Array.isArray(actRes.data) ? actRes.data : (actRes.data?.activities || [])).map((act) => ({
          id: `act-${act.activity_id}`,
          type: 'activity',
          subjectId: subjectId,
          creatorName: cls.instructor_name || act.instructor_name || 'Instructor',
          creatorId: act.instructor_id || cls.instructor_id || null,
          title: act.title || 'New classwork',
          message: (act.description || act.config_json?.instructions || '').slice(0, 200),
          time: act.created_at || new Date().toISOString(),
          raw: act,
          read: false,
          clickedCount: 0,
        }));

        return [...anns, ...acts];
      } catch (err) {
        return [];
      }
    };

    (async () => {
      try {
        const all = await Promise.all(classes.map((c) => fetchForClass(c)));
        const flat = all.flat();
        // merge with existing notifications but avoid duplicates
        const existingIds = new Set(notifications.map((n) => n.id));
        const merged = [
          ...flat.filter((n) => !existingIds.has(n.id)),
          ...notifications,
        ];
        // sort by time desc
        merged.sort((a, b) => new Date(b.time) - new Date(a.time));
        // fetch avatars for unique creatorIds
        const creatorIds = Array.from(new Set(merged.map(n => n.creatorId).filter(Boolean)));
        if (creatorIds.length > 0) {
          try {
            const token = localStorage.getItem('token');
            // fetch avatars in parallel
            const avatarPromises = creatorIds.map(id => fetch(`http://localhost:5000/user/${id}/avatar`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.ok ? r.json().catch(() => null) : null).catch(() => null));
            const avatarResults = await Promise.all(avatarPromises);
            const avatarById = {};
            avatarResults.forEach((res, i) => {
              if (res && res.avatar && res.avatar.file_path) {
                const path = res.avatar.file_path;
                avatarById[creatorIds[i]] = path.startsWith('http') ? path : `http://localhost:5000${path}`;
              }
            });
            // attach avatarUrl to notifications
            const withAvatars = merged.map(n => ({ ...n, avatarUrl: n.creatorId ? avatarById[n.creatorId] || null : null }));
            setNotifications(withAvatars);
          } catch (err) {
            console.error('Failed to fetch avatars for notifications', err);
            setNotifications(merged);
          }
        } else {
          setNotifications(merged);
        }
      } catch (err) {
        console.error('Failed to fetch class notifications:', err);
      }
    })();

  }, [classes]);

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-[#E0EAFC] to-[#CFDEF3] transition-all duration-500">
      {/* Sidebar */}
      {/* Inline Sidebar (moved from ./Sidebar) */}
      {/* Visible on md+ screens, toggled on small screens via `sidebarOpen` */}
      <aside
        className={`fixed top-0 left-0 h-full w-72 bg-white border-r-2 border-gray-200 shadow-lg transform transition-transform duration-300 ease-in-out z-50 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
      >
        <div className="text-center mt-20 mb-6">
          <div className="flex items-center justify-center gap-2">
            {!isEditingName ? (
              <>
                <h2 className="text-3xl font-bold text-blue-600 tracking-wide">{username}</h2>
                <button onClick={() => { setEditingName(username); setIsEditingName(true); }} className="text-gray-400 hover:text-gray-600 ml-1" title="Edit name">✎</button>
              </>
            ) : (
              <input
                autoFocus
                className="text-3xl font-bold text-blue-600 tracking-wide text-center outline-none"
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const newName = editingName.trim() || 'Student';
                    const oldKey = `profileImage_${username}`;
                    const newKey = `profileImage_${newName}`;
                    try {
                      const val = localStorage.getItem(oldKey);
                      if (val) {
                        localStorage.setItem(newKey, val);
                        localStorage.removeItem(oldKey);
                      }
                    } catch {}
                    localStorage.setItem('username', newName);
                    setUsername(newName);
                    setIsEditingName(false);
                  } else if (e.key === 'Escape') {
                    setIsEditingName(false);
                  }
                }}
                onBlur={() => {
                  const newName = editingName.trim() || 'Student';
                  const oldKey = `profileImage_${username}`;
                  const newKey = `profileImage_${newName}`;
                  try {
                    const val = localStorage.getItem(oldKey);
                    if (val) {
                      localStorage.setItem(newKey, val);
                      localStorage.removeItem(oldKey);
                    }
                  } catch {}
                  localStorage.setItem('username', newName);
                  setUsername(newName);
                  setIsEditingName(false);
                }}
              />
            )}
          </div>
          <p className="text-sm text-gray-500">Student</p>

          <div className="mt-3 flex flex-col items-center justify-center -ml-1">
            <button
              onClick={() => setIsProfileOpen(true)}
              className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-blue-400 to-blue-600 text-white flex items-center justify-center font-semibold hover:shadow-lg hover:scale-110 transition-all cursor-pointer"
            >
              {profileImage ? (
                <img src={profileImage} alt="profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-lg">{initials}</span>
              )}
            </button>
            {email && <p className="text-sm font-semibold text-black mt-3">{email}</p>}
          </div>
        </div>

        <div className="flex flex-col p-4 space-y-3">
          <button
            onClick={() => navigate('/student/StudentDashboard')}
            className="flex items-center gap-4 text-gray-700 hover:text-blue-600 hover:bg-blue-50 p-4 rounded-xl text-lg font-medium transition-all duration-200"
          >
            <HomeIcon fontSize="large" />
            <span>Home</span>
          </button>

          <button
            onClick={() => navigate('/student/todo')}
            className="flex items-center gap-4 text-gray-700 hover:text-blue-600 hover:bg-blue-50 p-4 rounded-xl text-lg font-medium transition-all duration-200"
          >
            <AssignmentIcon fontSize="large" />
            <span>To Do</span>
          </button>

          <button
            onClick={() => navigate('/student/archived')}
            className="flex items-center gap-4 text-gray-700 hover:text-blue-600 hover:bg-blue-50 p-4 rounded-xl text-lg font-medium transition-all duration-200"
          >
            <ArchiveIcon fontSize="large" />
            <span>Archived</span>
          </button>

          <button
            onClick={() => navigate('/student/setting')}
            className="flex items-center gap-4 text-gray-700 hover:text-blue-600 hover:bg-blue-50 p-4 rounded-xl text-lg font-medium transition-all duration-200"
          >
            <SettingsIcon fontSize="large" />
            <span>Settings</span>
          </button>
        </div>

        <div className="absolute bottom-6 left-0 w-full text-center text-gray-400 text-sm">
          © 2025 VirtuLab
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <Header
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onLogout={handleLogout}
        />

        <main className="flex-grow p-6 md:p-10 pt-28 md:pt-24 relative md:ml-72">
          {/* Join Class + Notifications Buttons */}
          <div className="absolute top-28 right-10 z-50 flex items-center gap-3">
            <div className="relative">
              <button
                onClick={() => {
                  setIsNotifOpen(true);
                }}
                className="flex items-center justify-center w-12 h-12 rounded-full bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 shadow-md transition-all"
                title="Notifications"
              >
                <NotificationsIcon />
              </button>

              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-semibold leading-none text-white bg-red-500 rounded-full">{unreadCount}</span>
              )}
            </div>

            <button
              onClick={() => setShowJoinModal(true)}
              className="flex items-center gap-2 border border-gray-400 text-gray-800 hover:bg-gray-100 px-4 py-2 rounded-full font-medium transition-all bg-white shadow-md"
            >
              <span className="text-lg">＋</span> Join Class
            </button>
          </div>


          {/* Welcome Message */}
          <h1 className="text-3xl font-bold text-gray-800 mb-10 text-center drop-shadow-sm">
            Welcome, Student!
          </h1>

          {/* Games & Activities Section (new compact card layout) */}
          <div className="bg-white/70 backdrop-blur-md rounded-2xl shadow-sm p-8 mb-12">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Explore</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div
                onClick={() => navigate('/student/dashboard')}
                className="rounded-xl p-4 flex items-center gap-4 shadow-md cursor-pointer"
                style={{
                  background: "linear-gradient(90deg,#E0EAFC 0%,#D9E9FB 50%,#CFDEF3 100%)",
                  color: "#0f172a",
                  boxShadow: "0 10px 25px rgba(13,78,155,0.06)",
                }}
              >
                <div className="h-12 w-12 rounded-lg flex items-center justify-center bg-white border border-white/60">
                  <span className="text-xl">🎮</span>
                </div>
                <div>
                  <div className="text-sm font-semibold">Games</div>
                  <div className="text-xs mt-1 opacity-80">Play and learn with fun interactive games.</div>
                </div>
              </div>

              <div
                className="rounded-xl p-4 flex items-center gap-4 shadow-md cursor-pointer"
                style={{
                  background: "linear-gradient(90deg,#E0EAFC 0%,#D9E9FB 50%,#CFDEF3 100%)",
                  color: "#0f172a",
                  boxShadow: "0 10px 25px rgba(13,78,155,0.06)",
                }}
              >
                <div className="h-12 w-12 rounded-lg flex items-center justify-center bg-white border border-white/60">
                  <span className="text-xl">🧩</span>
                </div>
                <div>
                  <div className="text-sm font-semibold">Activities</div>
                  <div className="text-xs mt-1 opacity-80">Explore activities and interactive lessons.</div>
                </div>
              </div>
            </div>
          </div>

          {/* My Classes Section */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">
              My Classes
            </h2>

            {loading ? (
              <p className="text-center text-gray-600">Loading classes...</p>
            ) : classes.length === 0 ? (
              <div className="bg-white/70 backdrop-blur-md p-8 rounded-2xl shadow-sm flex justify-center items-center">
                <p className="text-gray-600 text-lg font-medium">
                  No active classes.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                {classes.map((cls, index) => {
                  const classTitle = cls.title || "Untitled Class";
                  const initials = classTitle.slice(0, 2).charAt(0).toUpperCase() + classTitle.slice(1, 2).toLowerCase();

                  // Matching gradient palette with instructor dashboard - assigned by class ID hash
                  const colors = [
                    "linear-gradient(135deg, #E6F3FF 0%, #DCEFFF 100%)",
                    "linear-gradient(135deg, #FFF7ED 0%, #FFF1D6 100%)",
                    "linear-gradient(135deg, #EAF8FF 0%, #E6FFF4 100%)",
                    "linear-gradient(135deg, #F6EEFF 0%, #F0E8FF 100%)",
                    "linear-gradient(135deg, #E8FFF7 0%, #E6FFF0 100%)",
                    "linear-gradient(135deg, #FFF6F9 0%, #FFF2F0 100%)",
                  ];
                  // Use class ID to consistently assign color (same class = same color)
                  const classId = cls.subject_id || cls.class_id || cls.id;
                  const colorIndex = Array.from(classId.toString()).reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
                  const gradientColor = colors[colorIndex];

                  return (
                    <div
                      key={cls.subject_id || cls.class_id || cls.id}
                      onClick={() => navigate('/student/subclass', { state: { classData: cls } })}
                      className="relative bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl shadow-md p-6 flex flex-col hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                    >
                      <span className="absolute top-4 right-4 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-md">
                        Active
                      </span>

                      {/* Gradient Box with Initials */}
                      <div className="flex justify-center mb-4">
                        <div
                          style={{
                            background: gradientColor,
                          }}
                          className="h-16 w-16 rounded-xl flex items-center justify-center shadow-md"
                        >
                          <span className="text-2xl font-bold text-blue-700">
                            {initials}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col items-center text-center mb-3">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {classTitle}
                        </h3>
                      </div>

                      <p className="text-sm text-gray-600 mb-4 line-clamp-2 text-center">
                        {cls.description || "No description available."}
                      </p>

                      {cls.instructor_name && (
                        <p className="text-xs text-gray-500">
                          Instructor: <span className="font-medium">{cls.instructor_name}</span>
                        </p>
                      )}
                      {/* Burger menu (lower-right) */}
                      <button
                        data-menu-ignore
                        onClick={(e) => {
                          e.stopPropagation();
                          const id = cls.subject_id || cls.class_id || cls.id;
                          toggleMenu(id);
                        }}
                        className="absolute bottom-4 right-4 p-2 rounded-full bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 shadow"
                        title="Options"
                      >
                        <MenuIcon fontSize="small" />
                      </button>

                      {menuOpenFor === (cls.subject_id || cls.class_id || cls.id) && (
                        <div
                          data-menu-ignore
                          onClick={(e) => e.stopPropagation()}
                          className="absolute bottom-14 right-4 bg-white border border-gray-200 rounded-md shadow-md z-50"
                        >
                          <button
                            onClick={() => handleUnenroll(cls)}
                            className="block px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                          >
                            Unenroll
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </main>
      </div>

      {/* Join Class Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50">
          <div className="bg-white rounded-2xl shadow-lg p-8 w-[90%] max-w-md">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 text-center">
              Join a Class
            </h2>
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              placeholder="Enter class code"
              className="w-full border border-gray-300 rounded-lg p-3 mb-4 text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400"
              ref={inputRef}
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowJoinModal(false)}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleJoinClass}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-all"
              >
                Join
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notifications Slide-over */}
      {isNotifOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setIsNotifOpen(false)} />

          <aside className="relative ml-auto w-full max-w-3xl bg-white h-full shadow-2xl">
            <div className="flex items-center justify-between p-6">
              <h3 className="text-2xl font-extrabold text-gray-900">Notifications</h3>
              <button onClick={() => setIsNotifOpen(false)} className="p-2 rounded-full text-gray-600 hover:bg-gray-100">
                <CloseIcon />
              </button>
            </div>

            <div className="p-4 overflow-y-auto h-[calc(100%-64px)]">
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-500 mb-2">Today</h4>
                <div className="space-y-4">
                  {notifications.filter(n => !n.read).map(n => (
                    <div key={n.id} onClick={() => {
                      // mark as read on first click and increment clickedCount
                      setNotifications((prev) => prev.map((p) => p.id === n.id ? { ...p, clickedCount: (p.clickedCount || 0) + 1, read: true } : p));
                      const cls = classes.find(c => (c.subject_id || c.class_id || c.id) === n.subjectId);
                      if (cls) {
                        setIsNotifOpen(false);
                        navigate('/student/subclass', { state: { classData: cls, initialTab: n.type === 'announcement' ? 'newsfeed' : 'classwork' } });
                      }
                    }} className="flex items-start gap-4 p-4 bg-white rounded-md shadow-sm border border-gray-100 cursor-pointer">
                      <div className="h-12 w-12 rounded-full overflow-hidden flex items-center justify-center">
                        {n.avatarUrl ? (
                          <img src={n.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                        ) : (
                          <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-700 font-semibold">{(n.creatorName||'G').charAt(0).toUpperCase()}</div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-semibold text-gray-800">{n.creatorName}</span>
                              <span className="text-sm text-gray-700">{n.type === 'announcement' ? 'Post an announcement in' : 'Post activity in'}</span>
                              {n.type === 'announcement' ? (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">Newsfeed</span>
                              ) : (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">Classwork</span>
                              )}
                            </div>
                          </div>
                          <div className="text-xs text-gray-400 whitespace-nowrap ml-2">{new Date(n.time).toLocaleString()}</div>
                        </div>
                        <div className="text-sm text-gray-600 mt-2">{n.type === 'activity' ? n.title : n.message}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">Earlier</h4>
                <div className="space-y-4">
                  {notifications.filter(n => n.read).map(n => (
                    <div key={n.id} onClick={() => {
                      // increment clicked count for read notifications as well
                      setNotifications((prev) => prev.map((p) => p.id === n.id ? { ...p, clickedCount: (p.clickedCount || 0) + 1 } : p));
                      const cls = classes.find(c => (c.subject_id || c.class_id || c.id) === n.subjectId);
                      if (cls) {
                        setIsNotifOpen(false);
                        navigate('/student/subclass', { state: { classData: cls, initialTab: n.type === 'announcement' ? 'newsfeed' : 'classwork' } });
                      }
                    }} className="flex items-start gap-4 p-4 bg-gray-50 rounded-md border border-gray-100 cursor-pointer">
                      <div className="h-12 w-12 rounded-full overflow-hidden flex items-center justify-center">
                        {n.avatarUrl ? (
                          <img src={n.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                        ) : (
                          <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-semibold">{(n.creatorName||'G').charAt(0).toUpperCase()}</div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-semibold text-gray-800">{n.creatorName}</span>
                              <span className="text-sm text-gray-700">{n.type === 'announcement' ? 'Post an announcement in' : 'Post activity in'}</span>
                              {n.type === 'announcement' ? (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">Newsfeed</span>
                              ) : (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">Classwork</span>
                              )}
                            </div>
                          </div>
                          <div className="text-xs text-gray-400 whitespace-nowrap ml-2">{new Date(n.time).toLocaleString()}</div>
                        </div>
                        <div className="text-sm text-gray-600 mt-2">{n.type === 'activity' ? n.title : n.message}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* Profile modal for student */}
      {isProfileOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50" onClick={() => setIsProfileOpen(false)}>
          <div className="bg-white rounded-2xl shadow-lg p-6 w-[90%] max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-end">
              <button onClick={() => setIsProfileOpen(false)} className="text-gray-500 hover:text-gray-700 text-xl">&times;</button>
            </div>

            <div className="flex flex-col items-center gap-4 pt-2">
              <div className="w-28 h-28 rounded-full overflow-hidden bg-gradient-to-br from-blue-400 to-blue-600 text-white flex items-center justify-center text-2xl font-bold">
                {profileImage ? (
                  <img src={profileImage} alt="profile" className="w-full h-full object-cover" />
                ) : (
                  initials
                )}
              </div>
              {email && <p className="text-sm font-semibold text-black mt-3">{email}</p>}
              <div className="flex items-center gap-3">
                <button onClick={() => fileInputRef.current?.click()} className="mt-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition">Change profile</button>
                <button onClick={() => setIsProfileOpen(false)} className="mt-2 px-4 py-2 rounded-lg bg-gray-100 text-sm font-medium hover:bg-gray-200 transition">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hidden file input for student profile image selection */}
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={async (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        try {
          const token = localStorage.getItem('token');
          const form = new FormData();
          form.append('avatar', file);
          const resp = await fetch('http://localhost:5000/user/avatar', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: form,
          });
          if (!resp.ok) {
            const err = await resp.json().catch(() => ({}));
            throw new Error(err.message || 'Upload failed');
          }
          const data = await resp.json();
          const url = data.avatar?.file_path || null;
          if (url) {
            // make absolute by prefixing backend origin
            const abs = url.startsWith('http') ? url : `http://localhost:5000${url}`;
            try { localStorage.setItem(storageKey, abs); } catch {}
            setProfileImage(abs);
          }
          setIsProfileOpen(false);
        } catch (err) {
          console.error('Avatar upload failed', err);
          alert(err.message || 'Failed to upload avatar');
        }
        e.target.value = null;
      }} />
    </div>
  );
}

export default StudentDashboard;
