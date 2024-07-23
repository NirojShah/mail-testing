const Imap = require('imap');
const { simpleParser } = require('mailparser');

/**
 * Fetches emails from a specified folder and returns them.
 * @param {Object} config - The IMAP configuration object.
 * @param {string} folder - The folder to fetch emails from.
 * @returns {Promise<Array>} - A promise that resolves to an array of email objects.
 */
async function fetchMailsFromFolder(config, folder) {
  return new Promise((resolve, reject) => {
    const imap = new Imap(config);

    function openInbox(cb) {
      imap.openBox(folder, true, cb);
    }

    imap.once('ready', function () {
      openInbox(function (err, box) {
        if (err) {
          reject(err);
          return;
        }

        const messages = [];
        const emailPromises = [];
        const fetchOptions = {
          bodies: '',
          struct: true,
        };

        const f = imap.seq.fetch('1:*', fetchOptions);

        f.on('message', function (msg, seqno) {
          let email = {};

          const emailPromise = new Promise((resolve, reject) => {
            msg.on('body', function (stream, info) {
              let bodyBuffer = '';
              stream.on('data', function (chunk) {
                bodyBuffer += chunk.toString('utf8');
              });

              stream.once('end', function () {
                simpleParser(bodyBuffer, (err, mail) => {
                  if (err) {
                    reject(err);
                    return;
                  }

                  // Extract required fields with default values
                  email.subject = mail.subject || '';
                  email.text = mail.text || '';
                  email.from = mail.from ? mail.from.value : [];
                  email.to = mail.to ? mail.to.value : [];
                  email.date = mail.date || '';
                  email.messageId = mail.messageId || '';
                  email.inReplyTo = mail.inReplyTo || '';

                  resolve();
                });
              });
            });

            msg.once('attributes', function (attrs) {
              email.uid = attrs.uid;
            });

            msg.once('end', function () {
              messages.push(email);
            });
          });

          emailPromises.push(emailPromise);
        });

        f.once('error', function (err) {
          console.log('Fetch error: ' + err);
          reject(err);
        });

        f.once('end', async function () {
          console.log('Done fetching all messages!');
          try {
            await Promise.all(emailPromises);
            resolve(messages);
          } catch (err) {
            reject(err);
          }
          imap.end();
        });
      });
    });

    imap.once('error', function (err) {
      console.log(err);
      reject(err);
    });

    imap.once('end', function () {
      console.log('Connection ended');
    });

    imap.connect();
  });
}

/**
 * Creates threads from an array of emails based on the 'In-Reply-To' header.
 * @param {Array} emails - The array of email objects.
 * @returns {Array} - An array of thread objects.
 */
function createEmailThreads(emails) {
  const emailMap = {};
  const threads = {};

  // Create a map of emailId to email object
  emails.forEach(email => {
    emailMap[email.messageId] = email;
  });

  // Group emails by In-Reply-To header
  emails.forEach(email => {
    const inReplyTo = email.inReplyTo;
    if (inReplyTo) {
      if (!threads[inReplyTo]) {
        threads[inReplyTo] = [];
      }
      threads[inReplyTo].push(email);
    } else {
      if (!threads['root']) {
        threads['root'] = [];
      }
      threads['root'].push(email);
    }
  });

  // Organize threads
  const resultThreads = [];

  Object.keys(threads).forEach(key => {
    const emails = threads[key];
    const thread = { threadId: key, emails: [] };

    emails.forEach(email => {
      thread.emails.push(email);

      // Check if the email has any replies
      const replies = threads[email.messageId];
      if (replies) {
        replies.forEach(reply => thread.emails.push(reply));
      }
    });

    resultThreads.push(thread);
  });

  return resultThreads;
}

// Example usage in an async function
const config = {
  user: 'shlok',
  password: '123456',
  host: '192.168.136.209',
  port: 143,
  tls: false,
};

const fetchMails = async () => {
  try {
    const inbox = await fetchMailsFromFolder(config, 'INBOX');
    const sent = await fetchMailsFromFolder(config, 'Sent');
    const allMails = [...inbox, ...sent];
    console.log('Fetched emails:', allMails);

    const threads = createEmailThreads(allMails);
    console.log('Email threads:', threads);

  } catch (err) {
    console.error('Error fetching emails:', err);
  }
};

fetchMails();
