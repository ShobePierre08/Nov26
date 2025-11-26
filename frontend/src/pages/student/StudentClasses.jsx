import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Header from "../../web_components/Header";
import Sidebar from "./Sidebar";

function StudentClasses() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

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

  const handleClassClick = (classData) => {
    // Navigate to the student class dashboard by subject id and include class_code in query
    const code = classData.class_code || classData.code || "";
    navigate(`/student/class/${classData.subject_id}?code=${encodeURIComponent(code)}`, { state: { classData } });
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-[#E0EAFC] to-[#CFDEF3]">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col">
        <Header
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onLogout={handleLogout}
        />

        <main className="flex-grow p-6 md:p-10 pt-28 md:pt-24 md:ml-72">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-gray-800">My Classes</h1>
            <button
              onClick={() => navigate("/student/StudentDashboard")}
              className="text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              ← Back to Dashboard
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <p className="text-center text-gray-600">Loading classes...</p>
            </div>
          ) : classes.length === 0 ? (
            <div className="bg-white/70 backdrop-blur-md p-8 rounded-2xl shadow-sm flex flex-col items-center justify-center h-64">
              <p className="text-gray-600 text-lg font-medium mb-4">
                No classes joined yet.
              </p>
              <button
                onClick={() => navigate("/student/StudentDashboard")}
                className="px-6 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-all"
              >
                Join a Class
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {classes.map((cls) => (
                <div
                  key={cls.subject_id}
                  onClick={() => handleClassClick(cls)}
                  className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl shadow-md p-6 flex flex-col hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900 flex-1">
                      {cls.title || "Untitled Class"}
                    </h3>
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-md whitespace-nowrap ml-2">
                      Active
                    </span>
                  </div>

                  <p className="text-sm text-gray-600 mb-4 line-clamp-2 flex-grow">
                    {cls.description || "No description available."}
                  </p>

                  <div className="border-t border-gray-200 pt-4">
                    <p className="text-xs text-gray-500 mb-2">
                      Instructor: <span className="font-medium text-gray-700">{cls.instructor_name}</span>
                    </p>
                    {cls.class_code && (
                      <p className="text-xs text-gray-500">
                        Code: <span className="font-mono font-medium text-gray-700">{cls.class_code}</span>
                      </p>
                    )}
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

export default StudentClasses;
