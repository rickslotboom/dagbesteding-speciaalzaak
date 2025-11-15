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
      {/* 🔥 Deze logout-knop staat buiten AppRouter => zichtbaar op ALLE pagina's */}
      <div style={{ position: "fixed", top: 12, right: 12, zIndex: 999 }}>
        <LogoutButton onLogout={() => setUser(null)} />
      </div>

      {/* 🔥 Router pages */}
      <AppRouter user={user} />

      {/* 🔥 Altijd zichtbaar bottom navigation */}
      <BottomNav />
    </Router>
  );
}
