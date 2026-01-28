# Configuração Google Sheets (Zero Custo)

Siga estes passos para transformar uma Planilha Google em um "Servidor de Leads":

## 1. Preparar a Planilha
1. Crie uma nova planilha no Google Sheets: `leads_app_koche`.
2. Na primeira linha, crie o cabeçalho:
   - **A1:** Data
   - **B1:** Nome
   - **C1:** Email
   - **D1:** Telefone
   - **E1:** Fonte

## 2. Inserir o Código (Servidor)
1. Na planilha, clique em **Extensões** > **Apps Script**.
2. Apague qualquer código que estiver lá (`function myFunction...`).
3. Cole o código abaixo inteiro:

```javascript
// --- CONFIGURAÇÃO ---
const EMAIL_DESTINO = "seu_email@aqui.com"; // <--- COLOQUE SEU EMAIL AQUI
// --------------------

function doPost(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const data = JSON.parse(e.postData.contents);
    
    // Adicionar linha na planilha
    sheet.appendRow([
      new Date(),       // Data
      data.name, 
      data.email, 
      data.phone, 
      data.source || 'App'
    ]);
    
    return ContentService.createTextOutput(JSON.stringify({result: 'success'}))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({result: 'error', error: error.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Função para enviar Resumo Diário (Agendar no "Acionadores")
function enviarResumoDiario() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const lastRow = sheet.getLastRow();
  
  // Pegar leads de hoje
  const hoje = new Date().toDateString();
  let novosLeads = 0;
  
  // (Lógica simplificada: conta quantos tem a data de hoje na coluna A)
  // Para performance em planilhas gigantes, usaríamos filtros, mas aqui funciona bem.
  const dados = sheet.getRange(2, 1, lastRow - 1, 1).getValues(); 
  
  for (let i = 0; i < dados.length; i++) {
    if (new Date(dados[i][0]).toDateString() === hoje) {
      novosLeads++;
    }
  }
  
  if (novosLeads > 0) {
    MailApp.sendEmail({
      to: EMAIL_DESTINO,
      subject: `[App Koche] Resumo do Dia: ${novosLeads} novos leads`,
      htmlBody: `
        <h2>Resumo Diário</h2>
        <p>Você teve <strong>${novosLeads}</strong> novos cadastros completos hoje.</p>
        <p><a href="${SpreadsheetApp.getActiveSpreadsheet().getUrl()}">Clique aqui para ver a planilha</a></p>
      `
    });
  }
}
```

## 3. Publicar (Gerar o Link)
1. Clique no botão azul **Implantar** (Deploy) > **Nova implantação**.
2. Clique na engrenagem ⚙️ > **App da Web**.
3. Configure assim:
   - **Descrição:** `API Leads`
   - **Executar como:** `Eu` (Seu email)
   - **Quem pode acessar:** `Qualquer pessoa` (Isso é CRÍTICO para funcionar!)
4. Clique em **Implantar**.
5. Copie a **URL do app da web** (termina em `/exec`).

**ME MANDE ESSE LINK AQUI.**

## 4. Configurar Email Diário
1. No menu esquerdo do Apps Script (ícone Relógio ⏰), vá em **Acionadores**.
2. Clique em **Adicionar Acionador**.
3. Configure:
   - Função: `enviarResumoDiario`
   - Origem do evento: `Baseado no tempo`
   - Tipo de timer: `Contador diário`
   - Hora: Escolha a hora que prefere receber (ex: `18h as 19h`).
4. Salvar.
