const nodemailer = require('nodemailer');
const ejs = require('ejs');
const path = require('path');
const webConfig = require('../config/web-config');

async function sendEmail(email, subject, htmlType, data) {
    try {
        // Configurar o transporter do nodemailer
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: true,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });

        // Carregar o template apropriado
        const templatePath = path.join(__dirname, '..', 'views', 'templates', `${htmlType}.ejs`);
        const html = await ejs.renderFile(templatePath, { ...data, webConfig });

        // Enviar o email
        await transporter.sendMail({
            from: `"SDK Apps" <${process.env.SMTP_USER}>`,
            to: email,
            subject: subject,
            html: html
        });

        return true;
    } catch (error) {
        console.error('Erro ao enviar email:', error);
        return false;
    }
}

module.exports = sendEmail;
