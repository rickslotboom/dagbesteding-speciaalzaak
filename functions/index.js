const { onDocumentCreated, onDocumentUpdated } = require("firebase-functions/v2/firestore");
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

// Functie 1: Email bij nieuw rapport
exports.sendReportEmail = onDocumentCreated(
  "clients/{clientId}/reports/{reportId}",
  async (event) => {
    try {
      logger.info("🚀 Function gestart");
      
      const { clientId } = event.params;
      const report = event.data.data();

      const clientSnap = await admin
        .firestore()
        .collection("clients")
        .doc(clientId)
        .get();

      const client = clientSnap.data();
      logger.info("Client opgehaald:", client?.name);

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

      const parent = usersSnap.docs[0].data();
      const parentEmail = parent.email;

      if (!parentEmail) {
        logger.warn("⚠️ Ouder heeft geen email adres");
        return null;
      }

      logger.info("Ouder gevonden:", parentEmail);

      // Maak transporter HIER
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

      const message = {
        from: EMAIL_USER.value(),
        to: parentEmail,
        subject: `Nieuwe rapportage voor ${client?.name}`,
        text: `
Beste ${parent.username || 'ouder/verzorger'},

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

// Functie 2: Email wanneer email veld wordt toegevoegd of gewijzigd
exports.onUserEmailChanged = onDocumentUpdated(
  "users/{userId}",
  async (event) => {
    try {
      const before = event.data.before.data();
      const after = event.data.after.data();

      logger.info("=== DEBUG START ===");
      logger.info("Before email:", before.email);
      logger.info("After email:", after.email);
      logger.info("Username:", after.username);

      // Check of email is toegevoegd of gewijzigd
      const emailChanged = !before.email || before.email !== after.email;

      if (emailChanged && after.email) {
        logger.info("📧 Email gewijzigd voor gebruiker:", after.username);

        const userEmail = after.email;
        const userName = after.username || 'gebruiker';
        // Kapitaliseer eerste letter van gebruikersnaam
        const capitalizedUserName = userName.charAt(0).toUpperCase() + userName.slice(1);

        // Maak transporter HIER inline
        const transporter = nodemailer.createTransport({
          host: EMAIL_HOST.value(),
          port: parseInt(EMAIL_PORT.value()),
          secure: EMAIL_PORT.value() === "465",
          auth: {
            user: EMAIL_USER.value(),
            pass: EMAIL_PASS.value(),
          },
        });

        logger.info("✅ Transporter aangemaakt");

        const message = {
          from: EMAIL_USER.value(),
          to: userEmail,
          subject: "Welkom bij Zorgplan - Jouw inloggegevens",
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <style>
                body {
                  font-family: Arial, sans-serif;
                  line-height: 1.6;
                  color: #333;
                }
                .container {
                  max-width: 600px;
                  margin: 0 auto;
                  padding: 20px;
                }
                .header {
                  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                  color: white;
                  padding: 30px;
                  text-align: center;
                  border-radius: 10px 10px 0 0;
                }
                .content {
                  background: #f9f9f9;
                  padding: 30px;
                  border-radius: 0 0 10px 10px;
                }
                .credentials {
                  background: white;
                  padding: 20px;
                  border-radius: 8px;
                  margin: 20px 0;
                  border-left: 4px solid #667eea;
                }
                .credential-item {
                  margin: 10px 0;
                }
                .credential-label {
                  font-weight: bold;
                  color: #667eea;
                }
                .credential-value {
                  font-family: 'Courier New', monospace;
                  background: #f0f0f0;
                  padding: 8px 12px;
                  border-radius: 4px;
                  display: inline-block;
                  margin-top: 5px;
                }
                .button {
                  display: inline-block;
                  padding: 15px 30px;
                  background: #667eea;
                  color: white;
                  text-decoration: none;
                  border-radius: 5px;
                  font-weight: bold;
                  margin: 20px 0;
                }
                .warning {
                  background: #fff3cd;
                  border: 1px solid #ffc107;
                  padding: 15px;
                  border-radius: 5px;
                  margin: 20px 0;
                }
                .footer {
                  text-align: center;
                  color: #666;
                  margin-top: 30px;
                  font-size: 14px;
                }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>Welkom bij Dagbesteding de Speciaalzaak</h1>
                </div>
                <div class="content">
                  <p>Beste <strong>${capitalizedUserName}</strong>,</p>
                  
                  <p>Er is een account voor je aangemaakt in de Dagbesteding app. Hieronder vind je jouw persoonlijke inloggegevens:</p>
                  
                  <div class="credentials">
                    <div class="credential-item">
                      <div class="credential-label">📧 Gebruikersnaam:</div>
                      <div class="credential-value">${userName}</div>
                    </div>
                    <div class="credential-item">
                      <div class="credential-label">🔒 Wachtwoord:</div>
                      <div class="credential-value">${after.password || '[Neem contact op met beheerder voor je wachtwoord]'}</div>
                    </div>
                  </div>
                  
                  <div class="warning">
                    <strong>⚠️ Belangrijk:</strong> Wijzig je wachtwoord direct na je eerste login via de instellingen in de app voor optimale beveiliging.
                  </div>
                  
                  <p style="text-align: center;">
                    <a href="https://dagbesteding.speciaalzaakvoorburg.nl" class="button">
                      🚀 Inloggen op Dagbesteding De Speciaalzaak
                    </a>
                  </p>
                  
                  <p><strong>Hoe werkt het?</strong></p>
                  <ol>
                    <li>Klik op de knop hierboven of ga naar: <a href="https://dagbesteding.speciaalzaakvoorburg.nl">dagbesteding.speciaalzaakvoorburg.nl</a></li>
                    <li>Log in met je gebruikersnaam en wachtwoord</li>
                    <li>Ga naar <strong>Instellingen</strong> en wijzig je wachtwoord</li>
                    <li>Klaar! Je kunt nu veilig gebruik maken van de app</li>
                  </ol>
                  
                  <p>Heb je vragen of lukt het inloggen niet? Neem dan contact op met het zorgteam.</p>
                  
                  <div class="footer">
                    <p>Met vriendelijke groet,<br><strong>Dagbesteding De Speciaalzaak</strong></p>
                    <p style="font-size: 12px; color: #999;">
                      Deze e-mail is automatisch gegenereerd. Reageer niet op dit bericht.
                    </p>
                  </div>
                </div>
              </div>
            </body>
            </html>
          `,
        };

        logger.info("📨 Email verzenden naar:", userEmail);
        await transporter.sendMail(message);
        logger.info("✅ Welkomstmail verstuurd naar:", userEmail);
      } else {
        logger.info("⏭️ Email niet gewijzigd, geen mail versturen");
      }

      return null;
    } catch (err) {
      logger.error("❌ Error bij welkomstmail:", err);
      logger.error("Error stack:", err.stack);
      return null;
    }
  }
);