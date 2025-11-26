import virtulab from "../assets/Virtulab.svg";
import { useNavigate } from "react-router-dom";

function Header_No_Navbar() {
  const navigate = useNavigate();

  // open login in new tab
  const goToLogin = () => {
    window.open("/login", "_blank"); // ✅ Opens login page in new tab
  };

  // normal navigation for register
  const goToRegister = () => {
    window.open("/register", "_blank"); // ✅ Opens register page in new tab
  };

  return (
    <header className="bg-[#4FA9E2] text-white p-5 flex justify-between items-center shadow-md">
      {/* Left: Logo */}
      <div className="flex items-center">
        <img src={virtulab} alt="VirtuLab" className="w-10 inline-block" />
        <h1 className="text-2xl font-bold ml-2">VirtuLab</h1>
      </div>

      {/* Right: Buttons */}
      <div className="flex items-center gap-3">
        {/* Log in button - open in new tab */}
        <button
          onClick={goToLogin}
          className="px-5 py-2 bg-white text-[#4FA9E2] font-semibold rounded-full border border-[#4FA9E2] hover:bg-[#e6f3ff] transition"
        >
          Sign in
        </button>

        {/* Sign up button - same tab */}
        <button
          onClick={goToRegister}
          className="px-5 py-2 bg-[#4FA9E2] text-white font-semibold rounded-full border border-white hover:bg-[#3b91c7] transition"
        >
          Sign up
        </button>
      </div>
    </header>
  );
}

export default Header_No_Navbar;
