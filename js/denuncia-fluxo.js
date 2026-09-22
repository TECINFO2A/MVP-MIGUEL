// Fluxo de denuncia em etapas, com validacao, revisao e envio ao Supabase.

let etapaAtual = 1;
let enviandoDenuncia = false;
let arquivoSelecionado = null;

document.addEventListener('DOMContentLoaded', () => {
  window.verificarAutenticacao({ perfil: 'aluno', destino: 'denuncia.html' }).then(session => {
    if (!session) return;
    configurarFormulario();
    configurarVoz();
    configurarRascunho();
    window.initAudioRecorder?.();
  });
});

function configurarFormulario() {
  const dataInput = document.getElementById('data-ocorrencia');
  if (dataInput) dataInput.value = new Date().toISOString().split('T')[0];

  document.querySelectorAll('.category-card').forEach(card => card.addEventListener('click', () => selecionarCategoria(card)));
  document.getElementById('descricao-ocorrencia')?.addEventListener('input', atualizarContador);
  document.getElementById('local-ocorrencia')?.addEventListener('change', alternarOutroLocal);
  document.querySelectorAll('input[name="situacao-atual"]').forEach(input => input.addEventListener('change', alternarSituacao));
  document.querySelectorAll('input[name="risco-imediato"]').forEach(input => input.addEventListener('change', alternarRisco));
  document.getElementById('check-anonimo')?.addEventListener('change', alternarIdentificacao);
  document.getElementById('evidencias')?.addEventListener('change', validarArquivo);
  document.getElementById('btn-next-step')?.addEventListener('click', avancarEtapa);
  document.getElementById('btn-prev-step')?.addEventListener('click', () => mudarEtapa(etapaAtual - 1));
  document.getElementById('btn-edit-review')?.addEventListener('click', () => mudarEtapa(3));
  document.getElementById('form-denuncia')?.addEventListener('submit', evento => {
    evento.preventDefault();
    if (etapaAtual === 4) enviarDenuncia();
  });
  atualizarContador();
  atualizarProgresso();
}

function selecionarCategoria(card) {
  document.querySelectorAll('.category-card').forEach(item => {
    item.classList.remove('selected');
    item.setAttribute('aria-checked', 'false');
  });
  card.classList.add('selected');
  card.setAttribute('aria-checked', 'true');
  document.getElementById('tipo-situacao').value = card.dataset.category;
  esconderErro('error-tipo');
}

function alternarOutroLocal() {
  const local = document.getElementById('local-ocorrencia');
  const outro = document.getElementById('outro-local-container');
  if (outro) outro.hidden = local.value !== 'Outro';
}

function alternarSituacao(evento) {
  const note = document.getElementById('ongoing-note');
  if (note) note.hidden = evento.target.value !== 'Sim';
}

function alternarRisco(evento) {
  const alertBox = document.getElementById('box-alerta-risco');
  if (alertBox) alertBox.hidden = evento.target.value !== 'Sim';
}

function alternarIdentificacao() {
  const checkbox = document.getElementById('check-anonimo');
  const identificacao = document.getElementById('identificacao-container');
  if (identificacao) identificacao.hidden = checkbox.checked;
}

function avancarEtapa() {
  if (!validarEtapa(etapaAtual)) return;
  if (etapaAtual === 3) preencherRevisao();
  mudarEtapa(etapaAtual + 1);
}

function mudarEtapa(numero) {
  if (numero < 1 || numero > 4) return;
  etapaAtual = numero;
  document.querySelectorAll('.form-step').forEach(step => {
    const ativa = Number(step.dataset.step) === etapaAtual;
    step.hidden = !ativa;
    step.classList.toggle('active', ativa);
  });
  const voltar = document.getElementById('btn-prev-step');
  const continuar = document.getElementById('btn-next-step');
  if (voltar) voltar.hidden = etapaAtual === 1 || etapaAtual === 4;
  if (continuar) continuar.hidden = etapaAtual === 4;
  atualizarProgresso();
  document.querySelector('.form-step.active h2')?.focus();
}

function atualizarProgresso() {
  const nomes = ['Categoria', 'Seu relato', 'Detalhes', 'Revisão'];
  document.getElementById('step-label').textContent = `Etapa ${etapaAtual} de 4`;
  document.getElementById('step-name').textContent = nomes[etapaAtual - 1];
  document.getElementById('progress-fill').style.width = `${etapaAtual * 25}%`;
}

function validarEtapa(etapa) {
  if (etapa === 1 && !document.getElementById('tipo-situacao')?.value) {
    mostrarErro('error-tipo');
    return false;
  }
  if (etapa === 2 && !document.getElementById('descricao-ocorrencia')?.value.trim()) {
    mostrarErro('error-descricao');
    return false;
  }
  if (etapa === 3 && !document.getElementById('data-ocorrencia')?.value) {
    mostrarErro('error-data');
    return false;
  }
  return true;
}

function validarFormulario() {
  return validarEtapa(1) && validarEtapa(2) && validarEtapa(3);
}

function mostrarErro(id) {
  const erro = document.getElementById(id);
  if (erro) erro.hidden = false;
  window.announceAccessibility(erro?.textContent || 'Verifique este campo.');
}

function esconderErro(id) {
  const erro = document.getElementById(id);
  if (erro) erro.hidden = true;
}

function atualizarContador() {
  const descricao = document.getElementById('descricao-ocorrencia');
  const contador = document.getElementById('story-counter');
  if (contador && descricao) contador.textContent = `${descricao.value.length} / 1000 caracteres`;
}

function validarArquivo(evento) {
  const arquivo = evento.target.files[0];
  const preview = document.getElementById('file-preview');
  arquivoSelecionado = null;
  if (!arquivo) {
    if (preview) preview.textContent = '';
    return;
  }
  const tiposPermitidos = ['image/jpeg', 'image/png', 'application/pdf'];
  if (!tiposPermitidos.includes(arquivo.type) || arquivo.size > 5 * 1024 * 1024) {
    evento.target.value = '';
    if (preview) preview.textContent = 'Arquivo inválido. Use JPG, PNG ou PDF de até 5 MB.';
    return;
  }
  arquivoSelecionado = arquivo;
  if (preview) preview.textContent = `${arquivo.name} (${Math.ceil(arquivo.size / 1024)} KB)`;
}

function preencherRevisao() {
  const tipo = document.getElementById('tipo-situacao').value || 'Não informado';
  const selecionado = document.getElementById('local-ocorrencia').value;
  const outro = document.getElementById('outro-local')?.value.trim();
  const local = selecionado === 'Outro' ? outro || 'Outro local' : selecionado || 'Não informado';
  const data = document.getElementById('data-ocorrencia').value || 'Não informado';
  const descricao = document.getElementById('descricao-ocorrencia').value.trim();
  const revisao = document.getElementById('review-content');
  if (!revisao) return;
  revisao.innerHTML = `<dl><div><dt>Categoria</dt><dd>${window.escapeHTML(tipo)}</dd></div><div><dt>Local</dt><dd>${window.escapeHTML(local)}</dd></div><div><dt>Data</dt><dd>${window.escapeHTML(data.split('-').reverse().join('/'))}</dd></div><div><dt>Descrição</dt><dd>${window.escapeHTML(descricao)}</dd></div><div><dt>Anexo</dt><dd>${arquivoSelecionado ? '1 arquivo selecionado' : 'Nenhum arquivo'}</dd></div></dl>`;
}

async function enviarDenuncia() {
  if (enviandoDenuncia || !validarFormulario()) return;
  if (!navigator.onLine) {
    alert('Você está offline. Por segurança, denúncias não são armazenadas localmente. Conecte-se e tente novamente.');
    return;
  }
  enviandoDenuncia = true;
  const botao = document.getElementById('btn-submit-report');
  if (botao) { botao.disabled = true; botao.textContent = 'Enviando...'; }

  const tipo = document.getElementById('tipo-situacao').value;
  const descricao = document.getElementById('descricao-ocorrencia').value.trim();
  const selecionado = document.getElementById('local-ocorrencia').value;
  const local = selecionado === 'Outro' ? document.getElementById('outro-local')?.value.trim() || 'Outro local' : selecionado;
  const data_ocorrencia = document.getElementById('data-ocorrencia').value;
  const risco = document.querySelector('input[name="risco-imediato"]:checked')?.value || 'Não';
  const situacao = document.querySelector('input[name="situacao-atual"]:checked')?.value || 'Não informado';
  const envolvidos = document.getElementById('envolvidos')?.value.trim() || 'Não informado';
  const anonima = document.getElementById('check-anonimo').checked;
  const nome = anonima ? null : document.getElementById('nome-aluno').value.trim();
  const contato = anonima ? null : document.getElementById('contato-aluno').value.trim();
  const prioridade = risco === 'Sim' || tipo === 'Ameaça' || tipo === 'Agressão física' ? 'Alta' : ['Bullying', 'Cyberbullying', 'Discriminação'].includes(tipo) ? 'Média' : 'Baixa';
  let descricaoCompleta = `${descricao}\n\n[DETALHES DO RELATO]\nSituação atual: ${situacao}\nPessoas envolvidas: ${envolvidos}`;
  if (!anonima && (nome || contato)) descricaoCompleta += `\n[DADOS DE CONTATO: Nome: ${nome || 'Não fornecido'} | Contato: ${contato || 'Não fornecido'}]`;
  const codigo = window.generateComplaintCode();
  const { data: { session } } = await window.supabaseClient.auth.getSession();
  const alunoId = session?.user?.id;

  try {
    const { data: denuncia, error } = await window.supabaseClient.from('denuncias').insert({ codigo, tipo, descricao: descricaoCompleta, local: local || 'Não especificado', data_ocorrencia, prioridade, status: 'Recebida', anonima, aluno_id: alunoId, audio_path: null });
    if (error) throw error;
    const audio = window.getRecordedAudio?.();
    if (audio && denuncia?.[0]?.id && window.enviarAudioPrivado) {
      const audioPath = await window.enviarAudioPrivado(denuncia[0].id, audio, alunoId);
      await window.supabaseClient.from('denuncias').update({ audio_path: audioPath }).eq('id', denuncia[0].id);
    }
    localStorage.removeItem('paz_na_escola_rascunho_denuncia');
    window.location.href = `confirmacao.html?code=${encodeURIComponent(codigo)}`;
  } catch (erro) {
    console.error(erro);
    alert('Não foi possível enviar agora. Confira sua conexão e tente novamente.');
    enviandoDenuncia = false;
    if (botao) { botao.disabled = false; botao.textContent = '🛡️ Enviar relato com segurança'; }
  }
}

function configurarVoz() {
  const botao = document.getElementById('btn-falar');
  const descricao = document.getElementById('descricao-ocorrencia');
  const status = document.getElementById('voice-status');
  if (!botao || !descricao) return;
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    botao.addEventListener('click', () => alert('O reconhecimento de voz não está disponível neste navegador. Você pode digitar seu relato.'));
    return;
  }
  const reconhecimento = new SpeechRecognition();
  reconhecimento.lang = 'pt-BR';
  reconhecimento.interimResults = false;
  let gravando = false;
  botao.addEventListener('click', () => gravando ? reconhecimento.stop() : reconhecimento.start());
  reconhecimento.onstart = () => { gravando = true; botao.classList.add('recording'); botao.setAttribute('aria-label', 'Parar gravação de voz'); status.textContent = 'Fale agora seu relato.'; };
  reconhecimento.onresult = evento => { descricao.value = `${descricao.value} ${evento.results[0][0].transcript}`.trim().slice(0, 1000); atualizarContador(); salvarRascunho(); };
  reconhecimento.onend = () => { gravando = false; botao.classList.remove('recording'); botao.setAttribute('aria-label', 'Falar relato por voz'); status.textContent = ''; };
  reconhecimento.onerror = () => { status.textContent = 'Não foi possível reconhecer a voz. Digite seu relato.'; };
}

function configurarRascunho() {
  const descricao = document.getElementById('descricao-ocorrencia');
  const rascunho = localStorage.getItem('paz_na_escola_rascunho_denuncia');
  if (descricao && rascunho) { descricao.value = rascunho; atualizarContador(); }
  descricao?.addEventListener('input', salvarRascunho);
}

function salvarRascunho() {
  const descricao = document.getElementById('descricao-ocorrencia');
  if (descricao) localStorage.setItem('paz_na_escola_rascunho_denuncia', descricao.value.slice(0, 1000));
}

window.validarFormulario = validarFormulario;
window.enviarDenuncia = enviarDenuncia;
