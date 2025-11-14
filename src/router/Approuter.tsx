import { Routes, Route } from "react-router-dom";
import Dashboard from "../pages/Dashboard/Dashboard";
import ClientsList from "../pages/client/ClientsList";
import ClientOverview from "../pages/client/ClientOverviewPage";

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/clients" element={<ClientsList />} />
      <Route path="/client/:id" element={<ClientOverview />} />
    </Routes>
  );
}
