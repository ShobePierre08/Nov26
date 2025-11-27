import React, { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import axios from "axios";
import virtulab from "../../assets/Virtulab.svg";

function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Check existing session
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("userRoleId");

  if (token && role) {
    if (role === "3") return <Navigate to="/student/StudentDashboard" replace />;
    if (role === "2") return <Navigate to="/instructor/dashboard" replace />;
    return <Navigate to="/unauthorized" replace />;
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { email, password } = formData;

    if (!email || !password) {
      setError("All fields are required.");
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post("http://localhost:5000/auth/login", {
        email,
        password,
      });

      const { token, user } = response.data;

      localStorage.setItem("token", token);
      localStorage.setItem("userId", user.id);
      localStorage.setItem("userRoleId", user.role_id);
      localStorage.setItem("username", user.username);
      localStorage.setItem("email", user.email);

      if (user.role_id === 3)
        return navigate("/student/StudentDashboard", { replace: true });

      if (user.role_id === 2)
        return navigate("/instructor/dashboard", { replace: true });

      navigate("/unauthorized", { replace: true });

    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-[#cfe3fa] via-[#e6f0ff] to-white">
      <header className="bg-[#4FA9E2] text-white p-5 flex">
        <div className="flex items-center">
          <img src={virtulab} alt="VirtuLab" className="w-10 inline-block mr-2" />
          <h1 className="text-2xl font-bold">VirtuLab</h1>
        </div>
      </header>

      <div className="flex flex-1 items-center justify-center">
        <div className="bg-white p-8 rounded-2xl shadow-md w-90">
          <h2 className="text-2xl font-semibold text-center mb-4 text-gray-800">
            Login
          </h2>

          <form onSubmit={handleSubmit}>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              className="w-full p-2 border border-gray-300 rounded-md mb-6 text-gray-600"
            />

            <label className="block text-sm font-medium text-gray-600 mb-1">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              className="w-full p-2 border border-gray-300 rounded-md mb-6 text-gray-600"
            />

            {error && <p className="text-red-600 text-sm mb-3 text-center">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2 rounded-md text-white transition ${
                loading ? "bg-blue-400" : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-4">
            Don’t have an account?{" "}
            <button onClick={() => navigate("/register")}>
              <span className="font-bold text-blue-600 hover:underline cursor-pointer">
                Register
              </span>
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
