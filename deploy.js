import * as ftp from 'basic-ftp';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const target = process.argv[2] || 'app';

const config = {
    host: process.env.FTP_HOST?.replace(/^ftp:\/\/|^sftp:\/\//, ''),
    user: process.env.FTP_USER,
    password: process.env.FTP_PASSWORD,
    port: parseInt(process.env.FTP_PORT || 21),
    secure: false // Set to true for FTPS
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const targetConfig = {
    app: {
        localPath: path.join(__dirname, 'dist', 'app'),
        remotePath: process.env.REMOTE_PATH_APP || process.env.REMOTE_PATH || '/domains/kocheautomotiva.com.br/public_html/app'
    },
    beta: {
        localPath: path.join(__dirname, 'dist', 'app-beta'),
        remotePath: process.env.REMOTE_PATH_BETA || '/domains/kocheautomotiva.com.br/public_html/app-beta'
    }
}[target];

if (!targetConfig) {
    console.error(`❌ Invalid deploy target: ${target}. Use "app" or "beta".`);
    process.exit(1);
}

async function deploy() {
    const client = new ftp.Client();
    // client.ftp.verbose = true; // Setup logging

    if (!config.host || !config.user || !config.password) {
        console.error('❌ Missing credentials! Please check your .env file.');
        return;
    }

    try {
        console.log(`🔌 Connecting to ${config.host} (Port ${config.port})...`);
        await client.access(config);
        console.log('✅ Connected!');

        console.log(`📂 Uploading ${target} from ${targetConfig.localPath} to ${targetConfig.remotePath}...`);

        await client.ensureDir(targetConfig.remotePath);
        await client.clearWorkingDir(); // Optional: Clear destination first
        await client.uploadFromDir(targetConfig.localPath, targetConfig.remotePath);

        console.log('🚀 Deployment Complete!');
    } catch (err) {
        console.error('❌ Deployment Failed:', err);
    } finally {
        client.close();
    }
}

deploy();
