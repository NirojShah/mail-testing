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

// Function to fetch all emails
async function fetchAllEmails() {
    try {
        const connection = await imaps.connect(config);
        await connection.openBox('INBOX');

        const searchCriteria = ['ALL'];
        const fetchOptions = {
            bodies: ['HEADER'],
            markSeen: false
        };

        const messages = await connection.search(searchCriteria, fetchOptions);

        // Process messages and extract required data (like subject, from, etc.)
        const emailList = messages.map(message => ({
            uid: message.attributes.uid,
            subject: message.parts[0].body.subject[0],
            from: message.parts[0].body.from[0],
            date: message.attributes.date
        }));

        await connection.end();
        return emailList;
    } catch (error) {
        console.error('Error fetching emails:', error);
        throw error;
    }
}

// Function to fetch thread details for a specific subject or UID
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
        const threadDetails = messages.map(message => ({
            subject: message.parts[0].body.subject[0],
            from: message.parts[0].body.from[0],
            text: message.parts[1].body,
            html: message.parts[2].body,
            date: message.attributes.date
        }));

        await connection.end();
        return threadDetails;
    } catch (error) {
        console.error('Error fetching thread details:', error);
        throw error;
    }
}

let data = fetchAllEmails().then(data =>{
    console.log(data)
}).catch(err => {
    console.log(err)
})

// module.exports = { fetchAllEmails, fetchThreadDetails };
