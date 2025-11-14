import { Link } from "react-router-dom";
import styles from "./BottomNav.module.css";


export default function BottomNav() {
return (
<nav className={styles.nav}>
<Link to="/">Home</Link>
<Link to="/clients">Cliënten</Link>
<Link to="/rapportage">Rapportage</Link>
<Link to="/agenda">Agenda</Link>
<Link to="/instellingen">Instellingen</Link>
</nav>
);
}