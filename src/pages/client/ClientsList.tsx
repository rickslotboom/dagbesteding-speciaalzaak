import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebase";
import "./ClientsList.module.css";

interface ClientsListProps {
  user: any;
}

interface ClientData {
  firestoreId: string;
  name: string;
  photo?: string;
  [key: string]: any;
}

export default function ClientsListPage({ user }: ClientsListProps) {
  const [clients, setClients] = useState<ClientData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchClients() {
      try {
        const snap = await getDocs(collection(db, "clients"));

        let data: ClientData[] = snap.docs.map(doc => ({
          firestoreId: doc.id,
          ...doc.data()
        })) as ClientData[];

        // 🔥 Rol-filter
        if (user.role === "ouder") {
          data = data.filter(c => c.name === "Spongebob");
        }

        setClients(data);
      } catch (err) {
        console.error("Fout bij ophalen cliënten:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchClients();
  }, [user]);

  if (loading) return <p>Bezig met laden...</p>;

  return (
    <div className="clientsListContainer">
      <h1>Cliënten</h1>
      <Link to="/new-client" className="addClientButton">
      + Client toevoegen
      </Link>
      <div className="clientsGrid">
        {clients.map((c) => (
          <Link
            key={c.firestoreId}
            to={`/client/${c.firestoreId}`}
            className="clientCard"
          >
            <img src={c.photo} alt={c.name} className="clientPhoto" />
            <h2>{c.name}</h2>
          </Link>
        ))}
      </div>
    </div>
  );
}
