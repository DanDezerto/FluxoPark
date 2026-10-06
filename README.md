# FluxoPark

## Aplicação React

O projeto usa React 18 com Vite e mantém páginas HTML separadas para busca,
reserva, conta do motorista, métodos de pagamento, denúncias e administração.
O JSX está em `FluxoPark/src`, organizado em páginas, componentes, módulos de
API, providers e validação. A busca usa
TanStack Query para carregar a lista local; a reserva usa TanStack Query para
consultar os estacionamentos, vagas e reservas e para gravar a solicitação.
React Hook Form com Zod valida os dados do motorista. Tailwind continua
carregado pela CDN e os estilos próprios ficam em arquivos CSS externos.

## Reserva e API local

O projeto usa o json-server para fornecer uma API REST local a partir de
`db.json`. Com Node.js e npm instalados, na raiz do repositório instale as
dependências:

```sh
npm install
```

No PowerShell do Windows, caso `npm` seja bloqueado pela política de scripts,
use `npm.cmd install`.

Para desenvolver, abra dois terminais na raiz do repositório. No primeiro,
inicie a API:

```sh
npm run api
```

No segundo, inicie o Vite:

```sh
npm run dev
```

No PowerShell do Windows, use `npm.cmd run api` e `npm.cmd run dev` se o comando
`npm` for bloqueado pela política de scripts. Abra a URL local informada pelo
Vite, normalmente `http://localhost:5173/paginaInicialMotorista.html` ou
`http://localhost:5173/paginaReserva.html?placeId=demo-park-abc`. O proxy do
Vite encaminha `/parkings`, `/spots`, `/reservations` e `/reviews` para a API em
`localhost:3000`. O proxy encaminha também `/paymentMethods`, `/reports`,
`/partnerRequests`, `/administrators` e `/admin`. A API customizada em
`server.js` valida o código de cadastro administrativo antes de criar uma
conta.

Para gerar e servir a versão de produção junto com o json-server:

```sh
npm start
```

No Windows PowerShell, execute `npm.cmd start`. Acesse
`http://localhost:3000/paginaInicialMotorista.html` para a busca ou
`http://localhost:3000/paginaReserva.html?placeId=demo-park-abc` para testar a
reserva do estacionamento ABC.

O json-server grava as alterações em `db.json`. Use somente dados fictícios de
motorista durante os testes: nome, e-mail e celular enviados na reserva também
são gravados nesse arquivo local. Para limpar reservas de teste, pare o
servidor e substitua o conteúdo de `reservations` em `db.json` por `[]`.

## Contas demonstrativas

O cadastro de motorista grava perfis e veículos na coleção `users`; o cadastro
de estacionamento grava a conta do responsável em `parkingAccounts` e associa
os estacionamentos que ela pode manter. O login demonstrativo guarda apenas o
ID da sessão no navegador. A senha é convertida em um resumo SHA-256 no cliente,
mas isso **não é autenticação segura**: o json-server expõe as coleções e não
aplica autorização. Use somente dados fictícios e nunca reutilize senhas reais.

Após entrar como motorista, `contaUsuario.html` permite editar nome e celular,
manter veículos e consultar reservas. `metodosPagamento.html` permite manter
cartões, e `minhasDenuncias.html` mostra o andamento e as respostas recebidas.
Na conta do motorista, reservas confirmadas podem ser editadas ou canceladas
enquanto faltarem pelo menos 24 horas para o início. A edição revalida horário
de funcionamento e disponibilidade da vaga; reduzir a duração registra um
estorno demonstrativo e aumentá-la exige confirmar uma cobrança adicional
demonstrativa, ambos calculados pela tarifa por hora original da reserva. O
cancelamento registra um estorno demonstrativo do valor da reserva. Essas
alterações são apenas registros locais em `db.json`: não há movimentação real
de dinheiro nem integração com um processador de pagamentos.
Reservas exigem um veículo cadastrado e permitem selecionar ou cadastrar outro
carro. Os horários de entrada e saída são selecionados separadamente; as horas
e o valor são calculados pela diferença. O estabelecimento define os horários
de funcionamento por dia e se permite permanência durante a noite. As tags
Coberta, Descoberta e Especial podem ser combinadas na vaga e na busca. Coberta
e Descoberta são mutuamente exclusivas; Especial pode ser combinada com uma
delas.

As tarifas do estabelecimento são configuradas por tag e por duração total:
até 1 hora, mais de 1 até 4 horas e mais de 4 horas. A taxa da faixa selecionada
é aplicada a todas as horas reservadas; a última faixa também vale acima de 12
horas. A reserva pode durar até 24 horas. O valor por hora efetivamente aplicado
e o total são exibidos antes da confirmação.

Cartões são demonstrativos: o banco local conserva apenas bandeira, últimos
quatro dígitos, validade, titular e função crédito/débito. O número completo e
o CVV não são armazenados nem existe processador de pagamentos. Não use dados
reais. O login de parceiro abre a manutenção dos estacionamentos associados à
conta; novos cadastros ficam pendentes até a aprovação administrativa.

O cadastro de administrador exige um código verificado pela rota
`POST /admin/register` do servidor local. O valor padrão para desenvolvimento é
`administrador123`; substitua-o definindo `ADMIN_REGISTRATION_CODE` no ambiente
do servidor. Administradores entram com e-mail e senha e usam
`tratamentoRequisicoes.html` para responder denúncias, aplicar banimentos e
aprovar ou recusar solicitações de parceiros.

Esses fluxos continuam sendo uma demonstração: json-server expõe as coleções e
não protege as rotas de leitura e escrita com autenticação/autorização completa.
O resumo SHA-256 no cliente também não equivale a armazenamento de senha seguro.
Para produção, migre as contas, pagamentos, denúncias e decisões administrativas
para um backend com autenticação, autorização e armazenamento apropriados.

Na página inicial, o botão **Testar estacionamentos do json-server** carrega
os parceiros e tarifas cadastrados na API. Essa lista é para testar os dados e
links de reserva; ela não é filtrada geograficamente pelo destino e não mostra
distâncias fictícias. Para busca real por proximidade e rotas, use o campo de
destino com o Google Maps configurado.

`db.json` contém estacionamentos e vagas de demonstração, incluindo o
Estacionamento do Plaza Shopping Niterói e o Estacionamento Bay Market para
testes próximos ao Plaza Shopping Niterói. Os dados de parceria e tarifa desses
dois registros são exemplos locais, não confirmam uma relação comercial com os
estabelecimentos. A reserva consulta o horário de funcionamento, as tags, a
permissão de pernoite e os intervalos já registrados. A tela consulta
essa API para exibir tarifas e disponibilidade por período e vaga; a confirmação
cria um registro em `/reservations`. A disponibilidade considera intervalos
sobrepostos de reservas confirmadas/ativas. O pagamento continua simulado e
nenhuma cobrança é feita. O json-server não oferece transações nem garante
exclusividade em tentativas simultâneas, portanto não é adequado para reservas
reais.

Os perfis genéricos para testes de motorista, parceiro e administrador estão em
`mocks/`; as credenciais e todos os dados preenchidos estão descritos em
`DADOS_MOCKS.md`. O arquivo `mocks/estabelecimento-valonguinho.json` também
contém um estabelecimento associado ao Place ID do local no Google Maps; tarifas
e vagas desse mock são genéricas. Esses fixtures são somente para
desenvolvimento local e não confirmam parceria comercial.

Para permitir reservar um estacionamento encontrado pelo Google Maps, cadastre
seu ID real em `googlePlaceId` no estacionamento correspondente de `db.json`.
Um local sem correspondência na API local não pode ser reservado. A lista de
IDs parceiros da página de busca continua sendo configurada em
`googleMapsPartnerPlaceIds`.

## Google Maps

A página do motorista carrega a configuração de
`FluxoPark/public/config.local.js`, que é ignorado pelo Git. Em um clone novo,
copie `FluxoPark/public/config.example.js` para
`FluxoPark/public/config.local.js` e configure sua chave e IDs de lugares
parceiros. Esse arquivo é servido ao navegador e incluído no build local, mas
nunca deve ser versionado.

Para usar o mapa e as buscas reais, configure uma chave válida do Google Maps
Platform e habilite faturamento, Maps JavaScript API, Places API (New) e Routes
API no Google Cloud. Restrinja a chave aos domínios em que a aplicação será
publicada e às APIs necessárias. Chaves de API usadas no navegador podem ser
vistas por quem acessa o site. O `.gitignore` só evita o envio acidental ao Git;
não torna secreta uma chave usada no navegador. Restrinja-a no Google Cloud aos
domínios e APIs necessários e revogue-a se tiver sido exposta. A interface
informa quando a configuração local ou a autorização do Google impede carregar
o mapa.

O campo de destino usa sugestões do Google Places enquanto o usuário digita
(após três caracteres). Selecionar uma sugestão mantém o lugar resolvido para a
busca de estacionamentos; se nenhuma sugestão for selecionada, a busca por texto
continua disponível.

Os estacionamentos são comparados pela distância da rota a pé entre o
estacionamento e o destino; o tempo estimado de caminhada também é exibido. Ao
selecionar um card ou marcador, o trecho para caminhada é traçado no mapa.
O Google Places restringe os resultados iniciais a um raio em linha reta, e
os trajetos dependem da cobertura e da cota da Routes API. Se a cota de rotas
for excedida, a interface informa quantas rotas estão indisponíveis e não
apresenta essas distâncias como se fossem trajetos caminháveis.

Para marcar estacionamentos parceiros no mapa, adicione os IDs de lugar do
Google à lista `googleMapsPartnerPlaceIds` em
`FluxoPark/public/config.local.js`. Os marcadores parceiros aparecem em roxo; os
demais estacionamentos aparecem em azul. O Google Maps não informa a parceria
com o FluxoPark, portanto essa lista deve conter apenas parceiros confirmados.

Tailwind CSS e as fontes são carregados por CDN nesta versão; React e as
bibliotecas de formulário/consulta são instalados pelo npm e empacotados pelo
Vite.

## Documentação

- [Manual de instalação](./MANUAL_INSTALACAO.md)
- [Manual de operação](./MANUAL_OPERACAO.md)
- [Manual do usuário](./MANUAL_USUARIO.md)
