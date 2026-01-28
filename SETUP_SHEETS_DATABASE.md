# Configuração da Base de Dados na Planilha

Para usar a planilha como base de dados (fotos, vídeos, specs), siga estes passos na **MESMA PLANILHA** que já criamos.

## 1. Criar a Aba de Dados
1.  Crie uma nova aba (página) na planilha e chame-a de: `Dados` (Exatamente assim, com D maiúsculo).
2.  Na primeira linha, crie exatamente estes 12 cabeçalhos:
    *   **A1:** Brand
    *   **B1:** Model
    *   **C1:** Year
    *   **D1:** Engine
    *   **E1:** Transmission
    *   **F1:** Fluid
    *   **G1:** Quantity
    *   **H1:** Filter
    *   **I1:** Connection
    *   **J1:** ImageConnector
    *   **K1:** ImageLocation
    *   **L1:** VideoLink

3.  Insira pelo menos 1 linha de exemplo preenchida para testarmos.
    *   *Dica para Imagens:* Pode usar links públicos do Google Drive.
    *   *Dica para Vídeo:* Pode usar link normal do YouTube.

## 2. Atualizar o Código (Apps Script)
1.  Vá em **Extensões** > **Apps Script**.
2.  **Apague tudo** e cole o NOGO CÓDIGO abaixo (ele junta a parte de Leads com a de Dados):

```javascript
// --- CONFIGURAÇÃO ---
const EMAIL_DESTINO = "seu_email@aqui.com"; 
const NOME_ABA_DADOS = "Dados";
const NOME_ABA_LEADS = "Página1"; // Geralmente é o nome da primeira aba
// --------------------

function doPost(e) {
  // ... (Mantém a lógica de LEADS que já funcionava) ...
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(NOME_ABA_LEADS) || SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
    const data = JSON.parse(e.postData.contents);
    sheet.appendRow([new Date(), data.name, data.email, data.phone, data.source || 'App']);
    return ContentService.createTextOutput(JSON.stringify({result: 'success'})).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({result: 'error', error: error.toString()})).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  // ... (Nova lógica para ler DADOS) ...
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(NOME_ABA_DADOS);
    if (!sheet) throw new Error("Aba 'Dados' não encontrada.");

    const rows = sheet.getDataRange().getValues();
    const headers = rows[0];
    const data = [];

    // Transformar linhas em Objetos JSON
    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const obj = {};
        for (let j = 0; j < headers.length; j++) {
            // Mapear colunas para nomes de propriedades (minúsculo e sem espaço)
            let key = headers[j].toString().toLowerCase().trim().replace(/\s+/g, '');
            // Mapeamento manual para garantir compatibilidade com o App
            if(key === 'brand') key = 'brand';
            if(key === 'model') key = 'model';
            if(key === 'year') key = 'year';
            if(key === 'engine') key = 'engine';
            if(key === 'transmission') key = 'transmission'; // transmission
            if(key === 'fluid') key = 'fluidHomologation'; // Mapeia 'Fluid' da planilha para 'fluidHomologation' no app
            if(key === 'quantity') key = 'fluidQuantity'; // Mapeia 'Quantity' para 'fluidQuantity'
            if(key === 'filter') key = 'transmissionFilter'; // Mapeia 'Filter' para 'transmissionFilter'
            if(key === 'connection') key = 'connectionType'; // Mapeia 'Connection' para 'connectionType'
            if(key === 'imageconnector') key = 'imageConnector';
            if(key === 'imagelocation') key = 'imageLocation'; // Novo campo
            if(key === 'videolink') key = 'videoLink'; // Novo campo
            
            obj[key] = row[j];
        }
        if (obj.brand && obj.model) { // Só adiciona se tiver marca e modelo
            data.push(obj);
        }
    }

    return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({error: error.toString()})).setMimeType(ContentService.MimeType.JSON);
  }
}

// Mantenha a função enviarResumoDiario se quiser...
```

## 3. Publicar Novamente (IMPORTANTE)
Sempre que muda o código, tem que fazer nova implantação:
1.  Clique em **Implantar** > **Gerenciar implantações**.
2.  Clique no ícone de lápis (Editar) na topo direito.
3.  Em **Versão**, mude para **"Nova versão"**.
4.  Clique em **Implantar**.

(O link URL geralmente continua o mesmo, mas verifique).
