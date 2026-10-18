let usuarioLogado = null;
let modoCadastro = false;
let bancoDadosMaterias = {};
let materiaAtiva = null;

// Carrega os dados salvos automaticamente do navegador ao iniciar
function carregarDadosSalvos() {
    const salvo = localStorage.getItem("educaOne_db");
    if (salvo) {
        try {
            bancoDadosMaterias = JSON.parse(salvo);
        } catch (e) {
            bancoDadosMaterias = {};
        }
    }
}

// Salva os dados automaticamente no navegador
function persistirDados() {
    localStorage.setItem("educaOne_db", JSON.stringify(bancoDadosMaterias));
}

// --- AUTENTICAÇÃO ---
function alternarModoAuth() {
    modoCadastro = !modoCadastro;
    const camposCad = document.getElementById("campos-cadastro");
    const subtitulo = document.getElementById("auth-subtitulo");
    const btnAcao = document.getElementById("btn-acao-auth");
    const linkTroca = document.getElementById("link-troca");

    if (modoCadastro) {
        camposCad.classList.remove("escondido");
        subtitulo.innerText = "Crie o seu perfil acadêmico";
        btnAcao.innerText = "Cadastrar e Entrar";
        linkTroca.innerText = "Já tenho conta";
    } else {
        camposCad.classList.add("escondido");
        subtitulo.innerText = "Acesse a sua conta acadêmica";
        btnAcao.innerText = "Entrar";
        linkTroca.innerText = "Cadastre-se";
    }
}

function realizarLogin() {
    const email = document.getElementById("auth-email").value;
    const senha = document.getElementById("auth-senha").value;

    if (!email || !senha) {
        alert("Por favor, preencha o e-mail e a senha.");
        return;
    }

    if (modoCadastro) {
        const nome = document.getElementById("cad-nome").value;
        const curso = document.getElementById("cad-curso").value;
        if (!nome || !curso) {
            alert("Por favor, preencha o seu Nome e Curso.");
            return;
        }
        usuarioLogado = { nome, curso, email };
    } else {
        usuarioLogado = { nome: email.split('@')[0], curso: "Estudante UDESC", email };
    }

    document.getElementById("saudacao-nome").innerText = `Olá, ${usuarioLogado.nome}`;
    document.getElementById("saudacao-curso").innerText = usuarioLogado.curso;

    document.getElementById("tela-auth").classList.add("escondido");
    document.getElementById("tela-home").classList.remove("escondido");

    carregarDadosSalvos();
    calcularProgressoSemestre();
    atualizarHomeGeral();
}

function fazerLogout() {
    usuarioLogado = null;
    document.getElementById("tela-home").classList.add("escondido");
    document.getElementById("tela-auth").classList.remove("escondido");
}

// --- ANDAMENTO DO SEMESTRE ---
function calcularProgressoSemestre() {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    
    let inicio, fim;
    if (hoje.getMonth() < 6) {
        inicio = new Date(ano, 2, 1);
        fim = new Date(ano, 5, 30);
    } else {
        inicio = new Date(ano, 7, 1);
        fim = new Date(ano, 10, 30);
    }

    let totalDias = fim - inicio;
    let decorrido = hoje - inicio;
    let porcentagem = (decorrido / totalDias) * 100;

    if (porcentagem < 0) porcentagem = 0;
    if (porcentagem > 100) porcentagem = 100;

    document.getElementById("texto-progresso-semestre").innerText = `Semestre em andamento: ${porcentagem.toFixed(1)}% concluído`;
    document.getElementById("barra-progresso-topo").style.width = `${porcentagem}%`;
}

// --- ATUALIZAR HOME ---
function atualizarHomeGeral() {
    atualizarListaMaterias();
    atualizarCompromissosGeral();
}

function atualizarListaMaterias() {
    const container = document.getElementById("lista-materias");
    container.innerHTML = "";

    const chaves = Object.keys(bancoDadosMaterias);
    if (chaves.length === 0) {
        container.innerHTML = "<p style='font-size:12px; color:#64748b; text-align:center;'>Nenhuma disciplina cadastrada. Clique em '+ Nova Matéria' acima.</p>";
        return;
    }

    chaves.forEach((nomeMat) => {
        const dados = bancoDadosMaterias[nomeMat];
        let p1 = Number(dados.peso1) || 0;
        let p2 = Number(dados.peso2) || 0;
        let n1 = Number(dados.nota1) || 0;
        let n2 = Number(dados.nota2) || 0;
        let somaPesos = p1 + p2;
        let mediaParcial = somaPesos > 0 ? ((n1 * p1) + (n2 * p2)) / somaPesos : 0;

        const div = document.createElement("div");
        div.className = "materia-card";
        div.innerHTML = `
            <div class="materia-info">
                <h4>📘 ${nomeMat}</h4>
                <p>Média Atual: <strong>${mediaParcial.toFixed(2)}</strong> (Meta: 6.0)</p>
            </div>
            <span>→</span>
        `;
        div.onclick = () => abrirDetalhesMateria(nomeMat);
        container.appendChild(div);
    });
}

function atualizarCompromissosGeral() {
    const container = document.getElementById("lista-compromissos-geral");
    container.innerHTML = "";

    const chaves = Object.keys(bancoDadosMaterias);
    let temCompromissos = false;

    chaves.forEach((nomeMat) => {
        const agendaLista = bancoDadosMaterias[nomeMat].agenda || [];
        agendaLista.forEach(itemAgenda => {
            temCompromissos = true;
            const div = document.createElement("div");
            div.className = "compromisso-item";
            div.innerHTML = `
                <strong>📘 ${nomeMat} — ${itemAgenda.titulo}</strong>
                <span>📅 ${itemAgenda.dia} às ${itemAgenda.horario}</span>
            `;
            container.appendChild(div);
        });
    });

    if (!temCompromissos) {
        container.innerHTML = `<p class="texto-vazio">Nenhum compromisso cadastrado. Defina a agenda dentro de cada matéria.</p>`;
    }
}

function abrirModalMateria() {
    document.getElementById("modal-materia").classList.remove("escondido");
}

function fecharModalMateria() {
    document.getElementById("modal-materia").classList.add("escondido");
    document.getElementById("input-nova-materia").value = "";
}

function criarMateria() {
    const nome = document.getElementById("input-nova-materia").value.trim();
    if (!nome) {
        alert("Insira o nome da disciplina.");
        return;
    }

    if (bancoDadosMaterias[nome]) {
        alert("Esta disciplina já está cadastrada.");
        return;
    }

    bancoDadosMaterias[nome] = {
        av1Nome: "Prova 1", peso1: 40, nota1: "",
        av2Nome: "Trabalho", peso2: 60, nota2: "",
        profNome: "", profContato: "",
        agenda: [], links: [], resumos: []
    };

    persistirDados();
    fecharModalMateria();
    atualizarHomeGeral();
}

// --- DETALHES DA MATÉRIA ---
function abrirDetalhesMateria(nomeMat) {
    materiaAtiva = nomeMat;
    document.getElementById("titulo-materia-ativa").innerText = nomeMat;
    
    document.getElementById("tela-home").classList.add("escondido");
    document.getElementById("tela-detalhes").classList.remove("escondido");

    carregarDadosMatériaNaTela();
    mudarAba('notas');
}

function voltarHome() {
    atualizarHomeGeral();
    document.getElementById("tela-detalhes").classList.add("escondido");
    document.getElementById("tela-home").classList.remove("escondido");
}

function mudarAba(abaId) {
    document.querySelectorAll('.conteudo-aba').forEach(el => el.classList.add('escondido'));
    document.querySelectorAll('.aba-btn').forEach(el => el.classList.remove('ativa'));

    if (abaId === 'notas') {
        document.getElementById('aba-notas').classList.remove('escondido');
        document.querySelectorAll('.aba-btn')[0].classList.add('ativa');
    } else if (abaId === 'agenda') {
        document.getElementById('aba-agenda').classList.remove('escondido');
        document.querySelectorAll('.aba-btn')[1].classList.add('ativa');
    } else if (abaId === 'links') {
        document.getElementById('aba-links').classList.remove('escondido');
        document.querySelectorAll('.aba-btn')[2].classList.add('ativa');
    } else if (abaId === 'resumos') {
        document.getElementById('aba-resumos').classList.remove('escondido');
        document.querySelectorAll('.aba-btn')[3].classList.add('ativa');
    }
}

function carregarDadosMatériaNaTela() {
    const dados = bancoDadosMaterias[materiaAtiva];
    
    document.getElementById("nome-av1").value = dados.av1Nome;
    document.getElementById("peso-av1").value = dados.peso1;
    document.getElementById("nota-av1").value = dados.nota1;

    document.getElementById("nome-av2").value = dados.av2Nome;
    document.getElementById("peso-av2").value = dados.peso2;
    document.getElementById("nota-av2").value = dados.nota2;

    document.getElementById("prof-nome").value = dados.profNome;
    document.getElementById("prof-contato").value = dados.profContato;

    calcularMediaMateria();
    atualizarListaAgendaTela();
    atualizarListaLinksTela();
    atualizarListaResumosTela();
}

function salvarDadosMateria() {
    bancoDadosMaterias[materiaAtiva].av1Nome = document.getElementById("nome-av1").value;
    bancoDadosMaterias[materiaAtiva].av2Nome = document.getElementById("nome-av2").value;
    persistirDados();
}

function calcularMediaMateria() {
    let p1 = parseFloat(document.getElementById("peso-av1").value) || 0;
    let p2 = parseFloat(document.getElementById("peso-av2").value) || 0;
    let n1 = parseFloat(document.getElementById("nota-av1").value) || 0;
    let n2 = parseFloat(document.getElementById("nota-av2").value) || 0;

    bancoDadosMaterias[materiaAtiva].peso1 = p1;
    bancoDadosMaterias[materiaAtiva].peso2 = p2;
    bancoDadosMaterias[materiaAtiva].nota1 = document.getElementById("nota-av1").value;
    bancoDadosMaterias[materiaAtiva].nota2 = document.getElementById("nota-av2").value;

    persistirDados();

    let somaPesos = p1 + p2;
    if (somaPesos === 0) return;

    let media = ((n1 * p1) + (n2 * p2)) / somaPesos;
    document.getElementById("txt-media-parcial").innerText = `Média Ponderada Atual: ${media.toFixed(2)}`;

    let meta = 6.0;
    let txtFalta = document.getElementById("txt-quanto-falta");
    
    if (media >= meta) {
        txtFalta.innerText = "Status: Aprovado por média 🎉";
        txtFalta.style.color = "#10b981";
    } else {
        txtFalta.innerText = `Falta para atingir a média (6.0): ${(meta - media).toFixed(2)} pontos`;
        txtFalta.style.color = "#ef4444";
    }
}

function salvarInfoProfessor() {
    bancoDadosMaterias[materiaAtiva].profNome = document.getElementById("prof-nome").value;
    bancoDadosMaterias[materiaAtiva].profContato = document.getElementById("prof-contato").value;
    persistirDados();
}

// --- AGENDA / COMPROMISSOS ---
function adicionarCompromissoMateria() {
    const titulo = document.getElementById("input-agenda-titulo").value.trim();
    const dia = document.getElementById("input-agenda-dia").value.trim();
    const horario = document.getElementById("input-agenda-horario").value.trim();

    if (!titulo || !dia || !horario) {
        alert("Preencha o título, o dia e o horário do compromisso.");
        return;
    }

    bancoDadosMaterias[materiaAtiva].agenda.push({ titulo, dia, horario });
    persistirDados();
    
    document.getElementById("input-agenda-titulo").value = "";
    document.getElementById("input-agenda-dia").value = "";
    document.getElementById("input-agenda-horario").value = "";

    atualizarListaAgendaTela();
}

function atualizarListaAgendaTela() {
    const container = document.getElementById("lista-agenda-materia");
    container.innerHTML = "";
    const agendaLista = bancoDadosMaterias[materiaAtiva].agenda;

    agendaLista.forEach(item => {
        const div = document.createElement("div");
        div.className = "agenda-item";
        div.innerHTML = `<span><strong>${item.titulo}</strong> (${item.dia} às ${item.horario})</span>`;
        container.appendChild(div);
    });
}

// --- LINKS ---
function adicionarLinkMateria() {
    const titulo = document.getElementById("input-link-titulo").value.trim();
    const url = document.getElementById("input-link-url").value.trim();

    if (!titulo || !url) {
        alert("Preencha o título e a URL.");
        return;
    }

    bancoDadosMaterias[materiaAtiva].links.push({ titulo, url });
    persistirDados();

    document.getElementById("input-link-titulo").value = "";
    document.getElementById("input-link-url").value = "";
    atualizarListaLinksTela();
}

function atualizarListaLinksTela() {
    const container = document.getElementById("lista-links-materia");
    container.innerHTML = "";
    const links = bancoDadosMaterias[materiaAtiva].links;

    links.forEach(l => {
        const div = document.createElement("div");
        div.className = "link-item";
        div.innerHTML = `<span>${l.titulo}</span> <a href="${l.url}" target="_blank">Acessar ↗</a>`;
        container.appendChild(div);
    });
}

// --- RESUMOS POR TÓPICOS (TAGS) ---
function adicionarResumoMateria() {
    const tag = document.getElementById("input-resumo-tag").value.trim();
    const texto = document.getElementById("input-resumo-texto").value.trim();

    if (!tag || !texto) {
        alert("Preencha a etiqueta (tag) e o texto do resumo.");
        return;
    }

    bancoDadosMaterias[materiaAtiva].resumos.push({ tag, texto });
    persistirDados();
    
    document.getElementById("input-resumo-tag").value = "";
    document.getElementById("input-resumo-texto").value = "";

    atualizarListaResumosTela();
}

function atualizarListaResumosTela() {
    const container = document.getElementById("lista-resumos-materia");
    container.innerHTML = "";
    const resumos = bancoDadosMaterias[materiaAtiva].resumos;

    resumos.forEach(r => {
        const div = document.createElement("div");
        div.className = "resumo-card";
        div.innerHTML = `
            <span class="resumo-tag">${r.tag}</span>
            <p>${r.texto}</p>
        `;
        container.appendChild(div);
    });

    if (resumos.length === 0) {
        container.innerHTML = `<p class="texto-vazio">Nenhum resumo cadastrado nesta disciplina ainda.</p>`;
    }
}