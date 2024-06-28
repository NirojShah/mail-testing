const imaps = require('imap-simple');
const { simpleParser } = require('mailparser');

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
        const groupedEmails = messages.reduce((acc, message) => {
            const header = message.parts.find(part => part.which === 'HEADER').body;
            const subject = header.subject[0];
            if (!acc[subject]) {
                acc[subject] = [];
            }
            acc[subject].push({
                uid: message.attributes.uid,
                from: header.from[0],
                date: message.attributes.date
            });
            return acc;
        }, {});

        await connection.end();
        return groupedEmails;
    } catch (error) {
        console.error('Error fetching emails:', error);
        throw error;
    }
}

// Function to fetch thread details for a specific UID
async function fetchThreadDetails(uid) {
    try {
        const connection = await imaps.connect(config);
        await connection.openBox('INBOX');

        const searchCriteria = [['UID', uid]];
        const fetchOptions = {
            bodies: ['HEADER', 'TEXT'],
            markSeen: true
        };

        const messages = await connection.search(searchCriteria, fetchOptions);

        // Process messages and extract required data (like subject, from, text, html, etc.)
        const threadDetails = await Promise.all(messages.map(async message => {
            const headerPart = message.parts.find(part => part.which === 'HEADER');
            const textPart = message.parts.find(part => part.which === 'TEXT');

            if (!headerPart || !textPart) {
                throw new Error('Missing header or text part in the message.');
            }

            const header = headerPart.body;
            const parsedEmail = await simpleParser(textPart.body);

            return {
                uid: message.attributes.uid,
                subject: header.subject[0],
                from: header.from[0],
                text: parsedEmail.text,
                html: parsedEmail.html,
                date: message.attributes.date
            };
        }));

        await connection.end();
        return threadDetails;
    } catch (error) {
        console.error('Error fetching thread details:', error);
        throw error;
    }
}

// Example Usage
fetchAllEmailsGroupedBySubject().then((data) => {
    console.log(data);
});

fetchThreadDetails(8).then((data) => {
    console.log(data);
});

// module.exports = { fetchAllEmailsGroupedBySubject, fetchThreadDetails };
