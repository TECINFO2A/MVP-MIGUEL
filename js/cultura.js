// js/cultura.js
// Renderiza e gerencia a navegação interativa das trilhas de cultura de paz

document.addEventListener('DOMContentLoaded', () => {
  carregarProgressoAluno().finally(carregarTrilhas);
});

async function carregarTrilhas() {
  const container = document.getElementById('trilhas-container');
  if (!container) return;

  try {
    // Busca trilhas do banco (ou do mock simulado no supabase.js)
    const { data: trilhas, error } = await window.supabaseClient
      .from('conteudos')
      .select('*')
      .order('ordem', { ascending: true });

    if (error || !trilhas || trilhas.length === 0) {
      container.innerHTML = `<div class="card" style="text-align: center; color: var(--prioridade-alta);">
        Erro ao carregar os conteúdos de cultura de paz. Verifique a conexão.
      </div>`;
      return;
    }

    container.innerHTML = ''; // Limpa loader
    trilhasDisponiveis = trilhas;
    localStorage.setItem('paz_na_escola_conteudos', JSON.stringify(trilhas));

    trilhas.forEach(trilha => {
      container.appendChild(criarTrilhaCard(trilha));
    });
  } catch (err) {
    console.error("Erro geral:", err);
    container.innerHTML = `<div class="card" style="text-align: center; color: var(--prioridade-alta);">
      Falha crítica de comunicação com o servidor de conteúdos.
    </div>`;
  }
}

// Cria a estrutura visual da trilha interativa
function criarTrilhaCard(trilha) {
  const card = document.createElement('article');
  card.className = 'card trilha-card';
  card.id = `trilha-${trilha.id}`;

  card.innerHTML = `
    <div class="trilha-header">
      <div>
        <span class="badge badge-aberta" style="margin-bottom: 8px;">${window.escapeHTML(trilha.categoria)}</span>
        <h2 style="font-size: 1.3rem; color: var(--primary);">${window.escapeHTML(trilha.titulo)}</h2>
        <p style="color: var(--text-muted); font-size: 0.95rem; margin-top: 4px;">${window.escapeHTML(trilha.descricao)}</p>
      </div>
    </div>
    
    <button class="btn btn-outline" id="btn-iniciar-${trilha.id}" onclick="iniciarTrilha('${trilha.id}')" style="padding: 12px; font-size: 0.95rem; margin-top: 8px;">
      🌱 Iniciar Aprendizado
    </button>
    
    <div class="trilha-steps" id="steps-${trilha.id}">
      <!-- Conteúdo do passo atual injetado via JS -->
    </div>
  `;

  return card;
}

// Inicializa o fluxo interativo de passos da trilha
let estadoTrilhas = {}; // Armazena progresso em memória { trilhaId: { passoAtual: 0 } }
let alunoAtual = null;
let progressoTrilhas = {};
let trilhasDisponiveis = [];

async function carregarProgressoAluno() {
  try {
    const { data: { session } } = await window.supabaseClient.auth.getSession();
    alunoAtual = session?.user || null;
    if (!alunoAtual) return;
    const { data } = await window.supabaseClient.from('progresso_trilhas').select('*').eq('aluno_id', alunoAtual.id);
    (data || []).forEach(item => { progressoTrilhas[item.trilha_id] = item; });
  } catch (error) { console.warn('Progresso de trilhas indisponível.', error); }
}

function iniciarTrilha(trilhaId) {
  // Registra visualização de acesso nas métricas locais
  registrarAcessoTrilha(trilhaId);

  // Oculta botão inicial
  const btnIniciar = document.getElementById(`btn-iniciar-${trilhaId}`);
  if (btnIniciar) btnIniciar.style.display = 'none';

  // Mostra container de passos
  const stepsContainer = document.getElementById(`steps-${trilhaId}`);
  if (stepsContainer) {
    stepsContainer.classList.add('active');
    estadoTrilhas[trilhaId] = { passoAtual: progressoTrilhas[trilhaId]?.progresso ? Math.max(0, Math.ceil((progressoTrilhas[trilhaId].progresso / 100) * 2) - 1) : 0 };
    renderizarPasso(trilhaId);
  }
}

// Busca os dados da trilha por ID a partir dos dados do LocalStorage mock ou memoria
async function renderizarPasso(trilhaId) {
  const stepsContainer = document.getElementById(`steps-${trilhaId}`);
  if (!stepsContainer) return;

  // Busca dados completos da trilha localmente do localStorage para agilizar a navegação
  const conteudosLocais = trilhasDisponiveis.length ? trilhasDisponiveis : JSON.parse(localStorage.getItem('paz_na_escola_conteudos') || '[]');
  const trilha = conteudosLocais.find(t => String(t.id) === String(trilhaId));

  if (!trilha || !trilha.conteudo || !trilha.conteudo.passos) {
    stepsContainer.innerHTML = `<p style="color: var(--prioridade-alta);">Conteúdo indisponível.</p>`;
    return;
  }

  const index = estadoTrilhas[trilhaId].passoAtual;
  const passo = trilha.conteudo.passos[index];
  const totalPassos = trilha.conteudo.passos.length;

  let optionsHtml = '';
  passo.opcoes.forEach((opcao, idx) => {
    optionsHtml += `
      <button class="btn btn-accent" style="padding: 12px; font-size: 0.95rem; text-align: left; justify-content: flex-start;" onclick="responderPergunta('${trilhaId}', ${idx})">
        👉 ${window.escapeHTML(opcao)}
      </button>
    `;
  });

  stepsContainer.innerHTML = `
    <hr style="border: 0; border-top: 1px solid var(--border-color); margin: 16px 0;">
    <div style="font-size: 0.85rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase;">
      Passo ${index + 1} de ${totalPassos}
    </div>
    
    <p style="font-size: 1.05rem; margin-top: 8px; color: var(--text-dark); font-weight: 400;">
      ${window.escapeHTML(passo.texto)}
    </p>
    
    <div style="background: rgba(45, 212, 191, 0.05); border-left: 3px solid var(--secondary); padding: 12px; margin-top: 16px; border-radius: 0 var(--radius-sm) var(--radius-sm) 0;">
      <p style="font-weight: 500; font-size: 0.95rem; color: var(--primary);">${window.escapeHTML(passo.pergunta)}</p>
      <div class="step-options" id="options-container-${trilhaId}">
        ${optionsHtml}
      </div>
    </div>
    
    <div id="feedback-${trilhaId}" class="quiz-feedback"></div>
    
    <div id="navigation-${trilhaId}" style="margin-top: 16px; display: none; text-align: right;">
      <button class="btn btn-primary" style="width: auto; padding: 10px 20px; font-size: 0.95rem;" onclick="proximoPasso('${trilhaId}', ${totalPassos})">
        ${index + 1 === totalPassos ? 'Concluir Trilha 🎉' : 'Avançar →'}
      </button>
    </div>
  `;

  window.announceAccessibility(`Carregado passo ${index + 1} da trilha. ${passo.texto}. Pergunta: ${passo.pergunta}`);
}

function responderPergunta(trilhaId, opcaoIndex) {
  // Desativa os botões para evitar duplo clique
  const container = document.getElementById(`options-container-${trilhaId}`);
  if (container) {
    const buttons = container.getElementsByTagName('button');
    for (let btn of buttons) {
      btn.disabled = true;
      btn.style.opacity = '0.6';
    }
  }

  const feedback = document.getElementById(`feedback-${trilhaId}`);
  const navContainer = document.getElementById(`navigation-${trilhaId}`);

  if (feedback && navContainer) {
    feedback.className = 'quiz-feedback success';
    feedback.innerHTML = `
      🌟 <strong>Parabéns pela reflexão!</strong> Seu engajamento ajuda a criar uma convivência escolar melhor para todos.
    `;
    navContainer.style.display = 'block';
    
    // Rola suavemente até o feedback para melhorar UX no celular
    feedback.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    window.announceAccessibility("Excelente escolha! Clique no botão Avançar para prosseguir.");
  }
}

function proximoPasso(trilhaId, totalPassos) {
  const index = estadoTrilhas[trilhaId].passoAtual;

  if (index + 1 >= totalPassos) {
    salvarProgressoTrilha(trilhaId, 100, true);
    desbloquearConquistas(trilhaId);
    // Conclusão da trilha
    const stepsContainer = document.getElementById(`steps-${trilhaId}`);
    if (stepsContainer) {
      stepsContainer.innerHTML = `
        <hr style="border: 0; border-top: 1px solid var(--border-color); margin: 16px 0;">
        <div style="text-align: center; padding: 16px;">
          <div style="font-size: 3rem; margin-bottom: 8px;">🎓</div>
          <h3 style="color: var(--accent); margin-bottom: 8px;">Trilha Concluída!</h3>
          <p style="font-size: 0.95rem; color: var(--text-dark); margin-bottom: 16px;">
            Você completou todos os passos. Obrigado por fazer a diferença no clima escolar!
          </p>
          <button class="btn btn-outline" style="width: auto; padding: 8px 16px; font-size: 0.9rem;" onclick="reiniciarTrilha('${trilhaId}')">
            Refazer Trilha
          </button>
        </div>
      `;
      window.announceAccessibility("Parabéns, você concluiu esta trilha educativa!");
    }
  } else {
    // Avança para o próximo
    estadoTrilhas[trilhaId].passoAtual++;
    salvarProgressoTrilha(trilhaId, Math.round(((index + 1) / totalPassos) * 100), false);
    renderizarPasso(trilhaId);
  }
}

async function salvarProgressoTrilha(trilhaId, progresso, concluida) {
  const payload = { aluno_id: alunoAtual?.id, trilha_id: trilhaId, progresso, concluida, atualizado_em: new Date().toISOString(), data_inicio: progresso > 0 ? new Date().toISOString() : null, data_conclusao: concluida ? new Date().toISOString() : null };
  if (!alunoAtual) { const local = JSON.parse(localStorage.getItem('paz_na_escola_progresso_trilhas') || '{}'); local[trilhaId] = payload; localStorage.setItem('paz_na_escola_progresso_trilhas', JSON.stringify(local)); return; }
  await window.supabaseClient.from('progresso_trilhas').upsert(payload);
  progressoTrilhas[trilhaId] = payload;
}

async function desbloquearConquistas(trilhaId) {
  if (!alunoAtual) return;
  const names = { '1': 'Bom Ouvinte', '3': 'Pacificador' };
  if (names[trilhaId]) await window.supabaseClient.from('conquistas_alunos').upsert({ aluno_id: alunoAtual.id, conquista: names[trilhaId] });
  const progressos = Object.values(progressoTrilhas).filter(item => item.concluida).length;
  if (progressos >= 1) await window.supabaseClient.from('conquistas_alunos').upsert({ aluno_id: alunoAtual.id, conquista: 'Primeiro Passo' });
}

function reiniciarTrilha(trilhaId) {
  iniciarTrilha(trilhaId);
}

// Registra acessos e conclusões locais para o gestor poder visualizar estatísticas consolidadas
function registrarAcessoTrilha(trilhaId) {
  const acessos = JSON.parse(localStorage.getItem('paz_na_escola_acesso_cultura') || '{}');
  acessos[trilhaId] = (acessos[trilhaId] || 0) + 1;
  localStorage.setItem('paz_na_escola_acesso_cultura', JSON.stringify(acessos));
}

// Vincula funções ao escopo global do window para uso inline nos cliques
window.iniciarTrilha = iniciarTrilha;
window.responderPergunta = responderPergunta;
window.proximoPasso = proximoPasso;
window.reiniciarTrilha = reiniciarTrilha;
