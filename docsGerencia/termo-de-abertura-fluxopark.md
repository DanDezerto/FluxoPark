# Termo de Abertura do Projeto — FluxoPark

| Campo | Informação |
|---|---|
| **Versão** | 2.0 — versão final, consolidada a partir dos documentos provisórios do projeto |
| **Data** | 04/10/2026 |
| **Patrocinador** | Prof. Diogo Silveira Mendonça (CEFET/RJ) |
| **Gerente do projeto** | Ana Clara dos Santos Morais. Presta contas do plano inteiro ao patrocinador. |
| **Equipe de gestão** | Ana Clara dos Santos Morais, Beatriz Manhães, Juan Mendes, Manuela Ribeiro e Maria Luisa Santiago |
| **Duração estimada** | 3 meses |
| **Equipe de Desenvolvimento** | 4 alunos de Programação Web (PSW): Daniel Rimes, Fernando Barbosa, Ricardo Franco e Walter dos Santos. Dedicação estimada de 5 horas semanais por pessoa |

## 1. Propósito e justificativa

Este termo autoriza o início do projeto acadêmico **FluxoPark – Plataforma Digital de Reserva Antecipada de Vagas de Estacionamento**, um MVP web que permite ao motorista pesquisar, comparar e reservar com antecedência uma vaga em estacionamento parceiro, com pagamento integrado via PIX ou cartão.

Buscar vaga em centros urbanos sem planejamento é imprevisível e ineficiente: motoristas circulam por minutos à procura de locais livres. Do outro lado, os proprietários de estacionamentos enfrentam ociosidade crônica em horários de baixa demanda e dependem do fluxo passivo de veículos na rua.

O FluxoPark responde às duas dores. O motorista compara estabelecimentos por preço, distância, horário e disponibilidade e reserva com pagamento antecipado. O parceiro ganha uma ferramenta de gestão de ocupação e de atração ativa de clientes. O valor esperado é reduzir o tempo de busca por vaga em áreas comerciais e elevar a ocupação dos parceiros em horários ociosos. Esse diagnóstico é uma hipótese do grupo: motoristas e estacionamentos ainda não foram consultados formalmente.

O projeto é também uma experiência de aprendizagem prática. Os estudantes do grupo de PSW definem e desenvolvem o produto, usando ferramentas de IA generativa (Copilot/LLMs) para acelerar codificação e prototipagem, sempre com revisão humana. A dimensão pedagógica deve ser considerada no planejamento, nas revisões técnicas e na definição realista das entregas.

O MVP integra serviços de terceiros em modo de testes: mapas e geolocalização por OpenStreetMap/Leaflet e gateway de pagamento em *sandbox*. **A operação comercial em produção, com cobrança real, não faz parte deste escopo.**

## 2. Objetivos do projeto

Os objetivos abaixo são do MVP. Quem mede é a equipe de gestão, com ciência do patrocinador, nas demonstrações das semanas 8 e 12. As metas de negócio são medidas no teste piloto, com 2 a 3 parceiros reais; por serem poucos parceiros e poucas semanas, os resultados são indicativos, não conclusivos, e não substituem uma validação em escala.

- **Jornada única:** um motorista fictício pesquisa, compara, reserva e paga (em *sandbox*) em uma só interface, concluindo busca, escolha e reserva em menos de 3 minutos. A reserva só é confirmada após retorno positivo do gateway. Na AV1, essa jornada é demonstrada no frontend sobre o `json-server`; no M2, sobre o backend próprio.
- **Tempo de estacionamento:** reduzir em 30% o tempo entre a chegada ao destino e a entrada no estacionamento, comparado à busca sem reserva prévia, medido com os parceiros do piloto.
- **Ocupação dos parceiros:** elevar em 20 pontos percentuais a ocupação dos estacionamentos parceiros nos horários de baixa demanda, comparada à ocupação média informada pelo parceiro antes do piloto.
- **Pontualidade e tolerância:** manter os cancelamentos automáticos por estouro de tolerância abaixo de 10% das reservas efetuadas.
- **Adesão pós-piloto:** obter a confirmação de pelo menos 2 estacionamentos parceiros interessados em continuar na plataforma depois do piloto.
- **Marcos acadêmicos:** a AV1, com termo, caso de negócio, plano e o frontend dos fluxos priorizados sobre o `json-server`, é aceita na semana 8. O MVP, o termo de encerramento e as lições aprendidas são aceitos na semana 12, sem falha grave no pagamento.

## 3. Escopo de alto nível

### Incluído

- Busca de estacionamentos por endereço ou destino informado.
- Comparação por preço, distância, horário de funcionamento e vagas disponíveis, com mapa (OpenStreetMap/Leaflet). O preço da vaga é fixo e definido pelo parceiro.
- Reserva antecipada de vaga específica, com período de permanência definido pelo usuário e tolerância programada para chegada e saída.
- Cancelamento automático da reserva quando a tolerância é excedida sem *check-in*.
- Pagamento integrado via PIX ou cartão de crédito, em ambiente de testes (*sandbox*) do gateway, com módulo simulador local como contingência.
- Painel administrativo para o parceiro gerenciar estacionamentos, vagas, tarifas e reservas.
- Módulo de avaliação pós-uso, com nota de 1 a 5 e comentário, e histórico de reservas.
- Autenticação e controle de acesso por três perfis: Cliente, Estacionamento e Administrador.
- Protótipo e implementação das 4 telas principais: pesquisa de endereço, escolha de estacionamento, escolha de vaga, confirmação e pagamento.
- Frontend em HTML e CSS (protótipo) e em React com Redux, responsivo para navegadores desktop e mobile.
- Uso de `json-server` como backend simulado para a demonstração do frontend na AV1.
- Backend em JavaScript com Express e persistência em MongoDB, e integração do frontend a essa API no marco final.
- Teste piloto com 2 a 3 estacionamentos parceiros reais e relatório de desempenho do piloto.
- Documentação de gerenciamento do projeto, testes funcionais, documentação técnica essencial e demonstração das entregas.

### Fora do escopo inicial

- Aplicativo mobile nativo (iOS/Android); o MVP é uma aplicação web responsiva.
- Cobertura de estacionamentos informais ou sem cadastro como parceiro.
- Preço dinâmico por algoritmo de oferta e demanda.
- Assinaturas e mensalidades recorrentes para usuários.
- Integração com sistemas de zona azul ou de trânsito municipal.
- Contagem automática de vagas por câmera (OCR/CFTV) ou sensores de presença.
- Emissão automática de nota fiscal eletrônica municipal (NFe/SAT).
- Cobrança real de usuários e uso de dados reais de parceiro sem acordo prévio.
- Garantia de operação comercial em produção ao fim do terceiro mês (semana 12): o projeto entrega um MVP integrado e demonstrável; produção depende de aprovação da instituição, de segurança, de infraestrutura, de operação e de acordo comercial com os parceiros.

## 4. Abordagem técnica e de aprendizagem

O desenvolvimento será incremental e dividido em duas etapas, separadas pela AV1 (semana 8). Até a AV1 só se implementa o frontend; depois da AV1 só se implementam o backend e a integração:

1. **Protótipo (semanas 1 e 2):** as 4 telas principais em HTML e CSS, validadas pelo patrocinador antes de seguir.
2. **Frontend até a AV1:** migração do protótipo para React com Redux, consumindo `json-server` como backend simulado, com mapa (OpenStreetMap/Leaflet), perfis de acesso simulados e pagamento simulado. O `json-server` serve apenas à demonstração; não é backend de produção.
3. **Backend depois da AV1:** API em JavaScript com Express, regras de negócio (reserva com bloqueio de vaga, tolerância e cancelamento automático) e persistência em MongoDB, em camada gratuita ou ambiente local.
4. **Integração:** substituição do `json-server` pela API própria, testes de fluxo completo e integração do gateway de pagamento PIX/cartão (ex.: Asaas/Mercado Pago) em *sandbox*. O simulador de pagamento criado no `json-server` é reaproveitado como contingência, para que um atraso do gateway não trave os testes de reserva.
5. **Uso de IA generativa:** Copilot/LLMs aceleram código e telas, mas todo código passa por *code review* obrigatório por pares e por testes de vulnerabilidade, conduzidos por integrante da equipe de PSW designado para QA, antes de qualquer *merge* na branch principal. Sugestões de IA que ampliam o escopo ou o custo sem justificativa são recusadas e registradas.

**Revezamento:** nenhum aluno de PSW fica restrito a uma única tecnologia. As tarefas de frontend, até a AV1, e de backend e integração, depois dela, são distribuídas entre os quatro alunos, com pareamento, de modo que todos passem pelas duas etapas.

O plano deve reservar tempo para estudo, pareamento, revisão de código e correção de defeitos. A equipe prioriza uma fatia funcional pequena e segura; funcionalidades secundárias poderão ser reduzidas ou postergadas se o aprendizado ou as dependências externas pressionarem o prazo.

## 5. Marcos e entregas

| Marco | Prazo previsto | Entregáveis e critérios de aceite preliminares |
|---|---|---|
| **M1 — Frontend dos fluxos priorizados com `json-server` e documentação de gestão (AV1)** | Semana letiva 8 | Termo de abertura aprovado; protótipo navegável das 4 telas em HTML e CSS validado; frontend em React com Redux dos fluxos priorizados (gestão de estacionamento e vaga, perfis de acesso simulados, busca e comparação em mapa, reserva com tolerância, pagamento simulado e avaliação) consumindo `json-server`; limitações do mock documentadas; parceiro piloto confirmado (termo de adesão) até o fim da semana 6; documentação da AV1 (termo, caso de negócio e plano) validada sem lacunas. O aceite é registrado pelo patrocinador. |
| **M2 — Sistema integrado ao backend próprio e encerrado (AV2)** | Semana letiva 12 | Backend em Express com persistência em MongoDB; frontend conectado à API própria, sem `json-server`; controle de acesso por perfil, reserva com bloqueio de vaga e cancelamento automático por tolerância no backend; gateway de pagamento (PIX/cartão) integrado em *sandbox*, com reserva confirmada somente após retorno positivo e simulador como contingência; avaliações e histórico; teste piloto com 2 a 3 parceiros reais e relatório de desempenho; segunda sessão de usabilidade com motoristas; demonstração final; termo de encerramento e lições aprendidas. O aceite é registrado pelo patrocinador. |

Fases de execução, com a capacidade de desenvolvimento de 20 h por semana:

- **Semanas 1 e 2:** protótipo das 4 telas em HTML e CSS, primeira prospecção e apresentação da proposta aos parceiros, primeira sessão de teste de usabilidade com motoristas.
- **Semanas 3 e 4:** migração para React com Redux; gestão de estacionamentos, vagas e perfis simulados sobre o `json-server`.
- **Semanas 5 e 6:** busca e comparação em mapa; confirmação do parceiro piloto.
- **Semanas 7 e 8:** reserva com tolerância, pagamento simulado e avaliação no frontend; AV1.
- **Semanas 9 e 10:** backend Express e MongoDB, com as APIs de estacionamento, vaga e perfis; início da conexão do frontend à API própria.
- **Semanas 11 e 12:** reserva e busca no backend, conexão do frontend concluída, gateway em *sandbox*, cancelamento automático, avaliações e histórico, piloto, demonstração final e encerramento; AV2.

Os marcos acima são os da iniciação. As datas de calendário, as folgas e o caminho crítico ficam na linha de base de prazo do plano, que deve ser recalculada para a janela de 60 dias úteis das 12 semanas.

## 6. Requisitos de alto nível e critérios gerais de sucesso

- O motorista deve conseguir pesquisar, comparar, reservar, pagar e avaliar em uma jornada única, sem sair do app.
- O parceiro deve conseguir cadastrar e gerenciar estacionamento, vaga e reserva pelo mesmo sistema.
- O acesso a cada funcionalidade é restrito por perfil (Cliente, Estacionamento, Administrador); o perfil Cliente que tenta abrir o painel do parceiro recebe erro de acesso negado (HTTP 403).
- Alterações feitas pelo parceiro (preço, vagas, fechamento) devem refletir em tempo real na busca do motorista.
- A reserva só é confirmada após retorno positivo do gateway (ou simulação válida em ambiente de testes); nenhuma vaga é liberada sem a confirmação por *webhook*.
- A reserva é cancelada automaticamente e a vaga é liberada quando o motorista não comparece em até 30 minutos do horário agendado.
- A interface deve se adaptar a smartphones (360 px) e desktops (1080p).
- Os dados persistidos são validados e acessados pelo backend; o frontend não se conecta diretamente ao MongoDB.
- A AV1 demonstra os fluxos do frontend sem depender do backend definitivo, usando `json-server`; o M2 substitui o mock pela API Express e MongoDB do projeto.
- O aceite de cada pacote de trabalho está no dicionário da EAP. O detalhamento dos requisitos, a matriz CRUD e a de rastreabilidade estão no plano.
- O êxito do projeto será avaliado pela entrega dos marcos, pelo atendimento aos objetivos da seção 2, pelo aceite final do patrocinador e pelo aprendizado técnico documentado.

### Critérios de encerramento e cancelamento

O projeto termina na semana 12, quando o patrocinador registra o aceite do M2 ou a lista do que não passou no aceite. Encerrar com limitação conhecida é término, não fracasso escondido.

O patrocinador decide entre replanejar o escopo e cancelar ou encerrar o projeto antes da semana 12 se ocorrer uma destas condições:

- **Não adesão comercial:** ao final da semana 6, não há pelo menos 1 estacionamento parceiro confirmado para o piloto. O replanejamento possível é trocar o piloto por uma demonstração com dados fictícios.
- **Capacidade esgotada:** a demonstração de reserva e pagamento não cabe nas 240 h de desenvolvimento e o patrocinador não aprova um corte de escopo.
- **Inviabilidade da equipe:** desistência formal ou trancamento da disciplina por membros do projeto que comprometa a capacidade mínima de entrega.
- **Retirada de autorização:** o patrocinador retira a autorização do projeto.
- **Premissa essencial perdida:** uma premissa essencial cai e não há substituto dentro do prazo, por exemplo a equipe deixar de ter ambiente para desenvolver e executar o MVP.

Cancelar cedo, nesses casos, é decisão de governança. Não é meta do projeto.

## 7. Premissas e restrições

### Premissas

- O parceiro manterá o inventário de vagas atualizado no painel, mesmo que manualmente no começo do piloto.
- Os parceiros aceitam entrar no piloto sem custo de adesão.
- A regra de tolerância de chegada e saída é clara o bastante para o usuário entender antes de reservar.
- A equipe usará ferramentas de IA generativa para acelerar código e telas, com revisão humana obrigatória.
- O provedor de pagamento fornecerá ambiente de testes (*sandbox*) estável até a semana 12; se não fornecer, vale o simulador local.
- As camadas gratuitas (*Free Tier*) de hospedagem, banco de dados e mapas atendem ao volume de testes do piloto.
- O patrocinador, Prof. Diogo Mendonça, acompanhará o projeto e receberá as demonstrações dos marcos.
- Os participantes terão acesso às ferramentas, ao repositório e ao ambiente de desenvolvimento necessários.
- As regras de negócio da primeira versão poderão ser reduzidas a um conjunto prioritário que caiba no prazo.
- Fora do piloto, serão usados dados fictícios criados pela equipe.

### Restrições

- Prazo rígido de 3 meses (12 semanas letivas), com dedicação parcial de 5 horas semanais por aluno de PSW, executado pelos alunos do projeto, sem contratação externa.
- O projeto corre em paralelo a outras disciplinas, e semanas de prova reduzem a capacidade da equipe.
- O MVP é uma aplicação web responsiva; não há aplicativo nativo.
- Infraestrutura em camada gratuita. Orçamento e pagamentos são simulados: não há desembolso real nem remuneração à equipe, e qualquer custo real que surja exige autorização prévia do patrocinador.
- O gateway de pagamento opera em *sandbox*; o simulador não substitui validação com o provedor real.
- O `json-server` é exclusivamente uma solução de simulação do backend para a demonstração da AV1; não deve ser tratado como backend de produção.
- A equipe não está autorizada por este termo a usar dados reais de parceiro sem acordo prévio nem a cobrar usuários fora do fluxo de teste.
- Mudanças relevantes seguem o controle de mudanças da seção 8.

## 8. Governança e responsabilidades

### Stakeholders

| Stakeholder | Interesse ou responsabilidade | Participação nesta etapa |
|---|---|---|
| **Prof. Diogo Mendonça — patrocinador e avaliador** | Rigor metodológico, cumprimento dos marcos AV1 e AV2 e entregáveis de valor real; decide sobre mudanças relevantes de escopo e prazo | Ativo: recebe relatórios e demonstrações e dá o aceite dos marcos |
| **Equipe de gestão — 5 alunos** | Planejar e acompanhar o projeto, conduzir o relacionamento com parceiros e motoristas e registrar decisões e aceites | Ativos: equipe de gestão |
| **Equipe de desenvolvimento — 4 alunos de PSW** | Implementar a solução nos prazos e aprender na prática com ferramentas modernas, incluindo IA | Ativos: equipe de desenvolvimento |
| **Estacionamentos parceiros — operadores do sistema** | Aumentar a ocupação em horários ociosos sem complicação operacional nem custos excessivos | Engajados desde a semana 1: apresentação da proposta, onboarding (semanas 1–2 e 5–6), termo de adesão e piloto; ainda sem compromisso formal |
| **Motoristas — usuários finais** | Encontrar vagas rapidamente, comparar preços com transparência e reservar com segurança via PIX | Testes de usabilidade no protótipo (semanas 1–2) e no piloto (semanas 11–12); sem participação formal fora desses testes |
| **Provedor de gateway — parceiro técnico** | Integração via API dentro dos padrões de segurança, sem sobrecarga no ambiente de testes | Sem participação ativa: a equipe usa a documentação padrão e a API em modo de testes |

Os stakeholders sem compromisso formal não aprovaram os requisitos. Parceiros e motoristas serão consultados nos eventos listados acima; o termo de adesão ao piloto é o registro do compromisso do parceiro.

### Papéis e responsabilidades

| Papel | Responsabilidades principais | Designação |
|---|---|---|
| Patrocinador | Patrocinar o projeto, acompanhar os marcos, dar o aceite e decidir sobre mudanças relevantes | Prof. Diogo Silveira Mendonça |
| Gerente do projeto | Prestar contas do plano ao patrocinador, conferir pedidos de mudança contra a EAP, coordenar a equipe de gestão e emitir o relatório de status semanal | Ana Clara dos Santos Morais |
| Equipe de gestão | Planejar e acompanhar prazo, escopo, custos, riscos, comunicação e marcos; conduzir onboarding de parceiros e testes de usabilidade; registrar decisões e aceites | Ana Clara dos Santos Morais, Beatriz Manhães, Juan Mendes, Manuela Ribeiro e Maria Luisa Santiago |
| Equipe de desenvolvimento (PSW) | Implementar o frontend até a AV1 e o backend e a integração depois dela, em revezamento e pareamento, com testes, *code review* e documentação | Daniel Rimes, Fernando Barbosa, Ricardo Franco e Walter dos Santos |
| Equipe total do projeto | Participar das atividades do projeto, os alunos de PSW com dedicação estimada de 5 h/semana | 9 alunos: 5 de gestão e 4 de PSW |

Cada pacote de trabalho tem um responsável único pelo aceite (A), conforme a matriz de responsabilidades do plano. A equipe de gestão mantém a lista priorizada de trabalho, riscos, decisões e demonstrações; mudanças relevantes são submetidas ao patrocinador.

### Cadência e controle de mudanças

- Alinhamento da equipe 3 vezes por semana (15 min) e relatório de status toda sexta-feira, com progresso físico e financeiro (simulado) do caminho crítico.
- Relatórios ao patrocinador nos marcos M1/AV1 (semana 8) e M2/AV2 (semana 12).
- Atraso superior a 5 dias úteis em atividade do caminho crítico exige Solicitação de Mudança formal ao patrocinador.
- Estouro de custo acima de 10% em um pacote folha exige reavaliação pela gerente do projeto.

## 9. Riscos iniciais e respostas

| Risco | Impacto potencial | Resposta inicial |
|---|---|---|
| Baixa adesão de parceiros ao piloto | Sem parceiro, o app fica sem oferta para o motorista; é o risco mais crítico, já que a tecnologia de reserva e pagamento antecipado é validada no mercado | Buscar parceiro pequeno ou local disposto a testar sem custo, desde a semana 1; treinamento presencial e suporte direto ao operador nas semanas 5 e 6; se não houver termo de intenção até o início da semana 6, escalar ao patrocinador |
| Capacidade de desenvolvimento e prazo de 12 semanas (a avaliar no plano) | A capacidade é de 240 h (4 alunos × 5 h × 12 semanas) e o orçamento a usa por inteiro. Backend, integração, pagamento e piloto ficam concentrados nas semanas 9 a 12, com 80 h de desenvolvimento. O plano anterior estimava 500 h e 67 dias úteis de caminho crítico, que excedem os 60 dias úteis de 12 semanas | Recalcular rede, esforço e linha de base; priorizar a fatia mínima (busca, reserva e pagamento em *sandbox*); reduzir ou postergar avaliações e o tamanho do piloto com aprovação do patrocinador |
| Atraso ou instabilidade do *sandbox* de pagamentos | Atraso na homologação trava as reservas e a entrega do MVP | Solicitar credenciais até a semana 7; reaproveitar o simulador criado no `json-server` como contingência; trocar para o simulador se não houver credenciais funcionais até o início da semana 11 |
| Disponibilidade de vaga informada pelo parceiro fica desatualizada | *Overbooking*: o usuário paga e chega sem vaga | Atualização manual no início do piloto, registrada como limitação conhecida; trava automática que bloqueia novas reservas online com 90% da capacidade ocupada |
| Regra de tolerância não é clara para o usuário | Cancelamento considerado injusto gera pedido de estorno e reclamação | Deixar a regra visível antes da confirmação da reserva, não só nos termos de uso |
| Sobrecarga acadêmica em semanas de prova ou dedicação diferente da prevista | Entregas incompletas ou atrasadas | Mapear provas no calendário, monitorar a disponibilidade semanal, dividir tarefas pequenas e ajustar o escopo antes dos marcos |
| Código gerado por IA com inconsistências ou falhas de segurança | Retrabalho ou vulnerabilidades no MVP | *Code review* obrigatório por pares e testes de segurança antes de todo *merge* |
| Curva de aprendizagem maior que a prevista (a avaliar no plano) | Cada aluno passa por frontend e backend, e a produtividade inicial pode ser menor, sobretudo na etapa de backend, mais curta | Reservar tempo para estudo e pareamento; revezar tarefas entre os quatro alunos; priorizar o fluxo mínimo viável; revisar o plano a cada demonstração |
| Contrato do `json-server` diverge da API Express | Retrabalho na integração do frontend ao backend | Definir os contratos (payloads) na semana 3, usar o mesmo exemplo no mock e na API e conferir na semana 9 |
| Requisitos de segurança e privacidade (LGPD) identificados tardiamente | Retrabalho ou impedimento de uso real, pois o sistema trata dados de motoristas e de parceiros | Coletar o mínimo de dados pessoais, usar dados fictícios fora do piloto e tratar a revisão de segurança e privacidade como condição para qualquer uso além do MVP |
| Expectativa de produção ao fim do prazo | Uso prematuro de software não aprovado | Comunicar que a entrega é um MVP acadêmico demonstrável; exigir aprovações separadas para qualquer operação comercial |

O detalhamento de cada risco, com probabilidade, impacto, gatilho e responsável, está no plano.

## 10. Estimativa econômica e financiamento

Na iniciação, o parâmetro de mercado para um MVP desse porte feito por software house tradicional era de R\$ 60 mil a R\$ 100 mil. Com a equipe usando IA assistida e a hora valorada a R\$ 50,00, a estimativa equivalente em horas de estudantes ficava na faixa de R\$ 20 mil a R\$ 35 mil, e o plano para 6 meses previa 500 h e R\$ 25.000 apenas nos oito pacotes técnicos. O grupo reduziu o valor-hora simulado para **R\$ 18,00**. Com a duração de 3 meses, o orçamento foi recalculado a partir da capacidade das equipes: 240 h de PSW (4 alunos × 5 h × 12 semanas) e 300 h de gestão (5 alunos × 5 h × 12 semanas), 540 h no total. O resultado é **R\$ 10.400,40**, abaixo da faixa da iniciação porque ela supunha R\$ 50,00 por hora. O detalhe por pacote está no plano.

| Componente | Horas | Valor (R\$) | Observação |
|---|---:|---:|---|
| Atividades de desenvolvimento (PSW) | 216 | 3.888,00 | Esforço do plano anterior reduzido para 43% (500 h → 216 h) para caber na capacidade de PSW |
| Atividades de gestão | 260 | 4.680,00 | Documentação e planos (70 h), acompanhamento e comunicação (50 h), parceiros e piloto (70 h), usabilidade (36 h), relatório e encerramento (34 h) |
| Contingência (24 h PSW e 40 h gestão) | 64 | 1.152,00 | Para riscos conhecidos; usa as horas que sobram em cada equipe |
| **Linha de base de custo** | **540** | **9.720,00** | Igual à capacidade total das equipes em 12 semanas |
| Reserva gerencial (7%) | — | 680,40 | Para imprevistos sem evento nomeado; sob controle do patrocinador |
| **Orçamento total simulado** | — | **10.400,40** | Linha de base mais reserva gerencial |

**Orçamento e pagamentos são simulados: nenhum aluno é remunerado e o desembolso efetivo é R\$ 0,00.** O valor é a valoração do esforço acadêmico a R\$ 18,00 por hora, usada para planejamento, e não constitui bolsa, salário ou transferência financeira. Hospedagem, banco de dados e mapas usam camada gratuita, e os pagamentos do MVP ocorrem em *sandbox*.

Para fins do exercício, o custo simulado é distribuído igualmente entre os dois marcos, associando cada parcela à entrega e ao aceite correspondente:

| Marco e gatilho da parcela simulada | Prazo | Parcela simulada | Desembolso efetivo com a equipe |
|---|---|---:|---:|
| **M1 — Frontend dos fluxos priorizados com `json-server` e documentação de gestão (AV1)**: após demonstração e aceite pelo patrocinador | Semana letiva 8 | R\$ 5.200,20 (50%) | R\$ 0,00 — não há pagamento aos alunos |
| **M2 — Sistema integrado ao backend próprio e encerrado (AV2)**: após demonstração final e aceite pelo patrocinador | Semana letiva 12 | R\$ 5.200,20 (50%) | R\$ 0,00 — não há pagamento aos alunos |
| **Total do projeto** | 3 meses | **R\$ 10.400,40 (100%)** | **R\$ 0,00** |

O rateio de 50% por marco é uma convenção didática e não corresponde à distribuição do esforço: a capacidade de desenvolvimento é de 160 h até o fim da semana 8, só de frontend, e de 80 h nas semanas 9 a 12, só de backend e integração. O plano divide as 216 h de atividades em 148 h de frontend e 68 h de backend e integração, com 12 h de contingência em cada etapa, e a etapa de backend, com menos capacidade, é o ponto mais apertado. Não há horas livres de desenvolvimento no calendário; riscos que exijam mais desenvolvimento do que a contingência cobre demandarão redução de escopo ou replanejamento. A estimativa não contempla operação comercial, licenças nem contratação de terceiros. Se surgirem custos reais, o patrocinador deve avaliá-los e autorizá-los antes de serem incorridos.

## 11. Autoridade e aprovação

A aprovação deste termo autoriza o início do planejamento detalhado, do levantamento de requisitos e do desenvolvimento do MVP dentro das premissas e do escopo descritos, e concede à gerente de projeto a autoridade para liderar a equipe e usar os recursos acadêmicos descritos. Não autoriza o uso de dados reais de parceiro sem acordo prévio, a cobrança efetiva de usuários fora do fluxo de teste nem a operação comercial em produção.

Requisitos de aprovação:

- Validação formal deste termo pelo patrocinador antes do início do desenvolvimento.
- Aprovação do protótipo navegável das telas pelo patrocinador até a semana 2, antes de seguir para a implementação em React.
- Aceite final do MVP na semana 12, com base no funcionamento sem falhas graves.

| Aprovação | Nome | Assinatura | Data |
|---|---|---|---|
| Patrocinador | Prof. Diogo Silveira Mendonça (CEFET/RJ) |  |  |
| Gerente do projeto | Ana Clara dos Santos Morais |  |  |
| Representante da equipe de desenvolvimento (PSW) |  |  |  |