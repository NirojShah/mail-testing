const Imap = require('imap-simple');
const { inspect } = require('util');

// IMAP server configuration
const config = {
    imap: {
        user: 'niraj', // Your email address
        password: 'qugates123', // Your email password
        host: '192.168.15.90', // IMAP server hostname
        port: 143, // IMAP server port
        tls: false, // Use TLS if required by your server
        authTimeout: 30000, // Increase auth timeout if needed
        connTimeout: 30000 // Increase connection timeout if needed
    }
};

// Function to fetch sent emails
function fetchSentEmails() {
    Imap.connect(config).then((connection) => {
        return connection.openBox('Sent').then(() => {
            const searchCriteria = ['ALL']; // Fetch all sent emails
            const fetchOptions = {
                bodies: [''],
                markSeen: false // Do not mark emails as seen
            };

            return connection.search(searchCriteria, fetchOptions).then((messages) => {
                const fetchPromises = messages.map((message) => {
                 console.log(message)
                });

                return Promise.all(fetchPromises).then(() => {
                    console.log('Done fetching sent emails.');
                    connection.end();
                });
            });
        });
    }).catch((err) => {
        console.error('IMAP Error:', err);
    });
}

// Call function to fetch sent emails
fetchSentEmails();
