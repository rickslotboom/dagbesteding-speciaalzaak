import { useState } from "react";
import { BrowserRouter as Router } from "react-router-dom";
import AppRouter from "./router/Approuter";
import BottomNav from "./components/nav/BottomNav";
import LoginPage from "./pages/auth/LoginPage";
import LogoutButton from "./components/LogOutButton"; 
import "./index.css";

export default function App() {
  const [user, setUser] = useState<any>(null);

  if (!user) {
    return (
      <Router>
        <LoginPage onLogin={(u) => setUser(u)} />
      </Router>
    );
  }

  return (
    <Router>

      {/* 🔥 Scrollbare hoofdcontainer */}
      <div className="app-content">

        {/* Logout button blijft boven content */}
        <div className="logout-button">
          <LogoutButton onLogout={() => setUser(null)} />
        </div>

        {/* Alle pagina's */}
        <AppRouter user={user} />

      </div>

      {/* Bottom nav blijft fixed */}
      <BottomNav user={user} />
    </Router>
  );
}
