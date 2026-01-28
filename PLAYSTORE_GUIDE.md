# Guia de Publicação na Google Play Store (TWA) - Arch Linux

Este guia explica como publicar o seu Web App (React/Vite) na Google Play Store utilizando a tecnologia **Trusted Web Activity (TWA)** no Arch Linux.

---

## 1. Configuração do PWA (Já realizada)

Eu já configurei o `vite.config.js` para usar o plugin PWA.
**Importante**: Para que o ícone do app funcione no Android, você precisa adicionar dois arquivos de ícone na pasta `public/images`:
- `icon-192.png` (Tamanho 192x192px)
- `icon-512.png` (Tamanho 512x512px)

Você pode gerar esses ícones a partir do seu logo usando sites como [favicon-generator.org](https://www.favicon-generator.org/).

Para gerar a versão atualizada do site com o manifesto:
```bash
npm run build
node deploy.js
```

---

## 2. Ferramenta: Bubblewrap (Via NPX)

No Arch Linux, evite instalar pacotes npm globalmente (`sudo npm i -g`). Vamos usar o `npx` que executa o pacote temporariamente sem poluir o sistema.

### Pré-requisitos (Java/JDK)

Verifiquei que você já tem o Java instalado (`openjdk 25`). O Bubblewrap geralmente exige JDK 11 ou 17. Se ele reclamar da versão, você pode instalar o JDK 17 LTS:

```bash
sudo pacman -S jdk17-openjdk
```
E selecionar o 17 como padrão com `archlinux-java` se necessário, mas tente rodar sem isso primeiro.

### Inicializando o Projeto Android

1.  Crie uma pasta separada para o projeto nativo:
    ```bash
    mkdir android-twa
    cd android-twa
    ```

2.  Inicie o processo usando **npx**:
    ```bash
    npx @bubblewrap/cli init --manifest http://kocheautomotiva.com.br/guia-de-aplicacao/manifest.json
    ```

3.  Responda o questionário:
    *   **Domain**: `kocheautomotiva.com.br`
    *   **Application Name**: Guia de Aplicação Kóche
    *   **Short Name**: Guia Kóche
    *   **Application ID**: `br.com.kocheautomotiva.guia` (Exemplo)
    *   **Start URL**: `/guia-de-aplicacao/`
    *   **Display Mode**: Standalone/Fullscreen
    *   **Key Store**: Deixe ele criar uma nova. **GUARDE PASTA DE CHAVES E SENHAS!**

4.  Construindo o App:
    ```bash
    npx @bubblewrap/cli build
    ```

O arquivo gerado (`app-release-bundle.aab`) é o que você envia para a Play Store.

---

## 3. Validação de Propriedade (Digital Asset Links)

Para tirar a barra de endereço do navegador dentro do app:

1.  Após o build, o Bubblewrap vai gerar um arquivo `assetlinks.json`.
2.  Copie o conteúdo desse arquivo.
3.  Crie um arquivo local chamado `assetlinks.json` dentro da pasta `public/.well-known/` do seu projeto Vite (crie a pasta `.well-known` dentro de `public` se não existir).
4.  Faça o deploy novamente: `npm run build` e `node deploy.js`.

---

## 4. Google Play Console

1.  Crie uma conta de desenvolvedor ($25 USD).
2.  Crie um novo App.
3.  No menu **Produção**, faça o upload do arquivo `.aab`.
4.  Preencha todos os dados da loja (Screenshots, Descrição, etc).

---
