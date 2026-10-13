# Correção da AV1 — PSW — FluxoPark

Repositório: https://github.com/DanDezerto/FluxoPark

A nota de cada aluno é a parte comum do grupo mais a qualidade individual. Sem autoria efetiva na própria parte, a AV1 fica 0. A parte comum vale 60 pontos: stack da disciplina (30) e escopo funcionando (30). Os 40 restantes avaliam a qualidade do que o próprio aluno fez.

| Aluno | Nota |
| --- | ---: |
| Daniel Dezerto Rimes | 92 |
| Ricardo Garcia Franco | 92 |
| Fernando Lira Barbosa | 88 |
| Walter Veridiano dos Santos | 0 |

## Parte comum — 52/60

A stack vale 30/30.

- 5 pontos. React com telas de lista, cadastro, alteração e exclusão. Cada tela é uma página HTML do Vite: catálogo do motorista, reserva, conta, cadastro do estacionamento e métodos de pagamento. O `package.json` não traz `react-router-dom`.
- 5 pontos. React Hook Form 7 está no `package.json` e no formulário da reserva, com `zodResolver`.
- 5 pontos. Zod 4 valida a reserva em `FluxoPark/src/lib/reservationSchema.js`.
- 5 pontos. TanStack Query 5 está na reserva, com `useQuery`, `useMutation` e atualização da lista depois da gravação. O catálogo consulta a API com `fetchQuery`. Os outros formulários gravam com `fetch`.
- 5 pontos. A API sobe com `npm run api` na porta 3000. O `server.js` usa JSON Server 0.17.4, e o Vite encaminha as coleções para essa porta.
- 5 pontos. Tailwind é o framework de interface, carregado pelo script do CDN na página do motorista.

O escopo vale 22/30. A régua é o refinamento de 09/09/2026: CRUD de estacionamento, CRUD de vaga, pesquisar destino, reserva e pagamento, gestão de reservas, avaliar e emitir avaliações. São seis entregas de 5 pontos. A matriz pede exclusão em estacionamento e vaga. Em reserva, cancelar é atualização. Em pagamento, não há exclusão. Essas duas exclusões não entram no desconto.

O README sobe os dois processos. A correção usou os usuários do manual de instalação. A chave do Google Maps não foi configurada.

- 4 pontos, CRUD de estacionamento. O parceiro criou "Estacionamento AV1 Novo", que continuou em `GET /parkings` e na lista da conta, com a vaga N01. O nome de "Estacionamento de Teste" foi alterado, relido na API e depois devolvido ao original. Remover estacionamento não existe: o portal do parceiro só oferece Alterar, e não há `DELETE` de `/parkings` nas telas. O tratamento de solicitações aplica banimento com `PATCH`. O estacionamento `park-def`, banido, ficou fora da lista do motorista.
- 5 pontos, CRUD de vaga. No estacionamento de teste, a vaga Z99 foi criada e listada. DES-01 passou a DES-02 e o novo nome continuou na API. Z99 foi excluída e o `GET` seguinte respondeu 404. A reserva lista as vagas A01 a P01.
- 3 pontos, pesquisar destino. "Testar estacionamentos do json-server" listou 11 parceiros da API. Sem a chave do Maps, "Buscar" também chama essa lista local. O texto do destino não filtra o resultado, e o aviso da tela diz que as distâncias não foram filtradas pelo destino. A reserva a partir de um estacionamento dessa lista funciona.
- 5 pontos, reserva e pagamento. A reserva FP-980DBEC1, Estacionamento ABC, vaga C01, 20/10/2026 das 10:00 às 12:00, Pix, R$ 48, foi confirmada na tela e lida na API logo em seguida, com status confirmado. O pagamento desta versão é simulado, como o README descreve.
- 5 pontos, gestão de reservas. A conta do motorista listou o histórico com status, valor e ajustes. O cancelamento de FP-AV1TEST foi confirmado na tela e permaneceu na API como `cancelled`, com `paymentStatus` `simulated_refunded` e um estorno simulado.
- 0, avaliar e emitir avaliações. Nenhuma tela grava em `/reviews`. A coleção está vazia. Os comentários da ficha só apareceriam nos detalhes do Google Maps.

Durante a correção, a coleção de reservas encolheu uma vez: FP-980DBEC1 e quatro reservas que já estavam no `db.json` deixaram de aparecer, sem `DELETE /reservations` no log do servidor. Um teste seguinte, gravar outra reserva e alterar a tolerância do estacionamento, não repetiu a perda. A criação e o cancelamento conferidos acima tinham sido lidos na API no momento em que foram feitos.

## Daniel Dezerto Rimes — 92

Os commits de exportação do codespace, o `server.js`, o `package.json` e a maior parte das páginas estão no nome dele. A nota reúne os 52 pontos do grupo e 40 de qualidade.

Dois commits se chamam "Pending changes exported from your codespace" e concentram o servidor e um bloco grande das telas. O que está nesse histórico sobe com o README, grava estacionamento, vaga e reserva, e só trata sucesso quando a resposta da API vem correta.

## Ricardo Garcia Franco — 92

Os commits "implementa conta" e "Personaliza faixas de preço e menu lateral" estão no nome dele. A nota reúne os 52 pontos do grupo e 40 de qualidade.

O portal do parceiro, a conta do motorista, o login e as faixas de preço são a parte que a correção percorreu. O cadastro do estacionamento grava, altera e exclui vaga, e a reserva de duas horas caiu na faixa "Mais de 1 até 4 horas", com total de R$ 48. A remoção do estacionamento, que a matriz atribui ao administrador, está no desconto do escopo.

## Fernando Lira Barbosa — 88

Os commits de componentização com React e Tailwind, de data e calendário, do horário em 24 horas e do README estão no nome dele, com o e-mail `afbosa@gmail.com`. A nota reúne os 52 pontos do grupo e 36 de qualidade.

Desconto na parte individual:

- 2 pontos. Em `FluxoPark/src/pages/DriverPage.jsx`, a falha ao consultar a API pede para iniciar o servidor com `npm.cmd start`. O README e o `package.json` sobem a API com `npm run api` e o Vite com `npm run dev`.
- 2 pontos. Em `FluxoPark/src/components/reservation/ReservationComponents.jsx`, a lista de horas do `Time24Input` fica coberta pelo seletor de veículo. Na reserva, o clique na hora 10 atingiu o campo `#reservation-vehicle`.

O formulário da reserva, o esquema Zod e a consulta com TanStack Query estão nessa parte e foram os que gravaram a reserva conferida acima.

## Walter Veridiano dos Santos — 0

Não há commit, e-mail nem arquivo com o nome dele no repositório. O refinamento de 09/09/2026 inclui o nome dele no grupo. Sem commit próprio, a AV1 fica 0.
