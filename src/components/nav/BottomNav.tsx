import { Link } from "react-router-dom";
import styles from "./BottomNav.module.css";

export default function BottomNav({ user }: { user: any }) {
  console.log("BOTTOMNAV USER =", user);

  const isBegeleider = user?.role === "begeleider";
  const isOuder = user?.role === "ouder";

  return (
    <nav className={styles.nav}>
      <Link to="/">Home</Link>

      {isBegeleider && <Link to="/clients">Cliënten</Link>}

      {isOuder && (
        <Link to={`/client/${user.clientId}`}>
          {user.kind || "Mijn kind"}
        </Link>
      )}

      <Link to="/agenda">Agenda</Link>
      <Link to="/instellingen">Instellingen</Link>
    </nav>
  );
}
