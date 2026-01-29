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
            '/public_html/guia-transmissao',
            '/domains/kocheautomotiva.com.br/public_html/guia-aplicacao-transmissao',
            // Try relative path if valid
            'public_html'
        ];

        for (const p of pathsToCheck) {
            try {
                console.log(`\n🔎 Checking: ${p}`);
                const files = await client.list(p);
                const defaultFile = files.find(f => f.name === 'default.php');
                if (defaultFile) {
                    console.log(`✅ FOUND default.php in ${p}`);
                } else {
                    console.log(`❌ No default.php in ${p}`);
                }
                // List first 5 files to get an idea
                files.slice(0, 5).forEach(f => console.log(`   - ${f.name}`));
            } catch (e) {
                console.log(`⚠️ Could not list ${p}: ${e.message}`);
            }
        }

    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        client.close();
    }
}

checkRemote();
