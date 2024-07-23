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
        const emailPromises = []; // Initialize the array to collect promises
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
                  email.subject = mail.subject ,
                  email.text = mail.text ,
                  email.from = mail.from,
                  email.to = mail.to,
                  email.date = mail.date ,
                  email.messageId = mail.messageId ,
                  email.inReplyTo = Array.isArray(mail.inReplyTo) ? mail.inReplyTo : [mail.inReplyTo]
                  email.references = Array.isArray(mail.references) ? mail.references : [mail.references]
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

// Example usage in an async function
const config = {
  user: 'shlok',
  password: '123456',
  host: '192.168.136.209',
  port: 143,
  tls: false,
};

// IIFE to call the async function and log the results
const fetchMails = async () => {
  try {
    const inbox = await fetchMailsFromFolder(config, 'INBOX');
    const sent = await fetchMailsFromFolder(config,"Sent")
    allMails = [...inbox,...sent]
    console.log(allMails)

  } catch (err) {
    console.error('Error fetching emails:', err);
  }
};

fetchMails();
