# FluxoPark — Prototipação

---

## 👥 Membros

**Nome membros:**

- Daniel Dezerto Rimes
- Fernando Lira Barbosa
- Ricardo Garcia Franco
- Walter Veridiano dos Santos

---

## 🎯 Nome/Propósito

**FluxoPark** - auxiliar motoristas a localizarem e selecionarem estacionamentos parceiros próximos ao seu destino, de forma a otimizar tempo e recursos e, além de reservar vagas antecipadamente.

---

## 💼 Business Case

Em situações como viagens, eventos, compromissos profissionais ou visitas a locais desconhecidos, encontrar um estacionamento próximo ao destino pode ser uma tarefa demorada e imprevisível. O motorista muitas vezes precisa pesquisar previamente os estacionamentos disponíveis na região ou procurar uma vaga somente após chegar ao local, podendo perder tempo e, em situações de alta demanda, não encontrar vagas disponíveis.

O **FluxoPark** tem como objetivo facilitar esse processo, permitindo que o usuário informe seu destino e encontre estacionamentos parceiros localizados nas proximidades. A partir da localização apresentada, o usuário poderá consultar informações dos estabelecimentos, como preço, distância, horário de funcionamento e disponibilidade de vagas, além de realizar a reserva antecipada de uma vaga específica.

Dessa forma, o sistema gera valor ao proporcionar maior **previsibilidade e comodidade ao motorista**, que poderá planejar sua chegada ao destino sabendo previamente onde estacionará seu veículo. Para os estacionamentos parceiros, o sistema também possibilita o gerenciamento das vagas e reservas, contribuindo para uma melhor organização da ocupação do estabelecimento e para a atração de novos clientes.

---

## 🔄 Processo de Negócio Principal

Primeiro, o usuário informa o endereço ou local de destino para o qual deseja se deslocar. O sistema realiza uma análise geográfica e apresenta os estacionamentos parceiros localizados nas proximidades do destino, permitindo que o usuário consulte e compare os estabelecimentos de acordo com informações como preço e distância.

Posteriormente, o usuário seleciona um dos estacionamentos disponíveis e informa o período durante o qual pretende permanecer estacionado. O sistema verifica a disponibilidade das vagas para o período informado e apresenta as vagas que podem ser reservadas, permitindo que o usuário escolha uma vaga específica.

Após a seleção da vaga, o sistema calcula o valor da reserva de acordo com as regras de cobrança definidas pelo estacionamento. O usuário realiza o pagamento por meio do sistema e, após a confirmação, a vaga é reservada exclusivamente para ele durante o período estabelecido. A reserva possui um período de tolerância para chegada ou saída; caso o usuário ultrapasse o limite estabelecido, a reserva poderá ser cancelada e a vaga disponibilizada novamente.

Ao final da utilização, o usuário poderá avaliar o estacionamento utilizado, contribuindo para a avaliação dos estabelecimentos disponíveis na plataforma.

---

## 🗂️ Entidade

- Estacionamento
- Vaga
- Reserva
- Pagamento

---

## ⚙️ Casos de Uso

*Casos de uso:*

| Caso de Uso | Quantidade |
|---|:---:|
| Manutenção dos Estacionamentos (CRUD) | 4 casos de uso |
| Manutenção das Vagas (CRUD) | 4 casos de uso |
| Manutenção das Reservas (CRUD) | 4 casos de uso |
| Realização de Reserva | 1 caso de uso |
| Realização de Pagamento | 1 caso de uso |
| Avaliação de Estacionamento | 1 caso de uso |
| **Total** | **15 casos de uso** |

---

## 🖥️ Telas a serem projetadas em HTML

1. Pesquisa de endereço
2. Escolha de estacionamento
3. Escolha de vaga
4. Confirmação/pagamento
