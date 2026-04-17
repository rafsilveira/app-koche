---
description: Inicia o webapp local em um PowerShell persistente
---

Use o Windows PowerShell, e nao o terminal do CLI, para iniciar o servidor local de forma persistente durante a sessao de testes.

Execute exatamente este comando na raiz do projeto:

`Start-Process -FilePath "powershell.exe" -ArgumentList "-NoExit", "-Command", "Set-Location 'H:\Koche\app-koche'; npm run dev -- --host localhost"`

Depois informe que uma nova janela do PowerShell foi aberta e que o servidor Vite deve permanecer ativo nela durante os testes. Oriente o usuario a copiar a URL local exibida nessa janela, normalmente `http://localhost:5173/app-beta/`.
