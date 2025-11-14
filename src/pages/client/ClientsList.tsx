import { useState } from "react";
import { Link } from "react-router-dom";
import styles from "./ClientsList.module.css";
import clients from "../../data/clients.json";

export default function ClientsList() {
  const [search, setSearch] = useState("");

  const filteredClients = clients.filter((c) =>
    c.name.toLowerCase().startsWith(search.toLowerCase())
  );

  // helper om een nette URL slug te maken
  const slugify = (name: string) =>
    name.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Cliënten</h1>

      <input
        type="text"
        placeholder="Zoeken..."
        className={styles.search}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className={styles.list}>
        {filteredClients.map((c) => (
          <Link
            to={`/client/${(c.id)}`}
            key={c.id}
            className={styles.card}
          >
            <img src={c.photo} className={styles.photo} alt={c.name} />
            <div>
              <h2 className={styles.name}>{c.name}</h2>
              <p className={styles.info}>Leeftijd: {c.age}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
