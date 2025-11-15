import ClientCard from "../../pages/client/ClientCard";
import visitsToday from "../../data/demoVisitsToday";
import "./Dashboard.module.css";

interface DashboardProps {
  user: any;
}

export default function Dashboard({ user }: DashboardProps) {
  return (
    <div className="container">
      <h1 className="title">Wie komt er vandaag?</h1>

      <div className="grid">
        {visitsToday.map((v) => (
          <ClientCard key={v.id} data={v} />
        ))}
      </div>
    </div>
  );
}
