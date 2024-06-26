const imaps = require('imap-simple');
const { MailParser } = require('mailparser');
const _ = require('lodash');

const imapConfig = {
    imap: {
        user: 'dev',
        password: 'test1234',
        host: '192.168.15.90',
        port: 143, // Port for IMAP SSL, 143 for non-SSL
        tls: false,
    }
};

const fetchSentEmails = async () => {
    try {
        // Connect to the IMAP server
        const connection = await imaps.connect(imapConfig);

        // Open the Sent folder
        await connection.openBox('Sent');

        // Search for all emails in the Sent folder
        const searchCriteria = ['ALL'];
        const fetchOptions = {
            bodies: ['HEADER'],
            markSeen: false
        };

        const messages = await connection.search(searchCriteria, fetchOptions);

        // Process each email
        messages.forEach(async (item) => {
            const headerParts = _.find(item.parts, { "which": "HEADER" });
            if (headerParts && headerParts.body) {
                const headers = imaps.getParts(headerParts).join('\r\n'); // Convert to string

                console.log('Raw Headers:', headers); // Debug statement

                // Create a MailParser instance
                const mailparser = new MailParser();

                // Write headers to mailparser
                mailparser.write(headers);
                mailparser.end();

                // Get parsed email headers
                mailparser.on('headers', parsedHeaders => {
                    console.log('Parsed Email Headers:', parsedHeaders);
                });

                // Get parsed email content
                mailparser.on('end', parsedEmail => {
                    console.log('Parsed Email:', parsedEmail);
                });
            }
        });

        // Close the connection
        await connection.end();
    } catch (error) {
        console.error('Error fetching sent emails:', error);
    }
}

// Usage example
fetchSentEmails();
