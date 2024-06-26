const nodemailer = require('nodemailer');
const Imap = require('imap-simple');

// SMTP and IMAP configurations
const smtpConfig = {
    host: '192.168.15.90',  // Your SMTP server host
    port: 25,  // Your SMTP server port
    auth: {
        user: 'niraj@qugates.com',  // Your email address
        pass: 'qugates123'  // Your email password
    },
    tls: {
        rejectUnauthorized: false  // Use only if your SMTP server uses self-signed certificates
    }
};

const imapConfig = {
    imap: {
        user: 'dev', // Your email address
        password: 'test1234', // Your email password
        host: '192.168.15.90', // IMAP server hostname
        port: 143, // IMAP server port
        tls: false, // Use TLS if required by your server
        authTimeout: 30000, // Increase auth timeout if needed
        connTimeout: 30000 // Increase connection timeout if needed
    }
};

// Function to send an email
async function sendEmail() {
    // Create a SMTP transporter
    let transporter = nodemailer.createTransport(smtpConfig);

    // Email message options
    let mailOptions = {
        from: 'niraj@qugates.com',
        to: 'dev@qugates.com',
        subject: 'Test Email',
        text: 'Hello Niraj, This is a test email sent from Node.js.'
    };

    try {
        // Send mail with defined transport object
        let info = await transporter.sendMail(mailOptions);
        console.log('Email sent:', info.messageId);

        // Return the sent email info
        return info;
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
}

// Function to fetch sent emails
async function fetchSentEmails() {
    let connection;
    try {
        // Connect to IMAP server
        connection = await Imap.connect(imapConfig);

        // Ensure the 'Sent' folder exists
        const sentFolderName = 'Sent'; // Adjust if your server uses a different name
        await createFolderIfNotExists(connection, sentFolderName);

        // Open 'Sent' mailbox
        await connection.openBox(sentFolderName);

        // Search criteria to fetch all sent emails
        const searchCriteria = ['ALL'];
        const fetchOptions = {
            bodies: [''],
            markSeen: false // Do not mark emails as seen
        };

        // Search for emails
        let messages = await connection.search(searchCriteria, fetchOptions);

        // Log fetched messages
        messages.forEach((message) => {
            console.log('Fetched message:', message);
        });

    } catch (err) {
        console.error('Error fetching sent emails:', err);
        throw err;
    } finally {
        // Ensure the connection is properly closed
        if (connection) {
            await connection.end();
        }
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

// Test LMTP by sending an email and fetching sent emails
async function testLMTP() {
    try {
        // Send an email
        let sentEmail = await sendEmail();

        // Wait for a few seconds before fetching sent emails (to ensure processing time)
        await new Promise(resolve => setTimeout(resolve, 5000));

        // Fetch sent emails
        await fetchSentEmails();

    } catch (error) {
        console.error('Error testing LMTP:', error);
    }
}

// Call function to test LMTP
testLMTP();

