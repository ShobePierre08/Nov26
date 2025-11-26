import React, { useState, useRef } from "react";
import { MoreVertical, Edit2, Trash2 } from "lucide-react";

function AnnouncementsList({
  announcements,
  API_BASE_URL,
  getAttachmentIcon,
  onDelete,
  onEdit,
}) {
  const [openMenuId, setOpenMenuId] = useState(null);
  const menuRef = useRef(null);
  const [avatarByInstructor, setAvatarByInstructor] = useState({});

  // Close menu when clicking outside
  React.useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenuId(null);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch avatars for instructors who posted announcements
  React.useEffect(() => {
    const instructorIds = Array.from(new Set(announcements.map(a => a.instructor_id).filter(Boolean)));
    const idsToFetch = instructorIds.filter(id => !avatarByInstructor[id]);
    if (idsToFetch.length === 0) return;

    const token = localStorage.getItem('token');
    idsToFetch.forEach(async (id) => {
      try {
        const res = await fetch(`${API_BASE_URL.replace(/\/$/, '')}/user/${id}/avatar`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) return;
        const data = await res.json().catch(() => null);
        const path = data?.avatar?.file_path;
        const url = path ? (path.startsWith('http') ? path : `${API_BASE_URL.replace(/\/$/, '')}${path}`) : null;
        setAvatarByInstructor(prev => ({ ...prev, [id]: url }));
      } catch (err) {
        // ignore fetch errors per-instructor
      }
    });
  }, [announcements]);

  return (
    <div className="space-y-4">
      {announcements.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-8">
          No announcements yet. Create one to get started!
        </p>
      ) : (
        announcements.map((announcement) => (
          <div
            key={announcement.announcement_id}
            className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow relative"
          >
            {/* Three-dot menu button: show only when handlers are provided (instructor view) */}
            {(onEdit || onDelete) && (
              <div className="absolute top-4 right-4">
                <button
                  onClick={() =>
                    setOpenMenuId(
                      openMenuId === announcement.announcement_id
                        ? null
                        : announcement.announcement_id
                    )
                  }
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                  title="More options"
                >
                  <MoreVertical size={18} className="text-gray-600" />
                </button>

                {/* Context Menu */}
                {openMenuId === announcement.announcement_id && (
                  <div
                    ref={menuRef}
                    className="absolute right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-48"
                  >
                    {onEdit && (
                      <button
                        onClick={() => {
                          onEdit?.(announcement);
                          setOpenMenuId(null);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2 text-sm text-gray-700 border-b border-gray-100"
                      >
                        <Edit2 size={16} />
                        Edit
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => {
                          onDelete?.(announcement.announcement_id);
                          setOpenMenuId(null);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-red-50 flex items-center gap-2 text-sm text-red-600"
                      >
                        <Trash2 size={16} />
                        Delete
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="flex items-start gap-3 pr-10">
              <div className="h-10 w-10 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0">
                {avatarByInstructor[announcement.instructor_id] ? (
                  <img src={avatarByInstructor[announcement.instructor_id]} alt="instructor avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold text-sm">
                    {announcement.instructor_name?.charAt(0)?.toUpperCase() || "I"}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-gray-800 text-sm">
                    {announcement.instructor_name || "Instructor"}
                  </span>
                  <span className="text-xs text-gray-500">
                    {announcement.created_at
                      ? new Date(announcement.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })
                      : ""}
                  </span>
                </div>
                <p className="text-gray-700 text-sm whitespace-pre-wrap break-words">
                  {announcement.content}
                </p>
                {announcement.attachments &&
                  announcement.attachments.length > 0 && (
                    <div className="mt-4 space-y-3">
                      {/* Image/Video Previews */}
                      {announcement.attachments.some(a => a.mime_type?.startsWith("image/") || a.mime_type?.startsWith("video/")) && (
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                          {announcement.attachments.map((attachment) => {
                            const isImage = attachment.mime_type?.startsWith("image/");
                            const isVideo = attachment.mime_type?.startsWith("video/");
                            
                            if (!isImage && !isVideo) return null;
                            
                            const fileUrl = `${API_BASE_URL}/${attachment.file_path}`;
                            
                            return (
                              <a
                                key={attachment.attachment_id}
                                href={fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group block rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                              >
                                {isImage && (
                                  <img
                                    src={fileUrl}
                                    alt={attachment.file_name}
                                    className="w-full h-32 object-cover"
                                    onError={(e) => {
                                      e.target.style.display = 'none';
                                    }}
                                  />
                                )}
                                {isVideo && (
                                  <video
                                    src={fileUrl}
                                    className="w-full h-32 object-cover bg-gray-200"
                                    controls
                                    onError={(e) => {
                                      e.target.style.display = 'none';
                                    }}
                                  />
                                )}
                              </a>
                            );
                          })}
                        </div>
                      )}
                      
                      {/* File Links */}
                      {announcement.attachments.some(a => !a.mime_type?.startsWith("image/") && !a.mime_type?.startsWith("video/")) && (
                        <div className="flex flex-wrap gap-2">
                          {announcement.attachments.map((attachment) => {
                            const isImage = attachment.mime_type?.startsWith("image/");
                            const isVideo = attachment.mime_type?.startsWith("video/");
                            
                            if (isImage || isVideo) return null;
                            
                            return (
                              <a
                                key={attachment.attachment_id}
                                href={`${API_BASE_URL}/${attachment.file_path}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group flex items-center gap-2 rounded-full bg-indigo-50 text-indigo-600 px-3 py-1 text-xs font-medium hover:bg-indigo-100 transition"
                              >
                                <span aria-hidden className="text-sm">
                                  {getAttachmentIcon(attachment.mime_type)}
                                </span>
                                <span className="max-w-[140px] truncate">
                                  {attachment.file_name}
                                </span>
                              </a>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default AnnouncementsList;
