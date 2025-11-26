import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import virtulab from "../../assets/Virtulab.svg";

function RegisterPage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullname: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "student", // ✅ Default value
  });


  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // handle input change
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const { fullname, email, password, confirmPassword, role } = formData;

    if (!fullname || !email || !password || !confirmPassword) {
      setError("All fields are required.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      // ✅ Convert role (string) to role_id (number)
      const role_id = role === "instructor" ? 2 : 3;

      // ✅ Send to backend
      const response = await axios.post("http://localhost:5000/auth/register", {
        username: fullname,
        email,
        password,
        role_id,
      });

      setSuccess("Registration successful! Redirecting...");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed.");
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

      {/* Register Form Section */}
      <div className="flex flex-1 items-center justify-center">
        <div className="bg-white p-8 rounded-2xl shadow-md w-90 mt-10">
          <h2 className="text-2xl font-semibold text-center mb-1 text-gray-800">
            Register
          </h2>

          <form onSubmit={handleSubmit}>
            {/* Full Name */}
            <label
              htmlFor="fullname"
              className="block text-sm font-medium text-gray-600 mb-1"
            >
              Full Name
            </label>
            <input
              type="text"
              id="fullname"
              name="fullname"
              value={formData.fullname}
              onChange={handleChange}
              placeholder="Enter your full name"
              className="w-full p-2 border border-gray-300 rounded-md mb-6 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 placeholder-gray-400"
            />

            {/* Email */}
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-600 mb-1"
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              className="w-full p-2 border border-gray-300 rounded-md mb-6 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 placeholder-gray-400"
            />

            {/* Password */}
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-600 mb-1"
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Create a password"
              className="w-full p-2 border border-gray-300 rounded-md mb-6 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 placeholder-gray-400"
            />

            {/* Confirm Password */}
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-gray-600 mb-1"
            >
              Confirm Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Re-enter your password"
              className="w-full p-2 border border-gray-300 rounded-md mb-6 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 placeholder-gray-400"
            />

            {/* 🧩 Role Selector (Admin excluded) */}
            <label
              htmlFor="role"
              className="block text-sm font-medium text-gray-600 mb-1"
            >
              Role
            </label>
            <select
              id="role"
              name="role"
              value={formData.role} // ✅ This binds the select to React state
              onChange={handleChange} // ✅ This updates state when changed
              className="w-full p-2 border border-gray-300 rounded-md mb-6 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
            >
              <option value="student">Student</option>
              <option value="instructor">Instructor</option>
            </select>


            {/* Feedback Messages */}
            {error && (
              <p className="text-red-600 text-sm mb-3 text-center">{error}</p>
            )}
            {success && (
              <p className="text-green-600 text-sm mb-3 text-center">
                {success}
              </p>
            )}

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition cursor-pointer"
            >
              Register
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-4">
            Already have an account?{" "}
            <button onClick={() => navigate("/login")}>
              <span className="font-bold text-blue-600 hover:underline cursor-pointer">
                Login
              </span>
            </button>
          </p>
        </div>
      </div>
      
    </div>
  );
}

export default RegisterPage;
