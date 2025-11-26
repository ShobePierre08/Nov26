import { useLocation, useNavigate } from "react-router-dom";
import { useMemo } from "react";
import Header from "../../web_components/Header";
import Sidebar from "./Sidebar";

function FeaturePlaceholder() {
  const location = useLocation();
  const navigate = useNavigate();

  const { title, description, ctaLabel } = useMemo(() => {
    const defaults = {
      title: "Feature Coming Soon",
      description:
        "This section is still under construction. Check back soon for the full experience.",
      ctaLabel: "Back to Dashboard",
    };

    if (!location.state) {
      return defaults;
    }

    return {
      title: location.state.title || defaults.title,
      description: location.state.description || defaults.description,
      ctaLabel: location.state.ctaLabel || defaults.ctaLabel,
    };
  }, [location.state]);

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-[#cfe3fa] via-[#e6f0ff] to-white">
      <Sidebar isOpen={false} onClose={() => {}} />

      <div className="flex-1 flex flex-col">
        <Header
          onToggleSidebar={() => navigate("/instructor/dashboard")}
          onLogout={() => {
            localStorage.removeItem("token");
            navigate("/login");
          }}
        />

        <main className="flex flex-col items-center justify-center flex-1 px-6 pb-16">
          <div className="relative w-full max-w-3xl overflow-hidden rounded-3xl border border-white/60 bg-white shadow-2xl shadow-blue-200/50">
            <div className="absolute -top-20 -right-16 h-56 w-56 rounded-full bg-blue-200/50 blur-3xl" />
            <div className="absolute bottom-0 left-0 h-64 w-full bg-gradient-to-tr from-blue-100/30 via-transparent to-transparent" />

            <div className="relative px-10 py-14 text-center">
              <p className="text-sm uppercase tracking-[0.35em] text-blue-500/70">
                Instructor Workspace
              </p>
              <h1 className="mt-4 text-3xl sm:text-4xl font-semibold text-gray-800 leading-snug">
                {title}
              </h1>
              <p className="mt-4 text-base sm:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
                {description}
              </p>

              <div className="mt-10 flex flex-col sm:flex-row sm:justify-center gap-3">
                <button
                  onClick={() => navigate(-1)}
                  className="px-5 py-3 rounded-xl bg-blue-600 text-white font-semibold shadow-md hover:bg-blue-700 transition"
                >
                  {ctaLabel}
                </button>
                <button
                  onClick={() => navigate("/instructor/dashboard")}
                  className="px-5 py-3 rounded-xl border border-blue-200 text-blue-600 font-medium hover:bg-blue-50 transition"
                >
                  Go to Dashboard
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default FeaturePlaceholder;

