import { useState } from "react";
import { doc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { db } from "../firebase";

export function useClientReports(clientId: string | undefined, setClient: any) {
  const [newReport, setNewReport] = useState("");
  const [openReport, setOpenReport] = useState<any | null>(null);

  const addReport = async () => {
    if (!clientId || !newReport.trim()) {
      alert("Rapport is leeg.");
      return;
    }

    const report = {
      id: crypto.randomUUID(),
      date: new Date().toISOString().split("T")[0],
      text: newReport,
      createdAt: new Date().toISOString(),
    };

    try {
      await updateDoc(doc(db, "clients", clientId), {
        reports: arrayUnion(report),
      });

      setClient((prev: any) => ({
        ...prev,
        reports: [...(prev.reports || []), report],
      }));

      setNewReport("");
      alert("Rapport opgeslagen!");
    } catch (err: any) {
      console.error("Opslaan rapport:", err);
      alert("Opslaan mislukt: " + err?.message);
    }
  };

  const deleteReport = async (reportId: string, client: any) => {
    if (!clientId) return;

    const report = client.reports.find((r: any) => r.id === reportId);
    if (!report) return;
    if (!confirm("Weet je zeker dat je dit rapport wilt verwijderen?")) return;

    try {
      await updateDoc(doc(db, "clients", clientId), {
        reports: arrayRemove(report),
      });

      setClient((prev: any) => ({
        ...prev,
        reports: prev.reports.filter((r: any) => r.id !== reportId),
      }));

      alert("Rapport verwijderd!");
    } catch (err: any) {
      console.error("Delete rapport:", err);
      alert("Verwijderen mislukt: " + err?.message);
    }
  };

  return {
    newReport,
    setNewReport,
    openReport,
    setOpenReport,
    addReport,
    deleteReport,
  };
}