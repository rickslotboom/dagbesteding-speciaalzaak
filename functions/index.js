const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { defineString } = require("firebase-functions/params");
const { logger } = require("firebase-functions/v2");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");

admin.initializeApp();

// params
const EMAIL_USER = defineString("EMAIL_USER");
const EMAIL_PASS = defineString("EMAIL_PASS");
const EMAIL_HOST = defineString("EMAIL_HOST");
const EMAIL_PORT = defineString("EMAIL_PORT");

exports.sendReportEmail = onDocumentCreated(
  "clients/{clientId}/reports/{reportId}",
  async (event) => {
    try {
      logger.info("🚀 Function gestart");
      
      const { clientId } = event.params;
      const report = event.data.data();

      // Haal client data op
      const clientSnap = await admin
        .firestore()
        .collection("clients")
        .doc(clientId)
        .get();

      const client = clientSnap.data();
      logger.info("Client opgehaald:", client?.name);

      // Zoek ouder op basis van kind naam
      const usersSnap = await admin
        .firestore()
        .collection("users")
        .where("role", "==", "ouder")
        .where("kind", "==", client?.name)
        .get();

      if (usersSnap.empty) {
        logger.warn("⚠️ Geen ouder gevonden voor cliënt:", client?.name);
        return null;
      }

      // Neem eerste ouder (als er meerdere zijn)
      const parent = usersSnap.docs[0].data();
      const parentEmail = parent.email;

      if (!parentEmail) {
        logger.warn("⚠️ Ouder heeft geen email adres");
        return null;
      }

      logger.info("Ouder gevonden:", parentEmail);

      // Maak email transporter
      const transporter = nodemailer.createTransport({
        host: EMAIL_HOST.value(),
        port: parseInt(EMAIL_PORT.value()),
        secure: EMAIL_PORT.value() === "465",
        auth: {
          user: EMAIL_USER.value(),
          pass: EMAIL_PASS.value(),
        },
      });

      logger.info("Transporter aangemaakt");

      // Verstuur email
      const message = {
        from: EMAIL_USER.value(),
        to: parentEmail,
        subject: `Nieuwe rapportage voor ${client?.name}`,
        text: `
Beste ${parent.name || 'ouder/verzorger'},

Er is een nieuwe rapportage geplaatst voor ${client?.name}.

Datum: ${report?.date || 'onbekend'}

Inhoud:
${report?.text || 'geen tekst'}

Met vriendelijke groet,
Het zorgteam

---
Link naar app: https://dagbesteding.speciaalzaakvoorburg.nl/client/${clientId}
        `,
      };

      await transporter.sendMail(message);
      logger.info("✅ E-mail verstuurd naar:", parentEmail);
      
      return null;
    } catch (err) {
      logger.error("❌ Error:", err);
      return null;
    }
  }
);