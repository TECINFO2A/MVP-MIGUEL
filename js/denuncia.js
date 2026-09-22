// js/denuncia.js
// Lógica da tela de denúncia: validações, gravação de voz e envio para o banco

document.addEventListener('DOMContentLoaded', () => {
  setupForm();
  setupVoiceRecognition();
  setupRascunho();
});

// Inicializa a data atual no input de data_ocorrencia
function setupForm() {
  const dataInput = document.getElementById('data-ocorrencia');
  if (dataInput) {
    const today = new Date().toISOString().split('T')[0];
    dataInput.value = today;
  }

  // Toggle de identificação
  const checkAnonimo = document.getElementById('check-anonimo');
  const identificacaoContainer = document.getElementById('identificacao-container');
  if (checkAnonimo && identificacaoContainer) {
    checkAnonimo.addEventListener('change', () => {
      if (checkAnonimo.checked) {
        identificacaoContainer.style.display = 'none';
      } else {
        identificacaoContainer.style.display = 'block';
      }
    });
  }

  // Monitora seleção de risco imediato
  const riscoRadios = document.getElementsByName('risco-imediato');
  const boxAlertaRisco = document.getElementById('box-alerta-risco');
  if (riscoRadios && boxAlertaRisco) {
    riscoRadios.forEach(radio => {
      radio.addEventListener('change', () => {
        const simRadio = Array.from(riscoRadios).find(r => r.checked && r.value === 'Sim');
        if (simRadio) {
          boxAlertaRisco.style.display = 'block';
          window.announceAccessibility("Aviso: Risco imediato detectado. Procure ajuda de emergência.");
        } else {
          boxAlertaRisco.style.display = 'none';
        }
      });
    });
  }

  // Envio de formulário e modal
  const form = document.getElementById('form-denuncia');
  const confirmModal = document.getElementById('confirm-modal');
  const btnCancelModal = document.getElementById('btn-cancel-modal');
  const btnConfirmModal = document.getElementById('btn-confirm-modal');

  if (form && confirmModal) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (validarFormulario()) {
        confirmModal.classList.add('active');
        btnConfirmModal.focus();
      }
    });

    btnCancelModal.addEventListener('click', () => {
      confirmModal.classList.remove('active');
    });

    btnConfirmModal.addEventListener('click', async () => {
      confirmModal.classList.remove('active');
      await enviarDenuncia();
    });
  }
}

// Validação dos campos obrigatórios
function validarFormulario() {
  let valido = true;

  const tipo = document.getElementById('tipo-situacao');
  const descricao = document.getElementById('descricao-ocorrencia');
  const data = document.getElementById('data-ocorrencia');

  const errorTipo = document.getElementById('error-tipo');
  const errorDesc = document.getElementById('error-descricao');
  const errorData = document.getElementById('error-data');

  if (!tipo.value) {
    errorTipo.style.display = 'block';
    valido = false;
  } else {
    errorTipo.style.display = 'none';
  }

  if (!descricao.value.trim()) {
    errorDesc.style.display = 'block';
    valido = false;
  } else {
    errorDesc.style.display = 'none';
  }

  if (!data.value) {
    errorData.style.display = 'block';
    valido = false;
  } else {
    errorData.style.display = 'none';
  }

  if (!valido) {
    window.announceAccessibility("O formulário contém erros. Por favor, verifique os campos destacados.");
  }

  return valido;
}

// Envia os dados para o Supabase (ou Mock)
async function enviarDenuncia() {
  if (!navigator.onLine) {
    // Alerta de privacidade e conexão para denúncias sensíveis
    alert("⚠️ Você está desconectado. Para garantir a total segurança dos dados, as denúncias não são armazenadas localmente no seu dispositivo. Por favor, conecte-se à internet e tente novamente.");
    return;
  }

  const tipo = document.getElementById('tipo-situacao').value;
  const descricao = document.getElementById('descricao-ocorrencia').value;
  const local = document.getElementById('local-ocorrencia').value;
  const data_ocorrencia = document.getElementById('data-ocorrencia').value;
  const riscoImediato = document.querySelector('input[name="risco-imediato"]:checked').value;
  const anonima = document.getElementById('check-anonimo').checked;

  const nome = anonima ? null : document.getElementById('nome-aluno').value;
  const contato = anonima ? null : document.getElementById('contato-aluno').value;

  // Classificação automática de prioridade baseada em regras de segurança
  let prioridade = 'Baixa';
  if (riscoImediato === 'Sim' || tipo === 'Ameaça' || tipo === 'Agressão física') {
    prioridade = 'Alta';
  } else if (tipo === 'Bullying' || tipo === 'Cyberbullying' || tipo === 'Discriminação') {
    prioridade = 'Média';
  }

  const codigo = window.generateComplaintCode();

  // Se houver contato, anexa na descrição de forma privada
  let descricaoCompleta = descricao;
  if (!anonima && (nome || contato)) {
    descricaoCompleta += `\n\n[DADOS DE CONTATO DO ALUNO: Nome: ${nome || 'Não fornecido'} | Contato: ${contato || 'Não fornecido'}]`;
  }

  try {
    const { data, error } = await window.supabaseClient.from('denuncias').insert({
      codigo,
      tipo,
      descricao: descricaoCompleta,
      local: local || 'Não especificado',
      data_ocorrencia,
      prioridade,
      status: 'Aberta',
      anonima
    });

    if (error) {
      console.error(error);
      alert("Houve um erro ao enviar sua denúncia. Tente novamente mais tarde.");
    } else {
      // Limpa rascunho de segurança
      localStorage.removeItem('paz_na_escola_rascunho_denuncia');
      window.location.href = `confirmacao.html?code=${codigo}`;
    }
  } catch (err) {
    console.error(err);
    alert("Falha de rede ao se comunicar com o servidor.");
  }
}

// Configuração do botão de voz (Reconhecimento de Voz Experimental do Navegador)
function setupVoiceRecognition() {
  const btnVoice = document.getElementById('btn-falar');
  const descricao = document.getElementById('descricao-ocorrencia');
  const voiceStatus = document.getElementById('voice-status');

  if (!btnVoice || !descricao) return;

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    btnVoice.addEventListener('click', () => {
      alert("🎤 O reconhecimento de voz não está disponível ou não é suportado neste navegador. Por favor, digite seu relato.");
    });
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = 'pt-BR';
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  let gravando = false;

  btnVoice.addEventListener('click', () => {
    if (gravando) {
      recognition.stop();
    } else {
      try {
        recognition.start();
      } catch (err) {
        console.error("Erro ao iniciar reconhecimento:", err);
      }
    }
  });

  recognition.onstart = () => {
    gravando = true;
    btnVoice.classList.add('recording');
    btnVoice.setAttribute('aria-label', 'Parar gravação de voz');
    voiceStatus.innerText = "Listening... Fale agora seu relato.";
    window.announceAccessibility("Gravação iniciada. Pode começar a falar.");
  };

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    if (descricao.value) {
      descricao.value += ' ' + transcript;
    } else {
      descricao.value = transcript;
    }
    // Salva rascunho após alterar o valor
    salvarRascunho();
  };

  recognition.onend = () => {
    gravando = false;
    btnVoice.classList.remove('recording');
    btnVoice.setAttribute('aria-label', 'Falar relato por voz');
    voiceStatus.innerText = "";
    window.announceAccessibility("Gravação de voz finalizada.");
  };

  recognition.onerror = (event) => {
    console.error("Erro no reconhecimento de voz:", event.error);
    voiceStatus.innerText = "Erro ao reconhecer voz. Digite seu relato.";
    window.announceAccessibility("Ocorreu um erro na gravação de voz. Por favor, digite seu relato.");
  };
}

// Salva rascunho local provisório no LocalStorage (só para evitar perda de digitação acidental)
// Limpo assim que a denúncia é enviada com sucesso.
function setupRascunho() {
  const descricao = document.getElementById('descricao-ocorrencia');
  if (descricao) {
    // Carrega rascunho anterior se houver
    const rascunho = localStorage.getItem('paz_na_escola_rascunho_denuncia');
    if (rascunho) {
      descricao.value = rascunho;
    }

    descricao.addEventListener('input', salvarRascunho);
  }
}

function salvarRascunho() {
  const descricao = document.getElementById('descricao-ocorrencia');
  if (descricao) {
    localStorage.setItem('paz_na_escola_rascunho_denuncia', descricao.value);
  }
}
