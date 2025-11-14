import { BrowserRouter as Router } from "react-router-dom";
import AppRouter from "./router/Approuter";
import BottomNav from "./components/nav/BottomNav"; 
import "./index.css";

export default function App() {
  return (
    <Router>
      <div className="app-container">
        <AppRouter />
      </div>
      <BottomNav />
    </Router>
  );
}
