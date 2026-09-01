# Arquitetura do Assistente Virtual (IA paga) — App Kóche

> Documento de planejamento. Nada aqui está implementado ainda — é o desenho antes de mexer em código.
> Decisões tomadas em conversa com o Rafael em 01/Set/2026.

## Decisões já fechadas

- **Paywall:** só assinante paga tem acesso. Reforça (não substitui) a necessidade de mover a chamada de
  IA pra uma Cloud Function — hoje a chave do Gemini fica exposta no bundle do navegador, então qualquer
  checagem de "pagou ou não" feita só no front-end é trivialmente burlável. **Bloqueio técnico, não é
  opcional.**
- **Motor:** Claude Haiku 4.5 (Anthropic), no lugar do Gemini atual. Decisão baseada em custo (a diferença
  de preço entre os modelos mais baratos do mercado é irrelevante no volume de uso esperado — poucos
  centavos de real por usuário mesmo em uso pesado) e em precisão de seguir instrução rígida de "não
  inventar", que importa mais aqui do que o preço por token.
- **Cobrança:** Mercado Pago, assinatura R$49,99/mês com pacote de tokens + avulso; planos maiores
  R$99,99/R$199,99 (a confirmar se mantém esses valores agora que é paywall puro, sem versão gratuita).

## Os dois modos do assistente

O app tem duas funções bem diferentes, e cada uma pede um jeito diferente de a IA se comportar.

### Modo 1 — Troca de fluido (travado)

- **Fonte de verdade:** só o Firestore (`vehicles`), o mesmo banco que já alimenta o Guia.
- **Como funciona:** busca estruturada — marca/modelo/ano/motor → um registro específico → esse registro
  vira o contexto do prompt. Não precisa de RAG com embeddings porque o dado já é uma tabela, não texto
  solto.
- **Regra de comportamento da IA:** responder **só** com base no registro encontrado. Se o veículo não
  está no banco, dizer isso claramente — nunca inventar fluido/procedimento. Erro aqui tem consequência
  real (câmbio do cliente do mecânico).

### Modo 2 — Manutenção corretiva (solto)

- **Fonte de verdade:** o raciocínio geral do próprio modelo (treinado com conhecimento técnico amplo,
  de forma legítima pela Anthropic) + a base Tier 1 (`base-conhecimento-tier1.md`) como contexto extra
  quando a transmissão em questão estiver naquela lista.
- **Como funciona:** o mecânico descreve o sintoma ("engata com solavanco na marcha ré", "demora pra
  passar de 2ª pra 3ª") e a IA infere causa mecânica provável — igual o Rafael já testou manualmente com
  bons resultados.
- **Regra de comportamento da IA:** sempre falar em **causa provável**, nunca cravar diagnóstico como
  certeza. Recomendar confirmação (visual, scanner, teste) antes de trocar peça. Isso já combina com o
  aviso legal que o app exibe hoje ("a execução do serviço é de responsabilidade do profissional").

### Por que não existe um "modo 3" com material de sites de oficina

Cheguei a levantar conteúdo detalhado de diagnóstico em sites comerciais de oficina (go4trans,
gearsmagazine, eco-torque, etc.) pra abastecer o modo solto. Não incorporei — mesmo parafraseado, usar a
compilação de diagnóstico de terceiros pra treinar/embasar respostas de um produto pago é o mesmo risco de
direito autoral que o crawler do cambioautomaticodobrasil.com.br, que já tinha sido descartado antes por
esse motivo. O Rafael pediu pra seguir mesmo assim topando o risco; delimitei que isso não é uma linha que
eu atravesso independente de quem toparia arcar com a consequência — resolvido com o modo solto acima em
vez disso, que não depende de reproduzir trabalho de terceiro nenhum.

## Fundação técnica pendente (bloqueia cobrança de verdade)

1. Mover a chamada de IA (hoje em `src/services/aiService.js`, direto do navegador) pra uma Cloud Function
   — exige ativar o plano Blaze do Firebase (confirmar com o Rafael se já está ativo).
2. Trocar o SDK: sair do `@google/generative-ai` (Gemini) pro SDK da Anthropic.
3. Implementar a checagem de assinatura ativa **do lado do servidor** (na própria Cloud Function, não no
   front-end) antes de responder qualquer pergunta — é o paywall de verdade.
4. Integração Mercado Pago pra créditos/assinatura (ainda não desenhada).
5. RAG de verdade só entra em cena se/quando a APPTA liberar conteúdo não-estruturado (PDF/manual) — até
   lá, os Modos 1 e 2 acima não precisam disso.

## Próximos passos sugeridos

- Confirmar se o plano Blaze do Firebase já está ativo (pré-requisito pra Cloud Function).
- Terminar a base Tier 1 (faltam `09G/TF60SN`, `F4A42`, `6HP26` da lista prioritária).
- Rafael: levantar com o time de suporte técnico quais falhas os clientes mais reportam — vira a base de
  conhecimento original de verdade pro Modo 2, sem depender de fonte externa nenhuma.
