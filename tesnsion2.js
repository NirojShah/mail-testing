const Imap = require('imap');
const { simpleParser } = require('mailparser');

// Configuration for IMAP
const config = {
  user: 'shlok',
  password: '123456',
  host: '192.168.136.209',
  port: 143,
  tls: false,
};

/**
 * Creates an IMAP connection
 * @returns {Imap} - The IMAP connection
 */
function createImapConnection() {
  return new Imap({
    user: config.user,
    password: config.password,
    host: config.host,
    port: config.port,
    tls: config.tls,
  });
}

/**
 * Opens a mailbox and fetches all emails from it
 * @param {Imap} imap - The IMAP connection
 * @param {string} folder - The mailbox folder (e.g., 'INBOX', 'Sent')
 * @returns {Promise<Array>} - The array of fetched emails
 */
function fetchMailsFromFolder(imap, folder) {
  return new Promise((resolve, reject) => {
    imap.once('ready', () => {
      imap.openBox(folder, false, (err, box) => {
        if (err) return reject(err);

        const fetch = imap.seq.fetch(`${box.messages.total - 10}:*`, { bodies: ['HEADER.FIELDS (FROM TO SUBJECT DATE MESSAGE-ID IN-REPLY-TO)', 'TEXT'] });
        const emails = [];

        fetch.on('message', (msg, seqno) => {
          const email = { uid: seqno };

          msg.on('body', (stream, info) => {
            simpleParser(stream, (err, parsed) => {
              if (err) return reject(err);

              email.subject = parsed.subject;
              email.text = parsed.text;
              email.from = parsed.from.value;
              email.to = parsed.to.value;
              email.date = parsed.date;
              email.messageId = parsed.messageId;
              email.inReplyTo = parsed.inReplyTo;

              emails.push(email);
            });
          });
        });

        fetch.once('end', () => {
          resolve(emails);
        });

        fetch.once('error', (err) => {
          reject(err);
        });
      });
    });

    imap.once('error', (err) => {
      reject(err);
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
  const rootEmails = [];

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
      rootEmails.push(email);
    }
  });

  // Organize threads
  const resultThreads = [];

  rootEmails.forEach(rootEmail => {
    const thread = { threadId: rootEmail.messageId, emails: [rootEmail] };
    
    const stack = [rootEmail];
    const visited = new Set();

    while (stack.length > 0) {
      const currentEmail = stack.pop();
      const replies = threads[currentEmail.messageId];

      if (replies) {
        replies.forEach(reply => {
          if (!visited.has(reply.messageId)) {
            visited.add(reply.messageId);
            thread.emails.push(reply);
            stack.push(reply);
          }
        });
      }
    }

    resultThreads.push(thread);
  });

  return resultThreads;
}

// Example usage in an async function
const fetchMails = async () => {
  const imap = createImapConnection();

  try {
    const inbox = await fetchMailsFromFolder(imap, 'INBOX');
    const sent = await fetchMailsFromFolder(imap, 'Sent');
    const allMails = [...inbox, ...sent];
    console.log('Fetched emails:', allMails);

    const threads = createEmailThreads(allMails);
    console.log('Email threads:', threads);

  } catch (err) {
    console.error('Error fetching emails:', err);
  } finally {
    imap.end(); // Close the connection
  }
};

fetchMails();
