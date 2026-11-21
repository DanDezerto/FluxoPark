# Manual de Instalação

Este documento descreve como preparar, instalar e executar o FluxoPark em ambiente local de desenvolvimento.

## 1. Requisitos

Antes de iniciar, verifique se o ambiente atende aos itens abaixo:

- Node.js 18 ou superior
- npm 9 ou superior
- Docker Desktop com Docker Compose
- WSL 2 habilitado no Windows para o motor Linux do Docker Desktop
- Git (opcional, mas recomendado para clonar o projeto)
- Navegador moderno (Chrome, Edge, Firefox)
- Acesso à internet para consultar API do Google Maps, quando habilitada
- Dependências instaladas por `npm install`, incluindo Express no backend

## 2. Clonagem do projeto

```bash
git clone https://github.com/DanDezerto/FluxoPark.git
cd FluxoPark
```

Se o projeto já estiver disponível localmente, basta entrar na pasta raiz do repositório.

## 3. Instalação das dependências

Na raiz do projeto, execute:

```bash
npm install
```

Se o ambiente for Windows PowerShell e o comando `npm` estiver bloqueado pela política de execução do sistema, use:

```powershell
npm.cmd install
```

## 4. Configuração do Google Maps

Para ativar a busca e os mapas reais, é necessário configurar a chave do Google Maps.

1. Copie o arquivo de exemplo:

```bash
cp frontend/public/config.example.js frontend/public/config.local.js
```

No Windows PowerShell:

```powershell
Copy-Item frontend/public/config.example.js frontend/public/config.local.js
```

2. Edite o arquivo `frontend/public/config.local.js` e informe:
   - `googleMapsApiKey`
   - `googleMapsPartnerPlaceIds`

3. Habilite no Google Cloud as APIs necessárias, como:
   - Maps JavaScript API
   - Places API (New)
   - Routes API

> Importante: a chave usada no navegador pode ser visível ao cliente. Restrinja o uso por domínio e APIs necessárias para reduzir riscos de exposição.

## 5. Execução do ambiente local

O projeto usa o frontend Vite, a API Express e, durante a preparação do banco,
um PostgreSQL local executado pelo Docker Compose.

### 5.1 Iniciar o PostgreSQL local

Instale e inicie o Docker Desktop. Na raiz do projeto, execute:

```powershell
docker compose up -d
docker compose ps
```

O serviço `postgres` deve aparecer como `running` ou `healthy`. O Compose cria
um volume local persistente para que reiniciar ou parar o container não apague
os dados. A configuração atual é exclusiva para desenvolvimento; não reutilize
essas credenciais em produção.

O PostgreSQL do container fica disponível em `localhost:5433`. Essa porta
externa evita conflito com instalações locais do PostgreSQL que usam `5432`;
dentro do container, o serviço continua usando a porta padrão `5432`.

Para parar o banco sem apagar os dados:

```powershell
docker compose down
```

Não use `docker compose down -v` se quiser preservar os dados locais.

### 5.2 Preparar o schema Prisma

Crie a configuração local da conexão e aplique a migração inicial:

```powershell
Copy-Item backend\.env.example backend\.env
npm install
npm run prisma:migrate --workspace backend -- --name init
```

O schema e o histórico de migrações ficam em `backend/prisma`. A aplicação usa o
PostgreSQL como fonte de dados. Para importar ou atualizar os estacionamentos,
vagas e demais exemplos fictícios de `backend/db.json` (a operação pode ser
repetida com segurança), execute:

```powershell
npm run db:import --workspace backend
```

Após a importação, a busca do motorista lista estacionamentos do banco. O
Google Maps é opcional e serve para localizar o destino e calcular rotas entre
ele e os estacionamentos que têm coordenadas cadastradas.

### 5.3 Iniciar a API local

No terminal, na raiz do projeto:

```bash
npm run api
```

Isso inicia o servidor Express em `http://localhost:3000`, conectado ao
PostgreSQL. Configure `backend/.env` e aplique as migrações antes da primeira
execução.

Para validar as rotas Prisma usando o banco local, defina a variável de teste e
execute:

```powershell
$env:PRISMA_TEST_DATABASE_URL = "postgresql://fluxopark:fluxopark_dev_only@localhost:5433/fluxopark?schema=public"
npm run test:integration --workspace backend
```

### 5.4 Iniciar o frontend

Abra um segundo terminal e execute:

```bash
npm run dev
```

A aplicação fica disponível em uma URL local do Vite, normalmente algo como:

- `http://localhost:5173/paginaInicialMotorista.html`
- `http://localhost:5173/paginaReserva.html?parkingId=mock-parking`

## 6. Execução em produção local

Para gerar a versão de produção e servir o app junto com a API:

```bash
npm start
```

No PowerShell do Windows:

```powershell
npm.cmd start
```

Acesso sugerido:

- `http://localhost:3000/paginaInicialMotorista.html`
- `http://localhost:3000/paginaReserva.html?parkingId=mock-parking`

## 7. Dados de demonstração

O projeto inclui dados mockados em `backend/mocks/` e em `backend/db.json` para testes locais.

Para importar ou sincronizar os dados de `backend/db.json` no PostgreSQL,
execute `npm run db:import --workspace backend`.

A documentação detalhada dos perfis e credenciais está em:

- `DADOS_MOCKS.md`

Perfis disponíveis:

- Motorista
- Parceiro de estacionamento
- Administrador

## 8. Credenciais de teste

As credenciais de ambiente local estão descritas em `DADOS_MOCKS.md`. Exemplo:

- Motorista: `motorista@exemplo.test` / `MotoristaTeste2026!`
- Parceiro: `parceiro@exemplo.test` / `ParceiroTeste2026!`
- Administrador: `administrador@exemplo.test` / `AdminTeste2026!`

## 9. Dicas de manutenção

- O backend Express salva as alterações no PostgreSQL.
- Para consultar o banco, use pgAdmin ou Prisma Studio (`npm run prisma:studio --workspace backend`).
- Não use dados reais de cartão, CPF, e-mail ou senha em ambiente local.
- O projeto é uma demonstração de fluxo funcional e não possui autenticação e autorização de produção.

## 10. Solução de problemas comuns

### Erro ao iniciar o Vite

Verifique se o Node.js foi instalado corretamente:

```bash
node -v
npm -v
```

### API não responde

Confirme se o comando `npm run api` está em execução e se a porta `3000` está livre.

### Mapa não carrega

Verifique:

- `frontend/public/config.local.js` existe
- A chave do Google Maps está correta
- As APIs necessárias estão habilitadas
- O domínio está autorizado no Google Cloud

## 11. Observação final

Este manual cobre a execução local e de demonstração do FluxoPark. Para uso em produção, o sistema deve contar com autenticação segura, autorização, armazenamento de senhas e integração real com processamento de pagamentos e gerenciamento de identidade.
