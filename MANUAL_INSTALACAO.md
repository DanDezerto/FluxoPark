# Manual de Instalação

Este documento descreve como preparar, instalar e executar o FluxoPark em ambiente local de desenvolvimento.

## 1. Requisitos

Antes de iniciar, verifique se o ambiente atende aos itens abaixo:

- Node.js 18 ou superior
- npm 9 ou superior
- Git (opcional, mas recomendado para clonar o projeto)
- Navegador moderno (Chrome, Edge, Firefox)
- Acesso à internet para consultar API do Google Maps, quando habilitada

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
cp FluxoPark/public/config.example.js FluxoPark/public/config.local.js
```

No Windows PowerShell:

```powershell
Copy-Item FluxoPark/public/config.example.js FluxoPark/public/config.local.js
```

2. Edite o arquivo `FluxoPark/public/config.local.js` e informe:
   - `googleMapsApiKey`
   - `googleMapsPartnerPlaceIds`

3. Habilite no Google Cloud as APIs necessárias, como:
   - Maps JavaScript API
   - Places API (New)
   - Routes API

> Importante: a chave usada no navegador pode ser visível ao cliente. Restrinja o uso por domínio e APIs necessárias para reduzir riscos de exposição.

## 5. Execução do ambiente local

O projeto usa duas partes em paralelo:

- API local com `json-server`
- Aplicação frontend em React + Vite

### 5.1 Iniciar a API local

No terminal, na raiz do projeto:

```bash
npm run api
```

Isso inicia o servidor em `http://localhost:3000` com os dados de `db.json`.

### 5.2 Iniciar o frontend

Abra um segundo terminal e execute:

```bash
npm run dev
```

A aplicação fica disponível em uma URL local do Vite, normalmente algo como:

- `http://localhost:5173/paginaInicialMotorista.html`
- `http://localhost:5173/paginaReserva.html?placeId=demo-park-abc`

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
- `http://localhost:3000/paginaReserva.html?placeId=demo-park-abc`

## 7. Dados de demonstração

O projeto inclui dados mockados em `mocks/` e em `db.json` para testes locais.

Para usar um mock de exemplo, copie os objetos de cada coleção para o arquivo `db.json` e reinicie a API.

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

- O `json-server` salva alterações em `db.json`.
- Para limpar reservas de teste, pare a API e substitua o conteúdo de `reservations` por `[]`.
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

- `FluxoPark/public/config.local.js` existe
- A chave do Google Maps está correta
- As APIs necessárias estão habilitadas
- O domínio está autorizado no Google Cloud

## 11. Observação final

Este manual cobre a execução local e de demonstração do FluxoPark. Para uso em produção, o sistema deve contar com autenticação segura, autorização, armazenamento de senhas e integração real com processamento de pagamentos e gerenciamento de identidade.
