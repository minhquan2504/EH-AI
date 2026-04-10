// services/mail.service.ts
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config(); 

export interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
}

export class MailService {
  private static transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST as string,
    port: Number(process.env.EMAIL_PORT),
    secure: false, 
    auth: {
      user: process.env.EMAIL_USER as string,
      pass: process.env.EMAIL_PASS as string,
    },
  });

  static async send(options: SendMailOptions): Promise<void> {
    try {
      const info = await this.transporter.sendMail({
        from: process.env.EMAIL_FROM as string, 
        to: options.to, 
        subject: options.subject,
        html: options.html,
      });
    } catch (error) {
      console.error('❌ Lỗi gửi email:', error);
    }
  }
}