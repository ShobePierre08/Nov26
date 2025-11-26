import HomeIcon from "@mui/icons-material/Home";
import SettingsIcon from "@mui/icons-material/Settings";
import ArchiveIcon from "@mui/icons-material/Archive";
import AssignmentIcon from "@mui/icons-material/Assignment";
import ClassIcon from "@mui/icons-material/Class";
import { useNavigate } from "react-router-dom";

function Sidebar({ isOpen, onClose }) {
  const navigate = useNavigate();

  const links = [
    { name: "Home", 
      icon: <HomeIcon fontSize="large" />, 
      path: "/student/StudentDashboard" },

    { name: "My Classes", 
      icon: <ClassIcon fontSize="large" />, 
      path: "/student/StudentDashboard" },

    { name: "To Do", 
      icon: <AssignmentIcon fontSize="large" />, 
      path: "/student/todo" },

    { name: "Archived", 
      icon: <ArchiveIcon fontSize="large" />, 
      path: "/student/archived" },

    { name: "Settings", 
      icon: <SettingsIcon fontSize="large" />, 
      path: "/student/setting" },
  ];

  return (
    <>
      {/* ✅ Overlay (blur background when open) */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 backdrop-blur-sm transition-opacity duration-300"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        ></div>
      )}

      {/* ✅ Sidebar container */}
      <aside
        className={`fixed top-0 left-0 h-full w-72 bg-white border-r-2 border-gray-200 shadow-lg transform ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } transition-transform duration-300 ease-in-out z-50`}
      >
        {/* Header */}
        <div className="text-center mt-12 mb-6">
          <h2 className="text-3xl font-bold text-blue-600 tracking-wide"></h2>
          <p className="text-sm text-gray-500"></p>
        </div>

        {/* Navigation Links */}
        <div className="flex flex-col p-4 space-y-3">
          {links.map((link) => (
            <button
              key={link.name}
              onClick={() => navigate(link.path)}
              className="flex items-center gap-4 text-gray-700 hover:text-blue-600 hover:bg-blue-50 p-4 rounded-xl text-lg font-medium transition-all duration-200"
            >
              {link.icon}
              <span>{link.name}</span>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="absolute bottom-6 left-0 w-full text-center text-gray-400 text-sm">
          © 2025 VirtuLab
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
