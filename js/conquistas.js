const achievementCatalog = [
  ['🌱', 'Primeiro Passo', 'Completou a primeira trilha.'],
  ['🤝', 'Pacificador', 'Completou Resolução de Conflitos.'],
  ['💬', 'Bom Ouvinte', 'Completou Empatia.'],
  ['🕊️', 'Cultura de Paz', 'Completou todas as trilhas disponíveis.']
];
document.addEventListener('DOMContentLoaded', async () => {
  const session = await window.verificarAutenticacao({ perfil: 'aluno', destino: 'conquistas.html' });
  if (!session) return;
  const { data } = await window.supabaseClient.from('conquistas_alunos').select('*').eq('aluno_id', session.user.id);
  const unlocked = new Set((data || []).map(item => item.conquista));
  document.getElementById('achievements-list').innerHTML = achievementCatalog.map(([icon, title, description]) => `<article class="achievement-card ${unlocked.has(title) ? 'unlocked' : ''}"><span class="achievement-icon">${icon}</span><div><h2>${title}</h2><p>${description}</p></div><strong>${unlocked.has(title) ? 'Desbloqueada' : 'Ainda não desbloqueada'}</strong></article>`).join('');
});
