const imaps = require('imap-simple');
const { simpleParser } = require('mailparser');
const _ = require("lodash")

const config = {
    imap: {
        user: 'niraj',
        password: 'qugates123',
        host: '192.168.56.63',
        port: 143,
        tls: false
        
    }
};

imaps.connect(config).then((connection) => {
    return connection.openBox('INBOX').then(() => {
        const searchCriteria = ['ALL'];
        const fetchOptions = {
            bodies: ['HEADER', 'TEXT',""],
            markSeen: true
        };

        return connection.search(searchCriteria, fetchOptions).then((messages) => {
            messages.forEach((item) => {
                
                console.log("-------------------------------->",item.parts[0],"\n-----------> ",item.attributes)
                const all = _.find(item.parts, { which: 'TEXT' });
                const id = item.attributes.uid;
                const idHeader = 'Imap-Id: ' + id + '\r\n';
                
                simpleParser(idHeader + all.body, (err, mail) => {
                    if (err) {
                        console.error('Error parsing email:', err);
                        return;
                    }
                });
            });
        });
    });
}).catch((err) => {
    console.error('Error connecting to IMAP server:', err);
});
