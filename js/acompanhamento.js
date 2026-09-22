document.addEventListener('DOMContentLoaded', async () => {
  const session = await window.verificarAutenticacao({ perfil: 'aluno', destino: 'acompanhar-denuncia.html' });
  if (!session) return;
  const form = document.getElementById('form-acompanhar');
  const initialCode = new URLSearchParams(window.location.search).get('code');
  if (initialCode) { document.getElementById('codigo-acompanhamento').value = initialCode; consultarDenuncia(session); }
  form?.addEventListener('submit', event => { event.preventDefault(); consultarDenuncia(session); });
});

async function consultarDenuncia(session) {
  const input = document.getElementById('codigo-acompanhamento');
  const button = document.getElementById('btn-acompanhar');
  const result = document.getElementById('tracking-result');
  const code = input.value.trim().toUpperCase();
  result.hidden = true;
  if (!/^PNE-2026-[A-Z0-9]{6}$/.test(code)) { mostrarTrackingFeedback('Informe um protocolo válido no formato PNE-2026-XXXXXX.'); input.focus(); return; }
  button.disabled = true; button.textContent = 'Consultando...';
  try {
    const { data, error } = await window.supabaseClient.from('denuncias').select('*').eq('codigo', code).eq('aluno_id', session.user.id);
    if (error) throw error;
    const denuncia = data?.[0];
    if (!denuncia) { mostrarTrackingFeedback('Não encontramos esse protocolo entre os relatos da sua conta.'); return; }
    const { data: updates, error: updatesError } = await window.supabaseClient.from('denuncia_atualizacoes').select('*').eq('denuncia_id', denuncia.id).order('criado_em', { ascending: true });
    if (updatesError) throw updatesError;
    result.innerHTML = renderTracking(denuncia, updates || []);
    result.hidden = false;
  } catch (error) { console.error(error); mostrarTrackingFeedback('Não foi possível consultar agora. Tente novamente em instantes.'); }
  finally { button.disabled = false; button.textContent = '🔎 Consultar denúncia'; }
}

function renderTracking(denuncia, updates) {
  const events = updates.length ? updates : [{ status: denuncia.status, mensagem: 'Denúncia recebida', criado_em: denuncia.created_at }];
  const status = denuncia.status || 'Recebida';
  const stages = ['Recebida', 'Em análise', 'Em acompanhamento', 'Resolvida'];
  const current = Math.max(0, stages.findIndex(item => item.toLowerCase() === status.toLowerCase()));
  return `<article class="card tracking-detail"><div class="tracking-detail-head"><div><p class="eyebrow">PROTOCOLO</p><h2>${window.escapeHTML(denuncia.codigo)}</h2></div><span class="badge badge-${window.statusClass(status)}">${window.escapeHTML(status)}</span></div><div class="tracking-meta"><span><small>Tipo</small>${window.escapeHTML(denuncia.tipo)}</span><span><small>Prioridade</small>${window.escapeHTML(denuncia.prioridade || 'Não informada')}</span><span><small>Registrada em</small>${window.formatDate(denuncia.created_at)}</span></div><h3>Linha do tempo</h3><ol class="tracking-timeline">${stages.map((stage, index) => `<li class="${index < current ? 'complete' : index === current ? 'current' : ''}"><span aria-hidden="true">${index < current ? '✓' : index === current ? '●' : '○'}</span><strong>${stage}</strong></li>`).join('')}</ol><div class="tracking-updates"><h3>Atualizações disponíveis</h3>${events.map(event => `<article><time datetime="${window.escapeHTML(event.criado_em || '')}">${window.formatDate(event.criado_em)}</time><p>${window.escapeHTML(event.mensagem || 'Atualização de status registrada.')}</p></article>`).join('')}</div></article>`;
}
function mostrarTrackingFeedback(message) { const feedback = document.getElementById('tracking-feedback'); feedback.hidden = false; feedback.className = 'form-feedback error'; feedback.textContent = message; }
