import LogoutIcon from "@mui/icons-material/Logout";
import virtulab from "../assets/Virtulab.svg";
import { useNavigate } from "react-router-dom";
function Header({ onToggleSidebar }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <header className="bg-[#4FA9E2] text-white p-4 flex justify-between items-center shadow-md fixed w-full top-0 z-50">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <img src={virtulab} alt="VirtuLab" className="w-8" />
          <h1 className="text-xl font-semibold">VirtuLab</h1>
        </div>
      </div>

      <button
        onClick={handleLogout}
        className="flex items-center gap-1 hover:text-gray-200 cursor-pointer"
      >
        <LogoutIcon className="mr-2" /> Logout
      </button>
    </header>
  );
}

export default Header;
