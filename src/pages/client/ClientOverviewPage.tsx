import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase";
import "./ClientOverviewPage.module.css";

const tabs = [
  "Profiel",
  "Hulpvragen & Doelen",
  "Ondersteuning",
  "Vaste Taken",
  "Signaalplan",
  "Documenten",
  "Evaluatie",
  "Dagrapportage",
];

export default function ClientOverviewPage({ user }: { user: any })  {
  const { id } = useParams();

  const [client, setClient] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState(tabs[0]);

  // 🔥 1 CLIENT LADEN VANUIT FIRESTORE
  useEffect(() => {
    async function load() {
      const ref = doc(db, "clients", id as string);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        setClient({ id: snap.id, ...snap.data() });
      } else {
        setClient(undefined);
      }
    }
    load();
  }, [id]);

  // LOADING STATE
  if (client === null) return <p>Laden…</p>;

  // NOT FOUND
  if (client === undefined)
    return <p className="notfound">Cliënt niet gevonden.</p>;

  // Helper om lijsten netjes te tonen
  const renderList = (value: any[]) => {
    if (!value) return <p className="empty">Niet ingevuld.</p>;
    if (Array.isArray(value))
      return (
        <ul>
          {value.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      );
    return <p>{String(value)}</p>;
  };

  return (
    <div className="container">
      <header className="header">
        <img src={client.photo} alt={client.name} className="photo" />
        <div className="headerInfo">
          <h1>{client.name}</h1>
          <p>Leeftijd: {client.age}</p>
        </div>
      </header>

      <nav className="tabs">
        {tabs.map((t) => (
          <button
            key={t}
            className={`tabButton ${activeTab === t ? "active" : ""}`}
            onClick={() => setActiveTab(t)}
          >
            {t}
          </button>
        ))}
      </nav>

      <section className="tabContent">
        {/* PROFIEL */}
        {activeTab === "Profiel" && (
          <div>
            <h2>Basisgegevens</h2>
            <p><strong>Adres:</strong> {client.address}</p>
            <p><strong>Contactpersoon:</strong> {client.contact_person}</p>
            <p><strong>Medicatie:</strong> {client.medication}</p>

            <h3>Hobby's & interesses</h3>
            {renderList(client.hobbies)}

            <h3>Wat geeft rust bij overprikkeling</h3>
            <p>{client.calming || "Niet ingevuld."}</p>

            <h3>Communicatievoorkeuren</h3>
            {renderList(client.communication)}
          </div>
        )}

        {/* Hulpvragen & Doelen */}
        {activeTab === "Hulpvragen & Doelen" && (
          <div>
            <h2>Hulpvragen</h2>
            <p><strong>Cliënt:</strong> {client.help_requests}</p>
            <p><strong>Ouders:</strong> {client.parent_requests}</p>

            <h3>Doelen</h3>
            <ul>
              {client.goals?.length ? (
                client.goals.map((g: any) => (
                  <li key={g.id}>
                    <strong>{g.title}</strong> — {g.status}{" "}
                    {g.short_term ? "(Kort termijn)" : ""}
                    <br />
                    Einddatum: {g.end_date}
                    <br />
                    {g.details}
                  </li>
                ))
              ) : (
                <li>Geen doelen gevonden.</li>
              )}
            </ul>
          </div>
        )}

        {/* Ondersteuning */}
        {activeTab === "Ondersteuning" && (
          <div>
            <h2>Ondersteuning & Aanpak</h2>

            <h3>Wat doet de begeleider?</h3>
            <p>{client.support_staff || "Geen gegevens ingevuld."}</p>

            <h3>Wat doet de cliënt?</h3>
            <p>{client.support_client || "Geen gegevens ingevuld."}</p>

            <h3>Frequentie</h3>
            <p>{client.support_frequency || "Niet ingevuld"}</p>

            <h3>Locatie</h3>
            <p>{client.support_location || "Niet ingevuld"}</p>

            <h3>Hulpmiddelen</h3>
            <p>{client.support_tools || "Geen hulpmiddelen geregistreerd."}</p>
          </div>
        )}

        {/* Vaste taken */}
        {activeTab === "Vaste Taken" && (
          <div>
            <h2>Vaste Taken</h2>

            <h3>Sterke kanten</h3>
            {renderList(client.strengths)}

            <h3>Taken waar cliënt goed in is</h3>
            {renderList(client.tasks_good_at)}

            <h3>Vaste taken</h3>
            {renderList(client.fixed_tasks)}
          </div>
        )}

        {/* Signaalplan */}
        {activeTab === "Signaalplan" && (
          <div>
            <h2>Signaleringsplan bij spanning</h2>

            <h3>🟢 Groene fase — Wat gaat goed?</h3>
            {client.signaling_plan?.green
              ? renderList(client.signaling_plan.green.goes_well)
              : <p>Geen gegevens ingevuld.</p>
            }

            <h3>🟠 Oranje fase — Eerste signalen & aanpak</h3>
            {client.signaling_plan?.orange ? (
              <>
                <strong>Signalen:</strong>
                {renderList(client.signaling_plan.orange.signals)}

                <strong>Wat helpt:</strong>
                {renderList(client.signaling_plan.orange.what_helps)}

                <strong>Wat niet helpt:</strong>
                {renderList(client.signaling_plan.orange.what_not_helps)}
              </>
            ) : (
              <p>Geen gegevens ingevuld.</p>
            )}

            <h3>🔴 Rode fase — Veiligheidsafspraken</h3>
            {client.signaling_plan?.red ? (
              <>
                <strong>Veiligheidsmaatregelen:</strong>
                {renderList(client.signaling_plan.red.safety)}

                <strong>Contactpersonen / wie bellen:</strong>
                {renderList(client.signaling_plan.red.contact)}
              </>
            ) : (
              <p>Geen gegevens ingevuld.</p>
            )}
          </div>
        )}

        {/* Documenten */}
        {activeTab === "Documenten" && (
          <div>
            <h2>Documenten</h2>
            <p>Uploads en belangrijke documenten (PDF's, rapporten).</p>
          </div>
        )}

        {/* Evaluatie */}
        {activeTab === "Evaluatie" && (
          <div>
            <h2>Evaluatie</h2>
            <p>Evaluatiegegevens en voortgangsverslagen.</p>
          </div>
        )}

        {/* Dagrapportage */}
        {activeTab === "Dagrapportage" && (
          <div>
            <h2>Dagrapportage</h2>
            <p>Dagelijkse observaties en notities.</p>
          </div>
        )}
      </section>
    </div>
  );
}
