---
description: Inicia o webapp local em localhost
---

Use o terminal do CLI para iniciar o Vite em processo persistente, sem depender do tempo de vida deste prompt.

Execute exatamente este comando na raiz do projeto:

`$proc = Start-Process -FilePath "npm.cmd" -ArgumentList "run","dev","--","--host","localhost" -WorkingDirectory "." -PassThru; Set-Content -Path ".opencode/.test-server.pid" -Value $proc.Id; Start-Sleep -Seconds 3; Get-Content ".opencode/.test-server.pid"`

Se o servidor iniciar corretamente, informe que ele ficou rodando em background no terminal do CLI e peça a URL local exibida pelo Vite consultando o processo/log se necessario.
