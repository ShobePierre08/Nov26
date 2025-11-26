import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import PhaserSimulator from "../../features/DragDrop/components/PhaserSimulator";

export default function SimPCActivityView({ activity, onBack, onSubmit }) {
  const [isCompleted, setIsCompleted] = useState(false);
  const [completionTime, setCompletionTime] = useState(0);
  const [startTime] = useState(new Date());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkpoints, setCheckpoints] = useState({
    cpu: { completed: false, progress: 0, timestamp: null },
    cmos: { completed: false, progress: 0, timestamp: null },
    ram: { completed: false, progress: 0, timestamp: null },
  });
  const [overallProgress, setOverallProgress] = useState(0);
  const token = localStorage.getItem("token");

  // Load saved checkpoints when activity opens
  useEffect(() => {
    const loadSavedCheckpoints = async () => {
      try {
        const res = await axios.get(
          `http://localhost:5000/activity/${activity.activity_id}/my-submission`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (res.data?.checkpoint_data) {
          setCheckpoints(JSON.parse(res.data.checkpoint_data));
        }
      } catch (err) {
        console.log("No saved checkpoints found");
      }
    };

    if (token && activity.activity_id) loadSavedCheckpoints();
  }, [activity.activity_id, token]);

  // Update overall progress
  useEffect(() => {
    const completed = Object.values(checkpoints).filter((c) => c.completed).length;
    setOverallProgress((completed / Object.keys(checkpoints).length) * 100);
  }, [checkpoints]);

  // Track elapsed time
  useEffect(() => {
    if (isCompleted) return;

    const timer = setInterval(() => {
      setCompletionTime(Math.floor((new Date() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(timer);
  }, [isCompleted, startTime]);

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Save checkpoint to database
  const saveCheckpoint = useCallback(async (componentName, progress, isCompleted) => {
    try {
      console.log("saveCheckpoint called:", { componentName, progress, isCompleted });
      const updatedCheckpoints = {
        ...checkpoints,
        [componentName]: {
          completed: isCompleted,
          progress,
          timestamp: new Date().toISOString(),
        },
      };
      console.log("Updated checkpoints:", updatedCheckpoints);
      setCheckpoints(updatedCheckpoints);

      const response = await axios.post(
        `http://localhost:5000/activity/${activity.activity_id}/checkpoint`,
        {
          component: componentName,
          progress,
          isCompleted,
          checkpointData: JSON.stringify(updatedCheckpoints),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log("Checkpoint saved successfully:", response.data);
    } catch (err) {
      console.error("Failed to save checkpoint:", err);
    }
  }, [checkpoints, activity.activity_id, token]);

  const handleCompleteActivity = async () => {
    if (overallProgress < 100) {
      alert("Please complete all components before submitting.");
      return;
    }

    setIsCompleted(true);
    setIsSubmitting(true);

    try {
      const submissionData = {
        activity_id: activity.activity_id,
        submission_text: `SimPC activity completed. Time taken: ${formatTime(completionTime)}`,
        completion_status: "completed",
        checkpoint_data: JSON.stringify(checkpoints),
      };

      const formData = new FormData();
      formData.append("activity_id", activity.activity_id);
      formData.append("submission_text", submissionData.submission_text);
      formData.append("checkpoint_data", submissionData.checkpoint_data);

      if (!token) {
        alert('You are not logged in. Please login and try again.');
        setIsSubmitting(false);
        setIsCompleted(false);
        return;
      }

      const API_BASE_URL = "http://localhost:5000";
      await axios.post(
        `${API_BASE_URL}/activity/${activity.activity_id}/submission`,
        formData,
        {
          headers: { Authorization: `Bearer ${token}`, 'x-access-token': token },
        }
      );

      if (onSubmit) {
        onSubmit(submissionData);
      }

      // Show success message for 2 seconds before redirecting
      setTimeout(() => {
        onBack();
      }, 2000);
    } catch (error) {
      console.error("Error submitting SimPC activity:", error);
      alert("Error submitting activity. Please try again.");
      setIsCompleted(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gray-900 w-screen h-screen">
      {/* Header - Compact */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white px-4 py-3 border-b border-gray-700 flex justify-between items-center z-10">
        <div className="flex-1 min-w-0 flex items-center gap-6">
          <div>
            <h2 className="text-lg font-bold truncate">{activity.title || "PC Building Simulator"}</h2>
            {activity.instructions && (
              <p className="text-xs text-gray-300 mt-0.5 line-clamp-1">
                {activity.instructions}
              </p>
            )}
          </div>
          
          {/* Progress Bar - Inline */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold whitespace-nowrap">{overallProgress.toFixed(0)}%</span>
            <div className="w-32 h-2 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all duration-300"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
          </div>

          {/* Components Checklist */}
          <div className="flex gap-4 text-xs text-gray-300 border-l border-gray-700 pl-4">
            {Object.entries(checkpoints).map(([name, data]) => (
              <div key={name} className="flex items-center gap-1 uppercase">
                <span className={`w-4 h-4 flex items-center justify-center rounded text-xs font-bold ${
                  data.completed ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-400'
                }`}>
                  {data.completed ? '✓' : '○'}
                </span>
                <span>{name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Timer - Compact */}
        <div className="text-right ml-3 flex-shrink-0">
          <div className="text-2xl font-mono font-bold text-blue-400">{formatTime(completionTime)}</div>
          <div className="text-xs text-gray-400">Elapsed</div>
        </div>
      </div>

      {/* Simulator Container */}
      <div className="flex-1 overflow-hidden relative w-full h-full">
        <PhaserSimulator
          onCheckpointComplete={saveCheckpoint}
          savedCheckpoints={checkpoints}
        />

        {/* Completion Overlay */}
        {isCompleted && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 text-center shadow-2xl animate-in fade-in zoom-in duration-300">
              <div className="mb-4 text-5xl">✓</div>
              <h3 className="text-2xl font-bold text-green-600 mb-4">Activity Completed!</h3>
              <p className="text-gray-700 mb-2 text-lg">Time Taken: {formatTime(completionTime)}</p>
              <p className="text-gray-500 mb-6">Your submission has been recorded successfully.</p>
              <div className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg font-medium">
                Redirecting...
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-gray-800 text-white px-4 py-2 border-t border-gray-700 flex justify-end gap-2 z-40">
        <button
          onClick={onBack}
          disabled={isSubmitting}
          className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Exit
        </button>
        <button
          onClick={handleCompleteActivity}
          disabled={isCompleted || isSubmitting || overallProgress < 100}
          className={`px-4 py-1 rounded text-sm font-medium transition ${
            isCompleted || isSubmitting || overallProgress < 100
              ? "bg-green-600 text-white cursor-not-allowed opacity-50"
              : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
        >
          {isSubmitting ? "Submitting..." : isCompleted ? "✓ Submitted" : "Submit Activity"}
        </button>
      </div>
    </div>
  );
}
