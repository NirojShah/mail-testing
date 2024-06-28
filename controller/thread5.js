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

// Function to fetch all emails and group by subject
async function fetchAllEmailsGroupedBySubject() {
    try {
        const connection = await imaps.connect(config);
        await connection.openBox('INBOX');

        const searchCriteria = ['ALL'];
        const fetchOptions = {
            bodies: ['HEADER'],
            markSeen: false
        };

        const messages = await connection.search(searchCriteria, fetchOptions);

        // Group emails by subject
        const groupedEmails = {};
        messages.forEach(message => {
            const subject = message.parts[0].body.subject[0];
            const from = message.parts[0].body.from[0];
            const date = message.attributes.date;
            const uid = message.attributes.uid;

            if (!groupedEmails[subject]) {
                groupedEmails[subject] = [];
            }

            // Check if the email with the same subject and sender already exists
            const exists = groupedEmails[subject].some(email => email.from === from && email.date === date);
            if (!exists) {
                groupedEmails[subject].push({
                    uid,
                    from,
                    date
                });
            }
        });

        await connection.end();
        return groupedEmails;
    } catch (error) {
        console.error('Error fetching emails:', error);
        throw error;
    }
}

// Example usage
fetchAllEmailsGroupedBySubject().then(groupedEmails => {
    console.log(groupedEmails);
}).catch(error => {
    console.error('Error:', error);
});
