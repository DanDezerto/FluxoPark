# Manual do Usuário

Este manual apresenta o funcionamento do FluxoPark para os perfis de usuário e explica como navegar pela aplicação em ambiente local.

## 1. Acesso ao sistema

Após iniciar a aplicação localmente, use a URL informada pelo Vite ou pelo servidor de produção:

- Desenvolvimento: `http://localhost:5173/...`
- Produção local: `http://localhost:3000/...`

A página inicial do motorista geralmente é:

```text
http://localhost:5173/paginaInicialMotorista.html
```

Também é possível acessar diretamente a página de reserva com parâmetro de destino:

```text
http://localhost:5173/paginaReserva.html?placeId=demo-park-abc
```

## 2. Perfis do sistema

### 2.1 Motorista

O motorista pode:

- realizar busca por estacionamentos
- visualizar vagas disponíveis
- reservar estacionamento
- cadastrar e manter veículos
- gerir formas de pagamento fictícias
- consultar reservas e histórico
- cancelar ou alterar reservas

### 2.2 Parceiro de estacionamento

O parceiro pode:

- acessar seu painel de gestão
- cadastrar ou validar estacionamentos
- manter vagas e regras de operação
- responder a pendências da plataforma

### 2.3 Administrador

O administrador pode:

- aprovar solicitações de parceiros
- tratar denúncias
- aplicar sanções
- acessar o painel de gestão de usuários e operações

## 3. Login e autenticação de demonstração

O sistema de demonstração usa perfis locais. Consulte `DADOS_MOCKS.md` para as credenciais exatas.

Exemplos:

- Motorista: `motorista@exemplo.test`
- Parceiro: `parceiro@exemplo.test`
- Administrador: `administrador@exemplo.test`

> A autenticação no projeto é apenas para demonstração local. Não é um mecanismo de segurança de produção.

## 4. Fluxo do motorista

### 4.1 Cadastro e login

1. Acesse a tela de cadastro do motorista
2. Informe dados básicos, e-mail, senha e dados do veículo
3. Faça login com as credenciais informadas

### 4.2 Busca de estacionamentos

Na página inicial, o usuário pode:

- buscar por endereço ou ponto de referência
- visualizar estacionamentos próximos
- consultar distância, horário e status de vagas
- selecionar um estacionamento para continuar

### 4.3 Reserva de vaga

Ao selecionar um estacionamento:

1. escolha o período de entrada e saída
2. confirme o veículo associado
3. escolha ou cadastre um carro, se necessário
4. revise o valor estimado e a taxa aplicada
5. confirme a reserva

### 4.4 Validação de regras

O sistema considera:

- horários de funcionamento do estacionamento
- disponibilidade da vaga
- tags da vaga (Coberta, Descoberta, Especial)
- limite de permanência e regras de pernoite
- conflitos com reservas existentes

### 4.5 Edição e cancelamento

Na conta do motorista, é possível:

- visualizar reservas ativas
- editar a reserva quando houver janela permitida
- cancelar a reserva
- verificar reembolso ou cobrança simulada exibida no sistema

> A alteração é permitida apenas dentro das regras da aplicação e com antecedência mínima definida pelo sistema.

## 5. Fluxo do parceiro de estacionamento

### 5.1 Login

O parceiro entra com e-mail e senha cadastrados para a conta do responsável.

### 5.2 Gestão do estacionamento

Após o login, o parceiro pode:

- visualizar os estacionamentos vinculados
- alterar dados do local
- ajustar regras de funcionamento
- configurar vagas e preços
- acompanhar status da aprovação

### 5.3 Cadastro de novo estabelecimento

1. Preencha os dados do responsável e do local
2. Cadastre horários de operação
3. Defina vagas e tarifas
4. Envie para aprovação do administrador

## 6. Fluxo do administrador

O administrador acessa a área de tratamento de requisições e pode:

- aprovar parceiros
- rejeitar solicitações
- responder denúncias
- aplicar medidas de banimento
- definir status e encaminhamentos

## 7. Uso de dados fictícios e mocks

Para testes, o sistema inclui perfis de demonstração em `mocks/`.

Esses arquivos ajudam a simular:

- motorista com veículo
- parceiro com estacionamento
- administrador
- estabelecimento com vagas e tarifas

O arquivo `DADOS_MOCKS.md` reúne dados completos, incluindo:

- e-mails
- senhas
- nomes
- veículos
- endereços
- tarifas por faixa
- identificadores

## 8. Operação prática do usuário

### Para um motorista

1. Acesse a página inicial
2. Faça login
3. Busque um estacionamento próximo
4. Escolha uma vaga disponível
5. Defina datas e horários
6. Confirme a reserva
7. Consulte a conta para ver detalhes, editar ou cancelar

### Para um parceiro

1. Faça login com a conta de parceiro
2. Acesse o painel do estabelecimento
3. Configure horários, vagas e valores
4. Revise as solicitações pendentes
5. Atualize as informações conforme necessário

### Para um administrador

1. Faça login com a conta administrativa
2. Acesse o painel de tratamento de requisições
3. Avalie pendências e denúncias
4. Aplique decisões conforme o fluxo da aplicação

## 9. Regras e limitações do sistema

- A aplicação local é uma demonstração funcional, não um sistema de produção
- O pagamento é simulado
- Os dados não devem ser usados como informações reais
- O comportamento de login e banco de dados é simplificado para fins de teste local
- O Google Maps só funciona corretamente com a configuração local de chave e permissões

## 10. Resumo de uso

O FluxoPark foi pensado para facilitar a busca, a reserva e o gerenciamento de vagas de estacionamento em ambiente didático. O uso de mocks e dados sintéticos permite simular cenários reais de operação sem depender de dados operacionais reais.

## 11. Documentação complementar

- `README.md`
- `DADOS_MOCKS.md`
- `MANUAL_INSTALACAO.md`
- `MANUAL_OPERACAO.md`
