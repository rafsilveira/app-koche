import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';

dotenv.config();

// basic-ftp (a lib anterior) trava nesse host da Hostinger por causa do modo
// FTP passivo - o unico metodo que funciona de forma confiavel e' o curl.
const FTP_HOST = process.env.FTP_HOST?.replace(/^ftp:\/\/|^sftp:\/\//, '');
const FTP_USER = process.env.FTP_USER;
const FTP_PASSWORD = process.env.FTP_PASSWORD;
// O login FTP dessa conta ja cai direto em /public_html, entao o caminho
// certo e' relativo a raiz - nunca "/domains/.../public_html/...".
const REMOTE_PATH = process.env.REMOTE_PATH || 'guia-de-aplicacao';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOCAL_DIST = path.join(__dirname, 'dist');

function listFilesRecursive(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    return entries.flatMap((entry) => {
        const fullPath = path.join(dir, entry.name);
        return entry.isDirectory() ? listFilesRecursive(fullPath) : [fullPath];
    });
}

function uploadFile(localFile) {
    const relPath = path.relative(LOCAL_DIST, localFile).split(path.sep).join('/');
    const remoteUrl = `ftp://${FTP_HOST}/${REMOTE_PATH}/${relPath}`;
    execFileSync('curl', [
        '-sS', '-T', localFile, remoteUrl,
        '--user', `${FTP_USER}:${FTP_PASSWORD}`,
        '--ftp-create-dirs',
    ], { stdio: 'inherit' });
    return relPath;
}

function deploy() {
    if (!FTP_HOST || !FTP_USER || !FTP_PASSWORD) {
        console.error('❌ Credenciais faltando! Verifique o .env (FTP_HOST, FTP_USER, FTP_PASSWORD).');
        process.exit(1);
    }

    if (!fs.existsSync(LOCAL_DIST)) {
        console.error(`❌ Pasta "dist" não encontrada em ${LOCAL_DIST}. Rode "npm run build" antes.`);
        process.exit(1);
    }

    const files = listFilesRecursive(LOCAL_DIST);
    console.log(`📂 Enviando ${files.length} arquivo(s) de ${LOCAL_DIST} para ${REMOTE_PATH}/ ...`);

    for (const file of files) {
        const relPath = uploadFile(file);
        console.log(`  ✅ ${relPath}`);
    }

    console.log('🚀 Deploy concluído!');
}

deploy();
