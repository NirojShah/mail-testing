const imaps = require('imap-simple');

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

// Usage example
createFolderIfNotExists('Sent');
