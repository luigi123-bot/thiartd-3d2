import nodemailer, { type Transporter, type SentMessageInfo } from "nodemailer";

export async function enviarEmailConfirmacionNodemailer({
  to,
  subject,
  html
}: {
  to: string;
  subject: string;
  html: string;
}) {
  // Configura el transporter con tus credenciales de Gmail
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  const transporter: Transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS
    }
  });

  const mailOptions = {
    from: `Thiartd 3D <${process.env.GMAIL_USER}>`,
    to,
    subject,
    html
  };

  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const info: SentMessageInfo = await transporter.sendMail(mailOptions);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (typeof info.response === "string") {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      console.log("📧 Email enviado:", info.response);
    } else {
      console.log("📧 Email enviado:", info);
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return info;
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("❌ Error enviando email:", error.message);
      throw new Error(error.message);
    } else {
      console.error("❌ Error enviando email desconocido:", error);
      throw error;
    }
  }
}
