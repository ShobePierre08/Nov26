import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import Header from "../../web_components/Header";
import Sidebar from "./Sidebar";

function Setting() {
  const [message, setMessage] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    // Attempt to fetch instructor settings message (backend may vary)
    axios
      .get("http://localhost:5000/instructor/setting", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setMessage(res.data.message || "Instructor settings"))
      .catch((err) => {
        // Not fatal — show a friendly placeholder message
        console.error("Instructor settings fetch error", err?.response?.data || err);
        setMessage("Instructor settings — configure your class and preferences here.");
      });
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
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
          <h1 className="text-3xl font-bold text-gray-800 mb-10 text-center drop-shadow-sm">Settings</h1>

          <div className="grid gap-6 md:grid-cols-3 sm:grid-cols-2">
            {/* Profile card */}
            <div className="relative bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl shadow-md p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900">Profile</h3>
                <span className="text-xs font-medium bg-gray-200 text-gray-700 px-2 py-1 rounded-md">Personal</span>
              </div>
              <p className="text-sm text-gray-600 mb-4">Manage your instructor profile, avatar, and contact details.</p>
              <div className="mt-auto flex items-center justify-between">
                <button className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors">Edit</button>
              </div>
            </div>

            {/* Class defaults card */}
            <div className="relative bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl shadow-md p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900">Class defaults</h3>
                <span className="text-xs font-medium bg-gray-200 text-gray-700 px-2 py-1 rounded-md">Preferences</span>
              </div>
              <p className="text-sm text-gray-600 mb-4">Set default grading, visibility, and activity options for new classes.</p>
              <div className="mt-auto flex items-center justify-between">
                <button className="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 rounded-md hover:bg-emerald-700 transition-colors">Configure</button>
              </div>
            </div>

            {/* Notifications card */}
            <div className="relative bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl shadow-md p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                <span className="text-xs font-medium bg-gray-200 text-gray-700 px-2 py-1 rounded-md">Alerts</span>
              </div>
              <p className="text-sm text-gray-600 mb-4">Choose how you receive student submissions, class messages, and system alerts.</p>
              <div className="mt-auto flex items-center justify-between">
                <button className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors">Manage</button>
              </div>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}

export default Setting;
