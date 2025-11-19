// src/router/AppRouter.tsx
import { Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "../pages/Dashboard/Dashboard";
import ClientsListPage from "../pages/client/ClientsList";
import ClientOverview from "../pages/client/ClientOverviewPage";
import Agenda from "../pages/agenda/Agenda";
import Instellingen from "../pages/Instellingen/Instellingen";
import NewClientPage from "../pages/NewClientPage/NewClientPage";

interface AppRouterProps {
  user: any | null; // later: definieer een echte User interface
}

export default function AppRouter({ user }: AppRouterProps) {
  // Als je een login-route hebt, kun je hier redirecten wanneer user === null.
  // Voor nu: niet-ingelogd -> dashboard (of pas naar /login)
  if (user === null) {
    return (
      <Routes>
        <Route path="/" element={<Dashboard user={user} />} />
        <Route path="/clients" element={<Navigate to="/" replace />} />
        <Route path="/client/:id" element={<Navigate to="/" replace />} />
        <Route path="/agenda" element={<Navigate to="/" replace />} />
        <Route path="/instellingen" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Dashboard user={user} />} />

      {/* CLIENTS: begeleider = ziet lijst, ouder = redirect naar z'n client */}
      <Route
  path="/clients"
  element={
    user?.role === "begeleider" ? (
      <ClientsListPage user={user} />
    ) : user?.role === "ouder" ? (
      user.clientId ? (
        <Navigate to={`/client/${user.clientId}`} replace />
      ) : (
        <p>Client wordt geladen…</p>
      )
    ) : (
      <Navigate to="/" replace />
    )
  }
/>

      {/* CLIENT OVERVIEW: alle rollen kunnen hierheen, maar als je wilt
          dat ouders alleen hun eigen id kunnen zien, moet je die check óf hier doen
          (met useParams wrapper) óf in ClientOverviewPage zelf. */}
      <Route
        path="/client/:id"
        element={<ClientOverview user={user} />}
      />

      <Route path="/agenda" element={<Agenda />} />
      <Route path="/instellingen" element={<Instellingen user = {user} />} />
      <Route path="/new-client" element={<NewClientPage />} />
      {/* fallback: alles wat niet matched */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
