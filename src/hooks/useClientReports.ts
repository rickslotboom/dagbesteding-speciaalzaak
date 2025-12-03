import { useState } from "react";
import { doc, collection, addDoc, deleteDoc, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "../firebase";
import { useEffect } from "react";

export function useClientReports(clientId: string | undefined, setClient: any) {
  const [newReport, setNewReport] = useState("");
  const [openReport, setOpenReport] = useState<any | null>(null);
  const [reports, setReports] = useState<any[]>([]);

  // Luister realtime naar reports subcollection
  useEffect(() => {
    if (!clientId) return;

    const reportsRef = collection(db, "clients", clientId, "reports");
    const q = query(reportsRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reportsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Update client met reports
      setClient((prev: any) => ({
        ...prev,
        reports: reportsData,
      }));
      
      setReports(reportsData);
    });

    return () => unsubscribe();
  }, [clientId]);

  const addReport = async () => {
    if (!clientId || !newReport.trim()) {
      alert("Rapport is leeg.");
      return;
    }

    const report = {
      date: new Date().toISOString().split("T")[0],
      text: newReport,
      createdAt: new Date().toISOString(),
    };

    try {
      // Sla op in subcollection - DIT TRIGGERT JE CLOUD FUNCTION! 🎉
      await addDoc(collection(db, "clients", clientId, "reports"), report);

      setNewReport("");
      alert("Rapport opgeslagen!");
    } catch (err: any) {
      console.error("Opslaan rapport:", err);
      alert("Opslaan mislukt: " + err?.message);
    }
  };

  const deleteReport = async (reportId: string, client: any) => {
    if (!clientId) return;
    if (!confirm("Weet je zeker dat je dit rapport wilt verwijderen?")) return;

    try {
      await deleteDoc(doc(db, "clients", clientId, "reports", reportId));
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
    reports,
  };
}