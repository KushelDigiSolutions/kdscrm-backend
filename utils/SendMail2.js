
import { createTransport } from "nodemailer";

export const mailSender = async (email, subject, html) => {
    const transporter = createTransport({
        host: "smtpout.secureserver.net",
        port: 465,
        secure: true,
        auth: {
            user: "info@kusheldigi.com",
            pass: "Infokushel@12345"
        },
        from: "info@kusheldigi.com",
        tls: {
            rejectUnauthorized: false,
        },
    });

    await transporter.sendMail({
        from: 'Kushel Digi Solutions" <info@kusheldigi.com>',
        to: `${email}`,
        subject: subject,
        html: `${html}`
    });
};


