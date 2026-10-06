# FluxoPark – Refinamento da Prototipagem

**Grupo 1 – PSW**

- Daniel Dezerto Rimes
- Fernando Lira Barbosa
- Ricardo Garcia Franco
- Walter Veridiano dos Santos

📅 09/09/2026

---

## Matriz CRUD

|  | Estacionamento | Vaga | Reserva | Pagamento |
| --- | :---: | :---: | :---: | :---: |
| Criar estacionamento | C |  |  |  |
| Consultar estacionamento | R |  |  |  |
| Atualizar estacionamento | U |  |  |  |
| Remover estacionamento | D |  |  |  |
| Realizar reserva | R | U | C | C |
| Consultar reserva | R | R | R | R |
| Atualizar reserva |  |  | U |  |
| Cancelar reserva |  | U | U | U |
| Realizar pagamento |  |  | R | C |
| Criar vaga |  | C |  |  |
| Consultar vaga |  | R |  |  |
| Atualizar vaga |  | U |  |  |
| Remover vaga |  | D |  |  |
| Pesquisar destino | R | R |  |  |
| Avaliar estacionamento | U |  | R |  |
| Emitir avaliações | R |  |  |  |

---

## Matriz perfil x funcionalidade

|  | Cliente | Estacionamento | Administrador |
| --- | :---: | :---: | :---: |
| Criar estacionamento |  | x | x |
| Consultar estacionamento | x | x | x |
| Atualizar estacionamento |  | x | x |
| Remover estacionamento |  |  | x |
| Realizar reserva | x |  |  |
| Atualizar reserva | x | x | x |
| Consultar reserva | x | x | x |
| Cancelar reserva | x | x | x |
| Realizar pagamento | x |  |  |
| Criar vaga |  | x | x |
| Consultar vaga | x | x | x |
| Atualizar vaga |  | x | x |
| Remover vaga |  | x | x |
| Avaliar estacionamento | x |  |  |
| Emitir avaliações do estacionamento | x | x | x |
| Pesquisar destino | x |  |  |

---

## Priorização de requisitos

1. CRUD para Estacionamento
2. CRUD para Vaga
3. Pesquisar Destino
4. Realizar Reserva e Pagamento
5. Manutenção/Gestão de Reservas
6. Avaliar Estacionamento
7. Emitir Avaliações do Estacionamento
