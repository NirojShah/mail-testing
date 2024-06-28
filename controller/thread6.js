const imaps = require("imap-simple");
const { simpleParser } = require("mailparser");

const config = {
    imap: {
        user: 'dev',
        password: 'test1234',
        host: '192.168.15.90',
        port: 143,
        tls: false,
    }
};

async function fetchThreadsForSubject(subject) {
    try {
        const connection = await imaps.connect(config);
        await connection.openBox('INBOX');

        const searchCriteria = [['HEADER', 'SUBJECT', subject]];
        const fetchOptions = {
            bodies: ['HEADER',"TEXT",""],
            markSeen: false
        };

        const messages = await connection.search(searchCriteria, fetchOptions);

        const referenceEmail = messages.find(message => message.parts[0].body.subject[0] === subject);
        if (!referenceEmail) {
            console.error('Reference email not found');
            return [];
        }

        console.log(referenceEmail)
        // console.log(messages)

        // const referenceParsed = await simpleParser(referenceEmail.parts[0].body);

        // Process each message to compare with the reference email
        const threads = messages.map(async (message) => {
            try {



                console.log(message.parts[0].body.from)
                console.log(message.parts[0].body.to)
                console.log(message.parts[0].body.cc || null)

                
                // const parsed = await simpleParser(message);

                // console.log(parsed)

                // const isFromSame = parsed.from.text === referenceParsed.from.text;
                // const isToSame = parsed.to.text === referenceParsed.to.text;
                // const isCcSame = parsed.cc.text === referenceParsed.cc.text;

                // if (isFromSame && isToSame && isCcSame) {
                //     return {
                //         uid: message.attributes.uid,
                //         from: parsed.from.text,
                //         to: parsed.to.text,
                //         cc: parsed.cc.text,
                //         date: parsed.date
                //     };
                // } else {
                //     return null;
                // }
            } catch (parseError) {
                console.error('Error parsing message:', parseError);
                return null; // Handle parse errors
            }
        });

        const resolvedThreads = await Promise.all(threads);
        const validThreads = resolvedThreads.filter(thread => thread !== null);

        await connection.end();
        return validThreads;
    } catch (error) {
        console.error('Error fetching threads:', error);
        throw error;
    }
}

// Example usage
fetchThreadsForSubject("Test aorl")
    .then(threads => {
        console.log('Threads matching "Test aorl":', threads);
    })
    .catch(err => {
        console.error('Error fetching threads:', err);
    });
