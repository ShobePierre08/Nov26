import React, { useState, useEffect } from "react";
import axios from "axios";
import Editor from "@monaco-editor/react";
import Split from "react-split";

export default function CodeLabActivityView({ activity, onBack, onSubmit }) {
  const [isCompleted, setIsCompleted] = useState(false);
  const [completionTime, setCompletionTime] = useState(0);
  const [startTime] = useState(new Date());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFooter, setShowFooter] = useState(true);
  const token = localStorage.getItem("token");

  // Compiler state
  const [language, setLanguage] = useState("python3");
  const [code, setCode] = useState("# Write your code here\n");
  const [output, setOutput] = useState("");
  const [theme, setTheme] = useState("vs-dark");
  const [isRunning, setIsRunning] = useState(false);
  const [executionTime, setExecutionTime] = useState(null);

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

  const getDefaultCode = (lang) => {
    const templates = {
      python3: "# Write your code here\nprint('Hello, World!')",
      javascript: "// Write your code here\nconsole.log('Hello, World!');",
      c: `#include <stdio.h>\n\nint main() {\n    printf("Hello, World!\\n");\n    return 0;\n}`,
      cpp: `#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello, World!" << endl;\n    return 0;\n}`,
      java: `public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}`,
    };
    return templates[lang] || templates.python3;
  };

  const runCode = async () => {
    if (!code.trim()) {
      setOutput("Error: Code cannot be empty");
      return;
    }

    setIsRunning(true);
    setOutput("Running...");
    setExecutionTime(null);
    const codeStartTime = Date.now();

    try {
      const res = await axios.post(
        "http://localhost:5000/code/runcode",
        {
          language,
          code,
          stdin: "",
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          timeout: 15000,
        }
      );

      const codeEndTime = Date.now();
      setExecutionTime(((codeEndTime - codeStartTime) / 1000).toFixed(2));

      if (res.data.success === false || res.data.error) {
        const errorMsg = res.data.run?.stderr || res.data.error || "Execution failed";
        setOutput(`Error:\n${errorMsg}`);
        return;
      }

      const runData = res.data.run || res.data;
      let finalOutput = "";

      if (runData.stderr && runData.stderr.trim()) {
        finalOutput += `Error:\n${runData.stderr}\n\n`;
      }

      if (runData.stdout && runData.stdout.trim()) {
        finalOutput += runData.stdout;
      } else if (runData.output && runData.output.trim()) {
        finalOutput += runData.output;
      }

      if (!finalOutput.trim()) {
        if (runData.code === 0) {
          finalOutput = "Program executed successfully (no output)";
        } else {
          finalOutput = runData.stderr || "No output";
        }
      }

      setOutput(finalOutput.trim());
    } catch (err) {
      const codeEndTime = Date.now();
      setExecutionTime(((codeEndTime - codeStartTime) / 1000).toFixed(2));

      let errorMessage = "Error: ";
      if (err.response?.data?.run?.stderr) {
        errorMessage += err.response.data.run.stderr;
      } else if (err.response?.data?.error) {
        errorMessage += err.response.data.error;
      } else if (err.code === "ECONNABORTED") {
        errorMessage += "Request timeout. Your code may be taking too long to execute.";
      } else if (err.message) {
        errorMessage += err.message;
      } else {
        errorMessage += "Failed to execute code. Please try again.";
      }

      setOutput(errorMessage);
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmitActivity = async () => {
    setIsCompleted(true);
    setIsSubmitting(true);

    try {
      if (!token) {
        alert("You are not logged in. Please login and try again.");
        setIsSubmitting(false);
        setIsCompleted(false);
        return;
      }

      const submissionData = {
        activity_id: activity.activity_id,
        submission_text: `CodeLab activity completed. Time taken: ${formatTime(completionTime)}\n\n--- Code Submitted ---\n${code}\n\n--- Final Output ---\n${output}`,
        completion_status: "completed",
      };

      const formData = new FormData();
      formData.append("activity_id", activity.activity_id);
      formData.append("submission_text", submissionData.submission_text);

      const API_BASE_URL = "http://localhost:5000";
      await axios.post(
        `${API_BASE_URL}/activity/${activity.activity_id}/submission`,
        formData,
        {
          headers: { Authorization: `Bearer ${token}`, "x-access-token": token },
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
      console.error("Error submitting CodeLab activity:", error);
      alert("Error submitting activity. Please try again.");
      setIsCompleted(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gray-900">
      {/* Header - Compact */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white px-4 py-2 border-b border-gray-700 flex justify-between items-center z-10">
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold truncate">{activity.title || "Code Lab"}</h2>
          {activity.instructions && (
            <p className="text-xs text-gray-300 mt-0.5 line-clamp-1">
              {activity.instructions}
            </p>
          )}
        </div>

        {/* Timer - Compact */}
        <div className="text-right ml-3 flex-shrink-0">
          <div className="text-2xl font-mono font-bold text-blue-400">{formatTime(completionTime)}</div>
          <div className="text-xs text-gray-400">Elapsed</div>
        </div>
      </div>

      {/* Compiler Container */}
      <div className="flex-1 overflow-hidden relative flex flex-col bg-gray-950">
        {/* Toolbar - Clean and Modern */}
        <div className="bg-gradient-to-r from-gray-800 to-gray-850 border-b border-gray-700 px-4 py-3 flex items-center justify-between gap-3">
          <div className="text-sm text-gray-400">Code Editor</div>
          <div className="flex items-center gap-3">
            <select
              value={language}
              onChange={(e) => {
                const newLang = e.target.value;
                setLanguage(newLang);
                if (!code.trim() || code.trim() === getDefaultCode(language)) {
                  setCode(getDefaultCode(newLang));
                }
              }}
              className="bg-gray-700 border border-gray-600 text-white rounded px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer hover:bg-gray-600 transition"
            >
              <option value="python3">🐍 Python</option>
              <option value="javascript">📜 JavaScript</option>
              <option value="c">⚙️ C</option>
              <option value="cpp">⚙️ C++</option>
              <option value="java">☕ Java</option>
            </select>

            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className="bg-gray-700 border border-gray-600 text-white rounded px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer hover:bg-gray-600 transition"
            >
              <option value="vs-dark">🌙 Dark</option>
              <option value="light">☀️ Light</option>
            </select>

            <button
              onClick={runCode}
              disabled={isRunning}
              className={`${
                isRunning
                  ? "bg-gray-600 cursor-not-allowed text-gray-400"
                  : "bg-blue-600 hover:bg-blue-700 cursor-pointer text-white shadow-md hover:shadow-lg"
              } font-medium px-5 py-1.5 rounded transition-all text-sm flex items-center gap-2`}
            >
              {isRunning ? "⏳ Running..." : "▶ Run"}
            </button>
          </div>
        </div>

        {/* Split Panel: Code Editor | Output */}
        <div className="flex-1 overflow-hidden flex">
          <Split className="flex flex-row w-full" sizes={[60, 40]} minSize={250} gutterSize={4}>
            {/* Monaco Code Editor */}
            <div className="h-full overflow-hidden border-r border-gray-700">
              <Editor
                height="100%"
                language={language === "python3" ? "python" : language}
                theme={theme}
                value={code}
                onChange={(val) => setCode(val || "")}
                options={{
                  fontSize: 15,
                  fontFamily: "'Fira Code', 'Monaco', monospace",
                  minimap: { enabled: false },
                  automaticLayout: true,
                  scrollBeyondLastLine: false,
                  renderWhitespace: "none",
                  smoothScrolling: true,
                  padding: { top: 16, bottom: 16 },
                  lineHeight: 1.6,
                  wordWrap: "on",
                  formatOnPaste: true,
                }}
              />
            </div>

            {/* Output Section */}
            <div className="flex flex-col h-full bg-gray-950 overflow-hidden">
              <div className="bg-gradient-to-r from-gray-800 to-gray-850 border-b border-gray-700 px-4 py-2 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-300">📤 Output</h2>
                {executionTime && (
                  <span className="text-xs text-gray-500 bg-gray-700 px-2 py-1 rounded">
                    {executionTime}s
                  </span>
                )}
              </div>
              <div className="flex-1 overflow-auto p-4 bg-gray-950">
                <textarea
                  value={output}
                  onChange={(e) => setOutput(e.target.value)}
                  placeholder="Your output will appear here..."
                  className="w-full h-full bg-transparent text-emerald-400 font-mono text-sm resize-none focus:outline-none border-none p-0 whitespace-pre-wrap break-words placeholder:text-gray-600"
                  style={{ caretColor: "#10b981" }}
                />
              </div>
            </div>
          </Split>
        </div>

        {/* Toggle Footer Button */}
        <button
          onClick={() => setShowFooter(!showFooter)}
          className="absolute bottom-4 right-4 z-40 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-white text-xs rounded transition"
          title={showFooter ? "Hide Controls" : "Show Controls"}
        >
          {showFooter ? "▼ Hide" : "▲ Show"}
        </button>

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

      {/* Footer - Toggleable */}
      {showFooter && (
        <div className="bg-gray-800 text-white px-4 py-2 border-t border-gray-700 flex justify-end gap-2">
          <button
            onClick={onBack}
            disabled={isSubmitting}
            className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Exit
          </button>
          <button
            onClick={handleSubmitActivity}
            disabled={isCompleted || isSubmitting}
            className={`px-4 py-1 rounded text-sm font-medium transition ${
              isCompleted || isSubmitting
                ? "bg-green-600 text-white cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            {isSubmitting ? "Submitting..." : isCompleted ? "✓ Submitted" : "Submit Activity"}
          </button>
        </div>
      )}
    </div>
  );
}
