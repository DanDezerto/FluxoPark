const projetos = [
    
    {
    id: 3,
    nome: "Projeto 3",
    descricao: "Descrição do projeto 3",
    tecnologias: ["React", "Node.js", "MongoDB"],
    url: "",
    status: "ativo"
    },

    {
    id: 2,
    nome: "Projeto 2",
    descricao: "Descrição do projeto 2",
    tecnologias: ["Python", "Django", "PostgreSQL"],
    url: "",
    status: "em andamento"
    },

    {
    id: 1,
    nome: "Projeto 1",
    descricao: "Descrição do projeto 1",
    tecnologias: ["JavaScripts", "HTML", "CSS"],
    url: "",
    status: "ativo"
    }

]

const projetosOrdenados = [...projetos].sort((a, b) => a.id - b.id)

const listaProjetos = document.querySelector("#lista-projetos")

projetosOrdenados.forEach(projeto => {
  const itemProjeto = document.createElement("li")
  itemProjeto.className = "project-item"
  itemProjeto.innerHTML = `
    <article class="project-card">
      <div class="project-card__topline">
        <span class="project-card__id">#${projeto.id}</span>
        <span class="status status--${projeto.status === "ativo" ? "active" : "progress"}">
          ${projeto.status}
        </span>
      </div>
      <h2 class="project-card__title">${projeto.nome}</h2>
      <p class="project-card__description">${projeto.descricao}</p>
      <ul class="technology-list" aria-label="Tecnologias utilizadas">
        ${projeto.tecnologias.map(tecnologia => `<li>${tecnologia}</li>`).join("")}
      </ul>
    </article>
  `

  listaProjetos.appendChild(itemProjeto)
})