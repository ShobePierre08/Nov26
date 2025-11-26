import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Header from "../../web_components/Header";
import Sidebar from "./Sidebar";

function To_do() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const fetchTodo = async () => {
      try {
        const res = await axios.get("http://localhost:5000/student/todo", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setActivities(res.data?.activities || []);
      } catch (err) {
        console.error(err);
        alert("Session expired. Please log in again.");
        localStorage.removeItem("token");
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };

    fetchTodo();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const goToClasswork = (activity) => {
    const subject = {
      subject_id: activity.subject_id,
      title: activity.subject_title || activity.title,
      description: "",
      class_code: activity.class_code || "",
      instructor_id: activity.instructor_id,
    };
    // pass the activity id so the subclass page can open the activity modal
    navigate('/student/subclass', { state: { classData: subject, initialTab: 'classwork', openActivityId: activity.activity_id || activity.id } });
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-[#eaf6ff] via-[#d6eefc] to-white">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col">
        <Header
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onLogout={handleLogout}
        />

        <main className="flex-grow p-6 md:p-10 pt-28 md:pt-24 flex justify-center">
          <div className="w-full max-w-5xl">
            <div className="mb-6">
              <h1 className="text-3xl font-semibold text-slate-800">To Do</h1>
              <p className="text-sm text-slate-500 mt-1">Your upcoming activities and assignments across your classes.</p>
            </div>

            {loading ? (
              <div className="p-8 bg-white/60 rounded-xl shadow-inner text-center">
                <p className="text-gray-600">Loading...</p>
              </div>
            ) : activities.length === 0 ? (
              <div className="p-8 bg-white/60 rounded-xl shadow-inner text-center">
                <p className="text-gray-600">No pending activities. You're all caught up!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activities.map((a) => {
                  const config = typeof a.config_json === 'string' ? (() => { try { return JSON.parse(a.config_json); } catch(e){ return {}; } })() : (a.config_json || {});
                  return (
                    <div key={a.activity_id} className="bg-white rounded-xl p-6 shadow-lg flex justify-between items-start border border-white/60">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div className="px-3 py-1 rounded-md bg-blue-50 text-blue-700 text-sm font-medium">{a.subject_title}</div>
                          <div className="text-xs text-gray-400">• {new Date(a.created_at).toLocaleDateString()}</div>
                        </div>

                        <h3 className="text-lg font-semibold text-slate-800 mt-3">{a.title}</h3>
                        {config.instructions && <p className="text-sm text-gray-600 mt-2 line-clamp-2">{config.instructions}</p>}

                        <div className="mt-3 text-xs text-gray-500">
                          {config.due_date_time && (<span>Due: {new Date(config.due_date_time).toLocaleString()}</span>)}
                        </div>
                      </div>

                      <div className="pl-4 ml-4 border-l border-gray-100 flex items-center">
                        <button
                          onClick={() => goToClasswork(a)}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow"
                        >
                          View
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default To_do;
