import HomeIcon from "@mui/icons-material/Home";
import SettingsIcon from "@mui/icons-material/Settings";
import ArchiveIcon from "@mui/icons-material/Archive";
import AssignmentIcon from "@mui/icons-material/Assignment";
import { useNavigate, useLocation } from "react-router-dom";
import { useState, useRef, useEffect } from "react";

function Sidebar({ isOpen, onClose }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState(localStorage.getItem("username") || "Instructor");
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
  const fileInputRef = useRef(null);
  const storageKey = `profileImage_${username}`;
  const [profileImage, setProfileImage] = useState(() => localStorage.getItem(storageKey) || null);

  // On mount, if no profile image in localStorage, try fetching from server for current user
  useEffect(() => {
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
        // silent
      }
    };
    tryLoad();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const links = [
    { name: "Home", 
      icon: <HomeIcon fontSize="large" />, 
      path: "/instructor/dashboard" },
    {
      name: "Archived",
      icon: <ArchiveIcon fontSize="large" />,
      path: "/instructor/archived",
    },
    {
      name: "Settings",
      icon: <SettingsIcon fontSize="large" />,
      // navigate to instructor settings route (was incorrectly '/setting')
      path: "/instructor/setting",
    },
  ];

  return (
    <>
      {isOpen && (
        <div
          onClick={onClose}
          className="md:hidden fixed inset-0 z-40 transition-opacity duration-300 backdrop-blur-sm"
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.5)",
          }}
        ></div>
      )}

      <aside
        className={`bg-[#F6F8FA] border-r shadow-lg transition-all duration-300 ease-in-out ${
          isOpen
            ? "fixed top-0 left-0 z-50 w-72 h-screen"
            : "hidden md:flex md:sticky md:top-16 md:h-[calc(100vh-4rem)] md:w-72 md:flex-col"
        }`}
        style={{
          // ensure the aside sits above background layers when sticky
          zIndex: isOpen ? 9999 : undefined,
        }}
      >
        {/* Header Section */}
        <div className="px-4 py-6 text-center border-b">
          <div className="flex items-center justify-center gap-2">
            {!isEditingName ? (
              <>
                <h2 className="text-2xl font-bold text-[#19A5EA]">{username}</h2>
                <button onClick={() => { setEditingName(username); setIsEditingName(true); }} className="text-gray-400 hover:text-gray-600 ml-1" title="Edit name">✎</button>
              </>
            ) : (
              <input
                autoFocus
                className="text-2xl font-bold text-blue-600 outline-none text-center"
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const newName = editingName.trim() || 'Instructor';
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
                  const newName = editingName.trim() || 'Instructor';
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
          <p className="text-sm text-gray-500 mt-1">Instructor</p>

          <div className="mt-3 flex flex-col items-center justify-center -ml-1">
            <button
              onClick={() => setIsProfileOpen(true)}
              className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-blue-400 to-blue-600 text-white flex items-center justify-center font-semibold hover:bg-gradient-to-br hover:from-blue-300 hover:to-blue-500 transition-all cursor-pointer"
            >
              {profileImage ? (
                <img src={profileImage} alt="profile" className="w-full h-full object-cover" />
              ) : (
                initials
              )}
            </button>
            {email && <p className="text-sm font-semibold text-black mt-3">{email}</p>}
          </div>
        </div>

        {/* Menu Items */}
        <div className="flex flex-col p-4 space-y-4 flex-1">
          {links.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <button
                key={link.name}
                onClick={() => {
                  navigate(link.path);
                  onClose?.();
                }}
                className={`
                  flex items-center gap-4 p-3 rounded-lg transition-all duration-200
                  ${
                    isActive
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-700 hover:bg-blue-100 hover:text-blue-600"
                  }
                `}
              >
                <div
                  className={isActive ? "text-blue-600" : "text-gray-700"}
                >
                  {link.icon}
                </div>
                <span className="text-lg font-medium">{link.name}</span>
              </button>
            );
          })}
        </div>

        {/* Footer Section */}
        <div className="px-4 py-6 text-center border-t">
          <p className="text-xs text-gray-500">© 2025 VirtuLab</p>
        </div>
      </aside>

      {isProfileOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setIsProfileOpen(false)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-sm mx-4 p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-end">
              <button
                onClick={() => setIsProfileOpen(false)}
                className="text-gray-500 hover:text-gray-700 text-xl"
                aria-label="Close profile modal"
              >
                &times;
              </button>
            </div>

            <div className="flex flex-col items-center gap-4 pt-2">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-blue-400 to-blue-600 text-white flex items-center justify-center text-2xl font-bold">
                {profileImage ? (
                  <img src={profileImage} alt="profile" className="w-full h-full object-cover" />
                ) : (
                  initials
                )}
              </div>
              {email && <p className="text-sm font-semibold text-black mt-3">{email}</p>}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition"
                >
                  Change profile
                </button>
                <button
                  onClick={() => setIsProfileOpen(false)}
                  className="mt-2 px-4 py-2 rounded-lg bg-gray-100 text-sm font-medium hover:bg-gray-200 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Hidden file input for profile image selection */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (e) => {
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
        }}
      />
    </>
  );
}

export default Sidebar;
