const nodemailer = require('nodemailer');
const imaps = require('imap-simple');

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

// Function to generate a unique Message-ID
function generateMessageId() {
    return Math.random().toString(36).substr(2, 9);
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
async function createFolderIfNotExists(connection, folderName) {
    try {
        const exists = await folderExists(connection, folderName);
        if (!exists) {
            await connection.addBox(folderName);
            console.log(`Folder "${folderName}" created successfully.`);
        } else {
            console.log(`Folder "${folderName}" already exists.`);
        }
    } catch (error) {
        console.error('Error creating folder:', error);
    }
}

// Function to send and store mail
const sendAndStoreMail = async (to, subject, text, html) => {
    try {
        // Setup email data
        let mailOptions = {
            from: '"dev" <dev@qugates.com>',  // Sender address
            to: to,  // List of receivers
            subject: subject,  // Subject line
            text: text,  // Plain text body
            html: html,  // HTML body (optional)
            headers: {
                'Message-ID': `<${generateMessageId()}@qugates.com>` // Generate or use a unique Message-ID
            }
        };

        // Send the email
        let info = await transporter.sendMail(mailOptions);
        console.log('Message sent: %s', info.messageId);
        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));

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

        // Create the folder if it does not exist
        const folderName = 'SENTQUGATES';
        await createFolderIfNotExists(connection, folderName);

        // Open the folder
        await connection.openBox(folderName);

        // Construct raw email content
        const rawEmail = `Message-ID: ${info.messageId}\r\nFrom: ${mailOptions.from}\r\nTo: ${mailOptions.to}\r\nSubject: ${mailOptions.subject}\r\n\r\n${mailOptions.text || mailOptions.html}`;

        // Append the email to the folder
        await connection.append(rawEmail, { mailbox: folderName, flags: ['Seen'] });

        // Close the connection
        await connection.end();
        console.log('Email appended to SENTQUGATES folder');

    } catch (error) {
        console.error('Error:', error);
    }
}

// Usage example
sendAndStoreMail(
    ['niraj@qugates.com',"dev@qugates.com"],
    'Test Subject',
    'This is a plain text body of the email.',
    '<p>This is an <b>HTML</b> body of the email.</p>'
);
