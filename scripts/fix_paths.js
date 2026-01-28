import fs from 'fs';
import path from 'path';

const dbPath = path.resolve('/home/rafsilveira/Documents/App Koche/src/data/database.json');

try {
    const content = fs.readFileSync(dbPath, 'utf8');
    let data = JSON.parse(content);
    let count = 0;

    data = data.map(item => {
        let updated = false;
        if (item.imageConnector && item.imageConnector.startsWith('/')) {
            item.imageConnector = item.imageConnector.substring(1);
            updated = true;
        }
        if (item.imageConnectionLocation && item.imageConnectionLocation.startsWith('/')) {
            item.imageConnectionLocation = item.imageConnectionLocation.substring(1);
            updated = true;
        }
        if (updated) count++;
        return item;
    });

    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
    console.log(`Updated ${count} items in database.json to use relative paths.`);
} catch (error) {
    console.error("Error updating database:", error);
}
