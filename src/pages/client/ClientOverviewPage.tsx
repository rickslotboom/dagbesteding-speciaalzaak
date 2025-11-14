import { useState, type JSXElementConstructor, type ReactElement, type ReactNode, type ReactPortal } from "react";
import { useParams } from "react-router-dom";
import clients from "../../data/clients.json";
import styles from "./ClientOverviewPage.module.css";

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

export default function ClientOverviewPage() {
  const { id } = useParams();
  const client = clients.find((c) => c.id === Number(id));
  const [activeTab, setActiveTab] = useState(tabs[0]);

  if (!client) return <p className={styles.notfound}>Cliënt niet gevonden.</p>;

  // helper to render an array or fallback
  const renderList = (arr: string | number | bigint | boolean | any[] | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined) => {
    if (!arr) return <p className={styles.empty}>Niet ingevuld.</p>;
    if (typeof arr === "string") return <p>{arr}</p>;
    if (!Array.isArray(arr)) return <p>{String(arr)}</p>;
    return (
      <ul>
        {arr.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    );
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <img src={client.photo} alt={client.name} className={styles.photo} />
        <div className={styles.headerInfo}>
          <h1>{client.name}</h1>
          <p>Leeftijd: {client.age}</p>
        </div>
      </header>

      <nav className={styles.tabs}>
        {tabs.map((t) => (
          <button
            key={t}
            className={`${styles.tabButton} ${activeTab === t ? styles.active : ""}`}
            onClick={() => setActiveTab(t)}
          >
            {t}
          </button>
        ))}
      </nav>

      <section className={styles.tabContent}>
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

        {/* HULPVragen & DOELEN */}
        {activeTab === "Hulpvragen & Doelen" && (
          <div>
            <h2>Hulpvragen</h2>
            <p><strong>Cliënt:</strong> {client.help_requests}</p>
            <p><strong>Ouders:</strong> {client.parent_requests}</p>

            <h3>Doelen</h3>
            <ul>
              {client.goals?.map((g) => (
                <li key={g.id}>
                  <strong>{g.title}</strong> — {g.status} {g.short_term ? "(Kort termijn)" : ""}
                  <br />
                  Einddatum: {g.end_date}
                  <br />
                  {g.details}
                </li>
              )) ?? <li>Geen doelen gevonden.</li>}
            </ul>
          </div>
        )}

        {/* ONDERSTEUNING & AANPAK */}
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

        {/* VASTE TAKEN */}
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

        {/* SIGNAALPLAN */}
        {activeTab === "Signaalplan" && (
          <div>
            <h2>Signaleringsplan bij spanning</h2>

            <h3>🟢 Groene fase — Wat gaat goed?</h3>
            {/*
              In jouw JSON is dit: client.signaling_plan.green.goes_well (array)
              of client.signaling_plan.green (object)
            */}
            {client.signaling_plan?.green ? (
              <>
                {client.signaling_plan.green.goes_well
                  ? renderList(client.signaling_plan.green.goes_well)
                  : <p>{JSON.stringify(client.signaling_plan.green)}</p>}
              </>
            ) : (
              <p>Geen gegevens ingevuld.</p>
            )}

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

        {/* DOCUMENTEN */}
        {activeTab === "Documenten" && (
          <div>
            <h2>Documenten</h2>
            <p>Uploads en belangrijke documenten (PDF's, rapporten).</p>
          </div>
        )}

        {/* EVALUATIE */}
        {activeTab === "Evaluatie" && (
          <div>
            <h2>Evaluatie</h2>
            <p>Evaluatiegegevens en voortgangsverslagen.</p>
          </div>
        )}

        {/* DAGRAPPORTAGE */}
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
