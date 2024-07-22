const { ImapFlow } = require('imapflow');
const { simpleParser } = require('mailparser');

// Function to parse email
async function parseEmail(msg) {
    const parsed = await simpleParser(msg.source);
    return {
        id: parsed.messageId,
        inReplyTo: parsed.inReplyTo,
        references: parsed.references,
        from: parsed.from.text,
        to: parsed.to.text,
        subject: parsed.subject,
        date: parsed.date,
        body: parsed.text,
        html: parsed.html
    };
}

async function fetchEmails() {
    // Connect to the IMAP server
    const client = new ImapFlow({
        host: '192.168.136.209',
        port: 143, // Port for IMAP over SSL/TLS
        secure: false, // Use SSL/TLS
        auth: {
            user: 'shlok',
            pass: '123456'
        },
        tls: {
            rejectUnauthorized: false // Ignore self-signed certificate errors
        }
    });

    await client.connect();

    const folders = ['INBOX', 'Sent'];
    const threads = new Map();
    const emails = [];

    for (const folder of folders) {
        console.log(`Opening mailbox: ${folder}`);
        const mailbox = await client.selectMailbox(folder); // Use selectMailbox to open a mailbox
        console.log(`Mailbox '${folder}' selected.`);

        console.log(`Searching for emails in ${folder}`);
        const messages = client.fetch('*', { envelope: true, source: true });

        for await (const msg of messages) {
            const email = await parseEmail(msg);
            emails.push(email);

            if (email.inReplyTo) {
                const parentEmailId = email.inReplyTo;
                let thread = threads.get(parentEmailId);
                if (thread) {
                    thread.push(email);
                } else {
                    threads.set(parentEmailId, [email]);
                }
            } else {
                if (!threads.has(email.id)) {
                    threads.set(email.id, [email]);
                }
            }

            if (email.references) {
                email.references.forEach(ref => {
                    const thread = threads.get(ref);
                    if (thread) {
                        thread.push(email);
                    }
                });
            }
        }
    }

    await client.logout();

    // Display threads
    threads.forEach((thread, key) => {
        console.log(`\nThread starting with email ID: ${key}`);
        thread.forEach(email => {
            console.log(`- Subject: ${email.subject}`);
            console.log(`  From: ${email.from}`);
            console.log(`  To: ${email.to}`);
            console.log(`  Date: ${email.date}`);
            console.log(`  Body: ${email.body}\n`);
        });
    });
}

fetchEmails().catch(console.error);
