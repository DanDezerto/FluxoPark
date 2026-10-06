# Manual de Operação

Este documento descreve como operar o FluxoPark em ambiente local de desenvolvimento e como realizar o uso correto dos módulos do sistema.

## 1. Visão geral

O FluxoPark é uma aplicação de reserva de vagas de estacionamento, com fluxos para:

- Motorista
- Parceiro de estacionamento
- Administrador

A solução combina:

- Frontend em React + Vite
- API REST local com `json-server`
- Arquivos de dados em `db.json`
- Mocks de teste em `mocks/`

## 2. Estrutura relevante do projeto

- `FluxoPark/` — arquivos do frontend em React
- `db.json` — base de dados local da API
- `server.js` — servidor local com lógica de validação e rotas personalizadas
- `mocks/` — perfis e dados de demonstração para testes
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
- `npm run api` — inicia o servidor JSON local
- `npm run dev` — inicia o ambiente de desenvolvimento do frontend
- `npm run build` — gera build de produção
- `npm start` — monta a aplicação e serve a versão de produção local

## 4. Processo de inicialização

### Ambiente de desenvolvimento

1. Instale as dependências:

```bash
npm install
```

2. Inicie a API:

```bash
npm run api
```

3. Em outro terminal, inicie o frontend:

```bash
npm run dev
```

4. Acesse o sistema pelo endereço informado pelo Vite.

### Ambiente de produção local

```bash
npm start
```

Depois, acesse:

- `http://localhost:3000/paginaInicialMotorista.html`
- `http://localhost:3000/paginaReserva.html?placeId=demo-park-abc`

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
- Alterações e cancelamentos são registradas apenas em `db.json` para fins de demonstração.
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

Para simular usuários e parceiros, use os arquivos em `mocks/`.

Os principais arquivos são:

- `mocks/motorista.json`
- `mocks/estabelecimento.json`
- `mocks/estabelecimento-valonguinho.json`
- `mocks/administrador.json`

### Como aplicar os mocks

1. Abra `db.json`
2. Adicione os objetos dos mocks nos arrays correspondentes
3. Reinicie a API local

> Evite duplicar `id` e e-mail. Isso pode gerar conflitos de login e registros repetidos.

## 9. Limpeza e reset dos dados

Para remover registros gerados em testes:

1. Pare a API local
2. Abra `db.json`
3. Substitua `reservations` por `[]`
4. Reinicie a API

Se houver necessidade de resetar usuários, repita o procedimento nos arrays relevantes e verifique se os IDs não foram duplicados.

## 10. Monitoramento e diagnóstico

Durante a operação, observe:

- Console do terminal da API
- Console do terminal do Vite
- Arquivo `db.json` para verificar registros criados
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
- Faça backup de `db.json` antes de limpar ou alterar grandes conjuntos de dados

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
