import { useNavigate, Navigate } from "react-router-dom";
import virtulab from "../assets/Virtulab.svg";
import Header from "../web_components/Header_No_Navbar";
import Footer from "../web_components/Footer";

function Index() {
  const navigate = useNavigate();

  // Check if user is authenticated and is a student
  const token = localStorage.getItem("token");
  const userRole = localStorage.getItem("userRoleId");

  // If authenticated as student, redirect to dashboard
  if (token && Number(userRole) === 3) {
    return <Navigate to="/student/dashboard" replace />;
  }

  const goToLogin = () => navigate("/login");
  const goToRegister = () => navigate("/register");

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-[#eaf6ff] to-[#d0e6f8]">
      <Header /> {/* 🔹 Header (kept as before) */}

      {/* 🔹 Main Section */}
      <main className="mt-25 flex-grow flex flex-col items-center justify-center px-8 text-center">
        <div className="max-w-4xl space-y-6">
          {/* Title */}
          <h1 className="text-4xl lg:text-5xl font-extrabold text-[#0C274A] leading-snug">
            <span className="bg-[#4FA9E2] text-white px-3 py-1 rounded-xl mr-2">
              VIRTULAB:
            </span>
            An Interactive Web-based DIY Learning Platform for Laboratory Hands-on
            Activities for CCS Students
          </h1>

          {/* Subtitle */}
          <p className="text-gray-700 text-lg leading-relaxed">
            Where you can perform virtual lab
            experiments, develop coding skills, and track your progress
            interactively.
          </p>

          {/* Buttons */}
          <div className="flex justify-center gap-6 pt-4">
            <button
              onClick={() => window.open("/login", "_blank")}
              className="px-8 py-3 bg-[#4FA9E2] text-white font-semibold rounded-full shadow hover:bg-[#3b91c7] transition"
            >
              Sign In
            </button>


            
          </div>
        </div>
      </main>

      {/* 🔹 Activity Spotlight Section */}
      <section className="mt-10 bg-[#f5f9ff] py-16 px-6 text-center">
        <div className="max-w-6xl mx-auto">
          <h3 className="text-sm font-semibold text-indigo-600 mb-2 uppercase tracking-wide">
            Activity Spotlight
          </h3>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Playful missions student love to complete
          </h2>
          <p className="text-gray-600 mb-10">
            Every challenge is designed to build logic, creativity, and collaboration.
            Launch them in class or assign as self-paced quests.
          </p>

          {/* 🔹 Grid of Activities */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            
            {/* Drag and Drop Activities */}
            <div className="group flex flex-col items-center gap-3 rounded-3xl border border-gray-200 bg-white p-6 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
              <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  className="lucide lucide-layers h-7 w-7">
                  <path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z" />
                  <path d="M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12" />
                  <path d="M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17" />
                </svg>
              </span>
              <p className="text-sm font-semibold text-gray-800">Drag and Drop Activities</p>
            </div>

            {/* Coding Playground */}
            <div className="group flex flex-col items-center gap-3 rounded-3xl border border-gray-200 bg-white p-6 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
              <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  className="lucide lucide-gamepad2 h-7 w-7">
                  <line x1="6" x2="10" y1="11" y2="11" />
                  <line x1="8" x2="8" y1="9" y2="13" />
                  <line x1="15" x2="15.01" y1="12" y2="12" />
                  <line x1="18" x2="18.01" y1="10" y2="10" />
                  <path d="M17.32 5H6.68a4 4 0 0 0-3.978 3.59c-.006.052-.01.101-.017.152C2.604 9.416 2 14.456 2 16a3 3 0 0 0 3 3c1 0 1.5-.5 2-1l1.414-1.414A2 2 0 0 1 9.828 16h4.344a2 2 0 0 1 1.414.586L17 18c.5.5 1 1 2 1a3 3 0 0 0 3-3c0-1.545-.604-6.584-.685-7.258A4 4 0 0 0 17.32 5z" />
                </svg>
              </span>
              <p className="text-sm font-semibold text-gray-800">Coding Playground</p>
            </div>

            {/* DIY Activity Maker */}
            <div className="group flex flex-col items-center gap-3 rounded-3xl border border-gray-200 bg-white p-6 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
              <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-yellow-100 text-yellow-600">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  className="lucide lucide-sparkles h-7 w-7">
                  <path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z" />
                  <path d="M20 2v4" />
                  <path d="M22 4h-4" />
                  <circle cx="4" cy="20" r="2" />
                </svg>
              </span>
              <p className="text-sm font-semibold text-gray-800">DIY Activity Maker</p>
            </div>

            {/* Quiz Challenge */}
            <div className="group flex flex-col items-center gap-3 rounded-3xl border border-gray-200 bg-white p-6 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
              <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-green-100 text-green-600">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  className="lucide lucide-brain-circuit h-7 w-7">
                  <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" />
                  <path d="M9 13a4.5 4.5 0 0 0 3-4" />
                  <path d="M12 13h4" />
                  <path d="M12 18h6a2 2 0 0 1 2 2v1" />
                  <path d="M12 8h8" />
                  <path d="M16 8V5a2 2 0 0 1 2-2" />
                  <circle cx="16" cy="13" r=".5" />
                  <circle cx="18" cy="3" r=".5" />
                  <circle cx="20" cy="21" r=".5" />
                  <circle cx="20" cy="8" r=".5" />
                </svg>
              </span>
              <p className="text-sm font-semibold text-gray-800">Quiz Challenge</p>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
    
  );
}

export default Index;
