import { useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../firebase";
import sha256 from "crypto-js/sha256";

export default function LoginPage({ onLogin }: { onLogin: (user: any) => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const usersRef = collection(db, "users");
    const q = query(usersRef, where("username", "==", username));
    const snap = await getDocs(q);



    if (snap.empty) {
      setError("Gebruiker bestaat niet");
      return;
    }

    const user = snap.docs[0].data();

        console.log("🔐 Ingevoerde wachtwoord:", password);
console.log("🔐 SHA256 lokaal:", sha256(password).toString());
console.log("🔐 SHA256 in Firestore:", user.passwordHash);
console.log("Match?", sha256(password).toString() === user.passwordHash);


    

    const hash = sha256(password).toString();

    if (hash !== user.passwordHash) {
      setError("Wachtwoord onjuist");
      return;
    }

    console.log("🔥 Firestore user document:", user);
console.log("🔥 clientId in Firestore:", user.clientId);
console.log("🔥 user object dat naar App gaat:", {
  id: snap.docs[0].id,
  username: user.username,
  role: user.role,
  clientId: user.clientId
});

    // Succes!
    onLogin({
      id: snap.docs[0].id,
      username: user.username,
      role: user.role,
      clientId: user.clientId
    });
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
