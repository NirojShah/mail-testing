const nodemailer = require('nodemailer');
const imap = require('imap-simple');
const { simpleParser } = require('mailparser');

// SMTP and IMAP configurations
const smtpConfig = {
  host: '192.168.15.90',
  port: 25,
  secure: false, // true for 465, false for other ports
  auth: {
    user: 'niraj',
    pass: 'qugates123'
  },
  tls: {
    rejectUnauthorized: false
}
};

const imapConfig = {
  imap: {
    user: 'niraj',
    password: 'qugates123',
    host: '192.168.15.90',
    port: 143,
    tls: false,
    authTimeout: 3000
  }
};

async function replyToEmail() {
  try {
    // Step 1: Connect to IMAP and fetch the original email
    const connection = await imap.connect(imapConfig);
    await connection.openBox('INBOX');

    // Search for the email you want to reply to (customize criteria as needed)
    const searchCriteria = ['UNSEEN']; // Example criteria, customize as needed
    const fetchOptions = { bodies: ['HEADER', 'TEXT'], struct: true };

    const messages = await connection.search(searchCriteria, fetchOptions);
    
    if (messages.length === 0) {
      console.log('No emails found to reply to.');
      connection.end();
      return;
    }

    const message = messages[0]; // Assuming we're replying to the first matched email
    const all = await connection.getPartData(message, message.parts.find(part => part.which === 'HEADER'));
    const parsedEmail = await simpleParser(all);

    // Step 2: Send the reply email using Nodemailer
    const transporter = nodemailer.createTransport(smtpConfig);

    const replyMailOptions = {
      from: 'your_email@example.com',
      to: parsedEmail.from.value[0].address,
      subject: `Re: ${parsedEmail.subject}`,
      text: 'Your reply message here...',
      html: '<p>Your reply message here...</p>',
      headers: {
        'In-Reply-To': parsedEmail.messageId,
        'References': parsedEmail.messageId
      }
    };

    const info = await transporter.sendMail(replyMailOptions);
    console.log('Reply sent: %s', info.messageId);

    connection.end();
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the function to fetch the original email and send the reply
replyToEmail();
