import { useCallback } from "react";
import GoogleLogo from "../../assets/images/Google.png";

const GoogleSignIn: React.FC = () => {
  const handleClick = useCallback(() => {
    const backendURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
    window.location.href = `${backendURL}/oauth2/authorization/google`;
  }, []);
  return (
    <button
      onClick={handleClick}
      className="flex justify-center items-center border w-full rounded border-gray-600 h-[48px] hover:bg-slate-50 transition"
    >
      <img
        src={GoogleLogo}
        alt="google-icon"
        className="w-5 h-5 object-contain"
      />
      <p className="px-2 text-gray-600 font-medium">
        Tiếp tục với Google
      </p>
    </button>
  );
};

export default GoogleSignIn;
