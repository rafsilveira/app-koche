
import fs from 'fs';
import Papa from 'papaparse';
import path from 'path';

const csvFilePath = path.resolve('./Base de dados App Kóche - Sheet1.csv');
const jsonFilePath = path.resolve('./src/data/database.json');

const fileContent = fs.readFileSync(csvFilePath, 'utf8');

Papa.parse(fileContent, {
  header: true,
  skipEmptyLines: true,
  complete: (results) => {
    const data = results.data.map(row => ({
      brand: row['Marca']?.trim(),
      model: row['Modelo']?.trim(),
      year: row['Ano']?.trim(),
      engine: row['Motor']?.trim(),
      transmission: row['Transmissão']?.trim(),
      fluidHomologation: row['Homologação do Fluido']?.trim(),
      fluidQuantity: row['Quantidade de fluído']?.trim(),
      transmissionFilter: row['Filtro da transmissão']?.trim(),
      connectionType: row['Conexão da máquina de troca de fluidos']?.trim(),
      imageConnector: row['Imagem Conector']?.trim(),
      imageConnectionLocation: row['Imagem Local da Conexao ']?.trim() || row['Imagem Local da Conexao']?.trim(),
      videoProcedure: row['Video Procedimento']?.trim(),
      link: row['Link']?.trim()
    })).filter(item => item.brand && item.model); // Basic filtering for empty rows

    fs.writeFileSync(jsonFilePath, JSON.stringify(data, null, 2));
    console.log(`Converted ${data.length} records to ${jsonFilePath}`);
  },
  error: (err) => {
    console.error("Error parsing CSV:", err);
    process.exit(1);
  }
});
