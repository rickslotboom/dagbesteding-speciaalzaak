import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { updateDoc, arrayUnion, doc, getDoc } from "firebase/firestore";
import { db, storage } from "../../firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
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

// 🔥 VOEG USER PROP TOE
interface ClientOverviewPageProps {
  user: any;
}

export default function ClientOverviewPage({ user }: ClientOverviewPageProps) {
  const { id } = useParams();

  const [client, setClient] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState(tabs[0]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // 🔥 DEBUG: Check authenticatie bij laden component
  useEffect(() => {
    const auth = getAuth();
    console.log("🔐 Current user:", auth.currentUser);
    console.log("🔐 User ID:", auth.currentUser?.uid);
    console.log("🔐 Email:", auth.currentUser?.email);
    
    if (!auth.currentUser) {
      console.error("❌ GEEN GEBRUIKER INGELOGD!");
    }
  }, []);

  // -----------------------------------------
  // 🔥 BESTAND SELECTEREN
  // -----------------------------------------
  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    console.log("📄 Bestand geselecteerd:", file.name);
    console.log("📄 Bestand grootte:", file.size, "bytes");
    console.log("📄 Bestand type:", file.type);
    
    setSelectedFile(file);
  }

  // -----------------------------------------
  // 🔥 UPLOAD KNOP
  // -----------------------------------------
  async function handleUpload() {
    if (!selectedFile) return alert("Selecteer eerst een bestand.");

    // 🔥 DEBUG: Check authenticatie voor upload
    const auth = getAuth();
    console.log("🚀 Starting upload...");
    console.log("🚀 User authenticated:", !!auth.currentUser);
    console.log("🚀 Client ID:", id);
    console.log("🚀 File name:", selectedFile.name);

    try {
      const fileRef = ref(storage, `clients/${id}/documents/${selectedFile.name}`);
      console.log("📁 Storage path:", `clients/${id}/documents/${selectedFile.name}`);

      // 🔥 DEBUG: Upload starten
      console.log("⬆️ Uploading bytes...");
      await uploadBytes(fileRef, selectedFile);
      console.log("✅ Upload succesvol!");

      // 🔥 DEBUG: Download URL ophalen
      console.log("🔗 Ophalen download URL...");
      const url = await getDownloadURL(fileRef);
      console.log("✅ Download URL:", url);

      // 🔥 DEBUG: Firestore updaten
      console.log("💾 Opslaan in Firestore...");
      await updateDoc(doc(db, "clients", id!), {
        documents: arrayUnion({
          name: selectedFile.name,
          url,
          createdAt: new Date().toISOString(),
        }),
      });
      console.log("✅ Firestore bijgewerkt!");

      // State verversen
      setClient((prev: any) => ({
        ...prev,
        documents: [
          ...(prev.documents || []),
          { name: selectedFile.name, url },
        ],
      }));

      alert("Document geüpload!");
      setSelectedFile(null);
      
    } catch (error: any) {
      // 🔥 DEBUG: Foutafhandeling
      console.error("❌ UPLOAD FOUT:", error);
      console.error("❌ Error code:", error.code);
      console.error("❌ Error message:", error.message);
      
      if (error.code === "storage/unauthorized") {
        alert("Je hebt geen toestemming om bestanden te uploaden. Check Firebase Storage Rules.");
      } else {
        alert(`Upload fout: ${error.message}`);
      }
    }
  }

  // 🔥 1 CLIENT LADEN
  useEffect(() => {
    async function load() {
      console.log("📥 Loading client:", id);
      
      try {
        const refDoc = doc(db, "clients", id as string);
        const snap = await getDoc(refDoc);

        if (snap.exists()) {
          console.log("✅ Client gevonden:", snap.data());
          setClient({ id: snap.id, ...snap.data() });
        } else {
          console.warn("⚠️ Client niet gevonden");
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

            {/* BESTAND SELECTEREN */}
            <input
              type="file"
              onChange={handleFileSelect}
              accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
            />

            {/* UPLOAD KNOP */}
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
                    <a 
                      href={doc.url} 
                      target="_blank" 
                      rel="noreferrer"
                      onClick={() => {
                        console.log("📂 Opening document:", doc.name);
                        console.log("📂 URL:", doc.url);
                      }}
                    >
                      {doc.name}
                    </a>
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