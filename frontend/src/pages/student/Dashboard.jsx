import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Header from "../../web_components/Header";
import Sidebar from "./Sidebar";
import coding from "../../assets/gif/coding.gif";
import experiment from "../../assets/gif/experiment.gif";
import building from "../../assets/gif/building.gif";
import quiz from "../../assets/gif/quiz.gif";


import { Code, Monitor, HelpCircle, FlaskConical, X } from "lucide-react";

function DashboardPage() {
  const [message, setMessage] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeBox, setActiveBox] = useState(null);
  const navigate = useNavigate();
  const isDraggingRef = useRef(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    axios
      .get("http://localhost:5000/student/dashboard", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setMessage(res.data.message))
      .catch((err) => {
        console.error(err);
        alert("Session expired. Please log in again.");
        localStorage.removeItem("token");
        navigate("/login");
      });
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const goToCompiler = () => navigate("/compiler");
  const goToDragDrop = () => navigate("/dragdrop");

  const boxes = [
    {
      title: "CodeLab",
      text: "Play around with Coding",
      icon: <Code size={40} className="text-blue-500 mb-4" />,
      image: "/images/code.jpg",
      details:
        "CodeLab lets you practice programming directly in the browser with instant feedback.",
      hoverText: "Try live coding right now!",
      hoverGif: coding, 
      onClick: goToCompiler,
    },
    {
      title: "Sim Pc",
      text: "Learn by simulating through Drag and Drop",
      icon: <Monitor size={40} className="text-blue-500 mb-4" />,
      image: "/images/sim.jpg",
      details:
        "Sim PC helps you visualize computer operations using drag-and-drop simulations.",
      hoverText: "Visualize how a PC works interactively!",
      hoverGif: building,
      onClick: goToDragDrop,
    },
    {
      title: "Quiz",
      text: "Challenge yourself to answer a question",
      icon: <HelpCircle size={40} className="text-blue-500 mb-4" />,
      image: "/images/quiz.jpg",
      details:
        "The Quiz section tests your knowledge and helps reinforce learning through challenges.",
      hoverText: "Test your knowledge with fun quizzes!",
      hoverGif: quiz,
    },
    {
      title: "Experiment",
      text: "Create and share it to peers",
      icon: <FlaskConical size={40} className="text-blue-500 mb-4" />,
      image: "/images/experiment.jpg",
      details:
        "Experiment allows you to build, test, and share interactive projects with classmates.",
      hoverText: "Create your own interactive experiments!",
      hoverGif: experiment,
    },
  ];

  return (
    <div className="flex min-h-screen bg-gradient-to-b from-[#cfe3fa] via-[#e6f0ff] to-white select-none">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col">
        <Header
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onLogout={handleLogout}
        />

        <main className="flex-grow flex flex-col items-center justify-center text-center p-6 transition-all duration-300">
          {message && (
            <p className="text-gray-700 text-lg mb-8 font-medium tracking-wide">
              {message}
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-10 w-full max-w-4xl">
            {boxes.map((box, index) => (
              <div
                key={index}
                className="relative group cursor-pointer"
                onClick={() => setActiveBox(box)}
              >
                {/* Hover popup */}
                <div className="absolute -top-56 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 group-hover:-translate-y-3 transition-all duration-500 z-20 pointer-events-none">
                  <div className="bg-white/95 rounded-2xl shadow-2xl border border-blue-300 p-5 w-80 flex flex-col items-center scale-95 group-hover:scale-100 transition-all duration-500">
                    {box.hoverGif && (
                      <img
                        src={box.hoverGif}
                        alt="Preview"
                        className="w-56 h-32 object-cover rounded-xl mb-3 border border-gray-200"
                      />
                    )}
                    <p className="text-gray-800 text-base font-semibold text-center">
                      {box.hoverText}
                    </p>
                  </div>
                </div>

                {/* Main box */}
                <div
                  className="relative overflow-hidden bg-white p-10 rounded-2xl border border-blue-300 hover:border-blue-500 shadow-lg hover:shadow-2xl transform transition-all duration-500 hover:scale-105 hover:-translate-y-2"
                  style={{
                    backgroundImage: `url(${box.image})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                >
                  <div className="absolute inset-0 bg-white/85 backdrop-blur-[2px] rounded-2xl transition-all duration-500 group-hover:bg-white/70 group-hover:backdrop-blur-[1px]"></div>

                  <div className="relative flex flex-col items-center justify-center z-10">
                    {box.icon}
                    <h3 className="text-2xl font-bold text-gray-800 mb-2 drop-shadow-sm">
                      {box.title}
                    </h3>
                    <p className="text-gray-500 font-medium">{box.text}</p>
                  </div>

                  {/* Subtle glowing border effect */}
                  <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-blue-300 group-hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] transition-all duration-500"></div>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>

      {/* Popup Modal */}
      {activeBox && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50">
          <div className="bg-white w-96 rounded-2xl shadow-2xl p-6 relative animate-fadeIn border-t-4 border-blue-400">
            <button
              onClick={() => setActiveBox(null)}
              className="absolute top-3 right-3 text-gray-500 hover:text-red-500 transition"
            >
              <X size={24} />
            </button>
            <div className="flex flex-col items-center">
              {activeBox.icon}
              <h2 className="text-2xl font-bold text-gray-800 mt-2 mb-3">
                {activeBox.title}
              </h2>
              <p className="text-gray-600 leading-relaxed">
                {activeBox.details}
              </p>

              <button
                onClick={() => {
                  if (activeBox.onClick) activeBox.onClick();
                  setActiveBox(null);
                }}
                className="mt-6 bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-all duration-300 shadow-md hover:shadow-lg"
              >
                Open
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DashboardPage;
