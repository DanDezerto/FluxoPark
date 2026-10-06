# Dados de mocks para testes

Os arquivos em `mocks/` fornecem perfis de demonstração para cada tipo de conta
do FluxoPark:

- `mocks/motorista.json`: motorista e um veículo cadastrado.
- `mocks/estabelecimento.json`: conta de parceiro, estacionamento e vagas.
- `mocks/estabelecimento-valonguinho.json`: mock do Estacionamento Valonguinho,
  com Place ID e informações públicas disponíveis no Google Maps.
- `mocks/administrador.json`: conta administrativa.

Os registros usam o formato das coleções JSON da API. Para usar um mock,
adicione os objetos de cada coleção ao respectivo array em `db.json` e reinicie
o servidor da API. Evite inserir o mesmo `id` ou e-mail mais de uma vez. Os
dados são genéricos e exclusivos para desenvolvimento local; não os use em
produção.

## Credenciais de teste

| Perfil | E-mail | Senha |
| --- | --- | --- |
| Motorista | `motorista@exemplo.test` | `MotoristaTeste2026!` |
| Parceiro de estacionamento | `parceiro@exemplo.test` | `ParceiroTeste2026!` |
| Parceiro Valonguinho | `valonguinho@exemplo.test` | `ValonguinhoTeste2026!` |
| Administrador | `administrador@exemplo.test` | `AdminTeste2026!` |

O cadastro de novos administradores também exige o código configurado na API.
No ambiente local padrão, esse código é `administrador123`; contas mock já
criadas entram apenas com e-mail e senha.

## Dados preenchidos

### Motorista

- Nome: `Motorista de Teste`
- Celular: `+55 21 90000-0000`
- Veículo: placa `ABC1D23`, modelo `Hatch de teste`, cor `Prata`
- Identificadores: conta `mock-driver`, veículo `mock-vehicle`
- Coleção: `users`

### Parceiro de estacionamento

- Responsável demonstrativo: conta `mock-parking-partner`
- CNPJ de teste: `00000000000191`
- Estabelecimento: `Estacionamento de Teste`, Rua de Exemplo, 100, Centro,
  Niterói - RJ
- ID do estacionamento: `mock-parking`; o ID Google Places está vazio para não
  representar uma parceria ou localização real.
- Funcionamento: todos os dias às 08:00; fecha às 22:00 de domingo a quinta e
  às 23:00 às sextas e sábados; permite pernoite.
- Vagas: `COB-01` (Coberta), `DES-01` (Descoberta) e `ESP-01` (Descoberta e
  Especial). Nenhuma vaga combina Coberta e Descoberta.
- Tarifas por hora, definidas pelo total reservado:

| Tag | Até 1 hora | Mais de 1 até 4 horas | Mais de 4 horas |
| --- | ---: | ---: | ---: |
| Coberta | R$ 8,00 | R$ 6,00 | R$ 5,00 |
| Descoberta | R$ 5,00 | R$ 4,00 | R$ 3,00 |
| Especial | R$ 5,00 | R$ 4,00 | R$ 3,00 |

O valor da faixa selecionada é aplicado a cada hora da reserva. A faixa “Mais
de 4 horas” também é aplicada após 12 horas; reservas continuam limitadas a 24
horas.

### Estacionamento Valonguinho

- Nome no Google Maps: `Estacionamento Valonguinho - Niteroi Rotativo`
- Place ID: `ChIJ37e0yxKDmQARQ1nMiBragMs`
- Endereço: Av. Visconde do Rio Branco - Centro, Niterói - RJ, 24020-130
- Telefone: `+55 21 2621-4797`
- Coordenadas: latitude `-22.8960886`, longitude `-43.1255404`
- Avaliação indicada: `4.0/5`, com `51` avaliações
- Horário indicado: aberto 24 horas todos os dias
- Link enviado: <https://maps.app.goo.gl/nJqYyZjT9wQsKfiZ6>
- Identificadores locais: conta `mock-valonguinho-partner`, estacionamento
  `mock-estacionamento-valonguinho`
- Os valores por faixa, a tolerância, as vagas e suas tags são exemplos
  genéricos. O Google Maps não confirma preços, capacidade nem parceria com o
  FluxoPark.

### Administrador

- Nome: `Administrador de Teste`
- CPF de teste: `00000000000`
- ID da conta: `mock-administrator`
- Coleção: `administrators`

As senhas são armazenadas nos JSONs como SHA-256 para corresponder ao login
demonstrativo do projeto. Esse formato não é apropriado para autenticação em
produção; os perfis são apenas dados sintéticos de teste.
