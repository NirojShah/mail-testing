const imaps = require('imap-simple');
const _ = require('lodash');

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

// Function to fetch an email by Message-ID from the SENTQUGATES folder
async function fetchEmailByMessageId(messageId) {
    try {
        const connection = await imaps.connect(imapConfig);

        // Open the SENTQUGATES folder
        await connection.openBox('SENTQUGATES');

        // Search for the email by Message-ID
        const searchCriteria = [['HEADER', 'MESSAGE-ID', messageId]];
        const fetchOptions = {
            bodies: ['HEADER', 'TEXT', ''],
            markSeen: false
        };

        const messages = await connection.search(searchCriteria, fetchOptions);

        if (messages.length === 0) {
            console.log('No email found with the given Message-ID');
        } else {
            messages.forEach(item => {
                console.log(item)
            });
        }

        // Close the connection
        await connection.end();
    } catch (error) {
        console.error('Error fetching email by Message-ID:', error);
    }
}

// Usage example
fetchEmailByMessageId('<ykzfvodbr@qugates.com>');
