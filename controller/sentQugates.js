const imaps = require('imap-simple');

// IMAP configuration
const imapConfig = {
    imap: {
        user: 'dev',
        password: 'test1234',
        host: '192.168.15.90',
        port: 143, // Port for IMAP SSL, 143 for non-SSL
        tls: false,
    }
};

// Function to fetch emails from the SENTQUGATES folder
async function fetchEmailsFromSent() {
    try {
        const connection = await imaps.connect(imapConfig);

        // Open the SENTQUGATES folder
        await connection.openBox('SENTQUGATES');

        // Search for all emails in the SENTQUGATES folder
        const searchCriteria = ['ALL'];
        const fetchOptions = {
            bodies: ['HEADER', 'TEXT'],
            markSeen: false
        };

        const messages = await connection.search(searchCriteria, fetchOptions);

        // Process the messages
        messages.forEach(item => {
            console.log(item)
        });

        // Close the connection
        await connection.end();
    } catch (error) {
        console.error('Error fetching emails:', error);
    }
}

// Usage example
fetchEmailsFromSent();
