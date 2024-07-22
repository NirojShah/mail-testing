const Imap = require('imap');
const { simpleParser } = require('mailparser');

const imapConfig = {
    user: 'shlok',
    password: '123456',
    host: '192.168.136.209',
    port: 143,      // Use 993 for SSL/TLS
    tls: false      // Set to true if using SSL/TLS
};

function openInbox(imap, cb) {
    imap.openBox('INBOX', false, cb);
}

function fetchAllEmails() {
    const imap = new Imap(imapConfig);

    imap.once('ready', function () {
        openInbox(imap, function (err, box) {
            if (err) {
                console.error('Error opening inbox:', err);
                imap.end();
                return;
            }

            imap.search(['ALL'], function (err, results) {
                if (err) {
                    console.error('Error during search:', err);
                    imap.end();
                    return;
                }

                if (results.length === 0) {
                    console.log('No messages found.');
                    imap.end();
                    return;
                }

                const f = imap.fetch(results, { bodies: '' });
                f.on('message', function (msg, seqno) {
                    console.log('Processing message #', seqno);
                    msg.on('body', function (stream) {
                        let rawEmail = '';
                        stream.on('data', function (chunk) {
                            rawEmail += chunk.toString('utf8');
                        });

                        stream.on('end', async function () {
                            try {
                                const parsed = await simpleParser(rawEmail);
                                const email = {
                                    id: parsed.messageId,
                                    from: parsed.from ? parsed.from.text : null,
                                    to: parsed.to ? parsed.to.text : null,
                                    subject: parsed.subject,
                                    date: parsed.date,
                                    body: parsed.text,
                                    html: parsed.html
                                };

                                // Log email details
                                console.log('Parsed email:', email);
                            } catch (parseErr) {
                                console.error('Error parsing email:', parseErr);
                            }
                        });
                    });
                });

                f.once('end', function () {
                    console.log('Finished fetching all messages.');
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

fetchAllEmails();
