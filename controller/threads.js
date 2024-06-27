const imaps = require('imap-simple');
const { simpleParser } = require('mailparser');
const _ = require('lodash');

const config = {
    imap: {
        user: 'dev',
        password: 'test1234',
        host: '192.168.15.90',
        port: 143,
        tls: false,
    }
};

async function fetchEmailThreads() {
    try {
        // Connect to the IMAP server
        const connection = await imaps.connect(config);

        // Open the INBOX folder (change 'Sent' to 'INBOX' if you want to fetch from Inbox)
        await connection.openBox('Sent');

        // Fetch all emails
        const searchCriteria = ['ALL'];
        const fetchOptions = {
            bodies: ['HEADER'],
            struct: true,
            markSeen: true
        };

        console.log("Fetching emails...");

        const messages = await connection.search(searchCriteria, fetchOptions);

        // Group emails into threads based on Message-ID
        const threads = _.groupBy(messages, message => {
            // Ensure message and its parts exist before accessing properties
            if (message && message.parts && message.parts[0] && message.parts[0].body && message.parts[0].body['message-id']) {
                return message.parts[0].body['message-id'][0];
            }
            return null; // Return null if the property chain is invalid
        });

        // Output threads to console for debugging
        console.log("Threads:");
        console.log(threads);

        // Close the connection
        await connection.end();
    } catch (error) {
        console.error('Error:', error);
    }
}

// Call the function to fetch email threads
fetchEmailThreads();
