import { useState } from "react";
import { collection, query, where, getDocs, updateDoc } from "firebase/firestore";
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { db, auth } from "../../firebase";
import sha256 from "crypto-js/sha256";
import "./Instellingen.module.css";

export default function Instellingen({ user }: { user?: any }) {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [huidigWachtwoord, setHuidigWachtwoord] = useState("");
  const [nieuwWachtwoord, setNieuwWachtwoord] = useState("");
  const [bevestigWachtwoord, setBevestigWachtwoord] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Debug: log de user prop
  console.log("👤 User in Instellingen:", user);

  // Als er geen user is, toon een boodschap
  if (!user) {
    return (
      <div className="instellingen-page">
        <h1>Instellingen</h1>
        <div className="instellingen-card">
          <p>Gebruiker niet gevonden. Log opnieuw in.</p>
        </div>
      </div>
    );
  }

  // Password policy validatie (SAP-stijl)
  function validatePassword(password: string): { valid: boolean; message: string } {
    // Minimaal 8 karakters
    if (password.length < 8) {
      return { valid: false, message: "Wachtwoord moet minimaal 8 karakters bevatten" };
    }

    // Maximaal 40 karakters
    if (password.length > 40) {
      return { valid: false, message: "Wachtwoord mag maximaal 40 karakters bevatten" };
    }

    // Moet minimaal 1 hoofdletter bevatten
    if (!/[A-Z]/.test(password)) {
      return { valid: false, message: "Wachtwoord moet minimaal 1 hoofdletter bevatten" };
    }

    // Moet minimaal 1 kleine letter bevatten
    if (!/[a-z]/.test(password)) {
      return { valid: false, message: "Wachtwoord moet minimaal 1 kleine letter bevatten" };
    }

    // Moet minimaal 1 cijfer bevatten
    if (!/[0-9]/.test(password)) {
      return { valid: false, message: "Wachtwoord moet minimaal 1 cijfer bevatten" };
    }

    // Moet minimaal 1 speciaal teken bevatten
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      return { valid: false, message: "Wachtwoord moet minimaal 1 speciaal teken bevatten (!@#$%^&* etc.)" };
    }

    // Mag geen 3 opeenvolgende identieke karakters bevatten
    for (let i = 0; i < password.length - 2; i++) {
      if (password[i] === password[i + 1] && password[i] === password[i + 2]) {
        return { valid: false, message: "Wachtwoord mag geen 3 opeenvolgende identieke karakters bevatten" };
      }
    }

    // Mag geen gebruikersnaam bevatten (case-insensitive)
    if (password.toLowerCase().includes(user.username.toLowerCase())) {
      return { valid: false, message: "Wachtwoord mag je gebruikersnaam niet bevatten" };
    }

    return { valid: true, message: "" };
  }

  async function handleWachtwoordWijzigen(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Basis validatie
    if (!huidigWachtwoord || !nieuwWachtwoord || !bevestigWachtwoord) {
      setError("Vul alle velden in");
      return;
    }

    if (nieuwWachtwoord !== bevestigWachtwoord) {
      setError("Nieuwe wachtwoorden komen niet overeen");
      return;
    }

    if (nieuwWachtwoord === huidigWachtwoord) {
      setError("Nieuw wachtwoord moet verschillen van het huidige wachtwoord");
      return;
    }

    // Password policy validatie
    const validation = validatePassword(nieuwWachtwoord);
    if (!validation.valid) {
      setError(validation.message);
      return;
    }

    setIsLoading(true);

    try {
      // 1️⃣ Zoek gebruiker in Firestore
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("username", "==", user.username));
      const snap = await getDocs(q);

      if (snap.empty) {
        setError("Gebruiker niet gevonden");
        setIsLoading(false);
        return;
      }

      const userDoc = snap.docs[0];
      const userData = userDoc.data();

      // 2️⃣ Verificeer huidig wachtwoord
      const huidigHash = sha256(huidigWachtwoord).toString();
      if (huidigHash !== userData.passwordHash) {
        setError("Huidig wachtwoord is onjuist");
        setIsLoading(false);
        return;
      }

      // 3️⃣ Update Firebase Authentication
      const firebaseUser = auth.currentUser;
      if (!firebaseUser) {
        setError("Geen actieve sessie gevonden");
        setIsLoading(false);
        return;
      }

      // Herverifieer gebruiker voordat wachtwoord wordt gewijzigd
      const firebaseEmail = `${user.username}@zorgapp.local`;
      const credential = EmailAuthProvider.credential(firebaseEmail, huidigWachtwoord);
      
      try {
        await reauthenticateWithCredential(firebaseUser, credential);
        await updatePassword(firebaseUser, nieuwWachtwoord);
      } catch (authError: any) {
        console.error("Firebase Auth error:", authError);
        setError("Fout bij wijzigen wachtwoord in Firebase Auth");
        setIsLoading(false);
        return;
      }

      // 4️⃣ Update Firestore hash
      const nieuwHash = sha256(nieuwWachtwoord).toString();
      await updateDoc(userDoc.ref, {
        passwordHash: nieuwHash,
        updatedAt: new Date().toISOString()
      });

      // 5️⃣ Succes!
      setSuccess("Wachtwoord succesvol gewijzigd");
      setHuidigWachtwoord("");
      setNieuwWachtwoord("");
      setBevestigWachtwoord("");

    } catch (error: any) {
      console.error("❌ Wachtwoord wijzigen error:", error);
      setError(`Fout: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }

  const handleTileClick = (section: string) => {
    if (activeSection === section) {
      setActiveSection(null);
      // Reset form bij sluiten
      setHuidigWachtwoord("");
      setNieuwWachtwoord("");
      setBevestigWachtwoord("");
      setError("");
      setSuccess("");
    } else {
      setActiveSection(section);
      // Reset bij wisselen
      setError("");
      setSuccess("");
    }
  };

  return (
    <div className="instellingen-page">
      <h1>Instellingen</h1>

      {/* Tegeltjes overzicht */}
      {!activeSection && (
        <div className="tiles-container">
          <div 
            className="settings-tile"
            onClick={() => handleTileClick('wachtwoord')}
          >
            <div className="tile-icon">🔒</div>
            <h2>Wachtwoord wijzigen</h2>
            <p>Verander je wachtwoord</p>
          </div>

          <div 
            className="settings-tile"
            onClick={() => handleTileClick('account')}
          >
            <div className="tile-icon">👤</div>
            <h2>Accountinformatie</h2>
            <p>Bekijk je gegevens</p>
          </div>
        </div>
      )}

      {/* Wachtwoord wijzigen sectie */}
      {activeSection === 'wachtwoord' && (
        <div className="instellingen-card">
          <button 
            className="back-button"
            onClick={() => handleTileClick('wachtwoord')}
          >
            ← Terug
          </button>
          
          <h2>Wachtwoord wijzigen</h2>
          
          <form onSubmit={handleWachtwoordWijzigen} className="wachtwoord-form">
            <div className="form-group">
              <label>Huidig wachtwoord</label>
              <input
                type="password"
                value={huidigWachtwoord}
                onChange={(e) => setHuidigWachtwoord(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="form-group">
              <label>Nieuw wachtwoord</label>
              <input
                type="password"
                value={nieuwWachtwoord}
                onChange={(e) => setNieuwWachtwoord(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="form-group">
              <label>Bevestig nieuw wachtwoord</label>
              <input
                type="password"
                value={bevestigWachtwoord}
                onChange={(e) => setBevestigWachtwoord(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <button type="submit" disabled={isLoading}>
              {isLoading ? "Bezig..." : "Wachtwoord wijzigen"}
            </button>

            {error && <p className="error">{error}</p>}
            {success && <p className="success">{success}</p>}
          </form>
        </div>
      )}

      {/* Accountinformatie sectie */}
      {activeSection === 'account' && (
        <div className="instellingen-card">
          <button 
            className="back-button"
            onClick={() => handleTileClick('account')}
          >
            ← Terug
          </button>
          
          <h2>Accountinformatie</h2>
          <div className="account-info">
            <div className="info-row">
              <strong>Gebruikersnaam:</strong>
              <span>{user.username}</span>
            </div>
            <div className="info-row">
              <strong>Rol:</strong>
              <span>{user.role}</span>
            </div>
            {user.clientId && (
              <div className="info-row">
                <strong>Client ID:</strong>
                <span>{user.clientId}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}