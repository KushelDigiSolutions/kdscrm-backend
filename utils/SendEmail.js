import { createTransport } from "nodemailer";

export const SendEmail = async (to, subject, text, html) => {
  // console.log(to, subject, text, html);
  const transporter = createTransport({
    host: "smtpout.secureserver.net",
    port: 465,
    secure: true, 
    auth: {
      user: "info@kusheldigi.com",
      pass: "Infokusheldigi@3030"
    },
    from: "info@kusheldigi.com",
    tls: {
      rejectUnauthorized: false,
    },
  });
  await transporter.sendMail({
    from: '"Kushel Digi Solutions" <info@kusheldigi.com>',
    to,
    subject,
    text,
    html,
  });
};

 // auth: {
    //   user: "webmaster.kushel@gmail.com",
    //    pass:"fypnipkjntklyznj"
    // },
