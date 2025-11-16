// migrateUsers.ts
// Run dit script EENMALIG om je bestaande gebruikers naar Firebase Auth te migreren

import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";

// Firebase config (kopieer uit je firebase.ts)
const firebaseConfig = {
  apiKey: "AIzaSyAY73xjEitrE-0VsFxP9LnBhXtLcTx-oIY",
  authDomain: "zorgplan-app.firebaseapp.com",
  projectId: "zorgplan-app",
  storageBucket: "zorgplan-app.firebasestorage.app",
  messagingSenderId: "797740752930",
  appId: "1:797740752930:web:1b1d4a5fac0f0583882a7b"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

async function migrateUsers() {
  console.log("🚀 Starting user migration to Firebase Authentication...\n");

  try {
    // Haal alle users uit Firestore
    const usersRef = collection(db, "users");
    const snapshot = await getDocs(usersRef);

    console.log(`📊 Found ${snapshot.size} users in Firestore\n`);

    if (snapshot.empty) {
      console.log("⚠️  No users found in Firestore 'users' collection");
      return;
    }

    // Loop door elke user
    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (const userDoc of snapshot.docs) {
      const userData = userDoc.data();
      const username = userData.username;

      if (!username) {
        console.log(`⚠️  Skipping document ${userDoc.id} - no username field`);
        skipCount++;
        continue;
      }

      const email = `${username}@zorgapp.local`;
      
      // BELANGRIJK: Je moet het ORIGINELE wachtwoord gebruiken!
      // Als je die niet meer hebt, gebruik een tijdelijk wachtwoord
      const temporaryPassword = "TijdelijkWachtwoord123!";

      console.log(`👤 Processing: ${username}`);
      console.log(`   Firestore ID: ${userDoc.id}`);
      console.log(`   Email: ${email}`);
      console.log(`   Role: ${userData.role}`);

      try {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          temporaryPassword
        );

        console.log(`   ✅ Created! Firebase UID: ${userCredential.user.uid}\n`);
        successCount++;

      } catch (error: any) {
        if (error.code === "auth/email-already-in-use") {
          console.log(`   ⚠️  Already exists in Firebase Auth\n`);
          skipCount++;
        } else {
          console.error(`   ❌ Error: ${error.message}\n`);
          errorCount++;
        }
      }

      // Kleine pauze tussen requests
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log("\n" + "=".repeat(50));
    console.log("📊 Migration Summary:");
    console.log(`   ✅ Successfully created: ${successCount}`);
    console.log(`   ⚠️  Skipped (already exist): ${skipCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log("=".repeat(50));

    if (successCount > 0) {
      console.log("\n⚠️  BELANGRIJK:");
      console.log(`   Alle nieuwe gebruikers hebben tijdelijk wachtwoord: TijdelijkWachtwoord123!`);
      console.log(`   Laat gebruikers dit wijzigen bij eerste login.`);
    }

    console.log("\n✅ Migration complete!");
    process.exit(0);

  } catch (error) {
    console.error("\n❌ Migration failed:", error);
    process.exit(1);
  }
}