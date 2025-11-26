import React, { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import Header from "../../web_components/Header";
import Sidebar from "./Sidebar";

function StudentClassDashboard() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [subject, setSubject] = useState(location.state?.classData || null);
  const [loading, setLoading] = useState(!location.state?.classData);
  const [activeTab, setActiveTab] = useState("newsfeed");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const fetchSubject = async () => {
      if (subject) return;
      try {
        setLoading(true);
        // prefer explicit id; fall back to query `code` param or location.state.classData.class_code
        const params = new URLSearchParams(location.search);
        const codeFromQuery = params.get("code");
        let url;
        if (id) {
          url = `http://localhost:5000/student/subjects/${id}`;
        } else if (codeFromQuery) {
          url = `http://localhost:5000/student/subjects?class_code=${encodeURIComponent(codeFromQuery)}`;
        } else if (location.state?.classData?.class_code) {
          url = `http://localhost:5000/student/subjects?class_code=${encodeURIComponent(location.state.classData.class_code)}`;
        } else {
          throw new Error('No subject id or class code provided');
        }

        const res = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
        setSubject(res.data.subject);
      } catch (err) {
        console.error("Failed to load class:", err);
        alert(err.response?.data?.message || "Failed to load class.");
        navigate("/student/StudentDashboard");
      } finally {
        setLoading(false);
      }
    };

    fetchSubject();
  }, [id, location.state, navigate, subject]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  if (!subject) return <div className="flex items-center justify-center min-h-screen">Class not found.</div>;

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-[#e6f8ff] to-white">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col">
        <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} onLogout={handleLogout} />

        <main className="flex-1 px-6 sm:px-10 py-10 mt-12">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <button onClick={() => navigate('/student/StudentDashboard')} className="text-sm text-blue-600">← Back to classes</button>
              <h1 className="mt-3 text-3xl font-semibold text-gray-800">{subject.title}</h1>
              <p className="text-gray-500 mt-1">{subject.description}</p>
            </div>
            <div>
              <div className="bg-white/15 rounded-3xl p-4">
                <p className="text-xs text-gray-200 uppercase">Class code</p>
                <p className="mt-2 text-lg font-mono tracking-widest text-gray-800 bg-white/30 px-3 py-2 rounded">{subject.class_code}</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-white shadow-lg border border-white/60 px-6 py-6">
            <div className="flex items-center gap-4 mb-6">
              <button onClick={() => setActiveTab('newsfeed')} className={`px-4 py-2 rounded-full ${activeTab==='newsfeed'? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}>
                Newsfeed
              </button>
              <button onClick={() => setActiveTab('classwork')} className={`px-4 py-2 rounded-full ${activeTab==='classwork'? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}>
                Classwork
              </button>
              <button onClick={() => setActiveTab('people')} className={`px-4 py-2 rounded-full ${activeTab==='people'? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}>
                People
              </button>
              <button onClick={() => setActiveTab('grades')} className={`px-4 py-2 rounded-full ${activeTab==='grades'? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}>
                Grades
              </button>
            </div>

            <div>
              {activeTab === 'newsfeed' && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-800 mb-4">Newsfeed</h2>
                  <p className="text-gray-600">Announcements and posts will appear here (student view - read only).</p>
                </div>
              )}

              {activeTab === 'classwork' && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-800 mb-4">Classwork</h2>
                  <p className="text-gray-600">View assignments and activities assigned by the instructor.</p>
                </div>
              )}

              {activeTab === 'people' && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-800 mb-4">Class People</h2>
                  <p className="text-gray-600">Roster and participants will be shown here.</p>
                </div>
              )}

              {activeTab === 'grades' && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-800 mb-4">Grades</h2>
                  <p className="text-gray-600">Your grades and feedback will be available here.</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default StudentClassDashboard;
