document.addEventListener('DOMContentLoaded', () => {
  const campo = document.getElementById('codigo-consulta');
  const botao = document.getElementById('btn-consultar');
  const codigoInicial = new URLSearchParams(window.location.search).get('code');
  if (codigoInicial) campo.value = codigoInicial;
  botao.addEventListener('click', consultarRelato);
  campo.addEventListener('keydown', evento => { if (evento.key === 'Enter') consultarRelato(); });
  if (codigoInicial) consultarRelato();
});

async function consultarRelato() {
  const campo = document.getElementById('codigo-consulta');
  const erro = document.getElementById('lookup-error');
  const resultado = document.getElementById('resultado-consulta');
  const botao = document.getElementById('btn-consultar');
  const codigo = campo.value.trim().toUpperCase();
  erro.hidden = true;
  resultado.hidden = true;

  if (!/^PE-[0-9]{6}$/.test(codigo)) {
    erro.hidden = false;
    campo.focus();
    return;
  }

  botao.disabled = true;
  botao.textContent = 'Consultando...';
  try {
    const { data, error } = await window.supabaseClient.rpc('consultar_denuncia_publica', { p_codigo: codigo });
    if (error) throw error;
    const relato = Array.isArray(data) ? data[0] : data;
    resultado.innerHTML = relato ? renderizarRelato(relato) : '<div class="empty-state"><strong>Relato não encontrado.</strong><span>Confira o código e tente novamente.</span></div>';
    resultado.hidden = false;
  } catch (error) {
    console.error(error);
    resultado.innerHTML = '<div class="empty-state"><strong>Não foi possível consultar agora.</strong><span>Verifique sua conexão e tente novamente.</span></div>';
    resultado.hidden = false;
  } finally {
    botao.disabled = false;
    botao.textContent = 'Consultar status';
  }
}

function renderizarRelato(relato) {
  const status = relato.status || 'Aberta';
  const statusClass = status === 'Em análise' ? 'analise' : status.toLowerCase().replaceAll(' ', '-').replace('á', 'a');
  const etapas = ['Relato enviado', 'Recebido pela escola', 'Em análise', 'Em acompanhamento', 'Resolvido'];
  const indice = status === 'Aberta' ? 1 : status === 'Em análise' ? 2 : status === 'Resolvida' ? 4 : 2;
  return `<p class="eyebrow">SEU RELATO</p><h2>${window.escapeHTML(relato.codigo)}</h2><div class="tracking-status"><span class="badge badge-${statusClass}">${window.escapeHTML(status)}</span><strong>Status atual</strong></div><div class="tracking-meta"><span><small>Categoria</small>${window.escapeHTML(relato.tipo)}</span><span><small>Enviado em</small>${formatarData(relato.created_at)}</span></div><ol class="timeline">${etapas.map((etapa, index) => `<li class="${index < indice ? 'complete' : index === indice ? 'current' : ''}"><span aria-hidden="true">${index < indice ? '✓' : index === indice ? '•' : '○'}</span>${etapa}</li>`).join('')}</ol><p class="tracking-hint">Última atualização: ${formatarData(relato.updated_at || relato.created_at)}</p>`;
}

function formatarData(valor) {
  if (!valor) return 'Não informada';
  return new Date(valor).toLocaleDateString('pt-BR');
}
