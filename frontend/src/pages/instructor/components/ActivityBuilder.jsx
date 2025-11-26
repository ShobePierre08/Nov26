import React, { useState, useEffect } from "react";

function ActivityBuilder({
  isOpen,
  onClose,
  activityName,
  setActivityName,
  openDateTime,
  setOpenDateTime,
  dueDateTime,
  setDueDateTime,
  timeLimit,
  setTimeLimit,
  title,
  setTitle,
  instructions,
  setInstructions,
  isCreatingActivity,
  onCreateActivity,
  onReset,
}) {
  const [selectedActivities, setSelectedActivities] = useState([]);
  // attachments: array of { file: File, preview: string | null }
  const [attachments, setAttachments] = useState([]);
  const fileInputRef = React.useRef(null);

  useEffect(() => {
    // Clear attachments when modal is closed so state doesn't persist across openings
    if (!isOpen) {
      // revoke previews to avoid leaking memory
      attachments.forEach((a) => {
        if (a.preview) URL.revokeObjectURL(a.preview);
      });
      setAttachments([]);
      setSelectedActivities([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    // Sync selectedActivities when parent title changes (handles resets from parent)
    if (title && typeof title === "string") {
      const parts = title.split(",").map((p) => p.trim()).filter(Boolean);
      // only update if different to avoid loops
      const equal = parts.length === selectedActivities.length && parts.every((p) => selectedActivities.includes(p));
      if (parts.length && !equal) {
        setSelectedActivities(parts);
      }
    } else if (!title && selectedActivities.length) {
      // parent cleared title -> clear selections
      setSelectedActivities([]);
    }
    // Intentionally only depend on `title` to avoid update-in-render loops
  }, [title]);

  const handleActivityToggle = (activity) => {
    setSelectedActivities((prev) => {
      const exists = prev.includes(activity);
      const next = exists ? prev.filter((a) => a !== activity) : [...prev, activity];
      // keep parent's title in sync as a comma-separated string for compatibility
      setTitle(next.join(", "));
      return next;
    });
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl mx-4 my-8"
        onClick={(e) => e.stopPropagation()}
      >
          {/* Header */}
          <div className="sticky top-0 bg-white flex items-center justify-between p-6 border-b border-gray-200 rounded-t-2xl z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <svg
                className="w-5 h-5 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <h2 className="text-xl font-semibold text-gray-800">Create Activity</h2>
          </div>
          
        </div>

        <div className="p-6 space-y-8 max-h-[calc(100vh-180px)] overflow-y-auto">
          {/* Step 1: Activity Name */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-semibold text-sm">
                1
              </span>
              <h3 className="text-lg font-semibold text-gray-800">
                Enter the name.
              </h3>
            </div>
            <div>
              <input
                type="text"
                value={activityName}
                onChange={(e) => setActivityName(e.target.value)}
                placeholder="Activity name*"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800"
              />
            </div>
          </div>

           {/* Step 2: Add Attachment */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-semibold text-sm">
                2
              </span>
              <h3 className="text-lg font-semibold text-gray-800">
                Add Attachment.
              </h3>
            </div>
            <div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
                >
                  Add attachment
                </button>
                <p className="text-sm text-gray-500">You can add files that students will use for this activity.</p>
              </div>

              {attachments.length > 0 && (
                <div className="mt-4 space-y-2">
                  {attachments.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 border border-gray-200 rounded-lg">
                      <div className="flex items-center gap-3 min-w-0">
                        {item.preview ? (
                          <img src={item.preview} alt={item.file.name} className="w-12 h-12 object-cover rounded" />
                        ) : (
                          <div className="w-12 h-12 flex items-center justify-center bg-gray-100 rounded text-sm text-gray-600">{item.file.name.split('.').pop()}</div>
                        )}
                        <div className="min-w-0">
                          <div className="text-sm text-gray-600 truncate">{item.file.name}</div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (item.preview) URL.revokeObjectURL(item.preview);
                          setAttachments((prev) => prev.filter((_, i) => i !== idx));
                        }}
                        className="text-sm text-red-600 hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => {
                  const files = e.target.files ? Array.from(e.target.files) : [];
                  if (files.length) {
                    const items = files.map((f) => ({
                      file: f,
                      preview: f.type && f.type.startsWith("image/") ? URL.createObjectURL(f) : null,
                    }));
                    setAttachments((prev) => [...prev, ...items]);
                  }
                  e.target.value = null;
                }}
              />
            </div>
          </div>

          {/* Step 3: Time Restrictions */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-semibold text-sm">
                3
              </span>
              <h3 className="text-lg font-semibold text-gray-800">
                Set the time restrictions for your activity.
              </h3>
            </div>
            <div className="space-y-6">
              {/* Open date and time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Open date and time*
                </label>
                <div className="relative">
                  <input
                    type="datetime-local"
                    value={openDateTime}
                    onChange={(e) => setOpenDateTime(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800"
                  />
                  <svg
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  This will be the date and time when your students can start the activity.
                </p>
              </div>

              {/* Due date and time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Due date and time*
                </label>
                <div className="relative">
                  <input
                    type="datetime-local"
                    value={dueDateTime}
                    onChange={(e) => setDueDateTime(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800"
                  />
                  <svg
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  This will be the date and time when your students cannot access the activity anymore.
                </p>
              </div>

              {/* Time limit */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Time limit
                </label>
                <select
                  value={timeLimit}
                  onChange={(e) => setTimeLimit(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 bg-white"
                >
                  <option>While the activity is still open</option>
                  <option>30 minutes</option>
                  <option>1 hour</option>
                  <option>2 hours</option>
                  <option>3 hours</option>
                </select>
                <p className="mt-2 text-sm text-gray-500">
                  This will limit how long your students can take the activity after starting it.
                </p>
              </div>
            </div>
          </div>

          {/* Title Section */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-semibold text-sm">
                4
              </span>
              <h3 className="text-lg font-semibold text-gray-800">
                Set the activity you want for student.
              </h3>
            </div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Activity Type *
            </label>
            <div className="flex flex-wrap gap-3">
              {["CodeLab", "Sim Pc", "Quiz", "Experiment"].map((activity) => {
                const selected = selectedActivities.includes(activity);
                return (
                  <button
                    type="button"
                    key={activity}
                    onClick={() => handleActivityToggle(activity)}
                    className={`px-4 py-2 rounded-lg font-medium transition inline-flex items-center gap-2 ${
                      selected
                        ? "bg-blue-600 text-white shadow-lg"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {activity}
                  </button>
                );
              })}

            </div>
            {/* Activity Type Descriptions */}
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              {selectedActivities.length > 0 && (
                <div className="space-y-2">
                  {selectedActivities.map((activity) => {
                    const descriptions = {
                      "CodeLab": "Students write and execute code directly in the browser with real-time feedback.",
                      "Sim Pc": "Interactive PC building simulator where students learn hardware components by dragging parts to correct slots. A hands-on learning experience for computer architecture.",
                      "Quiz": "Multiple choice or short answer questions to test student knowledge.",
                      "Experiment": "Hands-on experiments for students to conduct and observe outcomes.",
                    };
                    return (
                      <div key={activity} className="text-sm">
                        <span className="font-semibold text-blue-900">{activity}:</span>
                        <p className="text-blue-800">{descriptions[activity]}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <p className="mt-3 text-xs text-gray-500">*Required</p>
          </div>
          {/* Instructions Section */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-semibold text-sm">
                5
              </span>
              <h3 className="text-lg font-semibold text-gray-800">
                Add instructions for your activity.
              </h3>
            </div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Instructions (optional)
            </label>
            <div className="border border-gray-300 rounded-lg">
              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Instructions (optional)"
                rows={8}
                className="w-full px-4 py-3 border-0 rounded-t-lg focus:outline-none text-gray-800 resize-none"
              />
              {/* Formatting Toolbar */}
              <div className="border-t border-gray-200 px-4 py-2 flex items-center gap-2">
                <button
                  className="p-1.5 hover:bg-gray-100 rounded transition"
                  title="Bold"
                >
                  <span className="font-bold text-gray-700 text-sm">B</span>
                </button>
                <button
                  className="p-1.5 hover:bg-gray-100 rounded transition"
                  title="Italic"
                >
                  <span className="italic text-gray-700 text-sm">I</span>
                </button>
                <button
                  className="p-1.5 hover:bg-gray-100 rounded transition"
                  title="Underline"
                >
                  <span className="underline text-gray-700 text-sm">U</span>
                </button>
                <button
                  className="p-1.5 hover:bg-gray-100 rounded transition"
                  title="Bullet List"
                >
                  <svg
                    className="w-4 h-4 text-gray-700"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM4 15a1 1 0 100 2h12a1 1 0 100-2H4z" />
                  </svg>
                </button>
                <button
                  className="p-1.5 hover:bg-gray-100 rounded transition"
                  title="Strikethrough"
                >
                  <span className="line-through text-gray-700 text-sm">X</span>
                </button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="sticky bottom-0 bg-white flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={() => {
                onReset();
                onClose();
              }}
              className="px-6 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              onClick={() => onCreateActivity(attachments.map((a) => a.file))}
              disabled={!activityName || !openDateTime || !dueDateTime || !title || isCreatingActivity}
              className={`px-6 py-2 rounded-lg font-medium transition ${
                activityName && openDateTime && dueDateTime && title && !isCreatingActivity
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              {isCreatingActivity ? "Creating..." : "Create Activity"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ActivityBuilder;
