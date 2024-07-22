const Imap = require('imap');
const { simpleParser } = require('mailparser');

const imapConfig = {
    user: 'shlok',
    password: '123456',
    host: '192.168.136.209',
    port: 143,
    tls: false
};

const targetMessageId = '<c3b49749-9f9f-4e8c-b990-493924d26db7@example.com>';

function openInbox(cb) {
    imap.openBox('INBOX', true, cb);
}

function fetchEmailsAsThreads(messageId) {
    imap.once('ready', function () {
        openInbox(async function (err, box) {
            if (err) throw err;

            imap.search([['HEADER', 'MESSAGE-ID', messageId], ['HEADER', 'IN-REPLY-TO', messageId], ['HEADER', 'REFERENCES', messageId]], function (err, results) {
                if (err) {
                    console.error('Error during search:', err);
                    imap.end();
                    return;
                }

                if (!results || results.length === 0) {
                    console.log('No messages found for the given search criteria.');
                    imap.end();
                    return;
                }

                const f = imap.fetch(results, { bodies: '' });
                const emails = [];

                f.on('message', function (msg, seqno) {
                    msg.on('body', async function (stream, info) {
                        let rawEmail = '';
                        stream.on('data', function (chunk) {
                            rawEmail += chunk.toString('utf8');
                        });

                        stream.on('end', async function () {
                            // Log raw email for debugging
                            console.log('Raw email content:', rawEmail);

                            try {
                                const parsed = await simpleParser(stream);
                                const email = {
                                    id: parsed.messageId,
                                    inReplyTo: parsed.inReplyTo,
                                    references: parsed.references,
                                    from: parsed.from ? parsed.from.text : null,
                                    to: parsed.to ? parsed.to.text : null,
                                    subject: parsed.subject,
                                    date: parsed.date,
                                    body: parsed.text
                                };

                                // Log details for debugging
                                console.log('Parsed email:', email);

                                emails.push(email);
                            } catch (parseErr) {
                                console.error('Error parsing email:', parseErr);
                            }
                        });
                    });
                });

                f.once('end', function () {
                    const threadedEmails = threadEmails(emails);
                    console.log(JSON.stringify(threadedEmails, null, 2));
                    imap.end();
                });

                f.once('error', function (fetchErr) {
                    console.error('Error fetching emails:', fetchErr);
                });
            });
        });
    });

    imap.once('error', function (err) {
        console.error('Connection error:', err);
    });

    imap.once('end', function () {
        console.log('Connection ended');
    });

    imap.connect();
}

function threadEmails(emails) {
    const threads = {};

    emails.forEach(email => {
        if (email.id) {
            threads[email.id] = { email: email, replies: [] };
        }

        if (email.inReplyTo) {
            const parentId = email.inReplyTo;
            if (!threads[parentId]) {
                threads[parentId] = { email: null, replies: [] };
            }
            threads[parentId].replies.push(email);
        }
    });

    const rootEmails = Object.values(threads).filter(thread => thread.email && !thread.email.inReplyTo);

    return rootEmails.map(thread => buildThread(thread, threads));
}

function buildThread(thread, allThreads) {
    const { email, replies } = thread;
    const structuredThread = {
        email: email,
        replies: replies.map(reply => buildThread(allThreads[reply.id], allThreads))
    };
    return structuredThread;
}

const imap = new Imap(imapConfig);

fetchEmailsAsThreads(targetMessageId);
