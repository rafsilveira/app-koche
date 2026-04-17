---
description: Interrompe o webapp local iniciado para testes
---

Use o terminal do CLI para encerrar o servidor Vite persistente desta workspace.

Execute primeiro este comando na raiz do projeto:

`if (Test-Path ".opencode/.test-server.pid") { $pid = Get-Content ".opencode/.test-server.pid" | Select-Object -First 1; if ($pid) { Stop-Process -Id ([int]$pid) -Force -ErrorAction SilentlyContinue }; Remove-Item ".opencode/.test-server.pid" -ErrorAction SilentlyContinue }`

Se o arquivo PID nao existir ou o processo ja tiver morrido, use como fallback encerrar o que estiver ouvindo na porta `5173`.

Depois confirme se o servidor foi encerrado.
