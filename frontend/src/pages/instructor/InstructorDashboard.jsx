import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import Header from "../../web_components/Header";
import Sidebar from "./Sidebar";

function DashboardPage() {
  const [message, setMessage] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [classes, setClasses] = useState([]);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [menuCoords, setMenuCoords] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ Modal state & inputs
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [className, setClassName] = useState("");
  const [subject, setSubject] = useState("");
  const [editClassName, setEditClassName] = useState("");
  const [editSubject, setEditSubject] = useState("");

  const getClassKey = (cls) =>
    cls?.subject_id ?? cls?.id ?? cls?.class_code ?? cls?.code ?? null;

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    axios
      .get("http://localhost:5000/instructor/dashboard", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        const fetchedSubjects = (res.data.classes || []).map((item) => ({
          ...item,
          subject: item.subject ?? item.description ?? "",
        }));

        setMessage(res.data.message || "Welcome back, Instructor!");
        setClasses(fetchedSubjects);
      })
      .catch((err) => {
        console.error("Error fetching dashboard:", err);
        if (err.response?.status === 401 || err.response?.status === 403) {
          alert("Session expired. Please log in again.");
          localStorage.removeItem("token");
          navigate("/login");
        } else {
          alert("Failed to load dashboard. Please try again.");
          setClasses([]);
        }
      });
  }, [navigate]);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  useEffect(() => {
    if (location.state?.newClass) {
      // Clear the transient state and rely on server for truth
      navigate("/instructor/dashboard", { replace: true, state: {} });
    }
  }, [location.state, navigate]);

  const handleCreateClass = async () => {
    if (!className.trim()) {
      alert("Class name is required.");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      alert("Session expired. Please log in again.");
      navigate("/login");
      return;
    }

    const payload = {
      title: className.trim(),
      description: subject || null,
    };

    try {
      const res = await axios.post(
        "http://localhost:5000/instructor/classes", payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Refresh the entire list from server to ensure we have the latest data
      const refresh = await axios.get("http://localhost:5000/instructor/dashboard", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const refreshedClasses = (refresh.data.classes || []).map((item) => ({
        ...item,
        subject: item.subject ?? item.description ?? "",
      }));
      setClasses(refreshedClasses);

      // Find the newly created subject from the refreshed list
      const newSubject = res.data?.subject;
      if (newSubject) {
        const enrichedSubject = {
          ...newSubject,
          subject: subject || newSubject.subject || newSubject.description || "",
        };
        navigate("/instructor/subclass", { state: { classData: enrichedSubject, initialTab: "newsfeed" } });
      } else {
        // If subject not in response, use the last item from refreshed list
        const lastClass = refreshedClasses[refreshedClasses.length - 1];
        if (lastClass) {
          navigate("/instructor/subclass", { state: { classData: lastClass, initialTab: "newsfeed" } });
        }
      }
    } catch (err) {
      console.error("Error creating class:", err);
      alert(err.response?.data?.message || "Failed to create class. Please try again.");
    }

    setIsModalOpen(false);
    setClassName("");
    setSubject("");
  };

  const handleUpdateClass = async () => {
    if (!editClassName.trim()) {
      alert("Class name is required.");
      return;
    }

    if (!editingClass) {
      alert("No class selected for editing.");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      alert("Session expired. Please log in again.");
      navigate("/login");
      return;
    }

    const subjectId = editingClass.subject_id || editingClass.id;
    if (!subjectId) {
      alert("Cannot update: Subject ID not found.");
      return;
    }

    const payload = {
      title: editClassName.trim(),
      description: editSubject || null,
    };

    try {
      await axios.put(
        `http://localhost:5000/instructor/subjects/${subjectId}`,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Refresh the entire list from server to ensure we have the latest data
      const refresh = await axios.get("http://localhost:5000/instructor/dashboard", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const refreshedClasses = (refresh.data.classes || []).map((item) => ({
        ...item,
        subject: item.subject ?? item.description ?? "",
      }));
      setClasses(refreshedClasses);

      alert("Class updated successfully!");
      setIsEditModalOpen(false);
      setEditingClass(null);
      setEditClassName("");
      setEditSubject("");
    } catch (err) {
      console.error("Error updating class:", err);
      alert(err.response?.data?.message || "Failed to update class. Please try again.");
    }
  };

  const handleCopyInviteLink = async (cls) => {
    const inviteLink = `${window.location.origin}/join?code=${cls.class_code || cls.code}`;
    const inviteDetails = `Join ${cls.title || cls.className || "my class"}!\n\nClass Code: ${cls.class_code || cls.code}\n\nJoin Link: ${inviteLink}`;
    
    try {
      await navigator.clipboard.writeText(inviteDetails);
      alert("Invitation link copied to clipboard!");
      setOpenMenuId(null);
    } catch (err) {
      console.error("Failed to copy invite:", err);
      alert("Failed to copy invitation link.");
    }
  };

  const handleEdit = (cls) => {
    setEditingClass(cls);
    setEditClassName(cls.title || cls.className || "");
    setEditSubject(cls.description || cls.subject || "");
    setIsEditModalOpen(true);
    setOpenMenuId(null);
  };

  const handleCopy = async (cls) => {
    const classDetails = `Class: ${cls.title || cls.className}\nSubject: ${cls.subject || cls.description}\nCode: ${cls.class_code || cls.code}`;
    
    try {
      await navigator.clipboard.writeText(classDetails);
      alert("Class details copied to clipboard!");
      setOpenMenuId(null);
    } catch (err) {
      console.error("Failed to copy:", err);
      alert("Failed to copy class details.");
    }
  };

  const handleArchive = async (cls) => {
    const name = cls.title || cls.className || "this class";
    if (!window.confirm(`Are you sure you want to archive "${name}"?`)) return;

    const subjectId = cls.subject_id || cls.id;
    if (!subjectId) {
      alert("Cannot archive: Subject ID not found.");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      alert("Session expired. Please log in again.");
      navigate("/login");
      return;
    }

    try {
      await axios.put(
        `http://localhost:5000/instructor/archive/${subjectId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Refresh the entire list from server to ensure we have the latest data
      const refresh = await axios.get("http://localhost:5000/instructor/dashboard", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const refreshedClasses = (refresh.data.classes || []).map((item) => ({
        ...item,
        subject: item.subject ?? item.description ?? "",
      }));
      setClasses(refreshedClasses);

      // Close the menu and notify
      setOpenMenuId(null);
      alert("Class archived successfully.");
    } catch (err) {
      console.error("Error archiving class:", err);
      const msg = err.response?.data?.message || "Failed to archive class. Please try again.";
      alert(msg);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-[#cfe3fa] via-[#e6f0ff] to-white select-none">
      <Header
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        onLogout={handleLogout}
        showMenu={false}
      />
      
      <div className="flex flex-1">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* ✅ Main Content */}
        <main 
          className="flex-grow flex flex-col p-10"
          onClick={() => setOpenMenuId(null)}
        >
          {/* Greeting */}
          {message && (
            <p className="text-gray-700 text-lg mb-6 font-medium tracking-wide text-center">
              {message}
            </p>
          )}

          {/* Active Classes Section */}
          <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">
            Active Classes
          </h2>

          {/* If no active classes */}
          {classes.length === 0 && (
            <div className="text-gray-500 text-center mb-8">
              <p className="text-base">
                You have no active classes yet.
              </p>
            </div>
          )}

          {/* ✅ Card Grid */}
          <div className="grid gap-8 justify-items-center items-stretch auto-rows-fr w-full" style={{ gridTemplateColumns: "repeat(5, 1fr)" }}>
            {/* Create Class Card - First Position */}
            <div
              onClick={() => setIsModalOpen(true)}
              className="group w-full max-w-xs sm:max-w-sm h-full min-h-[15rem] border-2 border-dashed border-gray-300 rounded-2xl flex flex-col justify-center items-center text-gray-500 cursor-pointer transition-all duration-200 hover:border-blue-400 hover:bg-blue-50/40 focus-within:border-blue-400 focus-within:bg-blue-50/40"
            >
              <span className="text-4xl mb-2 transition-transform group-hover:scale-110">
                +
              </span>
              <span className="text-lg font-semibold text-center">
                Create Class
              </span>
            </div>

            {/* Render Class Cards */}
            {classes.map((cls, index) => {
              const cardId = getClassKey(cls) || cls.title || `class-${index}`;
              const handleOpenClass = () =>
                navigate("/instructor/subclass", {
                  state: { classData: cls, initialTab: "newsfeed" },
                });

              // Unique gradient colors for each card - assigned by class ID hash for consistency
              const colors = [
                "linear-gradient(135deg, #E6F3FF 0%, #DCEFFF 100%)",
                "linear-gradient(135deg, #FFF7ED 0%, #FFF1D6 100%)",
                "linear-gradient(135deg, #EAF8FF 0%, #E6FFF4 100%)",
                "linear-gradient(135deg, #F6EEFF 0%, #F0E8FF 100%)",
                "linear-gradient(135deg, #E8FFF7 0%, #E6FFF0 100%)",
                "linear-gradient(135deg, #FFF6F9 0%, #FFF2F0 100%)",
              ];
              // Use class ID to consistently assign color (same class = same color)
              const classId = cls.subject_id || cls.id || cls.class_code || cls.code || cardId;
              const colorIndex = Array.from(classId.toString()).reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
              const gradientColor = colors[colorIndex];

              return (
                <div
                  key={cardId}
                  className="relative w-full max-w-xs sm:max-w-sm"
                >
                  <div
                    onClick={() => {
                      setOpenMenuId(null);
                      handleOpenClass();
                    }}
                    className="group h-full shadow-lg rounded-3xl border border-blue-400 ring-1 ring-blue-50 overflow-hidden transition-all duration-300 cursor-pointer flex flex-col hover:-translate-y-1 hover:shadow-[0_25px_45px_-15px_rgba(60,120,200,0.35)] focus-within:-translate-y-1 focus-within:shadow-[0_25px_45px_-15px_rgba(60,120,200,0.35)]"
                  >
                    {/* Top Half - Gradient Banner */}
                    <div
                      style={{ background: gradientColor }}
                      className="h-36 relative p-4 flex flex-col justify-center overflow-hidden"
                    >
                      <div className="absolute -top-10 -right-6 w-32 h-32 bg-white/20 rounded-full blur-3xl transition-transform duration-300 group-hover:scale-125" />

                      {/* Active indicator (top-right) */}
                      <div className="absolute top-3 right-3 z-20">
                        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/80 text-black text-xs font-medium shadow-sm">
                          <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
                          Active Class
                        </span>
                      </div>

                      <div className="relative z-10">
                        <h3 className="text-lg font-bold text-black tracking-wide break-words">
                          {cls.title || cls.className || "Untitled Class"}
                        </h3>
                        <p className="mt-1 text-sm text-black/80 truncate max-w-[18rem]">
                          {cls.subject || cls.description || "No description available"}
                        </p>
                      </div>
                    </div>

                    {/* Bottom Half - Old Style */}
                    <div className="relative flex-1 flex flex-col justify-between p-6 text-slate-800 bg-white">
                      {/* description moved to top banner; removed duplicate here */}
                      <div className="mt-6 flex justify-center items-center gap-3 text-xs text-slate-600">
                        {(cls.class_code || cls.code) && (
                          <span className="px-3 py-1 rounded-lg bg-white/70 text-blue-700 font-medium shadow-sm">
                            Code {cls.class_code || cls.code}
                          </span>
                        )}
                      </div>
                      <div className="mt-6 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(null);
                            handleOpenClass();
                          }}
                          className="flex-1 rounded-xl bg-white text-blue-700 text-sm font-semibold py-2.5 shadow-sm border border-blue-300 transition-colors group-hover:bg-green-700 group-hover:text-white"
                        >
                          Open Class
                        </button>

                        <div className="relative">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const opening = openMenuId !== cardId;
                              if (opening) {
                                setOpenMenuId(cardId);
                                const rect = e.currentTarget.getBoundingClientRect();
                                const left = rect.right - 192; // align menu right edge (menu width 192px)
                                const top = rect.bottom + window.scrollY + 8;
                                setMenuCoords({ top, left, cardId });
                              } else {
                                setOpenMenuId(null);
                                setMenuCoords(null);
                              }
                            }}
                            className="inline-flex h-8 w-8 items-center justify-center text-blue-700 hover:text-blue-800 focus:outline-none"
                            aria-label="More actions"
                          >
                            <span className="flex flex-col gap-1 items-center">
                              <span className="block h-1 w-1.5 rounded-full bg-current" />
                              <span className="block h-1 w-1.5 rounded-full bg-current" />
                              <span className="block h-1 w-1.5 rounded-full bg-current" />
                            </span>
                          </button>

                          {openMenuId === cardId && menuCoords && createPortal(
                            <div
                              onClick={(e) => e.stopPropagation()}
                              style={{ position: 'absolute', top: `${menuCoords.top}px`, left: `${menuCoords.left}px`, zIndex: 1100 }}
                              className="w-48 rounded-xl border border-gray-200 bg-white shadow-lg py-2 text-left"
                            >
                              <ul className="flex flex-col text-sm text-gray-700">
                                <li>
                                  <button
                                    type="button"
                                    onClick={() => { handleCopyInviteLink(cls); setOpenMenuId(null); setMenuCoords(null); }}
                                    className="w-full px-4 py-2.5 text-left hover:bg-gray-50 transition-colors"
                                  >
                                    Copy invitation link
                                  </button>
                                </li>
                                <li>
                                  <button
                                    type="button"
                                    onClick={() => { handleEdit(cls); setOpenMenuId(null); setMenuCoords(null); }}
                                    className="w-full px-4 py-2.5 text-left hover:bg-gray-50 transition-colors"
                                  >
                                    Edit
                                  </button>
                                </li>
                                <li>
                                  <button
                                    type="button"
                                    onClick={() => { handleCopy(cls); setOpenMenuId(null); setMenuCoords(null); }}
                                    className="w-full px-4 py-2.5 text-left hover:bg-gray-50 transition-colors"
                                  >
                                    Copy
                                  </button>
                                </li>
                                <li>
                                  <button
                                    type="button"
                                    onClick={() => { handleArchive(cls); setOpenMenuId(null); setMenuCoords(null); }}
                                    className="w-full px-4 py-2.5 text-left hover:bg-gray-50 transition-colors text-red-600"
                                  >
                                    Archive
                                  </button>
                                </li>
                              </ul>
                            </div>,
                            document.body
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  
                </div>
              );
            })}
          </div>
        </main>

      {isModalOpen && (
        <div
          className="fixed inset-0 flex justify-center items-center z-50 bg-black/20 backdrop-blur-sm"
          style={{ animation: 'fadeIn 0.2s ease-out' }}
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="bg-white/95 backdrop-blur-md p-8 rounded-2xl shadow-2xl border border-white/20 w-full max-w-md mx-4"
            style={{ animation: 'popUp 0.3s ease-out' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-semibold mb-6 text-gray-800">
              Create Class
            </h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleCreateClass();
              }}
            >
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="class-name"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Class name*
                  </label>
                  <input
                    type="text"
                    id="class-name"
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400 bg-white"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">*Required</p>
                </div>

                <div>
                  <label
                    htmlFor="subject"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Subject / Description
                  </label>
                  <input
                    type="text"
                    id="subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400 bg-white"
                  />
                </div>
              </div>

              <div className="mt-8 flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Class Modal */}
      {isEditModalOpen && (
        <div
          className="fixed inset-0 flex justify-center items-center z-50 bg-black/20 backdrop-blur-sm"
          style={{ animation: 'fadeIn 0.2s ease-out' }}
          onClick={() => {
            setIsEditModalOpen(false);
            setEditingClass(null);
            setEditClassName("");
            setEditSubject("");
          }}
        >
          <div
            className="bg-white/95 backdrop-blur-md p-8 rounded-2xl shadow-2xl border border-white/20 w-full max-w-md mx-4"
            style={{ animation: 'popUp 0.3s ease-out' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-semibold mb-6 text-gray-800">
              Edit Class
            </h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleUpdateClass();
              }}
            >
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="edit-class-name"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Class name*
                  </label>
                  <input
                    type="text"
                    id="edit-class-name"
                    value={editClassName}
                    onChange={(e) => setEditClassName(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400 bg-white"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">*Required</p>
                </div>

                <div>
                  <label
                    htmlFor="edit-subject"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Subject / Description
                  </label>
                  <input
                    type="text"
                    id="edit-subject"
                    value={editSubject}
                    onChange={(e) => setEditSubject(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400 bg-white"
                  />
                </div>
              </div>

              <div className="mt-8 flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingClass(null);
                    setEditClassName("");
                    setEditSubject("");
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none"
                >
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

export default DashboardPage;
