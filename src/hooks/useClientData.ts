import { useState, useEffect } from "react";
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../firebase";

// Helper functies voor CSV conversie
export function arrayToCSV(arr?: any[]) {
  if (!arr) return "";
  if (!Array.isArray(arr)) return String(arr);
  return arr.join(", ");
}

export function csvToArray(s: string) {
  if (!s) return [];
  return s.split(",").map((x) => x.trim()).filter(Boolean);
}

// Normaliseer client data voor editing
function normalizeClientForEdit(client: any) {
  return {
    ...client,
    address: client.address ?? "",
    contact_person: client.contact_person ?? "",
    medication: client.medication ?? "",
    help_requests: client.help_requests ?? "",
    parent_requests: client.parent_requests ?? "",
    support_staff: client.support_staff ?? "",
    support_client: client.support_client ?? "",
    support_frequency: client.support_frequency ?? "",
    support_location: client.support_location ?? "",
    support_tools: client.support_tools ?? "",
    calming: client.calming ?? "",
    hobbies: arrayToCSV(client.hobbies),
    communication: arrayToCSV(client.communication),
    strengths: arrayToCSV(client.strengths),
    tasks_good_at: arrayToCSV(client.tasks_good_at),
    fixed_tasks: arrayToCSV(client.fixed_tasks),
    signaling_plan: client.signaling_plan ? {
      green: {
        ...client.signaling_plan.green,
        goes_well: arrayToCSV(client.signaling_plan.green?.goes_well),
      },
      orange: {
        ...client.signaling_plan.orange,
        signals: arrayToCSV(client.signaling_plan.orange?.signals),
        what_helps: arrayToCSV(client.signaling_plan.orange?.what_helps),
        what_not_helps: arrayToCSV(client.signaling_plan.orange?.what_not_helps),
      },
      red: {
        ...client.signaling_plan.red,
        safety: arrayToCSV(client.signaling_plan.red?.safety),
      },
    } : undefined,
  };
}

// Normaliseer edit data voor opslaan in Firestore
function normalizeForSave(editData: any) {
  const payload: any = { ...editData };

  // Converteer CSV strings naar arrays
  if (typeof payload.hobbies === "string")
    payload.hobbies = csvToArray(payload.hobbies);
  if (typeof payload.communication === "string")
    payload.communication = csvToArray(payload.communication);
  if (typeof payload.strengths === "string")
    payload.strengths = csvToArray(payload.strengths);
  if (typeof payload.tasks_good_at === "string")
    payload.tasks_good_at = csvToArray(payload.tasks_good_at);
  if (typeof payload.fixed_tasks === "string")
    payload.fixed_tasks = csvToArray(payload.fixed_tasks);

  if (payload.signaling_plan) {
    const sp = { ...payload.signaling_plan };

    if (typeof sp.green?.goes_well === "string")
      sp.green.goes_well = csvToArray(sp.green.goes_well);
    if (typeof sp.orange?.signals === "string")
      sp.orange.signals = csvToArray(sp.orange.signals);
    if (typeof sp.orange?.what_helps === "string")
      sp.orange.what_helps = csvToArray(sp.orange.what_helps);
    if (typeof sp.orange?.what_not_helps === "string")
      sp.orange.what_not_helps = csvToArray(sp.orange.what_not_helps);
    if (typeof sp.red?.safety === "string")
      sp.red.safety = csvToArray(sp.red.safety);

    payload.signaling_plan = sp;
  }

  return payload;
}

export function useClientData(clientId: string | undefined) {
  const [client, setClient] = useState<any | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<any>({});

  // Load client data
  useEffect(() => {
    async function load() {
      if (!clientId) return;
      
      try {
        const refDoc = doc(db, "clients", clientId);
        const snap = await getDoc(refDoc);

        if (snap.exists()) {
          const data = { id: snap.id, ...snap.data() };
          setClient(data);
          if (!isEditing) {
            setEditData(data);
          }
        } else {
          setClient(undefined);
        }
      } catch (err) {
        console.error("Fout bij laden client:", err);
        setClient(undefined);
      }
    }
    load();
  }, [clientId]);

  // Start editing
  const startEdit = () => {
    setEditData(normalizeClientForEdit(client));
    setIsEditing(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditData(client);
    setIsEditing(false);
  };

  // Save changes
  const saveChanges = async () => {
    if (!clientId) return;

    try {
      const refDoc = doc(db, "clients", clientId);
      const payload = normalizeForSave(editData);
      
      await updateDoc(refDoc, payload);

      const updatedClient = { ...client, ...payload };
      setClient(updatedClient);
      setEditData(updatedClient);
      setIsEditing(false);
      
      alert("Gegevens opgeslagen!");
    } catch (err: any) {
      console.error("Opslaan mislukt:", err);
      alert("Opslaan mislukt: " + err?.message);
    }
  };

  // Delete client
  const deleteClient = async (onSuccess: () => void) => {
    if (!clientId) return;

    const confirmation = window.prompt(
      `Weet je ZEKER dat je ${client.name} volledig wilt verwijderen?\n\nTyp "VERWIJDER" om te bevestigen:`
    );

    if (confirmation !== "VERWIJDER") return;

    try {
      await deleteDoc(doc(db, "clients", clientId));
      alert(`${client.name} is volledig verwijderd.`);
      onSuccess();
    } catch (err: any) {
      console.error("Verwijderen mislukt:", err);
      alert("Verwijderen mislukt: " + err?.message);
    }
  };

  return {
    client,
    setClient,
    isEditing,
    editData,
    setEditData,
    startEdit,
    cancelEdit,
    saveChanges,
    deleteClient,
  };
}