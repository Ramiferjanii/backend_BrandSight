const nodemailer = require('nodemailer');
const twilio = require('twilio');
require('dotenv').config();

/**
 * Sends an email with scraping results.
 */
async function sendEmailNotification(to, subject, data) {
    try {
        const transporter = nodemailer.createTransport({
            service: process.env.EMAIL_SERVICE || 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const htmlContent = `
            <h2>Scraping Result</h2>
            <p><strong>Product:</strong> ${data.name}</p>
            <p><strong>Price:</strong> ${data.price}</p>
            <p><strong>Reference:</strong> ${data.reference}</p>
            <p><strong>Domain:</strong> ${data.domain}</p>
            <p><a href="${data.url}">View Product</a></p>
        `;

        const info = await transporter.sendMail({
            from: `"BrandSight Scraper" <${process.env.EMAIL_USER}>`,
            to: to,
            subject: subject,
            html: htmlContent
        });

        console.log('Email sent: %s', info.messageId);
        return info;
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
}

/**
 * Sends a WhatsApp message using Twilio.
 */
async function sendWhatsAppNotification(to, data) {
    try {
        const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

        const message = await client.messages.create({
            body: `*Scraping Result*\n\n*Product:* ${data.name}\n*Price:* ${data.price}\n*Ref:* ${data.reference}\n*Link:* ${data.url}`,
            from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
            to: `whatsapp:${to}`
        });

        console.log('WhatsApp message sent: %s', message.sid);
        return message;
    } catch (error) {
        console.error('Error sending WhatsApp:', error);
        throw error;
    }
}

module.exports = {
    sendEmailNotification,
    sendWhatsAppNotification
};
