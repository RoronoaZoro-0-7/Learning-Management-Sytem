import nodemailer, { Transporter } from "nodemailer";
import ejs from "ejs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

interface EmailOptions {
  email: string;
  subject: string;
  template: string;
  data: { [key: string]: any };
}

const sendMail = async (options: EmailOptions): Promise<void> => {
  const transporter: Transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT as string || "587"),
    service: process.env.SMTP_SERVICE,
    auth: {
      user: process.env.SMTP_MAIL,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  const { email, subject, template, data } = options;
  console.log(email, subject, template, data);

  // get the path to the email template file
  const __dirname = "D:/Projects/Learning Management System/backend/mails";
  const templatePath = path.join(__dirname, template);
  console.log("Rendering email from:", templatePath);

  let html: string;
  try {
    if (template === "order-confirmation.ejs") {
      html = await ejs.renderFile(templatePath, { order: data });
    } else {
      html = await ejs.renderFile(templatePath, data);
    }
  } catch (err) {
    console.error("❌ Error rendering EJS email template:", err);
    throw new Error("Email template rendering failed");
  }

  const mailOptions = {
    from: process.env.SMTP_MAIL,
    to: email,
    subject,
    html,
  };

  await transporter.sendMail(mailOptions);
};

export default sendMail;