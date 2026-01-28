import * as ftp from 'basic-ftp';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const config = {
    host: process.env.FTP_HOST?.replace(/^ftp:\/\/|^sftp:\/\//, ''),
    user: process.env.FTP_USER,
    password: process.env.FTP_PASSWORD,
    port: parseInt(process.env.FTP_PORT || 21),
    secure: false // Set to true for FTPS
};

// Destination path on the server
const REMOTE_PATH = process.env.REMOTE_PATH || '/domains/kocheautomotiva.com.br/public_html/guia-aplicacao-transmissao';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function deploy() {
    const client = new ftp.Client();
    // client.ftp.verbose = true; // Setup logging

    const localPath = path.join(__dirname, 'dist');

    if (!config.host || !config.user || !config.password) {
        console.error('❌ Missing credentials! Please check your .env file.');
        return;
    }

    try {
        console.log(`🔌 Connecting to ${config.host} (Port ${config.port})...`);
        await client.access(config);
        console.log('✅ Connected!');

        console.log(`📂 Uploading from ${localPath} to ${REMOTE_PATH}...`);

        await client.ensureDir(REMOTE_PATH);
        await client.clearWorkingDir(); // Optional: Clear destination first
        await client.uploadFromDir(localPath, REMOTE_PATH);

        console.log('🚀 Deployment Complete!');
    } catch (err) {
        console.error('❌ Deployment Failed:', err);
    } finally {
        client.close();
    }
}

deploy();
