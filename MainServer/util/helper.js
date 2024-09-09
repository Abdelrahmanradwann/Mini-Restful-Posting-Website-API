const nodemailer = require('nodemailer');



const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL,  
        pass: process.env.APP_PASSWORD,   
    },
});


async function sendHtmlEmail(toEmail, subject, htmlContent) {
    try {
        const mailOptions = {
            from: process.env.EMAIL,  
            to: toEmail,                                 
            subject: subject,                            
            html: htmlContent,                          
        };

        // Send the email
        let info = await transporter.sendMail(mailOptions);

        console.log('Email sent: %s', info.messageId);
    } catch (error) {
        console.error('Error sending email:', error);
    }
}

module.exports = {
    sendHtmlEmail
}

