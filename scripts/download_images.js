import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '../src/data/database.json');
const imagesDir = path.join(__dirname, '../public/images/connections');

// Ensure directory exists
if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
}

const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
let updatedCount = 0;
let errorCount = 0;

const downloadImage = (url, filepath) => {
    return new Promise((resolve, reject) => {
        // Extract ID
        const driveRegex = /drive\.google\.com\/file\/d\/([^/]+)\//;
        const match = url.match(driveRegex);
        if (!match || !match[1]) {
            return reject('Invalid Google Drive URL');
        }
        const fileId = match[1];

        // Use the export=download URL which usually works for public files
        const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;

        const file = fs.createWriteStream(filepath);

        const request = https.get(downloadUrl, (response) => {
            // Handle redirects (Google Drive does this a lot)
            if (response.statusCode === 302 || response.statusCode === 303) {
                https.get(response.headers.location, (redirectResponse) => {
                    if (redirectResponse.statusCode !== 200) {
                        file.close();
                        fs.unlink(filepath, () => { }); // Delete empty file
                        return reject(`Failed to download: Status Code ${redirectResponse.statusCode}`);
                    }
                    redirectResponse.pipe(file);
                    file.on('finish', () => {
                        file.close(resolve);
                    });
                }).on('error', (err) => {
                    fs.unlink(filepath, () => { });
                    reject(err);
                });
                return;
            }

            if (response.statusCode !== 200) {
                file.close();
                fs.unlink(filepath, () => { });
                return reject(`Failed to download: Status Code ${response.statusCode}`);
            }

            response.pipe(file);
            file.on('finish', () => {
                file.close(resolve);
            });
        }).on('error', (err) => {
            fs.unlink(filepath, () => { });
            reject(err);
        });
    });
};

const processDatabase = async () => {
    console.log('Starting image download process...');

    // Create a map to cache downloaded IDs so we don't download duplicates
    const downloadedIds = new Set();

    for (const item of data) {
        // Process imageConnectionLocation
        if (item.imageConnectionLocation && item.imageConnectionLocation.includes('drive.google.com')) {
            const driveRegex = /drive\.google\.com\/file\/d\/([^/]+)\//;
            const match = item.imageConnectionLocation.match(driveRegex);
            if (match && match[1]) {
                const fileId = match[1];
                const filename = `${fileId}.jpg`;
                const localPath = `/images/connections/${filename}`;
                const fullPath = path.join(imagesDir, filename);

                if (!downloadedIds.has(fileId)) {
                    if (!fs.existsSync(fullPath)) {
                        try {
                            console.log(`Downloading ${fileId}...`);
                            await downloadImage(item.imageConnectionLocation, fullPath);
                        } catch (err) {
                            console.error(`Error downloading ${fileId}: ${err}`);
                            errorCount++;
                            continue; // Skip updating reference if download failed
                        }
                    } else {
                        console.log(`Skipping ${fileId} (already exists)`);
                    }
                    downloadedIds.add(fileId);
                }

                item.imageConnectionLocation = localPath;
                updatedCount++;
            }
        }

        // Process imageConnector if needed (the task mainly mentioned connection location, but let's be safe)
        // Checking the plan, it specifically mentioned 51 unique links. The analysis script checked both.
        if (item.imageConnector && item.imageConnector.includes('drive.google.com')) {
            const driveRegex = /drive\.google\.com\/file\/d\/([^/]+)\//;
            const match = item.imageConnector.match(driveRegex);
            if (match && match[1]) {
                const fileId = match[1];
                const filename = `${fileId}.jpg`;
                const localPath = `/images/connections/${filename}`;
                const fullPath = path.join(imagesDir, filename);

                if (!downloadedIds.has(fileId)) {
                    if (!fs.existsSync(fullPath)) {
                        try {
                            console.log(`Downloading ${fileId}...`);
                            await downloadImage(item.imageConnector, fullPath);
                        } catch (err) {
                            console.error(`Error downloading ${fileId}: ${err}`);
                            errorCount++;
                            continue;
                        }
                    }
                    downloadedIds.add(fileId);
                }

                item.imageConnector = localPath;
                updatedCount++;
            }
        }
    }

    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
    console.log(`Process complete.`);
    console.log(`Updated references: ${updatedCount}`);
    console.log(`Errors: ${errorCount}`);
};

processDatabase();
