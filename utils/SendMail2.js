import { createTransport } from "nodemailer";
import EmailModel from "../models/EmailModel.js";

export const mailSender = async (
    organizationId,
    to,
    subject,
    html,
) => {
    console.log(organizationId, "At Emai Seneder")
    try {
        const config = await EmailModel.findOne({ organizationId })
        // ✅ Step 1: Check if org-specific config exists
        console.log(config, to)
        // 🛑 If no config found, skip sending mail
        if (!config) {
            console.warn(`⚠️ No email config found for org ${organizationId}, email not sent.`);
            return;
        }


        const transporter = createTransport({
            host: config.host,
            port: config.port,
            secure: config.secure,
            auth: {
                user: config.user,
                pass: config.pass,
            },
            from: config.from,
            tls: {
                rejectUnauthorized: false,
            },
        });

        // ✅ Send the email
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
