# Business Case — FluxoPark

**Versão:** 2.0 — alinhado ao termo de abertura e ao plano de 12 semanas; a seção 12 usa o orçamento do plano
**Data:** 04/10/2026

## 1. Resumo executivo

Propõe-se desenvolver, em 12 semanas, um MVP acadêmico (software teste) em que o motorista informa o destino, compara estacionamentos parceiros por preço, distância, horário e disponibilidade, reserva uma vaga específica com antecedência, paga em ambiente de testes via PIX ou cartão e avalia o estacionamento depois do uso. Achar vaga ao acaso é imprevisível e trabalhoso: o motorista pesquisa com antecedência e torce para ter vaga ao chegar, ou só descobre a situação real quando já está no local. Para o estacionamento parceiro, o sistema funciona como ferramenta de gestão de ocupação e de captação de clientes, sem depender só de quem passa na rua e decide entrar.

Até a AV1 (semana 8) só se entrega o frontend, sobre `json-server`. Depois dela, o backend e a integração (Express e MongoDB), com um teste piloto com 2 a 3 parceiros nas últimas semanas. Não haverá cobrança real, uso de dados reais de parceiro sem acordo prévio nem operação em produção. A viabilidade financeira de uma operação real dependerá de validação, integração e implantação em etapa futura.

O grupo não tem custo e receita reais de um software teste rodando, então a estimativa financeira da seção 12 parte de componentes que já existem no mercado (taxa de gateway de pagamento, faixa de preço de um MVP parecido e valor médio de diária de estacionamento). Como o pagamento do MVP é feito em *sandbox*, ele não gera receita: a análise é uma simulação ilustrativa.

## 2. Problema e oportunidade

A necessidade de negócio parte de um problema concreto. Nos Estados Unidos, estima-se que cerca de 30% do tráfego seja de motoristas circulando à procura de vagas para estacionar, um número ligado a um setor de estacionamento que movimenta mais de 30 bilhões de dólares por ano. Não é à toa que soluções de reserva antecipada surgiram como resposta direta a esse problema, tanto no Brasil quanto em outros países. Não há medida equivalente para o Brasil neste documento: o número é contexto, não prova do problema local. A hipótese do grupo é que o problema também ocorre aqui; motoristas e estacionamentos ainda não foram consultados formalmente.

A oportunidade está em oferecer, ao mesmo tempo, previsibilidade ao motorista e uma ferramenta de gestão de ocupação ao estacionamento parceiro, sem depender de um grande player já estabelecido. Do lado do estacionamento, há ociosidade em horários de baixa demanda e dependência do fluxo passivo de veículos.

### 2.1 Soluções existentes no mercado

A Estapar, dona do Zul+, é a maior rede de estacionamentos da América Latina, opera em 102 cidades e passa de 510 mil vagas em cerca de 700 locais, com o app somando mais de 9 milhões de usuários no Brasil, presente em 19 estados e no Distrito Federal. A reserva antecipada deles cobre aeroporto, arena e evento, com tolerância de 2 horas na entrada e 2 horas na saída. O modelo de cobrança por transação já é validado por eles em outro serviço do mesmo app: a tag de pedágio não tem mensalidade, só uma taxa de 10% sobre cada recarga.

Fora do Brasil, SpotHero e ParkWhiz seguem uma lógica parecida com a do FluxoPark, um marketplace de reserva sem custo de cadastro para o usuário. A SpotHero não cobra taxa de conveniência separada, embute a margem no preço mostrado, com economia média de 30% frente ao preço pago sem reserva. A ParkWhiz segue esquema parecido, com desconto que chega a 50% em relação ao preço na hora.

Isso dá um indício útil: a tecnologia de reserva e pagamento antecipado é um modelo maduro. O que costuma travar um projeto desse tipo não é o código, é conseguir parceiros suficientes para o usuário ter opção de verdade na hora da busca.

## 3. Objetivos

Estes são os objetivos da iniciativa. O MVP de 12 semanas demonstra o caminho e mede indícios no piloto; os resultados definitivos só vêm de uma operação futura, que não faz parte deste projeto. Os objetivos do MVP estão no termo de abertura.

- Reduzir em 30% o tempo entre chegar ao destino e estacionar o carro, comparado à busca sem reserva prévia, medido com os parceiros do piloto.
- Elevar em 20 pontos percentuais a ocupação dos estacionamentos parceiros em horário de baixa demanda, comparando com a ocupação média informada pelo parceiro antes do piloto.
- Manter a taxa de reserva cancelada por estouro de tolerância abaixo de 10% do total de reservas feitas.
- Ao fim do piloto, ter pelo menos 2 dos parceiros confirmando interesse em continuar usando o sistema.

## 4. Solução proposta

Desenvolver um MVP em que o motorista busca, compara, reserva e paga (em *sandbox*) por uma vaga em estacionamento parceiro, com tolerância de chegada e saída e avaliação pós-uso. O parceiro gerencia estacionamento, vaga e reserva pelo mesmo sistema. O desenvolvimento tem duas etapas: até a AV1, o frontend (primeiro HTML e CSS, depois React e Redux) consome dados fictícios de um `json-server`; depois da AV1, o backend em Express com MongoDB substitui o mock, e o gateway de pagamento é integrado em *sandbox*. O escopo técnico completo, os requisitos e a EAP estão detalhados no plano de projeto.

O desenho considera uma futura operação real, mas nenhum pagamento real, dado real de parceiro sem acordo ou credencial de produção será usado neste projeto. Contratos, segurança, privacidade e viabilidade comercial precisam ser tratados em etapa posterior.

## 5. Escopo inicial

### Incluído

- Busca de estacionamento a partir de um destino informado.
- Comparação de parceiros por preço, distância, horário e disponibilidade, com mapa.
- Reserva antecipada de vaga específica, com período de permanência definido pelo usuário.
- Pagamento no app via PIX ou cartão, em ambiente de testes (*sandbox*), com simulador como contingência.
- Tolerância de chegada e saída, com cancelamento automático em caso de atraso além do limite.
- Avaliação do estacionamento depois do uso e histórico de reservas.
- Cadastro, edição, consulta e remoção de estacionamentos, vagas e reservas pelo parceiro.
- Controle de acesso por perfil (Cliente, Estacionamento e Administrador).
- Principais telas: pesquisa de endereço, escolha de estacionamento, escolha de vaga, confirmação e pagamento.
- Teste piloto com 2 a 3 parceiros reais.

### Fora do escopo inicial

- Estacionamento informal ou sem cadastro como parceiro.
- Preço dinâmico por demanda (o valor da vaga é fixo, definido pelo parceiro).
- Assinatura recorrente para o usuário.
- Integração com sistema de trânsito municipal ou zona azul.
- App mobile nativo (o projeto prevê telas web responsivas).
- Cobrança real de usuários, uso de dados reais de parceiro sem acordo prévio e implantação em produção.

## 6. Benefícios esperados

| Objetivo | Motorista | Estacionamento parceiro |
|---|---|---|
| Reduzir o tempo de busca por vaga | Chega já sabendo onde vai estacionar | Ganha visibilidade sem depender só do fluxo de rua |
| Reserva com pagamento antecipado | Não fica sem vaga em dia de alta demanda | Reduz vaga ociosa em horário fraco |
| Avaliação pós-uso | Escolhe melhor da próxima vez | Cria incentivo para manter o padrão de atendimento |
| Painel de gestão de vagas | Vê disponibilidade mais confiável | Acompanha ocupação e reservas num só lugar |

Os benefícios são expectativas a validar no piloto e depois dele, com dados reais de uso. Neste projeto só se medem indícios, com 2 a 3 parceiros.

## 7. Alternativas consideradas

1. **Manter a busca manual, sem ferramenta dedicada:** o motorista continua pesquisando por conta própria ou ligando para o estacionamento. Não exige desenvolvimento, mas mantém o problema identificado na seção 2.
2. **Integrar-se como parceiro de uma plataforma já existente** (por exemplo, cadastrar os estacionamentos dentro do app da Estapar/Zul+ em vez de criar um app próprio): exige menos esforço de desenvolvimento, mas tira do grupo o controle sobre a experiência do usuário e sobre a receita por comissão, além de depender da aceitação de um player muito maior.
3. **Desenvolver o FluxoPark como MVP de marketplace próprio** (opção escolhida): exige esforço de desenvolvimento acadêmico e depende de conseguir parceiro disposto a testar, mas permite validar o modelo de forma independente, mantendo o controle do produto. Não substitui a decisão nem o investimento futuro para operação real.

A recomendação desta etapa é desenvolver o MVP (opção 3), já que a opção 1 não resolve o problema e a opção 2 depende de uma decisão de terceiros fora do controle do grupo.

## 8. Custos e recursos

Há uma estimativa econômica simulada na seção 12, relativa ao MVP. Não é orçamento aprovado nem custo de uma solução pronta para operação. O custo simulado do MVP é de **540 h** (9 alunos × 5 h por semana × 12 semanas) valoradas a **R\$ 18,00 por hora**, ou R\$ 9.720,00, mais 7% de reserva gerencial: **R\$ 10.400,40**. O desembolso real com a equipe é R\$ 0,00, porque os alunos não são pagos. O valor-hora de R\$ 18,00 foi definido pelo grupo para valorar o esforço de estudantes; fica abaixo do piso da faixa de R\$ 50 a R\$ 150 por hora de um freelancer, citada a seguir apenas como referência de mercado, e não deve ser lido como preço de venda.

**Referência de mercado** (não é orçamento do projeto; serve só de parâmetro): o escopo do FluxoPark (múltiplas telas, integração de pagamento, painel administrativo, geolocalização) se encaixa no que o mercado chama de MVP intermediário, entre R\$ 60 mil e R\$ 100 mil quando feito por software house, com prazo de 8 a 14 semanas, para produto com múltiplas jornadas, integração de pagamento, notificações push e painel administrativo. Com freelancer, a hora ficaria entre R\$ 50 e R\$ 150: custo inicial menor, mas sem gestão de projeto estrutural nem garantia de qualidade.

Custos de referência de uma operação futura (fora deste projeto):

| Item | Valor de referência |
|---|---|
| Hospedagem, gateway e mapas | R\$ 500 a R\$ 3.000/mês, conforme uso |
| Taxa PIX (Mercado Pago) | 0,99% por transação, sem piso fixo |
| Taxa de cartão de crédito à vista | 3,03% a 4,98%, conforme o prazo de recebimento |

Uma futura operação deverá considerar, no mínimo:

- Levantamento e validação das regras com os parceiros.
- Cobrança real, homologação do gateway em produção e conformidade financeira.
- Infraestrutura, segurança, privacidade (LGPD), testes e implantação.
- Atendimento ao parceiro e ao motorista, comunicação e suporte.
- Manutenção e evolução depois da implantação.

## 9. Riscos e dependências

| Risco ou dependência | Possível impacto | Ação inicial |
|---|---|---|
| Parceiro não aderir ao piloto sem custo de adesão | Sem estacionamento parceiro, o app fica sem oferta para o motorista; é o risco mais crítico, já que a tecnologia de reserva e pagamento é validada no mercado | Prospectar desde a semana 1, priorizando parceiro pequeno ou local; se não houver termo de intenção no início da semana 6, escalar ao patrocinador e replanejar o piloto com dados fictícios |
| Gateway de pagamento sem credenciais de *sandbox* a tempo | Atraso na integração e no cronograma do M2 | Pedir as credenciais até a semana 7 e reaproveitar o simulador criado no `json-server` como contingência |
| Disponibilidade de vaga informada pelo parceiro desatualizada | *Overbooking*: o usuário paga e chega sem vaga | Atualização manual no início do piloto, trava automática com 90% de ocupação e registro como limitação conhecida |
| Regra de tolerância de chegada e saída não é clara | Cancelamento considerado injusto gera pedido de estorno e reclamação | Deixar a regra visível antes da confirmação da reserva, não só nos termos de uso |
| Requisitos de segurança e privacidade identificados tardiamente | Retrabalho ou impedimento de uso real | Usar dados fictícios fora do piloto, coletar o mínimo de dados pessoais e tratar a revisão de segurança como condição para qualquer uso além do MVP |
| Capacidade da equipe insuficiente no backend, que fica concentrado nas semanas 9 a 12 | Atraso ou redução de funcionalidades | Priorizar a fatia mínima (busca, reserva e pagamento em *sandbox*) e reduzir avaliações ou o tamanho do piloto, com aprovação do patrocinador |
| Expectativa de produção ao fim do prazo | Uso prematuro de software não aprovado | Comunicar que a entrega é um MVP acadêmico demonstrável, sem validação comercial; exigir aprovações separadas para qualquer uso real |

O detalhamento de resposta a cada risco, com probabilidade, impacto em horas e gatilho, está no plano de projeto.

## 10. Indicadores de sucesso

As metas da seção 3 são sugestões iniciais do grupo e devem ser ajustadas com os parceiros confirmados, depois da medição da situação atual. Indicadores possíveis:

- Percentual de reservas completadas sem falha no fluxo de pagamento em *sandbox*.
- Tempo médio entre chegar ao destino e estacionar, comparado à busca sem reserva.
- Ocupação dos parceiros em horário de baixa demanda, antes e durante o piloto.
- Taxa de reserva cancelada por estouro de tolerância.
- Número de estacionamentos parceiros ativos ao fim do piloto.
- Quantidade de parceiros que confirmam interesse em continuar depois do piloto.

## 11. Recomendação e próximos passos

Recomenda-se autorizar o MVP acadêmico, com prazo de 12 semanas e a ordem de grandeza da seção 12. Orçamento e prazo de uma operação real ficam para decisão futura. O projeto deve:

1. Iniciar a prospecção de parceiros na semana 1 e confirmar ao menos 1 parceiro interessado em participar do piloto até o fim da semana 6.
2. Validar com o parceiro o processo de atualização manual da disponibilidade de vagas e combinar como medir a ocupação inicial e o tempo de chegada.
3. Solicitar as credenciais do gateway em *sandbox* até a semana 7.
4. Definir requisitos priorizados, critérios de sucesso, estimativa de custo e cronograma, no plano de projeto.
5. Ajustar as metas numéricas da seção 3 junto ao(s) parceiro(s) confirmado(s).
6. Planejar, em etapa posterior, a validação com parceiros e usuários e uma análise própria de segurança, privacidade e cobrança real, antes de qualquer operação comercial.

**Decisão solicitada:** autorizar o MVP descrito neste caso, formalizado no termo de abertura em documento separado. A decisão de investimento em operação real é outra, posterior, e depende dos dados que o piloto e a validação com os parceiros produzirem.

## 12. Análise econômica preliminar (24 meses)

### 12.1 Premissas e referências de mercado

Esta é uma **simulação ilustrativa de iniciação**, em reais nominais e com horizonte de 24 meses. O investimento usado nos indicadores é o **orçamento total simulado do plano de projeto**: **540 h** e **R\$ 10.400,40**. A faixa da iniciação para esse tipo de MVP, feito por estudantes com apoio de IA, era de R\$ 20 mil a R\$ 35 mil e supunha cerca de R\$ 50,00 por hora; com o valor-hora de R\$ 18,00, o investimento fica abaixo dela. A seção 12.6 testa o valor-hora de R\$ 50,00.

O MVP com pagamento em *sandbox* e `json-server` não gera receita. Os benefícios modelados pressupõem uma operação real, com cobrança em produção, depois do mês 3, fora deste projeto. Os valores de mercado são referências, não proposta comercial nem custo contábil.

| Premissa | Valor adotado | Base e ressalvas |
|---|---:|---|
| Equipe de projeto | 9 alunos × 5 h/semana × 12 semanas | 540 horas no total: 240 h dos 4 alunos de PSW e 300 h dos 5 de gestão. Os alunos não são pagos. |
| Valor-hora simulado | R\$ 18,00 | Definido pelo grupo, abaixo do piso de R\$ 50 por hora de freelancer da referência de mercado. É valoração de esforço de estudantes, não salário nem preço de mercado. |
| Investimento | R\$ 10.400,40 | R\$ 9.720,00 de linha de base de custos mais 7% de reserva gerencial, conforme o plano. Lançado igualmente nos meses 1 a 3: R\$ 3.466,80 por mês. |
| Ticket médio por reserva | R\$ 55,00 | Diária de estacionamento no Rio de Janeiro, apurada pela Colliers International e publicada em 2021. Dado antigo, a atualizar. Uma reserva por hora tenderia a ter ticket menor. |
| Comissão do FluxoPark | 8% | Um pouco abaixo dos 10% que a Estapar já cobra na recarga da tag de pedágio. |
| Taxa de gateway | 0,99% por transação PIX | Taxa do Mercado Pago, sem piso fixo. A seção 12.6 testa o cartão. |
| Custo operacional | R\$ 500/mês | Piso da faixa de R\$ 500 a R\$ 3.000/mês de hospedagem, gateway e mapas. A seção 12.6 testa o teto. |
| Dias de operação por mês | 21 | Conservador: usa só dias úteis. |
| Início dos benefícios | Mês 4 | Depois do piloto; entrada em operação real supõe decisão e investimento futuros. |
| Taxa de desconto | 13,75% ao ano | Meta Selic definida pelo Copom em 16/09/2026, convertida para 1,0794% ao mês. É benchmark macroeconômico, não substitui a taxa mínima de atratividade de quem investir. |

### 12.2 Investimento estimado

A valoração é a de uma hora de trabalho a R\$ 18,00. Com 9 alunos dedicando 5 h por semana durante 12 semanas:

$$
9 \times 5\ \text{h/semana} \times 12\ \text{semanas} \times R\$\ 18,00/\text{h} = R\$\ 9.720,00
$$

A reserva gerencial de 7% eleva o total a **R\$ 10.400,40**, ou **R\$ 3.466,80 por mês** nos meses 1 a 3. O orçamento do plano separa a linha de base (R\$ 9.720,00, que inclui R\$ 1.152,00 de contingência por evento de risco) da reserva gerencial (R\$ 680,40), sob controle do patrocinador. Os alunos não são pagos; o custo é a valoração do esforço acadêmico. A estimativa não inclui infraestrutura paga, licenças, supervisão, cobrança real, segurança de produção, suporte nem o custo de passar do MVP para uma operação real.

### 12.3 Benefícios estimados

A receita do FluxoPark seria a comissão sobre cada reserva paga, descontada a taxa do gateway.

| Item | Valor |
|---|---:|
| Ticket médio por reserva | R\$ 55,00 |
| Comissão FluxoPark (8%) | R\$ 4,40 |
| Custo de gateway PIX (0,99%) | R\$ 0,54 |
| **Receita líquida por reserva** | **R\$ 3,86** |

O volume de reservas por dia não vem de pesquisa pública; só de conversa com parceiro real. Dois cenários, apenas para ordem de grandeza, com número de parceiros e volume constantes de 21 dias por mês a partir do mês 4:

| Cenário | Parceiros | Reservas/dia por parceiro | Reservas por mês | Receita líquida por mês | Custo operacional | Benefício líquido por mês |
|---|---:|---:|---:|---:|---:|---:|
| Conservador | 2 | 5 | 210 | R\$ 809,66 | R\$ 500,00 | **R\$ 309,66** |
| Moderado | 3 | 10 | 630 | R\$ 2.428,97 | R\$ 500,00 | **R\$ 1.928,97** |

**Benefícios intangíveis (não monetizados):** o motorista economiza tempo de busca e ganha previsibilidade; o parceiro ganha visibilidade e dados de ocupação; a avaliação pós-uso cria incentivo de qualidade. Esses efeitos não entram em VPL, TIR, ROI nem índice benefício-custo e precisam ser medidos com dados de uso.

> **Distinção importante:** receita líquida de reserva não é lucro. Os cenários não incluem custo comercial, suporte, segurança de produção nem o investimento para passar do MVP a uma operação real. Também supõem parceiros e volume constantes por 21 meses, sem crescimento nem perda de parceiros.

### 12.4 Fluxo de caixa-base

O investimento é lançado nos meses 1 a 3; o benefício líquido, nos meses 4 a 24. Valores em reais.

| Mês/período | Investimento | Benefício líquido (conservador) | Benefício líquido (moderado) |
|---|---:|---:|---:|
| 1, 2 e 3 (cada mês) | -R\$ 3.466,80 | R\$ 0,00 | R\$ 0,00 |
| 4 a 24 (cada mês) | R\$ 0,00 | R\$ 309,66 | R\$ 1.928,97 |
| **Total nominal em 24 meses** | **-R\$ 10.400,40** | **R\$ 6.502,76** | **R\$ 40.508,27** |
| **Fluxo líquido total** |  | **-R\$ 3.897,65** | **R\$ 30.107,87** |

### 12.5 Indicadores financeiros

| Indicador | Conservador | Moderado | Interpretação |
|---|---:|---:|---|
| VPL, à taxa mensal equivalente da Selic | **-R\$ 4.572,76** | **R\$ 24.749,00** | Positivo quando o valor presente dos benefícios supera o investimento. |
| TIR | **-3,64% ao mês** | **15,17% ao mês** (aprox. **444,79% ao ano efetivo**) | Compara-se com a taxa de desconto de 1,0794% ao mês. A TIR do conservador é negativa. |
| ROI simples em 24 meses | **-37,48%** | **289,49%** | (benefícios − investimento) ÷ investimento, em valores nominais, sem valor do dinheiro no tempo. |
| Payback simples | **Não ocorre em 24 meses** | **Mês 9** | Mês em que o fluxo acumulado volta a ser positivo. |
| Payback descontado | **Não ocorre em 24 meses** | **Mês 9** | O mesmo, com os fluxos descontados. |
| Índice benefício-custo | **0,551** | **3,431** | Valor presente dos benefícios ÷ valor presente do investimento; acima de 1, os benefícios descontados superam o custo. |

A TIR do cenário moderado é muito alta porque o investimento simulado é pequeno e o benefício mensal é constante em todo o período. Ela deve ser lida como ordem de grandeza, não como retorno esperado; o VPL e o ponto de equilíbrio da seção 12.6 são medidas mais prudentes.

Fórmulas utilizadas:

$$
VPL = \sum_{t=1}^{24}\frac{FC_t}{(1+i_m)^t},\qquad
ROI = \frac{\text{benefícios nominais} - \text{custos nominais}}{\text{custos nominais}},\qquad
IBC = \frac{VP(\text{benefícios})}{VP(\text{investimento})}
$$

A taxa mensal equivalente usada é $i_m=(1+0,1375)^{1/12}-1=0,0107939$, ou aproximadamente 1,0794% ao mês. A TIR é a taxa mensal que zera o VPL do fluxo de caixa; a taxa anual efetiva é $(1+\text{TIR mensal})^{12}-1$.

### 12.6 Sensibilidade e conclusão

O VPL, em reais, muda assim com cada variação isolada, mantidas as demais premissas:

| Variação | VPL conservador | VPL moderado |
|---|---:|---:|
| Cenário-base | -R\$ 4.572,76 | R\$ 24.749,00 |
| Ticket médio de R\$ 40 (−27%) | -R\$ 8.571,18 | R\$ 12.753,74 |
| Comissão de 5% em vez de 8% | -R\$ 10.847,03 | R\$ 5.926,19 |
| Mix de 50% PIX e 50% cartão à vista (3,03%) | -R\$ 6.706,01 | R\$ 18.349,25 |
| Custo operacional de R\$ 3.000/mês | -R\$ 49.841,66 | -R\$ 20.519,90 |
| Valor-hora de R\$ 50 (investimento de R\$ 28.890,00, como na iniciação) | -R\$ 22.670,27 | R\$ 6.651,49 |
| Investimento 50% maior (R\$ 15.600,60) | -R\$ 9.662,68 | R\$ 19.659,08 |
| Volume de reservas 50% menor | -R\$ 11.903,19 | R\$ 2.757,68 |

O ponto de equilíbrio, com VPL igual a zero nas demais premissas-base, é de cerca de **13,1 reservas por dia no total** (por exemplo, 3 parceiros com cerca de 4,4 reservas por dia cada), aproximadamente 56% abaixo do cenário moderado. O resultado é muito sensível ao volume de reservas por parceiro, ao número de parceiros e ao ticket médio. No cenário conservador, a operação não paga o investimento em 24 meses em nenhuma variação testada.

Os indicadores do cenário moderado são favoráveis somente sob as hipóteses simplificadas do modelo: parceiros e volume constantes, entrada em operação real depois do mês 3 e nenhum investimento adicional de produção. Como o escopo atual termina em um MVP com pagamento em *sandbox*, esses indicadores **não representam o retorno financeiro deste projeto acadêmico**. Antes de qualquer decisão de investimento, será necessário medir o volume de reservas com parceiros reais, estimar separadamente o custo de passar à operação (gateway em produção, segurança, privacidade, suporte e comercial), confirmar a comissão com os parceiros e recalcular VPL, TIR, ROI, payback e índice benefício-custo para o escopo completo. A taxa Selic permanece apenas um benchmark.

Recomenda-se, antes de solicitar investimento: validar o ticket médio com os parceiros, porque o dado usado é de 2021 e de diária; confirmar a taxa de gateway e o mix entre PIX e cartão; verificar o custo operacional real de hospedagem, mapas e gateway; e medir a ocupação inicial dos parceiros e o volume de reservas no piloto. Os valores de mercado foram consultados nas datas das referências e não substituem cotações nem dados dos parceiros.

## 13. Referências

BANCO CENTRAL DO BRASIL. *Meta Selic: decisão do Copom de 16 de setembro de 2026*. Brasília, 2026. Disponível em: https://www.bcb.gov.br/en. Acesso em: 4 out. 2026.

ESTAPAR. *Estapar Estacionamentos*. [São Paulo], 2026. Disponível em: https://site.estapar.com.br/. Acesso em: 6 set. 2026.

ESTAPAR. *Conheça o novo site da Estapar: estacionamento, IPVA, seguro e mais!*. [São Paulo], 2026. Disponível em: https://www.estapar.com.br/paraquemdirige. Acesso em: 6 set. 2026.

ESTAPAR. *Reserva de vagas*. [São Paulo], 2026. Disponível em: https://www.estapar.com.br/paraquemdirige/reservadevagas. Acesso em: 6 set. 2026.

CLICKSOFT. *Quanto custa um MVP de aplicativo no Brasil em 2026?*. [Rio de Janeiro], 5 jun. 2026. Disponível em: https://clicksoft.com.br/blog/quanto-custa-um-mvp-de-aplicativo. Acesso em: 6 set. 2026.

DIÁRIO DO RIO DE JANEIRO. *Preço de estacionamentos no Rio de Janeiro são 58% mais caros que de São Paulo*. Rio de Janeiro, 3 nov. 2021. Disponível em: https://diariodorio.com/preco-de-estacionamentos-no-rio-de-janeiro-sao-58-mais-caros-que-de-sao-paulo/. Acesso em: 6 set. 2026.

NBC NEWS. *Silicon Valley dispatch: SpotHero wants to find you a parking spot*. [S. l.], 2014. Disponível em: https://www.nbcnews.com/tech/tech-news/silicon-valley-dispatch-spothero-wants-find-you-parking-spot-n524341. Acesso em: 6 set. 2026.

PARKSY. *Parking apps compared: SpotHero vs ParkMobile vs ParkWhiz*. [S. l.], 31 mar. 2026. Disponível em: https://www.parksy.com/blog/parking-apps-compared-spothero-vs-parkmobile-vs-parkwhiz. Acesso em: 6 set. 2026.

SELLSYNC. *Taxas Mercado Pago 2026: o guia completo para vendedores*. [S. l.], 5 ago. 2026. Disponível em: https://sellsync.ai/pt/blog/taxa-mercado-pago-2026-guia-completo/. Acesso em: 6 set. 2026.

UNSTAR. *ParkMobile vs SpotHero: 5 parking apps ranked (2026)*. [S. l.], 24 maio 2026. Disponível em: https://unstar.app/blog/parkmobile-spothero-paybyphone-parkwhiz-passport-parking-apps-ranked-2026. Acesso em: 6 set. 2026.

ZUL+. *Rotativo Digital em BH: app, tarifa e como funciona*. [S. l.], 15 jul. 2026. Disponível em: https://www.zuldigital.com.br/blog/como-funciona-o-rotativo-digital-bh/. Acesso em: 6 set. 2026.