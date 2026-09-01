# Base de Conhecimento Tier 1 — Manutenção Corretiva de Transmissão

> **Escopo:** só o Assistente Virtual (IA). Não afeta o Guia de Aplicação nem o banco `vehicles` do Firestore.
>
> **O que é "Tier 1":** fato técnico genérico, de fonte livre (Wikipedia — CC-BY-SA, cite a fonte — e dado
> público de patente/governo). **Não contém** nenhum conteúdo reescrito de site comercial de oficina — ver
> `arquitetura-assistente.md` pra entender por que essa linha foi mantida mesmo sob pressão de negócio pra
> usar o material protegido.
>
> **Como usar:** contexto suplementar no prompt do "modo solto" (manutenção corretiva), nunca como única
> fonte — a IA deve combinar isso com o raciocínio geral dela sobre o sintoma descrito pelo mecânico.

Priorizado pelas transmissões de maior volume no catálogo atual do app (ver contagem em `vehicles`).

---

## Famílias VW/Audi (dupla embreagem — DSG/S-tronic)

**DQ250 / 02E** — 6 marchas, embreagem úmida (banhada em óleo), primeira caixa de dupla embreagem produzida em massa pelo Grupo VW, em produção desde o início dos anos 2000. Usada em VW, Audi, SEAT e Škoda. Tipo de projeto: unidade "mecatrônica" (módulo que combina ECU + válvulas hidráulicas de controle) integrada à caixa.

**DL501 / 0B5** — 7 marchas, dupla embreagem úmida, usada em modelos Audi de maior porte/tração integral (conhecida comercialmente como "S tronic" de 7 marchas longitudinal).

**DQ200 / 0AM** — 7 marchas, dupla embreagem **seca** (sem banho de óleo — categoria de projeto diferente da DQ250/DL501, relevante porque o tipo de fluido e a sensibilidade térmica mudam).

---

## Famílias PSA/Renault (conversor de torque)

**AL4 / DP0** — 4 marchas, conversor de torque hidráulico convencional, desenvolvido em conjunto por PSA (Peugeot-Citroën) e Renault, em produção em massa desde 1999. Usada largamente em Peugeot, Citroën e Renault de motor dianteiro-transversal.

---

## Famílias Aisin (Japão)

**TF70SC / TF71SC (AT6)** — 6 marchas, conversor de torque. TF-70SC fabricada de 2007 a 2020, usada sob o índice "AT6" em modelos de tração dianteira da Peugeot-Citroën; a TF-71SC foi introduzida em 2014 na Volvo, depois adotada também por Citroën, Peugeot e Suzuki.

**AWF8F35 / TG81SC** — família de 8 marchas da Aisin, categoria de projeto mais recente que a linha TF-70/71SC de 6 marchas.

---

## Famílias Jatco (CVT — variador contínuo)

**JF015E / JF020E** — CVT (correia/polias, sem marchas fixas), fabricante Jatco, usada amplamente em modelos Nissan. Categoria de projeto diferente de todas as outras acima: não tem embreagem múltipla nem conversor de torque tradicional fazendo a troca de marcha — o mecanismo de desgaste típico é por correia metálica e polias, não por embreagens/discos.

---

## Famílias Mercedes-Benz

**722.6 (W5A580 / NAG1)** — 5 marchas, conversor de torque, arquitetura conhecida no mercado como "5G-Tronic". Tem uma unidade eletrônica de controle integrada na própria válvula (chamada "conductor plate" no mercado americano) — ponto de projeto que a distingue das transmissões com módulo de controle externo.

**722.9 (W7A700 / W7C700)** — 7 marchas, sucessora da 722.6, comercialmente "7G-Tronic". Mesma arquitetura de unidade de controle integrada na válvula, evoluída.

---

## Família Ford/Getrag (dupla embreagem)

**7DCT300** — 7 marchas, dupla embreagem **úmida**, introduzida pela Ford em 2015 como evolução da 6DCT250 (que era de embreagem seca). Comercialmente parte da linha "PowerShift". Mudar de seca pra úmida foi uma decisão de projeto especificamente pra melhorar resfriamento e controle de atrito frente aos problemas já conhecidos publicamente da geração anterior (ver nota de contexto de mercado abaixo).

> **Nota de contexto de mercado (fato público, não diagnóstico técnico):** a linha PowerShift anterior (6DCT250) foi alvo de ações judiciais coletivas nos EUA e Austrália por volta de 2016, e a Ford atualizou garantia e software em resposta — isso é histórico de mercado amplamente noticiado, não uma alegação nossa.

---

## Como preencher o resto das ~12 famílias prioritárias

Faltam: `09G/TF60SN`, `F4A42`, `6HP26` (ZF). Mesmo método: puxar página da Wikipedia da transmissão (não do carro), registrar fabricante/tipo/veículos/geração. Pendente só por tempo, não por dificuldade.

## Fontes usadas nesta primeira leva

- [Ford PowerShift transmission — Wikipedia](https://en.wikipedia.org/wiki/Ford_PowerShift_transmission)
- Achados de busca sobre DQ250/02E, AL4/DP0, TF70SC/TF71SC, JF015E/JF020E e 722.6/722.9 (fatos de fabricante/geração/tipo de projeto, sem reproduzir conteúdo de diagnóstico de terceiros).
