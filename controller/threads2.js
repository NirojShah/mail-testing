const imaps = require('imap-simple');

const config = {
    imap: {
        user: 'dev',
        password: 'test1234',
        host: '192.168.15.90',
        port: 143,
        tls: false,
    }
};

async function fetchAllEmails() {
    try {
        // Connect to the IMAP server
        const connection = await imaps.connect(config);

        // Open the INBOX folder (or any other folder you want to fetch emails from)
        await connection.openBox('INBOX');

        // Fetch all emails
        const searchCriteria = ['ALL'];
        const fetchOptions = {
            bodies: ['HEADER', 'TEXT'],
            markSeen: false
        };

        console.log("Fetching all emails...");

        const messages = await connection.search(searchCriteria, fetchOptions);

        if (messages.length === 0) {
            console.log('No emails found.');
            await connection.end();
            return;
        }

        // Log or process each email individually
        messages.forEach((message, index) => {
            console.log(`Email ${index + 1}:`);
            console.log('Subject:', message.parts.find(part => part.which === 'HEADER').body.subject[0]);
            console.log('From:', message.parts.find(part => part.which === 'HEADER').body.from[0]);
            console.log('Date:', message.attributes.date);
            console.log('---');
        });

        // Close the connection
        await connection.end();
    } catch (error) {
        console.error('Error:', error);
    }
}

// Call the function to fetch and display all emails
fetchAllEmails();
