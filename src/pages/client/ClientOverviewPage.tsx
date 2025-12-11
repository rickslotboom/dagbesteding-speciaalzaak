import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import "./ClientOverviewPage.module.css";

// Herbruikbare components
import {
  EditableText,
  EditableTextarea,
  EditableCSV,
} from "../../components/EditableFields";

// Custom hooks
import { useClientData } from "../../hooks/useClientData";
import { useClientReports } from "../../hooks/useClientReports";
import { useClientDocuments } from "../../hooks/useClientDocuments";

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
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(tabs[0]);

  // Custom hooks voor state management
  const {
    client,
    setClient,
    isEditing,
    editData,
    setEditData,
    startEdit,
    cancelEdit,
    saveChanges,
    deleteClient,
  } = useClientData(id);

  const reports = useClientReports(id, setClient);
  const documents = useClientDocuments(id, setClient);

  // Helper voor arrays renderen
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

  if (client === null) return <p>Laden…</p>;
  if (client === undefined) return <p className="notfound">Cliënt niet gevonden.</p>;

  return (
    <div className="page-content">
      {/* Rapport popup */}
      {reports.openReport && (
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
          onClick={() => reports.setOpenReport(null)}
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
            <h2>Rapport – {reports.openReport.date}</h2>
            <div
              style={{
                whiteSpace: "pre-line",
                marginTop: "10px",
                overflowY: "auto",
                flex: 1,
                marginBottom: "10px",
              }}
            >
              {reports.openReport.text}
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button
                style={{ marginTop: "8px", background: "red", color: "white" }}
                onClick={() => {
                  reports.deleteReport(reports.openReport.id, client);
                  reports.setOpenReport(null);
                }}
              >
                ❌ Rapport verwijderen
              </button>

              <button style={{ marginTop: "8px" }} onClick={() => reports.setOpenReport(null)}>
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

          {/* Edit actions */}
          <div style={{ display: "flex", justifyContent: "flex-end", margin: "12px 0" }}>
            {!isEditing ? (
              <button onClick={startEdit}>Wijzigen ✏️</button>
            ) : (
              <>
                <button onClick={saveChanges} style={{ marginRight: 8 }}>
                  Opslaan 💾
                </button>
                <button onClick={cancelEdit}>Annuleren</button>
              </>
            )}
          </div>


          {/* Tab content */}
          <section className="tabContent">
            {/* PROFIEL */}
            {activeTab === "Profiel" && (
              <div>
                <h2>Basisgegevens</h2>

                <EditableText 
                  label="Adres:" 
                  field="address" 
                  editData={editData}
                  setEditData={setEditData}
                  client={client}
                  isEditing={isEditing}
                />

                <EditableText 
                  label="Contactpersoon:" 
                  field="contact_person" 
                  editData={editData}
                  setEditData={setEditData}
                  client={client}
                  isEditing={isEditing}
                />

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

                <input
                  type="file"
                  onChange={documents.handleFileSelect}
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                />

                {documents.selectedFile && (
                  <button onClick={documents.uploadDocument} style={{ marginTop: "10px" }}>
                    Upload document: {documents.selectedFile.name}
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
                          onClick={() => documents.deleteDocument(d)}
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
                  value={reports.newReport}
                  onChange={(e) => reports.setNewReport(e.target.value)}
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
                  <button onClick={reports.addReport}>Rapport opslaan</button>
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
                              onClick={() => reports.setOpenReport(r)}
                              className="report-card-date"
                            >
                              {r.date}
                            </div>
                            <div
                              onClick={() => reports.setOpenReport(r)}
                              className="report-card-text"
                            >
                              {r.text.length > 80 ? r.text.slice(0, 80) + "..." : r.text}
                            </div>

                            <button
                              onClick={() => reports.deleteReport(r.id, client)}
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