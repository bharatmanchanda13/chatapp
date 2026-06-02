import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
    private readonly transporter: nodemailer.Transporter;

    constructor(private readonly configService: ConfigService) {
        this.transporter = nodemailer.createTransport({
            host: this.configService.get<string>('BREVO_SMTP_HOST'),
            port: this.configService.get<number>('BREVO_SMTP_PORT'),
            secure: false,
            auth: {
                user: this.configService.get<string>('BREVO_SMTP_USER'),
                pass: this.configService.get<string>('BREVO_SMTP_PASSWORD'),
            },
        });
    }

    async sendEmail(
        to: string,
        subject: string,
        html: string,
    ): Promise<void> {
        try {
            await this.transporter.sendMail({
                from: this.configService.get<string>('MAIL_FROM'),
                to,
                subject,
                html
            });
        } catch (error) {
            throw new InternalServerErrorException('Failed to send email');
        }
    }
}