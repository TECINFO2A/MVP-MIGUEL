// js/dashboard.js
// Processamento de dados estatísticos de denúncias e sentimentos para o Gestor

let periodoDashboard = 'all';
let denunciasDashboard = [];
let checkinsDashboard = [];

document.addEventListener('DOMContentLoaded', async () => {
  configurarFiltrosDashboard();
  // Garante rota protegida antes de renderizar qualquer dado sensível
  const session = await window.verificarAutenticacao({ perfil: 'gestor', destino: 'dashboard.html' });
  if (session) {
    carregarEstatisticas();
    carregarDenuncias();
    configurarFiltrosDenuncias();
    document.getElementById('btn-export-report')?.addEventListener('click', gerarRelatorioCSV);
  }
});

function configurarFiltrosDashboard() {
  document.querySelectorAll('.filter-button').forEach(button => {
    button.addEventListener('click', () => {
      periodoDashboard = button.dataset.period || 'all';
      document.querySelectorAll('.filter-button').forEach(item => item.classList.remove('active'));
      button.classList.add('active');
      atualizarDashboardFiltrado();
    });
  });
}

function atualizarDashboardFiltrado() {
  const limite = periodoDashboard === 'all' ? null : new Date();
  if (limite) {
    if (periodoDashboard === 'today') limite.setHours(0, 0, 0, 0);
    else limite.setDate(limite.getDate() - Number(periodoDashboard));
  }

  const dentroDoPeriodo = item => !limite || new Date(item.created_at) >= limite;
  const denunciasFiltradas = denunciasDashboard.filter(dentroDoPeriodo);
  const checkinsFiltrados = checkinsDashboard.filter(dentroDoPeriodo);

  atualizarMetricasDenuncias(denunciasFiltradas);
  atualizarMetricasSentimentos(checkinsFiltrados);
  atualizarMetricasTrilhas();
  atualizarIndicePaz(denunciasFiltradas, checkinsFiltrados);
  renderizarGraficoLinha(denunciasFiltradas);
  renderizarGraficoCategorias(denunciasFiltradas);
}

function atualizarIndicePaz(denuncias, checkins) {
  const resolved = denuncias.length ? denuncias.filter(item => ['Resolvida', 'Concluída'].includes(item.status)).length / denuncias.length : 0.5;
  const calm = checkins.length ? checkins.filter(item => ['Bem', 'Tranquilo(a)', 'Normal'].includes(item.sentimento)).length / checkins.length : 0.5;
  const participation = Math.min(1, Object.values(JSON.parse(localStorage.getItem('paz_na_escola_acesso_cultura') || '{}')).reduce((sum, value) => sum + Number(value || 0), 0) / 10);
  const volume = Math.max(0, 1 - (denuncias.length / Math.max(10, denunciasDashboard.length || 10)));
  const score = Math.round((resolved * 35) + (calm * 30) + (participation * 20) + (volume * 15));
  const value = document.getElementById('peace-index-value'); if (value) value.textContent = `${score} / 100`;
  const trend = document.getElementById('peace-index-trend'); if (trend) trend.textContent = 'Varia conforme o período e os dados disponíveis; use como sinal de acompanhamento.';
}

// Busca todas as denúncias e check-ins para gerar métricas e alimentar a tabela
async function carregarEstatisticas() {
  try {
    // 1. Busca todas as denúncias
    const { data: denuncias, error: errD } = await window.supabaseClient
      .from('denuncias')
      .select('*');

    if (!errD && denuncias) denunciasDashboard = denuncias;

    // 2. Busca check-ins para Clima Escolar Agregado (Segurança de Dados: Nunca puxa nomes ou IDs vinculados)
    const { data: checkins, error: errC } = await window.supabaseClient
      .from('checkins')
      .select('sentimento, created_at');

    if (!errC && checkins) checkinsDashboard = checkins;

    // 3. Lê métricas de trilhas educativas do LocalStorage (Acessos locais do estudante)
    atualizarDashboardFiltrado();

  } catch (error) {
    console.error("Erro ao processar estatísticas:", error);
  }
}

// Atualiza cards de métricas superiores das denúncias
function atualizarMetricasDenuncias(denuncias) {
  const total = denuncias.length;
  
  const prioridades = { Alta: 0, Média: 0, Baixa: 0 };
  const statusCounts = { Recebida: 0, 'Em análise': 0, 'Em acompanhamento': 0, Concluída: 0, Resolvida: 0 };

  denuncias.forEach(d => {
    if (prioridades[d.prioridade] !== undefined) prioridades[d.prioridade]++;
    if (statusCounts[d.status] !== undefined) statusCounts[d.status]++;
  });

  const metricTotalDenuncias = document.getElementById('metric-total-denuncias');
  const metricAlta = document.getElementById('metric-alta');
  const metricMedia = document.getElementById('metric-media');
  const metricBaixa = document.getElementById('metric-baixa');
  const metricTotalAbertas = document.getElementById('metric-total-abertas');
  const metricStatusAbertas = document.getElementById('metric-status-abertas');
  const metricStatusAnalise = document.getElementById('metric-status-analise');
  const metricStatusResolvidas = document.getElementById('metric-status-resolvidas');
  const metricEmAnalise = document.getElementById('metric-em-analise');
  const metricAltaTotal = document.getElementById('metric-alta-total');
  const metricResolvidosTotal = document.getElementById('metric-resolvidos-total');

  if (metricTotalDenuncias) metricTotalDenuncias.innerText = total;
  if (metricAlta) metricAlta.innerText = prioridades.Alta;
  if (metricMedia) metricMedia.innerText = prioridades.Média;
  if (metricBaixa) metricBaixa.innerText = prioridades.Baixa;
  if (metricTotalAbertas) metricTotalAbertas.innerText = statusCounts.Recebida;
  if (metricStatusAbertas) metricStatusAbertas.innerText = statusCounts.Recebida;
  if (metricStatusAnalise) metricStatusAnalise.innerText = statusCounts['Em análise'];
  if (metricStatusResolvidas) metricStatusResolvidas.innerText = statusCounts.Concluída + statusCounts.Resolvida;
  if (metricEmAnalise) metricEmAnalise.innerText = statusCounts['Em análise'];
  if (metricAltaTotal) metricAltaTotal.innerText = prioridades.Alta;
  if (metricResolvidosTotal) metricResolvidosTotal.innerText = statusCounts.Concluída + statusCounts.Resolvida;
}

// Processa check-ins emocionais de maneira totalmente agregada e exibe no gráfico de barras
function atualizarMetricasSentimentos(checkins) {
  const total = checkins.length;
  const totalCheckins = document.getElementById('metric-total-checkins');
  if (totalCheckins) totalCheckins.innerText = total;
  const contagem = {
    'Bem': 0,
    'Tranquilo(a)': 0,
    'Normal': 0,
    'Preocupado(a)': 0,
    'Triste': 0,
    'Com raiva': 0
  };

  checkins.forEach(c => {
    // Normaliza para lidar com possíveis variações
    let sentimento = c.sentimento;
    if (sentimento === 'Tranquilo') sentimento = 'Tranquilo(a)';
    if (sentimento === 'Preocupado') sentimento = 'Preocupado(a)';

    if (contagem[sentimento] !== undefined) {
      contagem[sentimento]++;
    }
  });

  // Atualiza barras de progresso
  Object.keys(contagem).forEach(feeling => {
    const qty = contagem[feeling];
    const pct = total > 0 ? Math.round((qty / total) * 100) : 0;

    const domId = feeling.replace('(a)', '');
    const barElement = document.getElementById(`bar-${domId}`);
    const valElement = document.getElementById(`val-${domId}`);

    if (barElement && valElement) {
      barElement.style.width = `${pct}%`;
      valElement.innerText = `${pct}%`;
    }
  });
}

function renderizarGraficoLinha(denuncias) {
  const container = document.getElementById('timeline-chart-container');
  if (!container) return;

  const range = periodoDashboard === 'today' ? 7 : periodoDashboard === '7' ? 7 : periodoDashboard === '30' ? 30 : 6;
  const entries = [];
  const hoje = new Date();

  for (let i = range - 1; i >= 0; i--) {
    const date = new Date(hoje);
    date.setDate(hoje.getDate() - i);
    const key = date.toISOString().slice(0, 10);
    entries.push({ label: date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }), value: 0, key });
  }

  denuncias.forEach(denuncia => {
    if (!denuncia.created_at) return;
    const data = new Date(denuncia.created_at);
    const key = data.toISOString().slice(0, 10);
    const entry = entries.find(item => item.key === key);
    if (entry) entry.value += 1;
  });

  const max = Math.max(...entries.map(item => item.value), 1);
  const bars = entries.map(item => {
    const height = Math.max(8, (item.value / max) * 100);
    return `
      <div class="simple-bar-group">
        <div class="simple-bar-track">
          <div class="simple-bar-fill" style="height: ${height}%"></div>
        </div>
        <small>${item.label}</small>
      </div>
    `;
  }).join('');

  container.innerHTML = `
    <div class="simple-chart simple-chart-timeline">
      ${bars}
    </div>
  `;
}

function renderizarGraficoCategorias(denuncias) {
  const container = document.getElementById('categories-chart-container');
  if (!container) return;

  if (!denuncias.length) {
    container.innerHTML = '<div class="empty-state"><p>Nenhum dado para exibir nesta categoria.</p></div>';
    return;
  }

  const contagem = {};
  denuncias.forEach(denuncia => {
    const tipo = denuncia.tipo || 'Outros';
    contagem[tipo] = (contagem[tipo] || 0) + 1;
  });

  const entries = Object.entries(contagem).sort((a, b) => b[1] - a[1]);
  const max = Math.max(...entries.map(([, value]) => value), 1);

  const html = entries.map(([label, value]) => {
    const percentage = Math.max(14, (value / max) * 100);
    return `
      <div class="category-chart-row">
        <span>${window.escapeHTML(label)}</span>
        <div class="category-chart-track">
          <div class="category-chart-fill" style="width: ${percentage}%"></div>
        </div>
        <strong>${value}</strong>
      </div>
    `;
  }).join('');

  container.innerHTML = `<div class="simple-category-chart">${html}</div>`;
}

// Soma acessos locais das trilhas de cultura de paz
function atualizarMetricasTrilhas() {
  const acessos = JSON.parse(localStorage.getItem('paz_na_escola_acesso_cultura') || '{}');
  let totalAcessos = 0;
  
  Object.values(acessos).forEach(val => {
    totalAcessos += parseInt(val) || 0;
  });

  const displayTrilhas = document.getElementById('metric-total-trilhas');
  if (displayTrilhas) {
    displayTrilhas.innerText = totalAcessos;
  }
}

// Preenche a tabela de denúncias
async function carregarDenuncias() {
  const tbody = document.getElementById('tabela-denuncias-body');
  if (!tbody) return;

  try {
    const { data: denuncias, error } = await window.supabaseClient
      .from('denuncias')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error(error);
      tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--prioridade-alta);">Erro ao carregar lista de denúncias.</td></tr>`;
      return;
    }

    if (denuncias.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted);">Nenhuma ocorrência registrada no momento.</td></tr>`;
      return;
    }

    denunciasDashboard = denuncias;
    popularFiltroTipos(denuncias);
    configurarNotificacoes();

    tbody.innerHTML = ''; // Limpa

    denuncias.forEach(d => {
      const tr = document.createElement('tr');
      
      // Formata data ocorrencia (YYYY-MM-DD -> DD/MM)
      let dataFormatada = 'N/A';
      if (d.data_ocorrencia) {
        const partes = d.data_ocorrencia.split('-');
        if (partes.length === 3) {
          dataFormatada = `${partes[2]}/${partes[1]}`;
        }
      }

      // Normaliza classes CSS de prioridade
      const prioridadeLower = d.prioridade.toLowerCase().replace('é', 'e');
      const statusClass = d.status.toLowerCase().replace('á', 'a').replace('â', 'a').replace('é', 'e').replace(' ', '-');

      tr.innerHTML = `
        <td><strong>${window.escapeHTML(d.codigo)}</strong></td>
        <td>${window.escapeHTML(d.tipo)}</td>
        <td><span class="badge badge-${prioridadeLower}">${window.escapeHTML(d.prioridade)}</span></td>
        <td>${dataFormatada}</td>
        <td><span class="badge badge-${statusClass}">${window.escapeHTML(d.status)}</span></td>
        <td>
          <a href="denuncia-detalhes.html?id=${d.id}" class="action-link" aria-label="Ver detalhes da ocorrência ${d.codigo}">Ver detalhes</a>
        </td>
      `;

      tbody.appendChild(tr);
    });

  } catch (err) {
    console.error(err);
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--prioridade-alta);">Falha crítica ao ler tabela.</td></tr>`;
  }
}

function configurarFiltrosDenuncias() {
  ['denuncia-search', 'denuncia-tipo-filter', 'denuncia-prioridade-filter', 'denuncia-status-filter'].forEach(id => document.getElementById(id)?.addEventListener('input', aplicarFiltrosDenuncias));
  document.getElementById('clear-denuncia-filters')?.addEventListener('click', () => {
    ['denuncia-search', 'denuncia-tipo-filter', 'denuncia-prioridade-filter', 'denuncia-status-filter'].forEach(id => { const element = document.getElementById(id); if (element) element.value = ''; });
    aplicarFiltrosDenuncias();
  });
}

function popularFiltroTipos(denuncias) {
  const select = document.getElementById('denuncia-tipo-filter');
  if (!select) return;
  [...new Set(denuncias.map(item => item.tipo).filter(Boolean))].sort().forEach(tipo => { const option = document.createElement('option'); option.value = tipo; option.textContent = `Tipo: ${tipo}`; select.appendChild(option); });
}

function aplicarFiltrosDenuncias() {
  const search = document.getElementById('denuncia-search')?.value.trim().toLowerCase() || '';
  const tipo = document.getElementById('denuncia-tipo-filter')?.value || '';
  const prioridade = document.getElementById('denuncia-prioridade-filter')?.value || '';
  const status = document.getElementById('denuncia-status-filter')?.value || '';
  const filtered = denunciasDashboard.filter(item => (!search || `${item.codigo} ${item.tipo} ${item.descricao}`.toLowerCase().includes(search)) && (!tipo || item.tipo === tipo) && (!prioridade || item.prioridade === prioridade) && (!status || item.status === status));
  renderizarTabelaFiltrada(filtered);
}

function renderizarTabelaFiltrada(denuncias) {
  const tbody = document.getElementById('tabela-denuncias-body');
  if (!tbody) return;
  if (!denuncias.length) { tbody.innerHTML = '<tr><td colspan="6" class="table-empty">Nenhum relato corresponde aos filtros.</td></tr>'; return; }
  tbody.innerHTML = denuncias.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)).map(d => `<tr><td><strong>${window.escapeHTML(d.codigo)}</strong></td><td>${window.escapeHTML(d.tipo || 'Outro')}</td><td>${window.formatDate(d.data_ocorrencia)}</td><td><span class="badge badge-${window.statusClass(d.prioridade)}">${window.escapeHTML(d.prioridade || 'Não informada')}</span></td><td><span class="badge badge-${window.statusClass(d.status)}">${window.escapeHTML(d.status || 'Recebida')}</span></td><td><a href="denuncia-detalhes.html?id=${encodeURIComponent(d.id)}" class="action-link" aria-label="Ver detalhes da ocorrência ${window.escapeHTML(d.codigo)}">Ver detalhes</a></td></tr>`).join('');
}

function configurarNotificacoes() {
  const button = document.querySelector('.notification-button');
  const badge = document.getElementById('notification-badge');
  const unseen = denunciasDashboard.filter(item => !item.visualizada_em);
  if (badge) { badge.textContent = unseen.length; badge.style.display = unseen.length ? 'flex' : 'none'; }
  button?.addEventListener('click', () => {
    if (!unseen.length) { window.announceAccessibility('Não há novas ocorrências.'); return; }
    window.announceAccessibility(`${unseen.length} novas ocorrências. ${unseen.filter(item => item.prioridade === 'Alta').length} de alta prioridade.`);
    unseen.forEach(item => window.supabaseClient.from('denuncias').update({ visualizada_em: new Date().toISOString() }).eq('id', item.id));
    if (badge) badge.style.display = 'none';
  });
}

function gerarRelatorioCSV() {
  const headers = ['Protocolo', 'Tipo', 'Data', 'Prioridade', 'Status'];
  const rows = denunciasDashboard.map(item => [item.codigo, item.tipo, item.data_ocorrencia, item.prioridade, item.status]);
  const csv = [headers, ...rows].map(row => row.map(value => `"${String(value ?? '').replace(/"/g, '""')}"`).join(';')).join('\n');
  const blob = new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `relatorio-paz-na-escola-${new Date().toISOString().slice(0, 10)}.csv`; link.click(); URL.revokeObjectURL(link.href);
  window.announceAccessibility('Relatório CSV gerado sem dados pessoais.');
}
