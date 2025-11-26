const axios = require('axios');

// Judge0 Language IDs mapping
const getLanguageId = (language) => {
  const languageMap = {
    'python3': 92,      // Python 3
    'python': 92,
    'javascript': 63,   // Node.js
    'js': 63,
    'c': 50,           // C (GCC 9.2.0)
    'cpp': 54,         // C++ (GCC 9.2.0)
    'c++': 54,
    'java': 62,        // Java (OpenJDK 13.0.1)
  };
  return languageMap[language.toLowerCase()] || 92; // Default to Python
};

// API Configuration
const JUDGE0_API_BASE = process.env.JUDGE0_API_URL || 'https://api.judge0.com';
const JUDGE0_RAPIDAPI_KEY = process.env.JUDGE0_RAPIDAPI_KEY || '';
const USE_RAPIDAPI = !!JUDGE0_RAPIDAPI_KEY;

// JDoodle API (fallback option)
const JDOODLE_CLIENT_ID = process.env.JDOODLE_CLIENT_ID || '';
const JDOODLE_CLIENT_SECRET = process.env.JDOODLE_CLIENT_SECRET || '';
const USE_JDOODLE = !!(JDOODLE_CLIENT_ID && JDOODLE_CLIENT_SECRET);

exports.runCode = async (req, res) => {
  const { language, code, stdin } = req.body;

  if (!language || !code) {
    return res.status(400).json({ error: "Language and code are required." });
  }

  try {
    // Try JDoodle first if configured
    if (USE_JDOODLE) {
      return await executeWithJDoodle(language, code, stdin, res);
    }
    
    // Try Judge0 with RapidAPI if configured
    if (USE_RAPIDAPI) {
      return await executeWithJudge0(language, code, stdin, res);
    }
    
    // If no API is configured, return helpful error
    res.status(500).json({
      success: false,
      error: "Code execution API not configured",
      details: "Please configure JDoodle API credentials. See README for setup instructions.",
      run: {
        stderr: "Error: No code execution API configured.\n\nTo fix this:\n1. Get free JDoodle API credentials from https://www.jdoodle.com/api-execute\n2. Create a .env file in the backend directory\n3. Add: JDOODLE_CLIENT_ID=your_id\n4. Add: JDOODLE_CLIENT_SECRET=your_secret\n5. Restart the server",
        stdout: "",
        output: "",
        code: 1,
        status: "Configuration Error",
      }
    });
  } catch (error) {
    console.error("Code Execution Error:", error.response?.data || error.message);
    
    let errorMessage = "Execution failed";
    if (error.response?.data) {
      errorMessage = error.response.data.message || JSON.stringify(error.response.data);
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    // Check for network/DNS errors
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      errorMessage = `Network error: Cannot connect to code execution API. ${errorMessage}\n\nPlease configure JDoodle API credentials for a more reliable service.`;
    }
    
    res.status(500).json({
      success: false,
      error: "Execution failed",
      details: errorMessage,
      run: {
        stderr: errorMessage,
        stdout: "",
        output: "",
        code: 1,
        status: "Error",
      }
    });
  }
};

// JDoodle API execution
async function executeWithJDoodle(language, code, stdin, res) {
  // JDoodle language mapping
  const jdoodleLanguageMap = {
    'python3': 'python3',
    'python': 'python3',
    'javascript': 'nodejs',
    'js': 'nodejs',
    'c': 'c',
    'cpp': 'cpp17',
    'c++': 'cpp17',
    'java': 'java',
  };

  // JDoodle version index mapping
  // versionIndex: '0' = default, '3' = Python 3, '4' = Python 3.9, etc.
  const versionIndexMap = {
    'python3': '3',      // Python 3
    'python': '3',       // Python 3
    'nodejs': '4',       // Node.js latest
    'javascript': '4',
    'js': '4',
    'c': '5',            // C (GCC 9.3.0)
    'cpp17': '0',        // C++17
    'cpp': '0',
    'java': '4',         // Java 15
  };

  const jdoodleLang = jdoodleLanguageMap[language.toLowerCase()] || 'python3';
  const versionIndex = versionIndexMap[jdoodleLang] || '3'; // Default to Python 3

  // Ensure stdin is properly formatted (each input() call reads one line)
  const formattedStdin = stdin ? stdin.trim() : "";

  const payload = {
    clientId: JDOODLE_CLIENT_ID,
    clientSecret: JDOODLE_CLIENT_SECRET,
    script: code,
    language: jdoodleLang,
    versionIndex: versionIndex,
    stdin: formattedStdin,
  };

  // Log for debugging (remove in production)
  console.log(`Executing ${language} code with JDoodle: ${jdoodleLang}, versionIndex: ${versionIndex}`);
  if (formattedStdin) {
    console.log(`Stdin provided: ${formattedStdin.replace(/\n/g, '\\n')}`);
  }

  try {
    const response = await axios.post('https://api.jdoodle.com/v1/execute', payload, {
      timeout: 15000,
    });

    const data = response.data;
    
    // JDoodle response format
    res.json({
      success: !data.error && data.statusCode === 200,
      language: language,
      run: {
        stdout: data.output || "",
        stderr: data.error || "",
        output: data.output || data.error || "",
        code: (data.error || data.statusCode !== 200) ? 1 : 0,
        status: (data.error || data.statusCode !== 200) ? "Error" : "Success",
        memory: data.memory || null,
        cpuTime: data.cpuTime || null,
      }
    });
  } catch (error) {
    // Handle JDoodle specific errors
    if (error.response?.data) {
      const errorData = error.response.data;
      throw new Error(errorData.error || `JDoodle API error: ${JSON.stringify(errorData)}`);
    }
    throw error;
  }
}

// Judge0 API execution
async function executeWithJudge0(language, code, stdin, res) {
  const languageId = getLanguageId(language);
  
  // Submit code with wait=true for simpler execution
  const submitPayload = {
    source_code: code,
    language_id: languageId,
    stdin: stdin || "",
    cpu_time_limit: 5,
    memory_limit: 128000,
    wall_time_limit: 10,
  };

  const headers = {
    'Content-Type': 'application/json',
  };

  if (USE_RAPIDAPI) {
    headers['X-RapidAPI-Key'] = JUDGE0_RAPIDAPI_KEY;
    headers['X-RapidAPI-Host'] = 'judge0-ce.p.rapidapi.com';
  }

  // Use wait=true for synchronous execution (simpler, but may timeout on long runs)
  const submitUrl = USE_RAPIDAPI 
    ? 'https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=false&wait=true'
    : `${JUDGE0_API_BASE}/submissions?base64_encoded=false&wait=true`;

  const response = await axios.post(submitUrl, submitPayload, {
    headers,
    timeout: 20000, // 20 seconds for wait mode
  });

  const result = response.data;

  // Map Judge0 status to our response format
  const statusId = result.status?.id || 0;
  const isSuccess = statusId === 3; // Accepted
  const hasError = statusId >= 4 && statusId <= 12; // Various error statuses

  // Get output and error messages
  const stdout = result.stdout || "";
  const stderr = result.stderr || "";
  const compileOutput = result.compile_output || "";
  const message = result.message || "";

  // Combine all error information
  let errorOutput = "";
  if (stderr) errorOutput += stderr;
  if (compileOutput) errorOutput += (errorOutput ? "\n" : "") + compileOutput;
  if (message && hasError) errorOutput += (errorOutput ? "\n" : "") + message;

  // Get status description
  const statusDescription = result.status?.description || "Unknown";

  // Return formatted response
  res.json({
    success: isSuccess,
    language: language,
    run: {
      stdout: stdout || "",
      stderr: errorOutput || "",
      output: stdout || errorOutput || "",
      code: isSuccess ? 0 : (hasError ? 1 : 0),
      signal: result.signal || null,
      status: statusDescription,
      time: result.time || null,
      memory: result.memory || null,
    }
  });
}
