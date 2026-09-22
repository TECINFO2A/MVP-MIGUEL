// js/sentimentos.js
// Lógica para registrar check-ins emocionais de sentimentos com suporte a offline

document.addEventListener('DOMContentLoaded', () => {
  setupCheckin();
});

function setupCheckin() {
  const sentimentButtons = document.querySelectorAll('.sentiment-btn');
  const contarMaisContainer = document.getElementById('contar-mais-container');
  const btnSalvar = document.getElementById('btn-salvar-checkin');
  const descricaoInput = document.getElementById('descricao-sentimento');

  let sentimentoSelecionado = null;

  sentimentButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      // Remove seleção anterior
      sentimentButtons.forEach(b => b.classList.remove('selected'));
      
      // Aplica seleção atual
      btn.classList.add('selected');
      sentimentoSelecionado = btn.getAttribute('data-feeling');

      // Exibe caixa de texto de contar mais e ativa botão
      contarMaisContainer.style.display = 'block';
      btnSalvar.disabled = false;

      // Acessibilidade
      window.announceAccessibility(`Selecionado sentimento: ${sentimentoSelecionado}. Campo opcional para contar mais expandido.`);
    });
  });

  if (btnSalvar) {
    btnSalvar.addEventListener('click', async () => {
      if (!sentimentoSelecionado) return;

      const descricao = descricaoInput ? descricaoInput.value.trim() : '';
      const dataRegistro = new Date().toISOString();
      const { data: { session } } = await window.supabaseClient.auth.getSession();
      const usuarioId = session?.user?.id || null;

      if (navigator.onLine) {
        // Envio online diretamente ao banco Supabase (ou Mock)
        try {
          const { error } = await window.supabaseClient.from('checkins').insert({
            sentimento: sentimentoSelecionado,
            descricao: descricao || null,
            created_at: dataRegistro,
            usuario_id: usuarioId
          });

          if (error) {
            console.error("Erro Supabase:", error);
            alert("Não foi possível salvar seu check-in de sentimento. Tente novamente.");
          } else {
            alert("Obrigado por compartilhar seu sentimento! Seu registro consolida as estatísticas escolares.");
            window.location.href = 'index.html';
          }
        } catch (err) {
          console.error(err);
          salvarOffline(sentimentoSelecionado, descricao, dataRegistro, usuarioId);
        }
      } else {
        // Salva localmente em modo offline
        salvarOffline(sentimentoSelecionado, descricao, dataRegistro, usuarioId);
      }
    });
  }
}

// Salva localmente no localStorage para sincronizar depois
function salvarOffline(sentimento, descricao, created_at, usuario_id) {
  const checkinsPendentes = JSON.parse(localStorage.getItem('paz_na_escola_checkin_pendente') || '[]');
  
  checkinsPendentes.push({
    sentimento,
    descricao: descricao || null,
    created_at,
    usuario_id
  });

  localStorage.setItem('paz_na_escola_checkin_pendente', JSON.stringify(checkinsPendentes));
  
  alert("☁️ Registro salvo localmente! Sem internet no momento, mas seu check-in será enviado automaticamente assim que a conexão retornar.");
  window.location.href = 'index.html';
}
