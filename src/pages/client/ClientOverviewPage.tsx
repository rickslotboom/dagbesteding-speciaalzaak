import {useEffect, useState } from "react";
import type { JSX } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import { db, storage } from "../../firebase";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  listAll,
} from "firebase/storage";

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


// Helper components BUITEN de main component
const EditableText = ({
  label,
  field,
  placeholder,
  editData,
  setEditData,
  client,
  isEditing,
}: {
  label?: string;
  field: string;
  placeholder?: string;
  editData: any;
  setEditData: (data: any) => void;
  client: any;
  isEditing: boolean;
}) => {
  return (
    <p>
      {label && <strong>{label} </strong>}
      {isEditing ? (
        <input
          value={editData[field] ?? ""}
          onChange={(e) => setEditData({ ...editData, [field]: e.target.value })}
          placeholder={placeholder}
          style={{ width: "100%" }}
        />
      ) : (
        (client[field] ?? "–")
      )}
    </p>
  );
};

const EditableTextarea = ({
  label,
  field,
  placeholder,
  editData,
  setEditData,
  client,
  isEditing,
}: {
  label?: string;
  field: string;
  placeholder?: string;
  editData: any;
  setEditData: (data: any) => void;
  client: any;
  isEditing: boolean;
}) => {
  return (
    <div>
      {label && <strong>{label}</strong>}
      {isEditing ? (
        <textarea
          value={editData[field] ?? ""}
          onChange={(e) => setEditData({ ...editData, [field]: e.target.value })}
          placeholder={placeholder}
          style={{ width: "100%", minHeight: 80 }}
        />
      ) : (
        <p style={{ whiteSpace: "pre-line" }}>{client[field] ?? "–"}</p>
      )}
    </div>
  );
};

const EditableCSV = ({
  label,
  field,
  editData,
  setEditData,
  client,
  isEditing,
  renderList,
}: {
  label?: string;
  field: string;
  editData: any;
  setEditData: (data: any) => void;
  client: any;
  isEditing: boolean;
  renderList: (value: any[]) => JSX.Element;
}) => (
  <div>
    {label && <strong>{label}</strong>}
    {isEditing ? (
      <input
        value={editData[field] ?? ""}
        onChange={(e) => setEditData({ ...editData, [field]: e.target.value })}
        placeholder="Komma gescheiden items"
        style={{ width: "100%" }}
      />
    ) : (
      renderList(client[field])
    )}
  </div>
);

export default function ClientOverviewPage({}: ClientOverviewPageProps) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [client, setClient] = useState<any | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<any>({});
  const [activeTab, setActiveTab] = useState(tabs[0]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [newReport, setNewReport] = useState("");
  const [openReport, setOpenReport] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Load client from Firestore
  useEffect(() => {
    async function load() {
      try {
        const refDoc = doc(db, "clients", id as string);
        const snap = await getDoc(refDoc);

        if (snap.exists()) {
          const data = { id: snap.id, ...snap.data() };
          setClient(data);
          // Alleen editData updaten als we NIET aan het bewerken zijn
          if (!isEditing) {
            setEditData(data);
          }
        } else {
          setClient(undefined);
        }
      } catch (err) {
        console.error("Fout bij laden client:", err);
        setClient(undefined);
      }
    }
    load();
  }, [id]); // isEditing NIET toevoegen aan dependencies!

  // Helper: render arrays nicely
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

  // UI Helper for editing arrays as comma-separated string
  function arrayToCSV(arr?: any[]) {
    if (!arr) return "";
    if (!Array.isArray(arr)) return String(arr);
    return arr.join(", ");
  }

  function csvToArray(s: string) {
    if (!s) return [];
    return s.split(",").map((x) => x.trim()).filter(Boolean);
  }

  // Enter edit mode: make sure editData is current client snapshot
  function handleEdit() {
    // Maak een kopie van client met correct geconverteerde arrays
    const initialEditData = {
      ...client,
      // Zorg dat alle tekstvelden strings zijn (niet undefined)
      address: client.address ?? "",
      contact_person: client.contact_person ?? "",
      medication: client.medication ?? "",
      help_requests: client.help_requests ?? "",
      parent_requests: client.parent_requests ?? "",
      support_staff: client.support_staff ?? "",
      support_client: client.support_client ?? "",
      support_frequency: client.support_frequency ?? "",
      support_location: client.support_location ?? "",
      support_tools: client.support_tools ?? "",
      calming: client.calming ?? "",
      // Converteer arrays naar CSV strings voor de input velden
      hobbies: arrayToCSV(client.hobbies),
      communication: arrayToCSV(client.communication),
      strengths: arrayToCSV(client.strengths),
      tasks_good_at: arrayToCSV(client.tasks_good_at),
      fixed_tasks: arrayToCSV(client.fixed_tasks),
      // Signaling plan conversies
      signaling_plan: client.signaling_plan ? {
        green: {
          ...client.signaling_plan.green,
          goes_well: arrayToCSV(client.signaling_plan.green?.goes_well),
        },
        orange: {
          ...client.signaling_plan.orange,
          signals: arrayToCSV(client.signaling_plan.orange?.signals),
          what_helps: arrayToCSV(client.signaling_plan.orange?.what_helps),
          what_not_helps: arrayToCSV(client.signaling_plan.orange?.what_not_helps),
        },
        red: {
          ...client.signaling_plan.red,
          safety: arrayToCSV(client.signaling_plan.red?.safety),
        },
      } : undefined,
    };
    
    setEditData(initialEditData);
    setIsEditing(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Cancel editing: revert editData and exit
  function handleCancel() {
    setEditData(client);
    setIsEditing(false);
  }

  // Save edits to Firestore and local state
  async function handleSave() {
    try {
      const refDoc = doc(db, "clients", id!);

      // Build payload for update. Only include keys that are in editData.
      // We also make sure signaling_plan is properly structured.
      const payload: any = { ...editData };

      // Normalize lists that were edited as CSV strings
      // For common list fields, ensure they are arrays in payload
      if (typeof payload.hobbies === "string")
        payload.hobbies = csvToArray(payload.hobbies);
      if (typeof payload.communication === "string")
        payload.communication = csvToArray(payload.communication);
      if (typeof payload.strengths === "string")
        payload.strengths = csvToArray(payload.strengths);
      if (typeof payload.tasks_good_at === "string")
        payload.tasks_good_at = csvToArray(payload.tasks_good_at);
      if (typeof payload.fixed_tasks === "string")
        payload.fixed_tasks = csvToArray(payload.fixed_tasks);

      // Signaleringsplan fields (they are edited as CSV strings in editData)
      if (payload.signaling_plan) {
        const sp = { ...payload.signaling_plan };

        if (typeof sp.green?.goes_well === "string")
          sp.green.goes_well = csvToArray(sp.green.goes_well);
        if (typeof sp.orange?.signals === "string")
          sp.orange.signals = csvToArray(sp.orange.signals);
        if (typeof sp.orange?.what_helps === "string")
          sp.orange.what_helps = csvToArray(sp.orange.what_helps);
        if (typeof sp.orange?.what_not_helps === "string")
          sp.orange.what_not_helps = csvToArray(sp.orange.what_not_helps);
        if (typeof sp.red?.safety === "string") sp.red.safety = csvToArray(sp.red.safety);

        payload.signaling_plan = sp;
      }

      // Firestore update (overwrite provided fields)
      await updateDoc(refDoc, payload);

      // Update local state to reflect saved data
      const updatedClient = { ...client, ...payload };
      setClient(updatedClient);
      setEditData(updatedClient);

      setIsEditing(false);
      alert("Gegevens opgeslagen!");
    } catch (err: any) {
      console.error("Opslaan mislukt:", err);
      alert("Opslaan mislukt: " + err?.message);
    }
  }

  // Delete client completely
  async function handleDeleteClient() {
    const confirmation = window.prompt(
      `Weet je ZEKER dat je ${client.name} volledig wilt verwijderen?\n\nTyp "VERWIJDER" om te bevestigen:`
    );

    if (confirmation !== "VERWIJDER") {
      return;
    }

    (setIsDeleting(true));

    try {
      // 1. Verwijder alle documenten uit Storage
      try {
        const storageRef = ref(storage, `clients/${id}/documents`);
        const fileList = await listAll(storageRef);
        
        const deletePromises = fileList.items.map((item) => deleteObject(item));
        await Promise.all(deletePromises);
      } catch (storageErr) {
        console.warn("Fout bij verwijderen storage bestanden:", storageErr);
        // Ga door zelfs als storage verwijdering faalt
      }

      // 2. Verwijder het Firestore document
      await deleteDoc(doc(db, "clients", id!));

      alert(`${client.name} is volledig verwijderd.`);
      
      // 3. Navigeer terug naar de clientenlijst
      navigate("/clients"); // Pas dit pad aan naar jouw route
    } catch (err: any) {
      console.error("Verwijderen mislukt:", err);
      alert("Verwijderen mislukt: " + err?.message);
      setIsDeleting(false);
    }
  }

  // Documents: file select + upload
  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
  }

  async function handleUpload() {
    if (!selectedFile) return alert("Selecteer eerst een bestand.");

    try {
      const fileRef = ref(storage, `clients/${id}/documents/${selectedFile.name}`);
      await uploadBytes(fileRef, selectedFile);
      const url = await getDownloadURL(fileRef);

      // Add to Firestore array
      await updateDoc(doc(db, "clients", id!), {
        documents: arrayUnion({
          name: selectedFile.name,
          url,
          createdAt: new Date().toISOString(),
        }),
      });

      // Update local state
      setClient((prev: any) => ({
        ...prev,
        documents: [...(prev.documents || []), { name: selectedFile.name, url }],
      }));

      setSelectedFile(null);
      alert("Document geüpload!");
    } catch (err: any) {
      console.error("Upload fout:", err);
      alert("Upload fout: " + err?.message);
    }
  }

  // Documents: delete
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
    } catch (err: any) {
      console.error("Delete fout:", err);
      alert("Verwijderen mislukt: " + (err?.message || err));
    }
  }

  // Reports: add
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
      console.error("Opslaan rapport:", err);
      alert("Opslaan mislukt: " + err?.message);
    }
  }

  // Reports: delete
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
      console.error("Delete rapport:", err);
      alert("Verwijderen mislukt: " + err?.message);
    }
  }

  if (client === null) return <p>Laden…</p>;
  if (client === undefined) return <p className="notfound">Cliënt niet gevonden.</p>;

  return (
    <div className="page-content">
      {/* Rapport-popup */}
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
              maxWidth: "700px",
              maxHeight: "80vh",
              display: "flex",
              flexDirection: "column",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2>Rapport – {openReport.date}</h2>
            <div
              style={{
                whiteSpace: "pre-line",
                marginTop: "10px",
                overflowY: "auto",
                flex: 1,
                marginBottom: "10px",
              }}
            >
              {openReport.text}
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button
                style={{ marginTop: "8px", background: "red", color: "white" }}
                onClick={() => {
                  deleteReport(openReport.id);
                  setOpenReport(null);
                }}
              >
                ❌ Rapport verwijderen
              </button>

              <button style={{ marginTop: "8px" }} onClick={() => setOpenReport(null)}>
                Sluiten
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="pageContainer">
        <div className="container">
          {/* Header */}
          <header className="header">
            <img src={client.photo} alt={client.name} className="photo" />
            <div className="headerInfo">
              <h1>{client.name}</h1>
              <p>Leeftijd: {client.age}</p>
            </div>
          </header>

          {/* Tabs */}
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

          {/* Edit actions (common for all tabs) */}
          <div style={{ display: "flex", justifyContent: "flex-end", margin: "12px 0" }}>
            {!isEditing ? (
              <button onClick={handleEdit}>Wijzigen ✏️</button>
            ) : (
              <>
                <button onClick={handleSave} style={{ marginRight: 8 }}>
                  Opslaan 💾
                </button>
                <button onClick={handleCancel}>Annuleren</button>
              </>
            )}
          </div>

          {/* Verwijder client knop */}
<div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "20px" }}>
  !isDeleting ? <button
    onClick={handleDeleteClient}
    style={{
      background: "red",
      color: "white",
      padding: "10px 14px",
      borderRadius: "6px",
      border: "none",
      cursor: "pointer",
    }}
  >
    ❌ Cliënt volledig verwijderen
  </button>
</div>


          {/* Tab content */}
          <section className="tabContent">
            {/* PROFIEL */}
            {activeTab === "Profiel" && (
              <div>
                <h2>Basisgegevens</h2>

                {/* Address */}
                <EditableText 
                  label="Adres:" 
                  field="address" 
                  editData={editData}
                  setEditData={setEditData}
                  client={client}
                  isEditing={isEditing}
                />

                {/* Contact person */}
                <EditableText 
                  label="Contactpersoon:" 
                  field="contact_person" 
                  editData={editData}
                  setEditData={setEditData}
                  client={client}
                  isEditing={isEditing}
                />

                {/* Medication */}
                <EditableText 
                  label="Medicatie:" 
                  field="medication" 
                  editData={editData}
                  setEditData={setEditData}
                  client={client}
                  isEditing={isEditing}
                />

                <h3>Hobby's & interesses</h3>
                <EditableCSV 
                  field="hobbies" 
                  editData={editData}
                  setEditData={setEditData}
                  client={client}
                  isEditing={isEditing}
                  renderList={renderList}
                />

                <h3>Wat geeft rust bij overprikkeling</h3>
                <EditableTextarea 
                  field="calming" 
                  editData={editData}
                  setEditData={setEditData}
                  client={client}
                  isEditing={isEditing}
                />

                <h3>Communicatievoorkeuren</h3>
                <EditableCSV 
                  field="communication" 
                  editData={editData}
                  setEditData={setEditData}
                  client={client}
                  isEditing={isEditing}
                  renderList={renderList}
                />
              </div>
            )}

            {/* Hulpvragen & Doelen */}
            {activeTab === "Hulpvragen & Doelen" && (
              <div>
                <h2>Hulpvragen</h2>
                <div>
                  <strong>Cliënt:</strong>
                  {isEditing ? (
                    <input
                      value={editData.help_requests ?? ""}
                      onChange={(e) =>
                        setEditData({ ...editData, help_requests: e.target.value })
                      }
                      style={{ width: "100%" }}
                    />
                  ) : (
                    <p>{client.help_requests ?? "–"}</p>
                  )}
                </div>

                <div>
                  <strong>Ouders:</strong>
                  {isEditing ? (
                    <input
                      value={editData.parent_requests ?? ""}
                      onChange={(e) =>
                        setEditData({ ...editData, parent_requests: e.target.value })
                      }
                      style={{ width: "100%" }}
                    />
                  ) : (
                    <p>{client.parent_requests ?? "–"}</p>
                  )}
                </div>

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

                <div>
                  <strong>Wat doet de begeleider?</strong>
                  {isEditing ? (
                    <textarea
                      value={editData.support_staff ?? ""}
                      onChange={(e) =>
                        setEditData({ ...editData, support_staff: e.target.value })
                      }
                      style={{ width: "100%" }}
                    />
                  ) : (
                    <p>{client.support_staff ?? "Geen gegevens ingevuld."}</p>
                  )}
                </div>

                <div>
                  <strong>Wat doet de cliënt?</strong>
                  {isEditing ? (
                    <textarea
                      value={editData.support_client ?? ""}
                      onChange={(e) =>
                        setEditData({ ...editData, support_client: e.target.value })
                      }
                      style={{ width: "100%" }}
                    />
                  ) : (
                    <p>{client.support_client ?? "Geen gegevens ingevuld."}</p>
                  )}
                </div>

                <div>
                  <strong>Frequentie</strong>
                  {isEditing ? (
                    <input
                      value={editData.support_frequency ?? ""}
                      onChange={(e) =>
                        setEditData({ ...editData, support_frequency: e.target.value })
                      }
                      style={{ width: "100%" }}
                    />
                  ) : (
                    <p>{client.support_frequency ?? "Niet ingevuld"}</p>
                  )}
                </div>

                <div>
                  <strong>Locatie</strong>
                  {isEditing ? (
                    <input
                      value={editData.support_location ?? ""}
                      onChange={(e) =>
                        setEditData({ ...editData, support_location: e.target.value })
                      }
                      style={{ width: "100%" }}
                    />
                  ) : (
                    <p>{client.support_location ?? "Niet ingevuld"}</p>
                  )}
                </div>

                <div>
                  <strong>Hulpmiddelen</strong>
                  {isEditing ? (
                    <input
                      value={editData.support_tools ?? ""}
                      onChange={(e) =>
                        setEditData({ ...editData, support_tools: e.target.value })
                      }
                      style={{ width: "100%" }}
                    />
                  ) : (
                    <p>{client.support_tools ?? "Geen hulpmiddelen geregistreerd."}</p>
                  )}
                </div>
              </div>
            )}

            {/* Vaste Taken */}
            {activeTab === "Vaste Taken" && (
              <div>
                <h2>Vaste Taken</h2>

                <h3>Sterke kanten</h3>
                <EditableCSV 
                  field="strengths" 
                  editData={editData}
                  setEditData={setEditData}
                  client={client}
                  isEditing={isEditing}
                  renderList={renderList}
                />

                <h3>Taken waar cliënt goed in is</h3>
                <EditableCSV 
                  field="tasks_good_at" 
                  editData={editData}
                  setEditData={setEditData}
                  client={client}
                  isEditing={isEditing}
                  renderList={renderList}
                />

                <h3>Vaste taken</h3>
                <EditableCSV 
                  field="fixed_tasks" 
                  editData={editData}
                  setEditData={setEditData}
                  client={client}
                  isEditing={isEditing}
                  renderList={renderList}
                />
              </div>
            )}

            {/* Signaalplan */}
            {activeTab === "Signaalplan" && (
              <div>
                <h2>Signaleringsplan bij spanning</h2>

                <h3>🟢 Groene fase — Wat gaat goed?</h3>
                {isEditing ? (
                  <input
                    value={editData.signaling_plan?.green?.goes_well ?? ""}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        signaling_plan: {
                          ...editData.signaling_plan,
                          green: {
                            ...(editData.signaling_plan?.green || {}),
                            goes_well: e.target.value,
                          },
                        },
                      })
                    }
                    style={{ width: "100%" }}
                    placeholder="Komma gescheiden"
                  />
                ) : (
                  renderList(client.signaling_plan?.green?.goes_well)
                )}

                <h3>🟠 Oranje fase — Eerste signalen & aanpak</h3>

                <div>
                  <strong>Signalen:</strong>
                  {isEditing ? (
                    <input
                      value={editData.signaling_plan?.orange?.signals ?? ""}
                      onChange={(e) =>
                        setEditData({
                          ...editData,
                          signaling_plan: {
                            ...editData.signaling_plan,
                            orange: {
                              ...(editData.signaling_plan?.orange || {}),
                              signals: e.target.value,
                            },
                          },
                        })
                      }
                      style={{ width: "100%" }}
                    />
                  ) : (
                    renderList(client.signaling_plan?.orange?.signals)
                  )}
                </div>

                <div>
                  <strong>Wat helpt:</strong>
                  {isEditing ? (
                    <input
                      value={editData.signaling_plan?.orange?.what_helps ?? ""}
                      onChange={(e) =>
                        setEditData({
                          ...editData,
                          signaling_plan: {
                            ...editData.signaling_plan,
                            orange: {
                              ...(editData.signaling_plan?.orange || {}),
                              what_helps: e.target.value,
                            },
                          },
                        })
                      }
                      style={{ width: "100%" }}
                    />
                  ) : (
                    renderList(client.signaling_plan?.orange?.what_helps)
                  )}
                </div>

                <div>
                  <strong>Wat niet helpt:</strong>
                  {isEditing ? (
                    <input
                      value={editData.signaling_plan?.orange?.what_not_helps ?? ""}
                      onChange={(e) =>
                        setEditData({
                          ...editData,
                          signaling_plan: {
                            ...editData.signaling_plan,
                            orange: {
                              ...(editData.signaling_plan?.orange || {}),
                              what_not_helps: e.target.value,
                            },
                          },
                        })
                      }
                      style={{ width: "100%" }}
                    />
                  ) : (
                    renderList(client.signaling_plan?.orange?.what_not_helps)
                  )}
                </div>

                <h3>🔴 Rode fase — Veiligheidsafspraken</h3>
                {isEditing ? (
                  <input
                    value={editData.signaling_plan?.red?.safety ?? ""}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        signaling_plan: {
                          ...editData.signaling_plan,
                          red: {
                            ...(editData.signaling_plan?.red || {}),
                            safety: e.target.value,
                          },
                        },
                      })
                    }
                    style={{ width: "100%" }}
                  />
                ) : (
                  renderList(client.signaling_plan?.red?.safety)
                )}
              </div>
            )}

            {/* Documenten */}
            {activeTab === "Documenten" && (
              <div>
                <h2>Documenten</h2>

                {/* File select */}
                <input
                  type="file"
                  onChange={handleFileSelect}
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                />

                {/* Upload button */}
                {selectedFile && (
                  <button onClick={handleUpload} style={{ marginTop: "10px" }}>
                    Upload document: {selectedFile.name}
                  </button>
                )}

                <h3>Bestaande documenten</h3>
                {client.documents?.length ? (
                  <ul>
                    {client.documents.map((d: any, i: number) => (
                      <li key={i} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <a href={d.url} target="_blank" rel="noreferrer">
                          {d.name}
                        </a>
                        <button
                          onClick={() => handleDeleteDocument(d)}
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

            {/* Evaluatie */}
            {activeTab === "Evaluatie" && (
              <div>
                <h2>Evaluatie</h2>
                <p>Evaluatiegegevens en voortgangsverslagen.</p>
              </div>
            )}

            {/* Dagrapportage / Reports */}
            {activeTab === "Dagrapportage" && (
              <div style={{ paddingBottom: "120px" }}>
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

                <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                  <button onClick={addReport}>Rapport opslaan</button>
                </div>

                <h3 style={{ marginTop: "20px" }}>Eerdere rapporten</h3>

                {client.reports?.length ? (
                  <div className="reports-scroll-container">
                    <div className="reports-list">
                      {client.reports
                        .slice()
                        .sort(
                          (a: any, b: any) =>
                            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                        )
                        .map((r: any) => (
                          <div
                            key={r.id}
                            className="report-card"
                            style={{ cursor: "pointer" }}
                          >
                            <div
                              onClick={() => setOpenReport(r)}
                              className="report-card-date"
                            >
                              {r.date}
                            </div>
                            <div
                              onClick={() => setOpenReport(r)}
                              className="report-card-text"
                            >
                              {r.text.length > 80 ? r.text.slice(0, 80) + "..." : r.text}
                            </div>

                            <button
                              onClick={() => deleteReport(r.id)}
                              style={{ color: "red", cursor: "pointer" }}
                            >
                              ❌ Verwijderen
                            </button>
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