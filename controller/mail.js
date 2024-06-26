const imaps = require('imap-simple');
const { simpleParser } = require('mailparser');
const _ = require("lodash")
const nodemailer = require("nodemailer")



const config = {
    imap: {
        user: 'dev',
        password: 'test1234',
        host: '192.168.15.90',
        port: 143, // Port for IMAP SSL, 143 for non-SSL
        tls: false,
    }
};

const fetchInbox = async()=>{

    console.log("hell")

// Connect to the IMAP server
imaps.connect(config).then((connection) => {
    // Open the INBOX folder
    return connection.openBox('Sent').then(() => {
        // Search for unseen emails
        const searchCriteria = ['ALL'];
        const fetchOptions = {
            bodies: ['HEADER', 'TEXT'],
            markSeen: true
        };

        return connection.search(searchCriteria, fetchOptions).then((messages) => {
            // console.log(messages)
            // messages.forEach((item) => {
            //     console.log(item.parts[0].body.to)
            //     console.log(item.parts[0].body.from)
            //     console.log(item.parts[0].body.subject)
            //     console.log(item.parts[1].body)
            // });

            console.log(messages[0].parts[0].body.to)

            connection.end();
        });
    });
}).catch((err) => {
    console.error('Error:', err);
});
}

// fetchInbox()


async function sendMail(to, subject, text, html) {
    let transporter = nodemailer.createTransport({
        host: '192.168.15.90',  // Change to your SMTP server host
        port: 25,  // Change to your SMTP server port
        auth: {
            user: 'dev@qugates.com',  // Your email address
            pass: 'test1234'  // Your email password
        },
        tls:{
            rejectUnauthorized : false
        }
    });

    // Setup email data
    let mailOptions = {
        from: '"dev" <dev@qugates.com>',  // Sender address
        to: to,  // List of receivers
        subject: subject,  // Subject line
        text: text,  // Plain text body
        html: html  // HTML body (optional)
    };

    // Send email with defined transport object
    try {
        let info = await transporter.sendMail(mailOptions);
        console.log('Message sent: %s', info.messageId);
        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    } catch (error) {
        console.error('Error sending email:', error);
    }
}

// Usage example
// sendMail(
//     'niraj@qugates.com',
//     'Test Subject',
//     'This is a plain text body of the email.',
//     '<p>This is an <b>HTML</b> body of the email.</p>'
// );




// Nodemailer transporter setup
const transporter = nodemailer.createTransport({
    host: '192.168.15.90',  // Change to your SMTP server host
    port: 25,  // Change to your SMTP server port
    auth: {
        user: 'dev@qugates.com',  // Your email address
        pass: 'test1234'  // Your email password
    },
    tls: {
        rejectUnauthorized: false
    }
});

const sendAndStoreMail = async (to, subject, text, html) => {
    try {
        // Setup email data
        let mailOptions = {
            from: '"dev" <dev@qugates.com>',  // Sender address
            to: to,  // List of receivers
            subject: subject,  // Subject line
            text: text,  // Plain text body
            html: html  // HTML body (optional)
        };

        // Send the email
        let info = await transporter.sendMail(mailOptions);
        console.log('Message sent: %s', info.messageId);
        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));

        // Append the email to the Sent folder
        const rawEmail = `From: ${mailOptions.from}\r\nMessage-ID: ${info.messageId}\r\nTo: ${mailOptions.to}\r\nSubject: ${mailOptions.subject}\r\n\r\n${mailOptions.text || mailOptions.html}`;

        // Connect to the IMAP server
        const config = {
            imap: {
                user: 'dev',
                password: 'test1234',
                host: '192.168.15.90',
                port: 143, // Port for IMAP SSL, 143 for non-SSL
                tls: false,
            }
        };

        const connection = await imaps.connect(config);

        // Open the Sent folder
        await connection.openBox('Sent');

        // Append the email to the Sent folder
        await connection.append(rawEmail, { mailbox: 'Sent', flags: ['Seen'] });

        // Close the connection
        await connection.end();
        console.log('Email appended to Sent folder');

    } catch (error) {
        console.error('Error:', error);
    }
}

// Usage example
// sendAndStoreMail(
//     'niraj@qugates.com',
//     'Test Subject',
//     'This is a plain text body of the email.',
//     '<p>This is an <b>HTML</b> body of the email.</p>'
// );






async function listAllFolders() {
    try {
        // Connect to the IMAP server
        const connection = await imaps.connect(config);

        // Fetch the list of folders
        const boxes = await connection.getBoxes();

        // Recursive function to print folders and subfolders
        function printFolders(boxes, indent = '') {
            for (const folder in boxes) {
                console.log(indent + folder);
                if (boxes[folder].children) {
                    printFolders(boxes[folder].children, indent + '  ');
                }
            }
        }
        // Print all folders
        printFolders(boxes);

        // Close the connection
        await connection.end();
    } catch (error) {
        console.error('Error:', error);
    }
}

// Usage example
// listAllFolders();

const Imap = require("imap-simple");
const { inspect } = require('util');

// IMAP server configuration

// Function to fetch sent emails
function fetchSentEmails() {
    Imap.connect(config).then((connection) => {
        return connection.openBox('Sent').then(() => {
            const searchCriteria = ['ALL']; // Fetch all sent emails
            const fetchOptions = {
                bodies: [''],
                markSeen: false // Do not mark emails as seen
            };

            return connection.search(searchCriteria, fetchOptions).then((messages) => {
                const fetchPromises = messages.map((message) => {
                    console.log(message)
                });

                return Promise.all(fetchPromises).then(() => {
                    console.log('Done fetching sent emails.');
                    connection.end();
                });
            });
        });
    }).catch((err) => {
        console.error('IMAP Error:', err);
    });
}

// Call function to fetch sent emails
fetchSentEmails();
