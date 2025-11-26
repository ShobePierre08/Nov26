import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Editor from "@monaco-editor/react"; // 🧠 Monaco Editor import
import Split from "react-split"; // ✨ Modern split layout
import Header from "../web_components/Header";
import Sidebar from "../pages/student/Sidebar";



// MAKE THIS IMPORTABLE INTO STUDENT DASHBOARD

function Compiler() {
  const [message, setMessage] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const [language, setLanguage] = useState("python3");
  const [code, setCode] = useState("print('Hello, World!')");
  const [output, setOutput] = useState("");
  const [theme, setTheme] = useState("vs-dark");
  const [isRunning, setIsRunning] = useState(false);
  const [executionTime, setExecutionTime] = useState(null);

  // Default code templates for each language
  const getDefaultCode = (lang) => {
    const templates = {
      python3: "print('Hello, World!')",
      javascript: "console.log('Hello, World!');",
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
    const startTime = Date.now();

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

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
          timeout: 15000, // 15 second timeout
        }
      );

      const endTime = Date.now();
      setExecutionTime(((endTime - startTime) / 1000).toFixed(2));

      if (res.data.success === false || res.data.error) {
        // Handle error response
        const errorMsg = res.data.run?.stderr || res.data.error || "Execution failed";
        setOutput(`Error:\n${errorMsg}`);
        return;
      }

      // Extract output properly
      const runData = res.data.run || res.data;
      let finalOutput = "";

      // Show stderr if there's an error
      if (runData.stderr && runData.stderr.trim()) {
        finalOutput += `Error:\n${runData.stderr}\n\n`;
      }

      // Show stdout (normal output)
      if (runData.stdout && runData.stdout.trim()) {
        finalOutput += runData.stdout;
      } else if (runData.output && runData.output.trim()) {
        finalOutput += runData.output;
      }

      // If no output at all
      if (!finalOutput.trim()) {
        if (runData.code === 0) {
          finalOutput = "Program executed successfully (no output)";
        } else {
          finalOutput = runData.stderr || "No output";
        }
      }

      setOutput(finalOutput.trim());
    } catch (err) {
      const endTime = Date.now();
      setExecutionTime(((endTime - startTime) / 1000).toFixed(2));
      
      console.error("Code execution error:", err.response?.data || err.message);
      
      let errorMessage = "Error: ";
      if (err.response?.data?.run?.stderr) {
        errorMessage += err.response.data.run.stderr;
      } else if (err.response?.data?.error) {
        errorMessage += err.response.data.error;
      } else if (err.code === 'ECONNABORTED') {
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


  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
    }
    
    // Set eye-friendly dark mode background
    document.body.style.backgroundColor = "#1a1a1a"; // Warm dark gray
    document.documentElement.style.backgroundColor = "#1a1a1a";
    
    // Cleanup: restore original background when component unmounts
    return () => {
      document.body.style.backgroundColor = "";
      document.documentElement.style.backgroundColor = "";
    };
  }, [navigate]);

  return (
    <div className="flex h-screen overflow-hidden bg-[#1a1a1a]">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col bg-[#1a1a1a]">
        <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-grow p-4 overflow-auto bg-[#1a1a1a]">
          {message && (
            <p className="mb-4 text-lg font-medium text-center text-[#d4d4d4]">
              {message}
            </p>
          )}

          <div className="mt-18 overflow-hidden flex flex-col h-[90vh] bg-[#252525] border border-[#3a3a3a] rounded-lg shadow-lg">
            {/* Toolbar */}
            <div className="flex items-center justify-end py-2.5 border-b bg-[#2d2d2d] border-[#3a3a3a]">
              <div className="flex items-center gap-3 px-3">
                <select
                  value={language}
                  onChange={(e) => {
                    const newLang = e.target.value;
                    setLanguage(newLang);
                    // Only set default code if current code is empty or matches the old default
                    if (!code.trim() || code.trim() === getDefaultCode(language)) {
                      setCode(getDefaultCode(newLang));
                    }
                  }}
                  className="bg-[#3a3a3a] border border-[#4a4a4a] text-[#d4d4d4] rounded-md px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer hover:bg-[#404040] transition-colors"
                >
                  <option value="python3">Python</option>
                  <option value="javascript">JavaScript</option>
                  <option value="c">C</option>
                  <option value="cpp">C++</option>
                  <option value="java">Java</option>
                </select>

                <select
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  className="bg-[#3a3a3a] border border-[#4a4a4a] text-[#d4d4d4] rounded-md px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer hover:bg-[#404040] transition-colors"
                >
                  <option value="vs-dark">Dark</option>
                  <option value="light">Light</option>
                </select>

                <button
                  onClick={runCode}
                  disabled={isRunning}
                  className={`${
                    isRunning 
                      ? "bg-[#5a5a5a] cursor-not-allowed text-[#9a9a9a]" 
                      : "bg-[#4a9eff] hover:bg-[#5aaaff] cursor-pointer text-white shadow-lg hover:shadow-xl"
                  } font-medium px-5 py-1.5 rounded-md transition-all duration-200`}
                >
                  {isRunning ? "⏳ Running..." : "▶ Run"}
                </button>
              </div>
            </div>

            {/* Split Panel: Code Editor | Output */}
            <Split
              className="flex flex-row flex-grow"
              sizes={[70, 30]}
              minSize={500}
              gutterSize={8}
            >
              {/* Monaco Code Editor */}
              <div className="h-full bg-[#1e1e1e]">
                <Editor
                  height="100%"
                  language={language === "python3" ? "python" : language}
                  theme={theme}
                  value={code}
                  onChange={(val) => setCode(val || "")}
                  options={{
                    fontSize: 15,
                    minimap: { enabled: false },
                    automaticLayout: true,
                    scrollBeyondLastLine: false,
                    renderWhitespace: "none",
                    smoothScrolling: true,
                  }}
                />
              </div>

              {/* Output Section */}
              <div className="flex flex-col border-l bg-[#1e1e1e] border-[#3a3a3a]">
                <div className="flex items-center justify-between px-4 py-2.5 border-b bg-[#252525] border-[#3a3a3a]">
                  <h2 className="text-sm font-semibold text-[#d4d4d4]">
                    Output
                  </h2>
                  {executionTime && (
                    <span className="text-xs text-[#9a9a9a]">
                      Executed in {executionTime}s
                    </span>
                  )}
                </div>
                <div className="flex-1 p-4 overflow-auto">
                  <textarea
                    value={output}
                    onChange={(e) => setOutput(e.target.value)}
                    placeholder="Your output will appear here..."
                    className="w-full h-full bg-[#1e1e1e] text-[#4ec9b0] font-mono text-sm resize-none focus:outline-none border-none p-0 whitespace-pre-wrap break-words placeholder:text-[#6a6a6a]"
                    style={{ caretColor: '#4ec9b0' }}
                  />
                </div>
              </div>
            </Split>
          </div>
        </main>
      </div>
    </div>
  );
}

export default Compiler;
