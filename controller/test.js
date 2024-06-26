const nodemailer = require('nodemailer');
const imaps = require('imap-simple');  // Assuming you are using imap-simple for IMAP operations



const config = {
    imap: {
        user: 'dev',
        password: 'test1234',
        host: '192.168.15.90',
        port: 143, // Port for IMAP SSL, 143 for non-SSL
        tls: false,
    }
};



async function sendAndStoreMail(to, subject, text, html) {
    // Nodemailer transporter setup
    let transporter = nodemailer.createTransport({
        host: '192.168.15.90',  // Change to your SMTP server host
        port: 25,  // Change to your SMTP server port
        auth: {
            user: 'dev@qugates.com',  // Your email address
            pass: 'test1234'  // Your email password
        },
        tls: {
            rejectUnauthorized: false
        }
    });

    // Setup email data
    let mailOptions = {
        from: '"dev" <dev@qugates.com>',  // Sender address
        to: to,  // List of receivers
        subject: subject,  // Subject line
        text: text,  // Plain text body
        html: html  // HTML body (optional)
    };

    try {
        // Send the email
        let info = await transporter.sendMail(mailOptions);
        console.log('Message sent: %s', info.messageId);
        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));

        // Store messageId in sent emails
        let sentEmail = {
            messageId: info.messageId,
            from: mailOptions.from,
            to: mailOptions.to,
            subject: mailOptions.subject,
            text: mailOptions.text,
            html: mailOptions.html
        };

        // Create raw email content
        let rawEmail = `From: ${mailOptions.from}\r\nTo: ${mailOptions.to}\r\nSubject: ${mailOptions.subject}\r\n\r\n${mailOptions.text || mailOptions.html}`;

        // Connect to the IMAP server
        const connection = await imaps.connect(config);  // Make sure 'config' is defined with IMAP server details

        // Open the Sent folder
        await connection.openBox('Sent');

        // Append the email to the Sent folder
        await connection.append(rawEmail, { mailbox: 'Sent', flags: ['Seen'] });

        // Close the connection
        await connection.end();
        console.log('Email appended to Sent folder');

        // Optionally, you can save the sent email details to a database or log them
        console.log('Stored sent email:', sentEmail);

    } catch (error) {
        console.error('Error:', error);
    }
}


sendAndStoreMail(
    'niraj@qugates.com',
    'Test Subject',
    'This is a plain text body of the email.',
    '<p>This is an <b>HTML</b> body of the email.</p>'
);

