import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { db } from "../firebase";

/** Haalt alle clients op */
export async function getAllClients() {
  console.log("🔍 [roosterService] getAllClients() gestart...");

  const snap = await getDocs(collection(db, "clients"));

  console.log("📦 Clients ontvangen uit Firebase:", snap.docs.length);

  const list = snap.docs.map((d) => {
    const data = d.data();
    console.log(`👤 Client geladen: ${d.id}`, data);
    return { id: d.id, ...data };
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
  console.log(
    `🔍 [roosterService] getMonthRooster(): ${year}-${String(
      month + 1
    ).padStart(2, "0")}`
  );

  const snap = await getDocs(collection(db, "rooster"));

  const result: Record<string, string[]> = {};

  snap.docs.forEach((docSnap) => {
    const key = docSnap.id; // "2025-02-05"

    console.log("📄 Rooster-document gevonden:", key);

    const monthPrefix = `${year}-${String(month + 1).padStart(2, "0")}`;

    if (key.startsWith(monthPrefix)) {
      const data = docSnap.data();
      console.log(`➡️ Deze hoort bij maand ${monthPrefix}:`, data);
      result[key] = data.clients || [];
    } else {
      console.log(`⏭️ Document hoort NIET bij deze maand: ${key}`);
    }
  });

  console.log("✅ Compleet maand-rooster:", result);
  return result;
}
