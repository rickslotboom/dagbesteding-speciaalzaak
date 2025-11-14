import styles from "./ClientCard.module.css";


interface ClientCardProps {
data: {
id?: number;
name: string;
time?: string;
status?: string;
photo: string;
};
}


export default function ClientCard({ data }: ClientCardProps) {
return (
<div className={styles.card}>
<img src={data.photo} alt={data.name} className={styles.photo} />
<div>
<h2 className={styles.name}>{data.name}</h2>
{data.time && <p className={styles.info}>{data.time}</p>}
{data.status && <p className={styles.status}>{data.status}</p>}
</div>
</div>
);
}