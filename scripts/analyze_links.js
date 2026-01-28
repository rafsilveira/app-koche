import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '../src/data/database.json');
const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

const driveLinks = new Set();
const itemsWithLinks = [];

data.forEach(item => {
    // Check imageConnectionLocation
    if (item.imageConnectionLocation && item.imageConnectionLocation.includes('drive.google.com')) {
        driveLinks.add(item.imageConnectionLocation);
        itemsWithLinks.push({ type: 'location', id: item.model, link: item.imageConnectionLocation });
    }
    // Check imageConnector
    if (item.imageConnector && item.imageConnector.includes('drive.google.com')) {
        driveLinks.add(item.imageConnector);
        itemsWithLinks.push({ type: 'connector', id: item.model, link: item.imageConnector });
    }
});

console.log(`Total items: ${data.length}`);
console.log(`Total unique Google Drive links: ${driveLinks.size}`);
console.log(`First 5 links found:`);
console.log([...driveLinks].slice(0, 5));
