import * as ftp from 'basic-ftp';
import dotenv from 'dotenv';

dotenv.config();

const target = process.argv[2] || 'app';

const config = {
    host: process.env.FTP_HOST?.replace(/^ftp:\/\/|^sftp:\/\//, ''),
    user: process.env.FTP_USER,
    password: process.env.FTP_PASSWORD,
    port: parseInt(process.env.FTP_PORT || 21),
    secure: false
};

const targetPath = {
    app: process.env.REMOTE_PATH_APP || process.env.REMOTE_PATH || '/domains/kocheautomotiva.com.br/public_html/app',
    beta: process.env.REMOTE_PATH_BETA || '/domains/kocheautomotiva.com.br/public_html/app-beta'
}[target];

if (!targetPath) {
    console.error(`❌ Invalid debug target: ${target}. Use "app" or "beta".`);
    process.exit(1);
}

async function checkRemote() {
    const client = new ftp.Client();

    if (!config.host || !config.user || !config.password) {
        console.error('❌ Missing credentials!');
        return;
    }

    try {
        console.log(`🔌 Connecting to ${config.host}...`);
        await client.access(config);

        console.log('PWD:', await client.pwd());

        console.log(`\n🔎 Checking: ${targetPath}`);
        await client.downloadTo('server_index.html', `${targetPath}/index.html`);
        console.log('✅ Downloaded server_index.html');

    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        client.close();
    }
}

checkRemote();
