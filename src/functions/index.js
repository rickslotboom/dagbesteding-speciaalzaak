const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { defineString } = require("firebase-functions/params");
const { logger } = require("firebase-functions");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");

admin.initializeApp();

// params
const EMAIL_USER = defineString("EMAIL_USER");
const EMAIL_PASS = defineString("EMAIL_PASS");
const EMAIL_HOST = defineString("EMAIL_HOST");
const EMAIL_PORT = defineString("EMAIL_PORT");

exports.sendReportEmail = onDocumentCreated(
  {
    document: "clients/{clientId}/reports/{reportId}",
    secrets: [EMAIL_USER, EMAIL_PASS, EMAIL_HOST, EMAIL_PORT],
  },
  async (event) => {
    try {
      const { clientId } = event.params;
      const report = event.data.data();

      const clientSnap = await admin
        .firestore()
        .collection("clients")
        .doc(clientId)
        .get();

      const client = clientSnap.data();

      const transporter = nodemailer.createTransport({
        host: EMAIL_HOST.value(),
        port: Number(EMAIL_PORT.value()),
        secure: true,
        auth: {
          user: EMAIL_USER.value(),
          pass: EMAIL_PASS.value(),
        },
      });

      const message = {
        from: EMAIL_USER.value(),
        to: "rick.slotboom@hotmail.com",
        subject: `Nieuwe rapportage voor ${client?.name}`,
        text: `
Er is een nieuwe rapportage geplaatst.

Cliënt: ${client?.name}
Datum: ${report.date}

Inhoud:
${report.text}

Link naar app:
https://zorgplan-app.web.app/client/${clientId}
      `,
      };

      await transporter.sendMail(message);
      logger.info("✔ E-mail verstuurd.");
    } catch (err) {
      logger.error("❌ Fout bij e-mailversturen:", err);
    }
  }
);
