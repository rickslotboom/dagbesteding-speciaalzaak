import { useState } from "react";
import { collection, query, where, getDocs} from "firebase/firestore";
import { signInWithEmailAndPassword } from "firebase/auth";
import { db, auth } from "../../firebase";
import sha256 from "crypto-js/sha256";

export default function LoginPage({ onLogin }: { onLogin: (user: any) => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    try {
      // 1️⃣ Check of gebruiker bestaat in Firestore
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("username", "==", username));
      const snap = await getDocs(q);

      if (snap.empty) {
        setError("Gebruiker bestaat niet");
        return;
      }

      const userDoc = snap.docs[0];
      const userData = userDoc.data();

      console.log("🔐 Ingevoerde wachtwoord:", password);
      console.log("🔐 SHA256 lokaal:", sha256(password).toString());
      console.log("🔐 SHA256 in Firestore:", userData.passwordHash);

      // 2️⃣ Check wachtwoord hash
      const hash = sha256(password).toString();
      if (hash !== userData.passwordHash) {
        setError("Wachtwoord onjuist");
        return;
      }

      console.log("✅ Wachtwoord correct - logging in met Firebase Auth...");

      // 3️⃣ Log in met Firebase Authentication
      // We gebruiken username@zorgapp.local als email format
      const firebaseEmail = `${username}@zorgapp.local`;
      
      try {
        // Probeer in te loggen met Firebase Auth
        const userCredential = await signInWithEmailAndPassword(
          auth,
          firebaseEmail,
          password
        );

        console.log("✅ Firebase Auth user:", userCredential.user);
        console.log("✅ Firebase UID:", userCredential.user.uid);

      } catch (authError: any) {
        console.log("⚠️ Firebase Auth user bestaat nog niet, wordt aangemaakt...");
        
        // Als gebruiker niet bestaat in Firebase Auth, toon instructie
        // Je moet deze gebruikers handmatig aanmaken in Firebase Console
        // of via een admin script
        setError(
          `Gebruiker "${username}" moet nog worden aangemaakt in Firebase Authentication. ` +
          `Maak een account aan met email: ${firebaseEmail}`
        );
        return;
      }

      // 4️⃣ Succes! Stuur user data door
      console.log("🔥 Firestore user document:", userData);
      console.log("🔥 clientId in Firestore:", userData.clientId);

      onLogin({
        id: userDoc.id,
        username: userData.username,
        role: userData.role,
        clientId: userData.clientId
      });

    } catch (error: any) {
      console.error("❌ Login error:", error);
      setError(`Login fout: ${error.message}`);
    }
  }

  return (
    <div className="loginContainer">
      <form className="loginBox" onSubmit={handleLogin}>
        <h1>Inloggen</h1>

        <input
          type="text"
          placeholder="Gebruikersnaam"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <input
          type="password"
          placeholder="Wachtwoord"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button type="submit">Inloggen</button>

        {error && <p className="error">{error}</p>}
      </form>
    </div>
  );
}