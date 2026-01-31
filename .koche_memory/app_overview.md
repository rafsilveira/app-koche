# App Kóche - Visão Geral

O **App Kóche** é uma aplicação web (PWA) desenvolvida para auxiliar aplicadores de fluidos de transmissão automática (ATF). Ele serve como um guia técnico rápido para consulta de especificações, procedimentos e suporte via IA.

## Tecnologias Principais

- **Frontend**: React.js com Vite.
- **Estilização**: CSS Vanilla (foco em estética premium e mobile-first).
- **Backend/Serviços**:
  - **Firebase**: Autenticação e banco de dados em tempo real.
  - **Gemini AI**: Integração de assistente inteligente para suporte técnico.
- **Distribuição**:
  - **PWA**: Instalável em dispositivos móveis.
  - **Android (TWA)**: Disponível na Play Store como uma Trusted Web Activity.
  - **Hospedagem**: Hostinger (acessível via subdiretório em `kocheautomotiva.com.br`).

## Arquitetura de Dados

O aplicativo utiliza um arquivo JSON (`Data_Carros_Koche_App.json`) como fonte primária de informações técnicas de veículos, permitindo uma navegação por Marca -> Modelo -> Ano -> Motorização.

## Objetivos do Projeto

1. Facilitar a escolha do fluido ATF correto.
2. Fornecer instruções visuais (fotos de conectores e vídeos).
3. Oferecer suporte técnico imediato via Chatbot com IA treinada em manuais de transmissão.
