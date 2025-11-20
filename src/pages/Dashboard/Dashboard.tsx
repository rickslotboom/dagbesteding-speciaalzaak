import { useEffect, useState } from "react";
import ClientCard from "../../pages/client/ClientCard";
import { getClientsForToday, getAllClients } from "../../services/roosterService";
import "./Dashboard.module.css";

export default function Dashboard() {
  const [visitsToday, setVisitsToday] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Datum van vandaag in NL-formaat
  const today = new Date().toLocaleDateString("nl-NL", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  useEffect(() => {
    async function load() {
      console.log("Dashboard: Start loading");

      const ids = await getClientsForToday();
      console.log("Client IDs for today:", ids);

      if (ids.length === 0) {
        setVisitsToday([]);
        setLoading(false);
        return;
      }

      /** Haal ALLE clients op */
      const allClients = await getAllClients();
      console.log("All clients:", allClients);

      /** Zoek de juiste clients erbij */
      const fullClients = ids
        .map(id => allClients.find(c => c.id === id))
        .filter(Boolean);

      console.log("Full clients for today:", fullClients);

      setVisitsToday(fullClients);
      setLoading(false);
    }

    load();
  }, []);

  if (loading) return <p>Bezig met laden...</p>;

  return (
    <div className="container">
      <h1 className="title">Wie komt er vandaag?</h1>
      <h2 style={{ marginBottom: 20 }}>Vandaag is het: <strong>{today}</strong></h2>

      {visitsToday.length === 0 ? (
        <p style={{ textAlign: "center", marginTop: 32, color: "#666" }}>
          Niemand ingeroosterd voor vandaag.
        </p>
      ) : (
        <div className="grid">
          {visitsToday.map((client, index) => (
            <ClientCard
              key={client.id}
              data={{
                id: client.id,
                name: client.name,
                photo: client.photo || "/default-photo.jpg",
                time: `${9 + index}:00`,
                status: "Ingeroosterd"
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
