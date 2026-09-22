document.addEventListener('DOMContentLoaded', async () => {
  const session = await window.verificarAutenticacao({ perfil: 'aluno', destino: 'aluno-perfil.html' });
  if (!session) return;
  const metadata = session.user.user_metadata || {};
  const name = metadata.nome || metadata.apelido || session.user.email;
  document.getElementById('profile-name').textContent = name;
  document.getElementById('profile-email').textContent = session.user.email || '';
  document.getElementById('profile-matricula').textContent = metadata.matricula || 'Não informada';
  document.getElementById('profile-turma').textContent = metadata.turma || 'Não informada';
  document.getElementById('profile-avatar').textContent = name.charAt(0).toUpperCase();
  const { data } = await window.supabaseClient.from('progresso_trilhas').select('*').eq('aluno_id', session.user.id);
  const container = document.getElementById('profile-progress');
  container.innerHTML = data?.length ? data.map(item => `<div class="progress-item"><div><strong>Trilha ${window.escapeHTML(item.trilha_id)}</strong><span>${item.progresso}%</span></div><div class="progress-bar"><span style="width:${Math.min(100, Number(item.progresso) || 0)}%"></span></div></div>`).join('') : '<p class="field-hint">Você ainda não iniciou uma trilha.</p>';
  document.getElementById('profile-password').addEventListener('click', () => window.location.href = 'recuperar-senha.html');
});
