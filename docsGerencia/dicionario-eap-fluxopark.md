# Dicionário da EAP — FluxoPark

**Versão:** 2.0 — EAP reorganizada em duas etapas: frontend até a AV1 e backend e integração depois
**Data:** 04/10/2026
**Linha de base do escopo:** este dicionário, a declaração do escopo e a EAP em [plano-de-projeto-fluxopark.md](plano-de-projeto-fluxopark.md)

Cada linha é um pacote de trabalho. **A** é quem presta contas do aceite. **R** é quem executa. O nível abaixo do pacote, quando existe na EAP (por exemplo 1.4.1.1), é atividade do cronograma e não tem aceite próprio.

O identificador do pacote é o código da EAP. Marco, recurso e custo não se repetem aqui: estão no cronograma e no orçamento do plano. Cada pacote técnico tem um único aluno de PSW como A, e os quatro alunos se revezam entre as duas etapas, de modo que cada um responde por pacotes de frontend e de backend. Os papéis individuais da equipe de gestão ainda não foram definidos; nos pacotes de gestão, A é a gerente do projeto e R é a equipe de gestão. O patrocinador não recebe A de pacote: ele aprova mudança, marco e cancelamento.

## 1.1 Gestão e coordenação do projeto

| Pacote | Entrega | A | R | Aceite observável |
|---|---|---|---|---|
| 1.1.1 | Termo de abertura e caso de negócio mantidos | Ana Clara | Equipe de gestão | A versão do termo e do caso de negócio citada em qualquer entrega é a mesma em uso no momento, ou a mudança está registrada. |
| 1.1.2 | Cronograma, orçamento, riscos, decisões e mudanças acompanhados | Ana Clara | Equipe de gestão | Cada mudança de escopo, prazo ou custo tem pedido, decisão e efeito registrados nas três linhas de base; os riscos são revistos nos status semanais. |
| 1.1.3 | Demonstrações e aceites dos marcos registrados | Ana Clara | Equipe de gestão | Há registro de aceite ou de recusa do M1 na semana 8 e do M2 na semana 12, com a decisão do patrocinador. |
| 1.1.4 | Prospecção, termo de adesão e acompanhamento dos parceiros do piloto | Ana Clara | Equipe de gestão | O termo de intenção existe até o início da semana 6 e o termo de adesão até o fim dela; a medida inicial de ocupação do parceiro está registrada antes do piloto; cada contato tem registro. |
| 1.1.5 | Sessões de usabilidade com motoristas conduzidas | Ana Clara | Equipe de gestão | Há duas sessões, uma com o protótipo (semanas 2 a 4) e outra no piloto (semanas 11 e 12), com roteiro padronizado e relatório de ajustes que separa o escopo atual do futuro. |

## 1.2 Requisitos e desenho

| Pacote | Entrega | A | R | Aceite observável |
|---|---|---|---|---|
| 1.2.1 | Requisitos levantados e matriz de rastreabilidade mantida | Ana Clara | Equipe de gestão | Cada requisito (REQ-01 a REQ-11) tem origem, pacote da EAP e aceite observável na matriz do plano. |
| 1.2.2 | Protótipo das 4 telas em HTML e CSS definido | Ana Clara | Equipe PSW | Outro integrante da equipe percorre as 4 telas (pesquisa de endereço, escolha de estacionamento, escolha de vaga, confirmação e pagamento) pelo roteiro busca, escolha, reserva e pagamento, sem passo não representado; o patrocinador aprova o protótipo até a semana 2. |
| 1.2.3 | Modelo de dados e contratos (payloads) definidos | Ana Clara | Equipe PSW | O mesmo exemplo de payload de estacionamento, vaga, reserva e avaliação serve ao `json-server` e à API Express. |
| 1.2.4 | Regras de negócio do MVP documentadas | Ana Clara | Equipe de gestão, com PSW consultada | Tolerância de 30 minutos, bloqueio de vaga, trava de 90%, confirmação por gateway e avaliação têm regra escrita e um exemplo; cada regra sem validação do parceiro está marcada como hipótese. |

## 1.3 Base técnica e ambientes

| Pacote | Entrega | A | R | Aceite observável |
|---|---|---|---|---|
| 1.3.1 | Aplicação React com Redux inicializada | Fernando | Equipe PSW | Outro aluno executa a aplicação seguindo a instrução do repositório. |
| 1.3.2 | `json-server` configurado com dados fictícios | Fernando | Equipe PSW | O frontend lê estacionamento, vaga, reserva e avaliação fictícios do mock, sem API própria. |
| 1.3.3 | API Express inicializada | Fernando | Equipe PSW | A API responde uma rota de verificação sem o frontend acessar o MongoDB. |
| 1.3.4 | MongoDB configurado para desenvolvimento | Fernando | Equipe PSW | Um registro gravado é lido depois de reiniciar a API. |
| 1.3.5 | Credenciais do gateway em *sandbox* e serviço de mapas obtidos | Fernando | Equipe PSW | Uma chamada de teste ao gateway e ao serviço de mapas retorna resposta válida, sem erro de configuração. |

## 1.4 Marco 1 — Frontend dos fluxos priorizados, com `json-server`

| Pacote | Entrega | A | R | Aceite observável |
|---|---|---|---|---|
| 1.4.1 | Painel do parceiro: estacionamento, vaga, tarifa e reservas recebidas | Fernando | Equipe PSW | Um estacionamento ou vaga cadastrado aparece na busca logo após o cadastro; a edição reflete na hora; a remoção faz o item sumir da busca e impede nova reserva; o parceiro consulta e cancela as reservas recebidas. |
| 1.4.2 | Perfis de acesso simulados (Cliente, Estacionamento, Administrador) | Walter | Equipe PSW | Cada perfil abre apenas as telas marcadas na matriz perfil × funcionalidade do plano; o perfil Cliente não abre o painel do parceiro. |
| 1.4.3 | Busca e comparação em mapa | Ricardo | Equipe PSW | A lista de estacionamentos próximos ao destino é exibida no mapa com preço, distância, horário e disponibilidade corretos para cada um. |
| 1.4.4 | Reserva com tolerância visível e pagamento simulado | Daniel | Equipe PSW | A vaga fica bloqueada para o motorista durante o período; a regra de tolerância aparece antes da confirmação; no mock, a reserva só passa a confirmada depois do retorno da simulação de pagamento, e antes disso o status é de reserva pendente. |
| 1.4.5 | Avaliação pós-uso e histórico de reservas | Walter | Equipe PSW | Só uma reserva concluída pode ser avaliada; a nota de 1 a 5 e o comentário ficam vinculados a ela; o histórico lista as reservas do motorista. |
| 1.4.6 | Frontend conectado ao `json-server` | Ricardo | Equipe PSW | Os fluxos de 1.4.1 a 1.4.5 usam o `json-server`, não a API Express. |
| 1.4.7 | Demonstração do M1 e limitações do mock documentadas | Daniel | Equipe PSW | A demonstração da semana 8 executa o roteiro dos fluxos priorizados e registra a limitação do mock, e o patrocinador registra o aceite. |

1.4 aceita a tela com o mock. 1.5 aceita a API no MongoDB. Um pacote não herda o aceite do outro.

## 1.5 Backend e regras de negócio

| Pacote | Entrega | A | R | Aceite observável |
|---|---|---|---|---|
| 1.5.1 | API de estacionamento e vaga | Ricardo | Equipe PSW | As operações persistem no MongoDB; vaga sem estacionamento existente é rejeitada; estacionamento ou vaga removidos deixam de aparecer na busca. |
| 1.5.2 | API de perfis e controle de acesso | Fernando | Equipe PSW | Cada perfil executa exatamente as funcionalidades marcadas na matriz do plano; chamada do perfil Cliente ao painel do parceiro recebe erro de acesso negado (HTTP 403). |
| 1.5.3 | API de busca e comparação | Walter | Equipe PSW | A busca por destino devolve estacionamentos com preço, distância, horário e disponibilidade; estacionamento fechado ou removido não aparece. |
| 1.5.4 | API de reserva: bloqueio, trava de 90% e cancelamento automático | Daniel | Equipe PSW | A vaga fica bloqueada exclusivamente para o motorista durante o período; com 90% da capacidade ocupada, nova reserva online é recusada; sem *check-in* em 30 minutos, a reserva é cancelada e a vaga é liberada automaticamente. |
| 1.5.5 | Integração do gateway PIX/cartão em *sandbox*, com *webhook* e simulador | Walter | Equipe PSW | A reserva só passa a confirmada depois do *webhook* de sucesso do gateway; sem credenciais, o simulador reproduz sucesso e falha; pagamento recusado não confirma a reserva e libera a vaga. |
| 1.5.6 | API de avaliações e histórico | Fernando | Equipe PSW | A avaliação é gravada e vinculada à reserva concluída; avaliação de reserva não concluída é recusada; a nota média do estacionamento fica visível na busca. |
| 1.5.7 | Dados de domínio persistidos no MongoDB | Ricardo | Equipe PSW | Estacionamento, vaga, reserva e avaliação continuam disponíveis depois de reiniciar a API. |

1.5.4 aceita o bloqueio, a trava e o cancelamento. 1.5.5 aceita a confirmação do pagamento. Um pacote não herda o aceite do outro.

## 1.6 Marco 2 — Sistema integrado ao backend próprio

| Pacote | Entrega | A | R | Aceite observável |
|---|---|---|---|---|
| 1.6.1 | Frontend conectado à API Express, sem `json-server` | Daniel | Equipe PSW | Os fluxos do M1 executam contra a API Express, sem `json-server` no lugar da API própria. |
| 1.6.2 | Fluxos completos persistidos e recuperados do MongoDB | Daniel | Equipe PSW | Reserva e avaliação sobrevivem a novo acesso do mesmo usuário fictício. |
| 1.6.3 | Erros e estados inválidos tratados nos fluxos prioritários | Daniel | Equipe PSW | Vaga indisponível, pagamento recusado, tolerância excedida e acesso negado produzem mensagem identificável, não tela em branco. |
| 1.6.4 | Demonstração integrada final preparada | Daniel | Equipe PSW | A demonstração da semana 12 executa o roteiro de 1.6.1 a 1.6.3, ou registra o caso que falhou. |

1.6.4 executa o roteiro. 1.7 registra o que passou, o que falhou e o que ficou de fora.

## 1.7 Verificação e encerramento

| Pacote | Entrega | A | R | Aceite observável |
|---|---|---|---|---|
| 1.7.1 | Testes dos fluxos prioritários executados | Ana Clara | PSW executa; gestão registra | Há resultado passado ou falho para busca, reserva, pagamento, tolerância, avaliação e controle de perfil. |
| 1.7.2 | Defeitos tratados ou registrados como limitação conhecida | Ana Clara | PSW corrige; gestão registra | Defeito que viola o aceite de um pacote está corrigido ou listado como limitação conhecida da demonstração final. |
| 1.7.3 | Instruções de execução documentadas | Ana Clara | Equipe PSW | Outro aluno sobe o MVP (frontend, API, MongoDB e mocks) só com o texto do repositório. |
| 1.7.4 | Relatório de desempenho do piloto elaborado | Ana Clara | Equipe de gestão | O relatório informa, para cada meta do termo (tempo de estacionamento, ocupação, cancelamentos por tolerância e adesão), o que foi medido, o que não foi e a limitação; os resultados constam como indicativos. |
| 1.7.5 | Termo de encerramento e lições aprendidas registrados | Ana Clara | Equipe de gestão | O termo diz o que foi aceito, o que ficou de fora e o que a equipe não repetiria, e separa a operação em produção como trabalho futuro, sem dono neste projeto. |