const imaps = require('imap-simple');
const { simpleParser } = require('mailparser');
const nodemailer = require('nodemailer');

const config = {
    imap: {
        user: 'niraj',
        password: 'qugates123',
        host: '192.168.56.63',
        port: 143,
        tls: false,
    }
};

async function replyToEmail() {
    try {
        // Connect to the IMAP server
        const connection = await imaps.connect(config);

        // Open the INBOX folder (change 'Sent' to 'INBOX' if you want to fetch from Inbox)
        await connection.openBox('Sent');

        // Replace with the UID of the email you want to reply to
        const emailUID = 2;

        // Fetch the email using UID
        const searchCriteria = [['UID', 16]];
        const fetchOptions = {
            bodies: [''],
        };

        console.log("Fetching email...");

        const messages = await connection.search(searchCriteria, fetchOptions);

        if (messages.length === 0) {
            console.log('No emails found to reply to.');
            await connection.end();
            return;
        }

        const message = messages[0]; // Assuming we're replying to the first matched email

        // Combine header and text parts into a single string
        const emailContent = message.parts.map(part => part.body).join('\r\n');

        // Parse the email content
        const parsedEmail = await simpleParser(emailContent);

        // Print parsed email for debugging
        console.log('Parsed Email:', parsedEmail.subject);

        // Validate parsedEmail.from
        if (!parsedEmail.from || !parsedEmail.from.text || parsedEmail.from.text.length === 0) {
            throw new Error('Parsed email does not contain valid "from" address.');
        }

        // Setup SMTP transporter
        const transporter = nodemailer.createTransport({
            host: '192.168.56.63',
            port: 25,
            auth: {
                user: 'niraj@qugates.com',
                pass: 'qugates123'
            },
            tls: {
                rejectUnauthorized: false
            }
        });

        // Setup email reply options
        // Extract the existing "Re: " prefix from the original subject
const rePrefix = parsedEmail.subject.startsWith('Re: ') ? '' : 'Re: ';

// Setup email reply options
const replyMailOptions = {
    from: 'niraj@qugates.com',
    to: parsedEmail.from.text,
    subject: `${rePrefix}${parsedEmail.subject}`,
    text: 'Your reply message here...',
    html: '<p>Your reply message here...</p>',
    inReplyTo: parsedEmail.messageId,
    references: parsedEmail.messageId
};


        console.log("Sending reply...");

        // Send email
        const info = await transporter.sendMail(replyMailOptions);
        console.log('Reply sent: %s', info.messageId);

        // Append the sent email to the "Sent" folder
        const sentMail = `From: ${replyMailOptions.from}\r\nTo: ${replyMailOptions.to}\r\nSubject: ${replyMailOptions.subject}\r\n\r\n${replyMailOptions.text || replyMailOptions.html}`;
        await connection.append(sentMail, { mailbox: 'Sent', flags: ['Seen'] });
        console.log('Sent mail saved to Sent folder.');

        // Close the connection
        await connection.end();
    } catch (error) {
        console.error('Error:', error);
    }
}

// Call the function to reply to the email
replyToEmail();
