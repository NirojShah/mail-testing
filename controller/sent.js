const nodemailer = require("nodemailer");
const imaps = require('imap-simple');
const { simpleParser } = require('mailparser');
const _ = require("lodash");

const imapConfig = {
    imap: {
        user: 'dev',
        password: 'test1234',
        host: '192.168.15.90',
        port: 143, // Port for IMAP SSL, 143 for non-SSL
        tls: false,
    }
};

// Function to list all folders
async function listAllFolders(connection) {
    try {
        const boxes = await connection.getBoxes();
        function printFolders(boxes, indent = '') {
            for (const folder in boxes) {
                console.log(indent + folder);
                if (boxes[folder].children) {
                    printFolders(boxes[folder].children, indent + '  ');
                }
            }
        }
        printFolders(boxes);
    } catch (error) {
        console.error('Error listing folders:', error);
    }
}

// Function to check if a folder exists
async function folderExists(connection, folderName) {
    try {
        const boxes = await connection.getBoxes();
        function checkFolders(boxes) {
            for (const folder in boxes) {
                if (folder.toUpperCase() === folderName.toUpperCase()) {
                    return true;
                }
                if (boxes[folder].children) {
                    if (checkFolders(boxes[folder].children)) {
                        return true;
                    }
                }
            }
            return false;
        }
        return checkFolders(boxes);
    } catch (error) {
        console.error('Error checking folder existence:', error);
        return false;
    }
}

// Function to create a folder if it does not exist
async function createFolderIfNotExists(folderName) {
    try {
        const connection = await imaps.connect(imapConfig);
        const exists = await folderExists(connection, folderName);
        if (!exists) {
            await connection.addBox(folderName);
            console.log(`Folder "${folderName}" created successfully.`);
        } else {
            console.log(`Folder "${folderName}" already exists.`);
        }
        await listAllFolders(connection);
        await connection.end();
    } catch (error) {
        console.error('Error creating folder:', error);
    }
}

// Function to send an email and store it in Sent Items
async function sendAndStoreMail(to, subject, text, html) {
    // Nodemailer transporter setup
    let transporter = nodemailer.createTransport({
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

    // Setup email data
    let mailOptions = {
        from: '"dev" <dev@qugates.com>',  // Sender address
        to: to,  // List of receivers
        subject: subject,  // Subject line
        text: text,  // Plain text body
        html: html  // HTML body (optional)
    };

    try {
        // Send the email
        let info = await transporter.sendMail(mailOptions);
        console.log('Message sent: %s', info.messageId);
        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));

        // Create raw email content
        let rawEmail = `From: ${mailOptions.from}\r\nTo: ${mailOptions.to}\r\nSubject: ${mailOptions.subject}\r\n\r\n${mailOptions.text || mailOptions.html}`;

        // Connect to the IMAP server
        const connection = await imaps.connect(imapConfig);

        // Ensure the Sent folder exists
        const sentFolderName = 'Sent'; // Change to 'Sent Items' if needed
        await createFolderIfNotExists(sentFolderName);

        // Open the Sent folder
        await connection.openBox(sentFolderName);

        // Append the email to the Sent folder
        await connection.append(rawEmail, { mailbox: sentFolderName, flags: ['Seen'] });

        // Close the connection
        await connection.end();
        console.log('Email appended to Sent folder');

    } catch (error) {
        console.error('Error:', error);
    }
}

// Usage example
sendAndStoreMail(
    'niraj@qugates.com',
    'Test Subject',
    'This is a plain text body of the email.',
    '<p>This is an <b>HTML</b> body of the email.</p>'
);
