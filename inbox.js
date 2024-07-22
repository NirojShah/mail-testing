const Imap = require('imap');
const { simpleParser } = require('mailparser');

const imapConfig = {
  user: 'niraj',
  password: 'niraj@123',
  host: '192.168.135.63',
  port: 143,
  tls: false
};

const fetchEmails = () => {
  return new Promise((resolve, reject) => {
    const imap = new Imap(imapConfig);

    imap.once('ready', () => {
      imap.openBox('INBOX', true, (err, box) => {
        if (err) {
          reject(err);
          return;
        }

        imap.search(['ALL'], (err, results) => {
          if (err) {
            reject(err);
            return;
          }

          const fetch = imap.fetch(results, { bodies: '' });

          const emails = [];

          fetch.on('message', (msg, seqno) => {
            const email = { seqno };

            msg.on('body', (stream, info) => {
              simpleParser(stream, (err, parsed) => {
                if (err) {
                  console.error('Error parsing email:', err);
                  return;
                }

                email.subject = parsed.subject;
                email.from = parsed.from.text;
                email.date = parsed.date;
                email.messageId = parsed.messageId;
                email.inReplyTo = parsed.inReplyTo;
                email.references = parsed.references || [];

                emails.push(email);
              });
            });
          });

          fetch.on('end', () => {
            imap.end();
            resolve(emails);
          });

          fetch.on('error', err => {
            reject(err);
          });
        });
      });
    });

    imap.once('error', err => {
      reject(err);
    });

    imap.connect();
  });
};

const organizeThreads = (emails) => {
  const threads = {};
  const standaloneEmails = [];

  emails.forEach(email => {
    if (email.inReplyTo) {
      const threadId = email.inReplyTo;
      if (!threads[threadId]) {
        threads[threadId] = [];
      }
      threads[threadId].push(email);
    } else {
      standaloneEmails.push(email);
    }
  });

  return { threads, standaloneEmails };
};

const displayEmails = async () => {
  try {
    const emails = await fetchEmails();
    const { threads, standaloneEmails } = organizeThreads(emails);

    console.log('Standalone Emails:');
    standaloneEmails.forEach(email => {
      console.log(`- ${email.subject} (from: ${email.from}, date: ${email.date})`);
    });

    console.log('\nEmail Threads:');
    Object.keys(threads).forEach(threadId => {
      console.log(`Thread: ${threadId}`);
      threads[threadId].forEach(email => {
        console.log(`  - ${email.subject} (from: ${email.from}, date: ${email.date})`);
      });
    });
  } catch (error) {
    console.error('Error fetching emails:', error);
  }
};

displayEmails();
