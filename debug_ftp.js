import * as ftp from 'basic-ftp';
import dotenv from 'dotenv';

dotenv.config();

const config = {
    host: process.env.FTP_HOST?.replace(/^ftp:\/\/|^sftp:\/\//, ''),
    user: process.env.FTP_USER,
    password: process.env.FTP_PASSWORD,
    port: parseInt(process.env.FTP_PORT || 21),
    secure: false
};

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

        const pathsToCheck = [
            '/public_html/guia-de-aplicacao/assets',
            '/public_html/assets',
            '/public_html/guia-aplicacao-transmissao/assets'
        ];

        const p = '/public_html/guia-de-aplicacao';
        console.log(`\n🔎 Checking: ${p}`);
        await client.downloadTo('server_index.html', `${p}/index.html`);
        console.log('✅ Downloaded server_index.html');

    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        client.close();
    }
}

checkRemote();
