# FluxoPark

## Aplicação React

O projeto usa React 18 com Vite e possui duas entradas: `FluxoPark/paginaInicialMotorista.html`
e `FluxoPark/paginaReserva.html`. O JSX está em `FluxoPark/src`, organizado em
páginas, componentes, módulos de API, providers e validação. A busca usa
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
`localhost:3000`.

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

Na página inicial, o botão **Testar estacionamentos do json-server** carrega
os parceiros e tarifas cadastrados na API. Essa lista é para testar os dados e
links de reserva; ela não é filtrada geograficamente pelo destino e não mostra
distâncias fictícias. Para busca real por proximidade e rotas, use o campo de
destino com o Google Maps configurado.

`db.json` contém seis estacionamentos parceiros e 26 vagas, com tarifas por
tipo de vaga e tolerâncias de chegada. As coleções de reservas e avaliações
iniciam vazias. A reserva oferece horários de início em intervalos de 30
minutos a partir das 06:00; a duração selecionada deve terminar até as 23:00,
e períodos já reservados deixam de aparecer como disponíveis. A tela consulta
essa API para exibir tarifas e disponibilidade por período e vaga; a confirmação
cria um registro em `/reservations`. A disponibilidade considera intervalos
sobrepostos de reservas confirmadas/ativas. O pagamento continua simulado e
nenhuma cobrança é feita. O json-server não oferece transações nem garante
exclusividade em tentativas simultâneas, portanto não é adequado para reservas
reais.

Para permitir reservar um estacionamento encontrado pelo Google Maps, cadastre
seu ID real em `googlePlaceId` no estacionamento correspondente de `db.json`.
Um local sem correspondência na API local não pode ser reservado. A lista de
IDs parceiros da página de busca continua sendo configurada em
`googleMapsPartnerPlaceIds`.

## Google Maps

A página do motorista carrega a chave local de
`FluxoPark/public/config.local.js`, que é ignorado pelo Git. Para configurá-la,
copie `FluxoPark/public/config.example.js` para esse nome e preencha
`googleMapsApiKey` com sua chave. Esse arquivo local precisa existir para que o
Vite o sirva durante o desenvolvimento e o inclua no build de produção.

Para usar o mapa e as buscas reais, configure uma chave válida do Google Maps
Platform e habilite faturamento, Maps JavaScript API, Places API (New) e Routes
API no Google Cloud. Restrinja a chave aos domínios em que a aplicação será
publicada e às APIs necessárias. Chaves de API usadas no navegador podem ser
vistas por quem acessa o site; o `.gitignore` evita enviá-la ao repositório,
mas as restrições do Google Cloud são necessárias para protegê-la contra uso
indevido. Sem a chave local, a tela mantém os resultados identificados como
dados demonstrativos.

Os estacionamentos são comparados pela distância da rota de carro entre o
estacionamento e o destino; o tempo estimado de direção também é exibido.
O Google Places restringe os resultados iniciais a um raio em linha reta, e
os trajetos dependem da cobertura e da cota da Routes API. Se a cota de rotas
for excedida, a interface informa quantas rotas estão indisponíveis e não
apresenta essas distâncias como se fossem trajetos de carro.

Para marcar estacionamentos parceiros no mapa, adicione os IDs de lugar do
Google à lista `googleMapsPartnerPlaceIds` em
`FluxoPark/public/config.local.js`. Os marcadores parceiros aparecem em roxo; os
demais estacionamentos aparecem em azul. O Google Maps não informa a parceria
com o FluxoPark, portanto essa lista deve conter apenas parceiros confirmados.

Tailwind CSS e as fontes são carregados por CDN nesta versão; React e as
bibliotecas de formulário/consulta são instalados pelo npm e empacotados pelo
Vite.
