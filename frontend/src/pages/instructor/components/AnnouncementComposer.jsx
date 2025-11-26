import { useState } from "react";
import axios from "axios";

function AnnouncementComposer({
  isOpen,
  onClose,
  classInfo,
  instructorName,
  onAnnouncementPosted,
  selectedAttachments,
  setSelectedAttachments,
  announcementText,
  setAnnouncementText,
  isPosting,
  setIsPosting,
  photoVideoInputRef,
  fileInputRef,
  getAttachmentIcon,
  formatFileSize,
}) {
  const API_BASE_URL = "http://localhost:5000";

  const handlePostAnnouncement = async () => {
    if (!announcementText.trim()) {
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      alert("Session expired. Please log in again.");
      return;
    }

    const subjectId = classInfo.subject_id || classInfo.id;
    if (!subjectId) {
      alert("Cannot post: Subject ID not found.");
      return;
    }

    const formData = new FormData();
    formData.append("subject_id", subjectId);
    formData.append("content", announcementText.trim());
    
    console.log("FormData before appending files:");
    console.log("  subject_id:", subjectId);
    console.log("  content:", announcementText.trim());
    console.log("  files to upload:", selectedAttachments.length);
    
    selectedAttachments.forEach((attachment, index) => {
      console.log(`  appending file ${index}:`, attachment.file.name, "size:", attachment.file.size);
      formData.append("attachments", attachment.file);
    });

    setIsPosting(true);
    try {
      const response = await axios.post(
        "http://localhost:5000/instructor/announcements",
        formData,
        {
          headers: { 
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("Announcement response:", response.data);

      const createdAnnouncement = response.data?.announcement;
      
      console.log("Created announcement object:", createdAnnouncement);
      console.log("Attachments in response:", createdAnnouncement?.attachments);

      if (!createdAnnouncement) {
        console.error("No announcement returned from server");
        alert("Error: No announcement data returned from server");
        setIsPosting(false);
        return;
      }

      const newAnnouncement = {
        announcement_id: createdAnnouncement.announcement_id,
        content: createdAnnouncement.content,
        created_at: createdAnnouncement.created_at || new Date().toISOString(),
        instructor_name: createdAnnouncement.instructor_name || instructorName,
        attachments: createdAnnouncement.attachments || [],
      };

      console.log("Final announcement to display:", newAnnouncement);

      onAnnouncementPosted(newAnnouncement);
      onClose();
      setAnnouncementText("");
      setSelectedAttachments([]);
    } catch (error) {
      console.error("Error posting announcement:", error);
      console.error("Error response:", error.response?.data);
      alert(error.response?.data?.message || "Failed to post announcement. Please try again.");
    } finally {
      setIsPosting(false);
    }
  };

  const handleAttachmentRemove = (id) => {
    setSelectedAttachments((prev) => prev.filter((item) => item.id !== id));
  };

  const quickActions = [
    {
      label: "Add attachment",
      onClick: () => fileInputRef.current?.click(),
    },
  ];

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 bg-black/20 backdrop-blur-sm"
      style={{ animation: 'fadeIn 0.2s ease-out' }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-[0_25px_60px_rgba(15,23,42,0.18)] w-full max-w-2xl mx-4 overflow-hidden border border-indigo-50 max-h-[90vh] flex flex-col"
        style={{ animation: 'popUp 0.3s ease-out' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#f5f2ff] to-white border-b border-indigo-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold tracking-[0.3em] text-indigo-400">
              INSTRUCTOR POST
            </p>
            <h2 className="text-lg font-semibold text-slate-800 mt-1">
              New post
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-9 w-9 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-500 hover:text-slate-700 hover:shadow transition"
          >
            <span className="text-lg leading-none">&times;</span>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1">
          {/* User Row */}
          <div className="px-6 pt-5 pb-3 flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-semibold text-lg">
              {instructorName
                .split(" ")
                .map((n) => n.charAt(0))
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </div>
            <div>
              <p className="font-medium text-slate-800">{instructorName}</p>
              <p className="text-xs text-slate-400">
                What&apos;s happening in {classInfo.className}?
              </p>
            </div>
          </div>

          {/* Text Input Area */}
          <div className="px-6 pb-4">
            <textarea
              value={announcementText}
              onChange={(e) => setAnnouncementText(e.target.value)}
              placeholder={`Share an update with ${classInfo.className}`}
              className="w-full min-h-[180px] px-4 py-3 border-2 border-indigo-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-300 text-gray-800 placeholder-gray-400 resize-none text-base bg-indigo-50/40"
              autoFocus
            />
          </div>

          {selectedAttachments.length > 0 && (
            <div className="px-6 pb-4">
              {/* File List */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-indigo-600 uppercase tracking-[0.25em] mb-3">
                  Files ({selectedAttachments.length}/6)
                </p>
                {selectedAttachments.map((attachment) => {
                  const mimeType = attachment.mimeType || attachment.file.type;
                  const isImage = mimeType.startsWith("image/");
                  const isVideo = mimeType.startsWith("video/");
                  const previewUrl = isImage || isVideo ? URL.createObjectURL(attachment.file) : null;

                  return (
                    <div
                      key={attachment.id}
                      className="rounded-xl border border-indigo-100 bg-indigo-50/60 overflow-hidden"
                    >
                      {/* Preview */}
                      {previewUrl && (isImage || isVideo) && (
                        <div className="relative w-full bg-black/5 max-h-40 overflow-hidden">
                          {isImage && (
                            <img
                              src={previewUrl}
                              alt={attachment.file.name}
                              className="w-full h-40 object-cover"
                            />
                          )}
                          {isVideo && (
                            <video
                              src={previewUrl}
                              className="w-full h-40 object-cover"
                              controls
                            />
                          )}
                        </div>
                      )}

                      {/* File Info */}
                      <div className="flex items-center justify-between px-4 py-3 text-sm text-slate-700">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-lg" aria-hidden>
                            {getAttachmentIcon(mimeType)}
                          </span>
                          <div className="min-w-0">
                            <p className="font-medium truncate">{attachment.file.name}</p>
                            <p className="text-xs text-indigo-400">
                              {formatFileSize(attachment.file.size)}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleAttachmentRemove(attachment.id)}
                          className="text-xs font-semibold text-indigo-500 hover:text-indigo-700 transition ml-2 flex-shrink-0"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Formatting Toolbar */}
          <div className="px-6 pb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {quickActions.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  title={item.label}
                  onClick={item.onClick}
                  className="px-4 py-2 rounded-lg border border-indigo-200 text-indigo-600 font-medium text-sm hover:bg-indigo-50 transition"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 flex items-center justify-end gap-3 bg-indigo-50/40 border-t border-indigo-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-indigo-500 font-semibold hover:bg-white rounded-lg transition"
            disabled={isPosting}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!announcementText.trim() || isPosting}
            onClick={handlePostAnnouncement}
            className={`px-6 py-2 rounded-lg font-medium transition ${
              announcementText.trim() && !isPosting
                ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-200"
                : "bg-indigo-100 text-indigo-300 cursor-not-allowed"
            }`}
          >
            {isPosting ? "Posting..." : "Post"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AnnouncementComposer;
