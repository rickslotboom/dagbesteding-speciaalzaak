import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { updateDoc, arrayUnion, doc, getDoc, arrayRemove } from "firebase/firestore";
import { db, storage } from "../../firebase";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { getAuth } from "firebase/auth";

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

interface ClientOverviewPageProps {
  user?: any;
}

export default function ClientOverviewPage({}: ClientOverviewPageProps) {
  const { id } = useParams();

  const [client, setClient] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState(tabs[0]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [newReport, setNewReport] = useState("");
  const [openReport, setOpenReport] = useState<any | null>(null);


  /** 🔐 Debug: current user */
  useEffect(() => {
    const auth = getAuth();
    console.log("🔐 Current user:", auth.currentUser);
  }, []);

  /** 📁 Bestand selecteren */
  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
  }

  /** 📤 Upload document */
  async function handleUpload() {
    if (!selectedFile) return alert("Selecteer eerst een bestand.");

    try {
      const fileRef = ref(storage, `clients/${id}/documents/${selectedFile.name}`);

      await uploadBytes(fileRef, selectedFile);
      const url = await getDownloadURL(fileRef);

      await updateDoc(doc(db, "clients", id!), {
        documents: arrayUnion({
          name: selectedFile.name,
          url,
          createdAt: new Date().toISOString(),
        }),
      });

      setClient((prev: any) => ({
        ...prev,
        documents: [...(prev.documents || []), { name: selectedFile.name, url }],
      }));

      alert("Document geüpload!");
      setSelectedFile(null);

    } catch (error: any) {
      console.error("❌ Upload fout:", error);
      alert(`Upload fout: ${error.message}`);
    }
  }

  /** ❌ Document verwijderen */
  async function handleDeleteDocument(docItem: any) {
    if (!confirm(`Weet je zeker dat je ${docItem.name} wilt verwijderen?`)) return;

    try {
      const fileRef = ref(storage, `clients/${id}/documents/${docItem.name}`);
      await deleteObject(fileRef);

      await updateDoc(doc(db, "clients", id!), {
        documents: arrayRemove(docItem),
      });

      setClient((prev: any) => ({
        ...prev,
        documents: prev.documents.filter((d: any) => d.name !== docItem.name),
      }));

      alert("Document verwijderd!");
    } catch (err) {
      console.error("❌ Delete fout:", err);
      alert("Verwijderen mislukt: " + (err as any).message);
    }
  }

  /** ➕ Nieuw rapport opslaan */
  async function addReport() {
    if (!newReport.trim()) return alert("Rapport is leeg.");

    const report = {
      id: crypto.randomUUID(),
      date: new Date().toISOString().split("T")[0],
      text: newReport,
      createdAt: new Date().toISOString(),
    };

    try {
      await updateDoc(doc(db, "clients", id!), {
        reports: arrayUnion(report),
      });

      setClient((prev: any) => ({
        ...prev,
        reports: [...(prev.reports || []), report],
      }));

      setNewReport("");
      alert("Rapport opgeslagen!");
    } catch (err: any) {
      alert("Opslaan mislukt: " + err.message);
    }
  }

  /** 🧹 Rapport verwijderen */
  async function deleteReport(reportId: string) {
    const report = client.reports.find((r: any) => r.id === reportId);
    if (!report) return;

    if (!confirm("Weet je zeker dat je dit rapport wilt verwijderen?")) return;

    try {
      await updateDoc(doc(db, "clients", id!), {
        reports: arrayRemove(report),
      });

      setClient((prev: any) => ({
        ...prev,
        reports: prev.reports.filter((r: any) => r.id !== reportId),
      }));

      alert("Rapport verwijderd!");
    } catch (err: any) {
      alert("Verwijderen mislukt: " + err.message);
    }
  }

  /** 📥 Client ophalen */
  useEffect(() => {
    async function load() {
      try {
        const refDoc = doc(db, "clients", id as string);
        const snap = await getDoc(refDoc);

        if (snap.exists()) {
          setClient({ id: snap.id, ...snap.data() });
        } else {
          setClient(undefined);
        }
      } catch (error) {
        console.error("❌ Fout bij laden client:", error);
        setClient(undefined);
      }
    }
    load();
  }, [id]);

  if (client === null) return <p>Laden…</p>;
  if (client === undefined) return <p className="notfound">Cliënt niet gevonden.</p>;

  /** 🔧 Helper voor lijsten */
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
    <div className="page-content">
      {openReport && (
  <div
    style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: "rgba(0,0,0,0.5)",
      backdropFilter: "blur(3px)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 9999,
    }}
    onClick={() => setOpenReport(null)}
  >
    <div
      style={{
        background: "white",
        padding: "20px",
        borderRadius: "8px",
        width: "90%",
        maxWidth: "500px",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <h2>Rapport – {openReport.date}</h2>
      <p style={{ whiteSpace: "pre-line", marginTop: "10px" }}>
        {openReport.text}
      </p>

      <button
        style={{ marginTop: "20px", background: "red", color: "white" }}
        onClick={() => {
          deleteReport(openReport.id);
          setOpenReport(null);
        }}
      >
        ❌ Rapport verwijderen
      </button>

      <button style={{ marginTop: "10px" }} onClick={() => setOpenReport(null)}>
        Sluiten
      </button>
    </div>
  </div>
)}

      <div className="pageContainer">
        <div className="container">

          {/* 📌 Header */}
          <header className="header">
            <img src={client.photo} alt={client.name} className="photo" />
            <div className="headerInfo">
              <h1>{client.name}</h1>
              <p>Leeftijd: {client.age}</p>
            </div>
          </header>

          {/* 📌 Tabs */}
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

          {/* 📌 Tab inhoud */}
          <section className="tabContent">

            {/* ---- PROFIEL ---- */}
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

            {/* ---- HULPVRAGEN ---- */}
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

            {/* ---- ONDERSTEUNING ---- */}
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

            {/* ---- VASTE TAKEN ---- */}
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

            {/* ---- SIGNAALPLAN ---- */}
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

            {/* ---- DOCUMENTEN ---- */}
            {activeTab === "Documenten" && (
              <div>
                <h2>Documenten</h2>

                <input
                  type="file"
                  onChange={handleFileSelect}
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                />

                {selectedFile && (
                  <button onClick={handleUpload} style={{ marginTop: "10px" }}>
                    Upload document: {selectedFile.name}
                  </button>
                )}

                <h3>Bestaande documenten</h3>
                {client.documents?.length ? (
                  <ul>
                    {client.documents.map((doc: any, i: number) => (
                      <li key={i}>
                        <a href={doc.url} target="_blank" rel="noreferrer">
                          {doc.name}
                        </a>

                        <button
                          onClick={() => handleDeleteDocument(doc)}
                          style={{ color: "red", cursor: "pointer" }}
                        >
                          ❌ Verwijderen
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>Geen documenten geüpload.</p>
                )}
              </div>
            )}

            {/* ---- DAGRAPPORTAGE (NIEUW) ---- */}
            {activeTab === "Dagrapportage" && (
              <div style={{ paddingBottom: "80px" }}>
                <h2>Dagrapportage</h2>

                <textarea
                  placeholder="Schrijf hier je rapport..."
                  value={newReport}
                  onChange={(e) => setNewReport(e.target.value)}
                  style={{
                    width: "100%",
                    height: "120px",
                    marginBottom: "10px",
                    padding: "10px",
                    borderRadius: "8px",
                    border: "1px solid #ccc",
                  }}
                />

                <button onClick={addReport}>Rapport opslaan</button>

                <h3 style={{ marginTop: "20px" }}>Eerdere rapporten</h3>

                {client.reports?.length ? (
  <div className="reports-scroll-container">
  <div className="reports-list">
    {client.reports
      .sort(
        (a: any, b: any) =>
          new Date(b.createdAt).getTime() -
          new Date(a.createdAt).getTime()
      )
      .map((r: any) => (
        <div
          key={r.id}
          className="report-card"
          onClick={() => setOpenReport(r)}
          style={{ cursor: "pointer" }}
        >
          <div className="report-card-date">{r.date}</div>
          <div className="report-card-text">
            {r.text.length > 80 ? r.text.slice(0, 80) + "..." : r.text}
          </div>
        </div>
      ))}
      </div>
  </div>
) : (
  <p>Geen rapporten aangemaakt.</p>
)}


              </div>
            )}
          </section>
        </div>
      </div>
    </div>

  );
}
