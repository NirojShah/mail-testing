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
        const threadDetails = messages.map(message => {
            const subject = message.parts[0].body.subject[0];
            const from = message.parts[0].body.from[0];
            const text = message.parts[1] ? message.parts[1].body : ''; // Check if parts[1] exists
            const html = message.parts[2] ? message.parts[2].body : ''; // Check if parts[2] exists
            const date = message.attributes.date;

            return {
                uid: message.attributes.uid,
                subject: subject,
                from: from,
                text: text,
                html: html,
                date: date
            };
        });

        await connection.end();
        return threadDetails;
    } catch (error) {
        console.error('Error fetching thread details:', error);
        throw error;
    }
}


fetchThreadDetails(8).then(data =>{
    console.log(data)
})