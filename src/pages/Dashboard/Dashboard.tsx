import ClientCard from "../../pages/client/ClientCard";
import visitsToday from "../../data/demoVisitsToday";
import styles from "./Dashboard.module.css";


export default function Dashboard() {
return (
<div className={styles.container}>
<h1 className={styles.title}>Wie komt er vandaag?</h1>
<div className={styles.grid}>
{visitsToday.map((v) => (
<ClientCard key={v.id} data={v} />
))}
</div>
</div>
);
}