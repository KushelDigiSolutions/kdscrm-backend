// import { createTransport } from "nodemailer";

// export const SendEmail = async (to, subject, text, html) => {
//   // console.log(to, subject, text, html);
//   const transporter = createTransport({
//     host: "smtpout.secureserver.net",
//     port: 465,
//     secure: true,
//     auth: {
//       user: "info@kusheldigi.com",
//       pass: "Infokushel@12345"
//     },
//     from: "info@kusheldigi.com",
//     tls: {
//       rejectUnauthorized: false,
//     },
//   });
//   await transporter.sendMail({
//     from: '"Kushel Digi Solutions" <info@kusheldigi.com>',
//     to,
//     subject,
//     text,
//     html,
//   });
// };

// auth: {
//   user: "webmaster.kushel@gmail.com",
//    pass:"fypnipkjntklyznj"
// },

import EmailModel from "../models/EmailModel.js";
import { createTransport } from "nodemailer";

const defaultConfig = {
  host: "smtpout.secureserver.net",
  port: 465,
  secure: true,
  auth: {
    user: "info@kusheldigi.com",
    pass: "KRC@infokds",
  },
  from: '"Kushel Digi Solutions" <info@kusheldigi.com>',
};

/**
 * Send an email using organization-specific or default SMTP config.
 *
 * @param {String} organizationId - The organization ID to fetch email config
 * @param {String} to - Recipient email
 * @param {String} subject - Subject of the email
 * @param {String} html - HTML content of the email
 */
export const SendEmail = async (organizationId, to, subject, html) => {
  console.log(organizationId, "At Email Sender");

  let config = defaultConfig;

  try {
    const configFromDB = await EmailModel.findOne({ organizationId });

    if (
      configFromDB &&
      configFromDB.auth?.user &&
      configFromDB.auth?.pass
    ) {
      config = {
        host: configFromDB.host,
        port: configFromDB.port,
        secure: configFromDB.secure,
        auth: {
          user: configFromDB.auth.user,
          pass: configFromDB.auth.pass,
        },
        from: configFromDB.from,
      };
    }

    console.log("Using Config:", config);
    console.log("Sending to:", to);

    if (!config || !config.auth?.user || !config.auth?.pass) {
      console.warn(`⚠️ No valid email config for org ${organizationId}. Email not sent.`);
      return;
    }

    const transporter = createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.auth.user,
        pass: config.auth.pass,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    await transporter.sendMail({
      from: config.from,
      to,
      subject,
      html,
    });

    console.log(`✅ Email sent to ${to} using ${config.from}`);
  } catch (error) {
    console.error("❌ Email sending failed:", error.message);
  }
};