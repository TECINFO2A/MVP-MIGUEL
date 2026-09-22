document.addEventListener('DOMContentLoaded', async () => {
  const session = await window.verificarAutenticacao({ perfil: 'aluno', destino: 'aluno-dashboard.html' });
  if (!session) return;
  const user = session.user;
  const nome = user.user_metadata?.nome || user.user_metadata?.apelido || user.email;
  document.getElementById('student-greeting').textContent = `Olá, ${nome}!`;
  const { data } = await window.supabaseClient.from('denuncias').select('*').eq('aluno_id', user.id);
  document.getElementById('student-report-count').textContent = data?.length || 0;
  const actions = document.querySelector('.student-actions');
  if (actions) actions.insertAdjacentHTML('beforeend', '<a class="student-action" href="acompanhar-denuncia.html"><span>⌕</span><strong>Acompanhar denúncia<small>Consultar protocolo</small></strong></a><a class="student-action" href="central-ajuda.html"><span>?</span><strong>Central de ajuda<small>Encontrar orientação</small></strong></a><a class="student-action" href="conquistas.html"><span>🏆</span><strong>Minhas conquistas<small>Ver meu progresso</small></strong></a><a class="student-action" href="aluno-perfil.html"><span>○</span><strong>Meu perfil<small>Dados e trilhas</small></strong></a>');
  document.getElementById('student-theme')?.addEventListener('click', () => {
    const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    window.applyTheme(next);
  });
});
