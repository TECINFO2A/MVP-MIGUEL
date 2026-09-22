document.addEventListener('DOMContentLoaded', async () => {
  const session = await window.verificarAutenticacao({ perfil: 'aluno', destino: 'minhas-denuncias.html' });
  if (!session) return;
  const list = document.getElementById('minhas-denuncias-list');
  const { data, error } = await window.supabaseClient.from('denuncias').select('*').eq('aluno_id', session.user.id).order('created_at', { ascending: false });
  if (error) {
    list.innerHTML = '<div class="card form-feedback error">Não foi possível carregar seus relatos agora.</div>';
    return;
  }
  if (!data?.length) {
    list.innerHTML = '<div class="card empty-state"><strong>Você ainda não registrou uma denúncia.</strong><span>Quando precisar, estaremos aqui para ouvir.</span><a class="btn btn-primary" href="denuncia.html">Fazer uma denúncia</a></div>';
    return;
  }
  list.innerHTML = data.map(relato => {
    const statusClass = window.statusClass(relato.status);
    return `<a class="report-card" href="denuncia-detalhes.html?id=${encodeURIComponent(relato.id)}"><div><span class="eyebrow">${window.escapeHTML(relato.codigo)}</span><h2>${window.escapeHTML(relato.tipo)}</h2><p>${window.escapeHTML(relato.local || 'Local não informado')} · ${window.formatDate(relato.data_ocorrencia)}</p></div><div class="report-card-meta"><span class="badge badge-${statusClass}">${window.escapeHTML(relato.status || 'Em análise')}</span><span aria-label="${relato.audio_path ? 'Possui áudio anexado' : 'Sem áudio anexado'}">${relato.audio_path ? '🎧' : '—'}</span></div></a>`;
  }).join('');
});
