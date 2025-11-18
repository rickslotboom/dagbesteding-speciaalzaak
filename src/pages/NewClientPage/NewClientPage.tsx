import { useState } from "react";
import { addDoc, collection } from "firebase/firestore";
import { db } from "../../firebase";
import { useNavigate } from "react-router-dom";

export default function NewClientPage() {
  const navigate = useNavigate();

  // Basis velden
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [photo, setPhoto] = useState("");
  const [address, setAddress] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [medication, setMedication] = useState("");

  // Arrays
  const [hobbies, setHobbies] = useState("");
  const [communication, setCommunication] = useState("");
  const [strengths, setStrengths] = useState("");
  const [tasksGoodAt, setTasksGoodAt] = useState("");
  const [fixedTasks, setFixedTasks] = useState("");

  // Hulpvragen & ondersteuning
  const [helpRequests, setHelpRequests] = useState("");
  const [parentRequests, setParentRequests] = useState("");
  const [supportStaff, setSupportStaff] = useState("");
  const [supportClient, setSupportClient] = useState("");
  const [supportFrequency, setSupportFrequency] = useState("");
  const [supportLocation, setSupportLocation] = useState("");
  const [supportTools, setSupportTools] = useState("");

  // -------------------------------
  // SIGNALERINGSPLAN (TOEGEVOEGD)
  // -------------------------------

  // 🟢 Groene fase
  const [greenGoesWell, setGreenGoesWell] = useState("");

  // 🟠 Oranje fase
  const [orangeSignals, setOrangeSignals] = useState("");
  const [orangeHelps, setOrangeHelps] = useState("");
  const [orangeNotHelps, setOrangeNotHelps] = useState("");

  // 🔴 Rode fase
  const [redSafety, setRedSafety] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    await addDoc(collection(db, "clients"), {
      name,
      age,
      photo,
      address,
      contact_person: contactPerson,
      medication,

      hobbies: hobbies ? hobbies.split(",").map(s => s.trim()) : [],
      communication: communication ? communication.split(",").map(s => s.trim()) : [],
      strengths: strengths ? strengths.split(",").map(s => s.trim()) : [],
      tasks_good_at: tasksGoodAt ? tasksGoodAt.split(",").map(s => s.trim()) : [],
      fixed_tasks: fixedTasks ? fixedTasks.split(",").map(s => s.trim()) : [],

      help_requests: helpRequests,
      parent_requests: parentRequests,

      support_staff: supportStaff,
      support_client: supportClient,
      support_frequency: supportFrequency,
      support_location: supportLocation,
      support_tools: supportTools,

      // -------------------------------
      // SIGNALLINGSPLAN OPSLAAN
      // -------------------------------
      signaling_plan: {
        green: {
          goes_well: greenGoesWell
            ? greenGoesWell.split(",").map(s => s.trim())
            : []
        },
        orange: {
          signals: orangeSignals
            ? orangeSignals.split(",").map(s => s.trim())
            : [],
          what_helps: orangeHelps
            ? orangeHelps.split(",").map(s => s.trim())
            : [],
          what_not_helps: orangeNotHelps
            ? orangeNotHelps.split(",").map(s => s.trim())
            : []
        },
        red: {
          safety: redSafety
            ? redSafety.split(",").map(s => s.trim())
            : []
        }
      },

      documents: [],
      reports: [],
      goals: []
    });

    navigate("/clients");
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Nieuwe cliënt</h1>

      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: 12 }}
      >

        <h2>Basisgegevens</h2>
        <input placeholder="Naam" value={name} onChange={e => setName(e.target.value)} required />
        <input placeholder="Leeftijd" value={age} onChange={e => setAge(e.target.value)} />
        <input placeholder="Foto-URL" value={photo} onChange={e => setPhoto(e.target.value)} />
        <input placeholder="Adres" value={address} onChange={e => setAddress(e.target.value)} />
        <input placeholder="Contactpersoon" value={contactPerson} onChange={e => setContactPerson(e.target.value)} />
        <input placeholder="Medicatie" value={medication} onChange={e => setMedication(e.target.value)} />

        <h2>Lijsten (scheid items met een komma)</h2>
        <input placeholder="Hobby's" value={hobbies} onChange={e => setHobbies(e.target.value)} />
        <input placeholder="Communicatievoorkeuren" value={communication} onChange={e => setCommunication(e.target.value)} />
        <input placeholder="Sterke kanten" value={strengths} onChange={e => setStrengths(e.target.value)} />
        <input placeholder="Taken waar goed in" value={tasksGoodAt} onChange={e => setTasksGoodAt(e.target.value)} />
        <input placeholder="Vaste taken" value={fixedTasks} onChange={e => setFixedTasks(e.target.value)} />

        <h2>Hulpvragen & ondersteuning</h2>
        <textarea placeholder="Hulpvragen cliënt" value={helpRequests} onChange={e => setHelpRequests(e.target.value)} />
        <textarea placeholder="Hulpvragen ouders" value={parentRequests} onChange={e => setParentRequests(e.target.value)} />

        <textarea placeholder="Wat doet de begeleider?" value={supportStaff} onChange={e => setSupportStaff(e.target.value)} />
        <textarea placeholder="Wat doet de cliënt?" value={supportClient} onChange={e => setSupportClient(e.target.value)} />
        <input placeholder="Frequentie" value={supportFrequency} onChange={e => setSupportFrequency(e.target.value)} />
        <input placeholder="Locatie" value={supportLocation} onChange={e => setSupportLocation(e.target.value)} />
        <input placeholder="Hulpmiddelen" value={supportTools} onChange={e => setSupportTools(e.target.value)} />

        {/* ---------------------------- */}
        {/* SIGNALLERINGSPLAN FIELDS     */}
        {/* ---------------------------- */}
        <h2>Signaleringsplan bij spanning</h2>

        <h3>🟢 Groene fase — Wat gaat goed?</h3>
        <textarea
          placeholder="Wat gaat goed? (komma gescheiden)"
          value={greenGoesWell}
          onChange={(e) => setGreenGoesWell(e.target.value)}
        />

        <h3>🟠 Oranje fase — Eerste signalen & aanpak</h3>
        <textarea
          placeholder="Signalen (komma gescheiden)"
          value={orangeSignals}
          onChange={(e) => setOrangeSignals(e.target.value)}
        />
        <textarea
          placeholder="Wat helpt (komma gescheiden)"
          value={orangeHelps}
          onChange={(e) => setOrangeHelps(e.target.value)}
        />
        <textarea
          placeholder="Wat niet helpt (komma gescheiden)"
          value={orangeNotHelps}
          onChange={(e) => setOrangeNotHelps(e.target.value)}
        />

        <h3>🔴 Rode fase — Veiligheidsafspraken</h3>
        <textarea
          placeholder="Veiligheidsmaatregelen (komma gescheiden)"
          value={redSafety}
          onChange={(e) => setRedSafety(e.target.value)}
        />

        <button
          type="submit"
          style={{
            padding: "10px 16px",
            background: "#2196f3",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontSize: "16px"
          }}
        >
          Opslaan
        </button>
      </form>
    </div>
  );
}
