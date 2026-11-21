# Manual de Operação

Este documento descreve como operar o FluxoPark em ambiente local de desenvolvimento e como realizar o uso correto dos módulos do sistema.

## 1. Visão geral

O FluxoPark é uma aplicação de reserva de vagas de estacionamento, com fluxos para:

- Motorista
- Parceiro de estacionamento
- Administrador

A solução combina:

- Frontend em React + Vite
- API REST local desenvolvida com Express
- PostgreSQL local conectado à API por Prisma
- `backend/db.json` mantido como origem dos dados fictícios para importação
- Mocks de teste em `backend/mocks/`

## 2. Estrutura relevante do projeto

- `frontend/` — aplicação React/Vite e arquivos estáticos
- `backend/db.json` — dados fictícios iniciais, importados para o PostgreSQL
- `backend/server.js` — servidor local com lógica de validação e rotas personalizadas
- `docker-compose.yml` — configuração do PostgreSQL local para desenvolvimento
- `backend/prisma/` — schema e migrações do PostgreSQL
- `backend/mocks/` — perfis e dados de demonstração para testes
- `DADOS_MOCKS.md` — credenciais e dados de exemplo

## 3. Scripts disponíveis

Na raiz do projeto, os comandos principais são:

```bash
npm install
npm run api
npm run dev
npm run build
npm start
```

### Função de cada script

- `npm install` — instala as dependências
- `npm run api` — inicia a API Express conectada ao PostgreSQL
- `npm run dev` — inicia o ambiente de desenvolvimento do frontend
- `npm run build` — gera build de produção
- `npm test` — executa os testes automatizados do backend Express
- `npm run test:integration --workspace backend` — testa os endpoints Prisma no PostgreSQL; defina antes `PRISMA_TEST_DATABASE_URL` com uma URL de banco de desenvolvimento/teste
- `npm start` — monta a aplicação e serve a versão de produção local

## 4. Processo de inicialização

### Ambiente de desenvolvimento

1. Inicie o Docker Desktop e o PostgreSQL:

```bash
docker compose up -d
```

2. Instale as dependências:

```bash
npm install
```

3. Inicie a API:

```bash
npm run api
```

4. Em outro terminal, inicie o frontend:

```bash
npm run dev
```

5. Acesse o sistema pelo endereço informado pelo Vite.

> A API persiste no PostgreSQL usando Prisma. Para importar ou atualizar os
> dados fictícios de `backend/db.json`, execute `npm run db:import --workspace backend`.
> A tela de busca lista os estacionamentos do PostgreSQL; o Google Maps é
> opcional para localizar o destino e calcular rotas.

### Ambiente de produção local

```bash
npm start
```

Depois, acesse:

- `http://localhost:3000/paginaInicialMotorista.html`
- `http://localhost:3000/paginaReserva.html?parkingId=mock-parking`

## 5. Operação do módulo de motorista

O motorista pode:

- Buscar estacionamentos
- Consultar vagas disponíveis
- Reservar uma vaga por período
- Informar dados do veículo
- Salvar métodos de pagamento fictícios
- Visualizar reservas
- Cancelar ou editar reservas com regras específicas

### Regras importantes

- A reserva exige que exista um veículo cadastrado.
- O cálculo do valor considera as tags da vaga e o intervalo de permanência.
- A duração máxima da reserva é de 24 horas.
- Alterações e cancelamentos são persistidos no PostgreSQL para fins de demonstração.
- Reservas confirmadas podem ser alteradas com antecedência mínima de 24 horas.

## 6. Operação do módulo de parceiro

O parceiro de estacionamento pode:

- Fazer login com conta de parceiro
- Acessar os estacionamentos vinculados à conta
- Gerenciar vagas, horários e regras do local
- Cadastrar/atualizar informações do estacionamento
- Solicitar aprovação administrativa

### Observação

Novos cadastros de parceiros ficam pendentes até aprovação administrativa. A aprovação é realizada por um administrador.

## 7. Operação do módulo de administrador

O administrador pode:

- Acessar o painel administrativo
- Aprovar ou recusar solicitações de parceiros
- Responder denúncias
- Aplicar banimentos
- Validar cadastros por código de registro

### Código de registro administrativo

No ambiente local, o código padrão é:

```text
administrador123
```

Esse valor pode ser alterado pela variável `ADMIN_REGISTRATION_CODE` no ambiente do servidor.

## 8. Uso de mock de dados

Para simular usuários e parceiros, use os arquivos em `backend/mocks/`.

Os principais arquivos são:

- `backend/mocks/motorista.json`
- `backend/mocks/estabelecimento.json`
- `backend/mocks/estabelecimento-valonguinho.json`
- `backend/mocks/administrador.json`

### Como aplicar os mocks

1. Adicione os objetos de demonstração às coleções correspondentes em `backend/db.json`.
2. Execute `npm run db:import --workspace backend` para importar ou sincronizar os registros.

> Evite duplicar `id` e e-mail. Isso pode gerar conflitos de login e registros repetidos.

## 9. Limpeza e reset dos dados

Para remover registros gerados em testes:

1. Pare a API local
2. Use o pgAdmin ou Prisma Studio para gerenciar os dados do PostgreSQL.

O importador é idempotente para registros com o mesmo ID. Para limpar dados,
use pgAdmin ou Prisma Studio com cuidado; registros históricos relacionados
podem impedir exclusões físicas.

## 10. Monitoramento e diagnóstico

Durante a operação, observe:

- Console do terminal da API
- Console do terminal do Vite
- pgAdmin ou Prisma Studio para verificar registros criados
- Logs de erros em páginas e modais do sistema

### Indicadores comuns

- Erro de porta ocupada
- Mapa não carregando
- Falha ao buscar estacionamentos
- Reserva rejeitada por conflito de horários

## 11. Boas práticas de operação

- Use somente dados fictícios de teste
- Não reutilize senhas reais
- Evite inserir cartões reais em qualquer ambiente de desenvolvimento
- Mantenha a configuração do Google Maps restrita por domínio
- Faça backup do volume PostgreSQL antes de operações administrativas

## 12. Situação de uso em produção

A solução local é uma simulação funcional. Em produção, o sistema deve receber melhorias de segurança, incluindo:

- autenticação forte
- controle de acesso por perfil
- armazenamento seguro de senhas
- processamento seguro de pagamentos
- auditoria e logs completos
- integração com backend real e banco de dados persistente

## 13. Acesso rápido

Documentação complementar:

- `README.md`
- `DADOS_MOCKS.md`
- `MANUAL_INSTALACAO.md`
- `MANUAL_USUARIO.md`
