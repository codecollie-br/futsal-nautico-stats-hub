# Futsal Náutico Stats Hub

## Sobre o Projeto

Este projeto é uma aplicação para gerenciamento e visualização de estatísticas de futsal do Náutico.

## Tecnologias Utilizadas

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## Como rodar localmente

1. Clone o repositório:
   ```sh
   git clone <YOUR_GIT_URL>
   ```
2. Acesse o diretório do projeto:
   ```sh
   cd <YOUR_PROJECT_NAME>
   ```
3. Instale as dependências:
   ```sh
   npm install
   ```
4. Inicie o servidor de desenvolvimento:
   ```sh
   npm run dev
   ```

## Contribuição

Sinta-se à vontade para abrir issues ou pull requests para sugerir melhorias ou reportar problemas.

# Funcionalidades Pendentes - Plataforma Futsal do Náutico v4.0

Este documento lista todas as funcionalidades e requisitos que ainda precisam ser implementados ou verificados, com base na análise do PRD e do código existente.

---

## 1. Princípios e Arquitetura Geral

*   **Experiência do Usuário (UX):**
    *   **Tema Claro / Escuro (Dark Mode):** Implementação de um botão de alternância para o usuário escolher entre tema claro e escuro.
    *   **Microinterações Sonoras:** Adicionar efeitos sonoros para ações chave (apito final do cronômetro, comemoração de gol).
*   **Abordagem de Design (Mobile-First):** Verificação e otimização da responsividade e UX para dispositivos móveis (necessita de testes e análise de CSS/layout).
*   **Arquitetura de Ilhas (Astro com Preact/Svelte):** Confirmar a orquestração do Astro e a utilização de "ilhas" interativas para componentes de alta interatividade (como a tela da partida), otimizando o carregamento e a performance.
*   **Comunicação em Tempo Real (SSE - Server-Sent Events):** Implementação de SSE para atualizações ao vivo de placares e lista de presença. (Atualmente, parece estar usando polling ou revalidação de cache, mas não SSE explícito).

---

## 2. Módulo de Gestão de Jogadores

*   **Upload e Corte de Imagem (`Cropper.js`):** Implementação da lógica para upload de imagem que permita o corte e enquadramento da foto no formulário de criação/edição de jogadores. (Provável localização: `src/components/jogadores/JogadorForm.tsx`).

---

## 3. Módulo de Partida Ao Vivo

*   **Salvaguarda "Cronômetro em 00:00":** Implementar o alerta "O cronômetro parece não ter sido iniciado..." se um gol for marcado com o tempo em 00:00.
*   **Substituição de Jogadores:** Criar a interface e a lógica para permitir a seleção de um jogador em quadra e um na lista de espera para realizar a troca, registrando o evento.
*   **Atualização da Fila de Espera no Banco:** Completar a lógica na função `logicaPosPartida` para persistir as alterações na fila de espera no banco de dados (mover jogadores que "saem" para o final da fila, com prioridade se aplicável).

---

## 4. Módulo de Comunidade e Engajamento

*   **Votação "Craque do Domingo":**
    *   Desenvolver a funcionalidade da API para liberar a votação ao final do último jogo do domingo.
    *   Criar a interface na página do domingo para que cada jogador participante do dia possa registrar seu único voto.
*   **"Time do Domingo":** Desenvolver um componente que, ao final do dia, busca os jogadores com melhor performance (com base na pontuação definida no PRD) e os exibe como um "time ideal".
*   **Resumo Automático para WhatsApp:** Criar um botão "Copiar Resumo para WhatsApp" que gera e copia um texto formatado com as principais estatísticas do dia.

---

## 5. Módulo de Administração

*   **Edição de Histórico:** Desenvolver uma interface protegida para que um administrador possa editar dados de domingos passados (participantes, placares, eventos de partida). (Página `src/pages/Admin.tsx`).
*   **Modo de Inclusão Rápida:** Criar um formulário simplificado dentro do painel de administração para cadastrar rapidamente os resultados de jogos antigos, sem a necessidade de simular o fluxo de uma partida ao vivo. (Página `src/pages/Admin.tsx`).

---

## 6. Lógica de Cálculo de Estatísticas (Regras de Negócio)

*   **Gols Sofridos:** Implementar a lógica para que, para cada evento 'GOL', todos os jogadores do time que sofreu o gol (buscados em `Jogadores_por_Partida`) recebam `+1` em seus gols sofridos (incluindo gols contra).
*   **Minutos Jogados:** Implementar a lógica para que, na finalização de cada partida, a `duracao_minutos` seja somada ao `total_minutos_jogados` de todos os 10 jogadores que participaram da partida.
*   **Elegibilidade para Prêmios:** Desenvolver a lógica para calcular o percentual de participação de um jogador (`>= 40% do total de domingos em que houve jogos no ano`) para que ele apareça nos rankings anuais.

---

## 7. Configuração Técnica

*   **Credenciais de Conexão (`.env`):** Verificar se as credenciais do banco de dados estão sendo carregadas corretamente de um arquivo `.env` e nunca hardcoded na aplicação.

---

Este é um plano de alto nível. Podemos mergulhar em cada um desses itens conforme avançamos. Qual deles você gostaria de priorizar e começar a trabalhar?
