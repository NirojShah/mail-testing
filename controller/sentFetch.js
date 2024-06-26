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
        messages.forEach(async (item,key) => {
           console.log(key)
        });

        // Close the connection
        await connection.end();
    } catch (error) {
        console.error('Error fetching sent emails:', error);
    }
}

// Usage example
fetchSentEmails();
