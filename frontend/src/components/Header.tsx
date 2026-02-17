import { logoutAPI } from "../api/authApi";

export default function Header() {
  const handleLogout = async () => {
    console.log(" Logout button clicked");
    await logoutAPI();
    console.log(" Logout API done");
  };

  return <button onClick={handleLogout}>Logout</button>;
}
