import { createTransport } from "nodemailer";
import EmailModel from "../models/EmailModel.js";

const defaultConfig = {
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: "noreply@kdscrm.com",
    pass: "wczvbmopwzwreesk",
  },
  from: '"Kushel Digi CRM" <noreply@kdscrm.com>',
};

export const mailSender = async (organizationId, to, subject, html) => {
  console.log(organizationId, "📩 At Email Sender");

  try {
    // Step 1: Try to get organization-specific email settings
    const config = await EmailModel.findOne({ organizationId });

    // Step 2: Use org config if exists, otherwise use defaultConfig
    const emailConfig = config
      ? {
          host: config.host,
          port: config.port,
          secure: config.secure,
          auth: {
            user: config.user,
            pass: config.pass,
          },
          from: config.from || defaultConfig.from,
          tls: { rejectUnauthorized: false },
        }
      : {
          ...defaultConfig,
          tls: { rejectUnauthorized: false },
        };

    if (!config) {
      console.warn(`⚠️ No email config found for org ${organizationId}. Using default config.`);
    }

    // Step 3: Create transporter
    const transporter = createTransport(emailConfig);

    // Step 4: Send email
    await transporter.sendMail({
      from: emailConfig.from,
      to,
      subject,
      html,
    });

    console.log(`✅ Email sent to ${to} using ${emailConfig.from}`);
  } catch (error) {
    console.error("❌ Email sending failed:", error.message);
  }
};
