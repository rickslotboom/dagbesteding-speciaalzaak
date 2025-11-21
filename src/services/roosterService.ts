import { collection, doc, getDoc, getDocs, setDoc } from "firebase/firestore";
import { db } from "../firebase";

// ===== Types =====
export interface Client {
  id: string;
  name: string;
  photo?: string;
  intro?: string;
}

/** Haalt alle clients op */
export async function getAllClients(): Promise<Client[]> {
  console.log("🔍 [roosterService] getAllClients() gestart...");
  const snap = await getDocs(collection(db, "clients"));
  console.log("📦 Clients ontvangen uit Firebase:", snap.docs.length);

  const list: Client[] = snap.docs.map((d) => {
    const data = d.data();
    console.log(`👤 Client geladen: ${d.id}`, data);
    return { 
      id: d.id, 
      name: data.name || "",
      photo: data.photo,
      intro: data.intro,
    };
  });

  console.log("✅ Alle clients verwerkt:", list);
  return list;
}

/** Haalt rooster voor 1 datum op (dashboard + detail) */
export async function getClientsForDate(date: Date): Promise<string[]> {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const id = `${y}-${m}-${d}`;

  console.log(`🔍 [roosterService] getClientsForDate(): Datum ID = ${id}`);

  const ref = doc(db, "rooster", id);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    console.log(`⚠️ Geen rooster gevonden voor ${id}`);
    return [];
  }

  const data = snap.data();
  console.log(`📅 Rooster gevonden (${id}):`, data);
  return data.clients || [];
}

/** Dashboard */
export async function getClientsForToday() {
  console.log("📆 getClientsForToday() gestart...");
  return getClientsForDate(new Date());
}

/** Haalt rooster voor hele maand */
export async function getMonthRooster(year: number, month: number) {
  console.log(`🔍 [roosterService] getMonthRooster(): ${year}-${String(month + 1).padStart(2, "0")}`);

  const snap = await getDocs(collection(db, "rooster"));
  const result: Record<string, string[]> = {};

  snap.docs.forEach((docSnap) => {
    const key = docSnap.id;
    console.log("📄 Rooster-document gevonden:", key);

    const monthPrefix = `${year}-${String(month + 1).padStart(2, "0")}`;

    if (key.startsWith(monthPrefix)) {
      const data = docSnap.data();
      console.log(`➡️ Deze hoort bij maand ${monthPrefix}:`, data);
      result[key] = data.clients || [];
    }
  });

  console.log("✅ Compleet maand-rooster:", result);
  return result;
}

/** Update het volledige rooster voor een dag */
export async function updateDayRooster(dateKey: string, clientIds: string[]): Promise<boolean> {
  console.log(`💾 [roosterService] updateDayRooster(): ${dateKey}`, clientIds);

  try {
    const ref = doc(db, "rooster", dateKey);
    await setDoc(ref, { clients: clientIds }, { merge: true });
    console.log(`✅ Rooster voor ${dateKey} succesvol opgeslagen`);
    return true;
  } catch (error) {
    console.error(`❌ Fout bij opslaan rooster voor ${dateKey}:`, error);
    return false;
  }
}

/** Voeg een client toe aan een dag */
export async function addClientToDay(dateKey: string, clientId: string): Promise<boolean> {
  console.log(`➕ [roosterService] addClientToDay(): ${clientId} aan ${dateKey}`);

  const currentClients = await getClientsForDateKey(dateKey);

  if (currentClients.includes(clientId)) {
    console.log(`⚠️ Client ${clientId} staat al ingeroosterd op ${dateKey}`);
    return true;
  }

  return updateDayRooster(dateKey, [...currentClients, clientId]);
}

/** Verwijder een client van een dag */
export async function removeClientFromDay(dateKey: string, clientId: string): Promise<boolean> {
  console.log(`➖ [roosterService] removeClientFromDay(): ${clientId} van ${dateKey}`);

  const currentClients = await getClientsForDateKey(dateKey);
  const updated = currentClients.filter((id) => id !== clientId);

  return updateDayRooster(dateKey, updated);
}

/** Helper: haal clients op via dateKey string */
async function getClientsForDateKey(dateKey: string): Promise<string[]> {
  const ref = doc(db, "rooster", dateKey);
  const snap = await getDoc(ref);

  if (!snap.exists()) return [];
  return snap.data().clients || [];
}