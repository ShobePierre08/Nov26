import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Header from "../../web_components/Header";
import Sidebar from "./Sidebar";

function Archived_Instructor() {
  const [archived, setArchived] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const fetchArchivedSubjects = async () => {
      try {
        const response = await axios.get(
          "http://localhost:5000/instructor/archived",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setArchived(response.data?.archived || []);
      } catch (err) {
        console.error("❌ Error fetching archived subjects:", err);
        if (err.response?.status === 401) {
          alert("Session expired. Please log in again.");
          localStorage.removeItem("token");
          navigate("/login");
        } else {
          alert(err.response?.data?.message || "Failed to load archived subjects.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchArchivedSubjects();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const handleRestore = async (subjectId) => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Session expired. Please log in again.");
      navigate("/login");
      return;
    }

    try {
      await axios.put(
        `http://localhost:5000/instructor/restore/${subjectId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setArchived((prev) => prev.filter((s) => s.subject_id !== subjectId));
      alert("✅ Subject restored successfully!");
    } catch (err) {
      console.error("Error restoring subject:", err);
      alert(err.response?.data?.message || "Failed to restore subject.");
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-[#cfe3fa] via-[#e6f0ff] to-white">
      <Header
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        onLogout={handleLogout}
      />

      <div className="flex flex-1">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className="flex-grow p-6 md:p-20">
          <h1 className="text-3xl font-bold text-gray-800 mb-10 text-center drop-shadow-sm">
              Archived Classes
          </h1>

          {loading ? (
            <p className="text-center text-gray-600">Loading archived classes...</p>
          ) : archived.length === 0 ? (
            <div className="flex justify-center items-center h-64">
              <div className="bg-white/60 backdrop-blur-md px-8 py-6 rounded-2xl shadow-sm">
                <p className="text-gray-700 text-lg">No archived classes found.</p>
              </div>
            </div>
          ) : (
            <div className="grid gap-6" style={{ gridTemplateColumns: "repeat(5, 1fr)" }}>
              {archived.map((subj) => (
                <div
                  key={subj.subject_id}
                  className="relative bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl shadow-md p-6 flex flex-col hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                >
                  
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {subj.title || "Untitled Class"}
                    </h3>
                    <span className="text-xs font-medium bg-gray-200 text-gray-700 px-2 py-1 rounded-md">
                      Archived
                    </span>
                  </div>

                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                    {subj.description || "No description available."}
                  </p>

                  {subj.class_code && (
                    <p className="text-xs text-gray-500 mb-4">
                      Code: <span className="font-medium">{subj.class_code}</span>
                    </p>
                  )}

                  <div className="mt-auto flex items-center justify-between">
                    <div>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleRestore(subj.subject_id); }}
                        className="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 rounded-md hover:bg-emerald-700 transition-colors"
                      >
                        Unarchive
                      </button>
                    </div>

                    <div>
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (!window.confirm('Delete this archived class permanently? This cannot be undone.')) return;
                          const token = localStorage.getItem('token');
                          if (!token) {
                            alert('Session expired. Please log in again.');
                            navigate('/login');
                            return;
                          }
                          try {
                            await axios.delete(`http://localhost:5000/subject/${subj.subject_id}`, {
                              headers: { Authorization: `Bearer ${token}` }
                            });
                            setArchived((prev) => prev.filter((s) => s.subject_id !== subj.subject_id));
                            alert('Class deleted');
                          } catch (err) {
                            console.error('Error deleting subject:', err);
                            alert(err.response?.data?.message || 'Failed to delete class.');
                          }
                        }}
                        className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default Archived_Instructor;
