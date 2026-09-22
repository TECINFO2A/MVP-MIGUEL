// js/auth.js
// Autenticacao de alunos e gestores. A autorizacao real deve ser aplicada pelo Supabase/RLS.

document.addEventListener('DOMContentLoaded', () => {
  const formLogin = document.getElementById('form-login');
  if (formLogin) formLogin.addEventListener('submit', realizarLogin);
  document.getElementById('form-cadastro')?.addEventListener('submit', realizarCadastro);
  document.getElementById('form-recuperacao')?.addEventListener('submit', solicitarRecuperacao);
  document.getElementById('form-redefinir')?.addEventListener('submit', redefinirSenha);
  document.getElementById('toggle-password')?.addEventListener('click', alternarSenha);
  document.querySelectorAll('[data-login-profile]').forEach(button => button.addEventListener('click', () => {
    document.querySelectorAll('[data-login-profile]').forEach(item => item.classList.remove('active'));
    button.classList.add('active');
    document.getElementById('login-perfil').value = button.dataset.loginProfile;
    document.getElementById('login-heading').textContent = button.dataset.loginProfile === 'gestor' ? 'Acesse o painel administrativo' : 'Acesse seu espaço privado';
    document.getElementById('student-signup-link').hidden = button.dataset.loginProfile === 'gestor';
    document.getElementById('demo-credentials').hidden = button.dataset.loginProfile !== 'gestor';
  }));
});

function feedback(id, message, type = 'error') { const element = document.getElementById(id); if (!element) return; element.hidden = false; element.className = `form-feedback ${type}`; element.textContent = message; }
function setBusy(button, busy, label) { if (button) { button.disabled = busy; button.textContent = busy ? 'Aguarde...' : label; } }
function alternarSenha() { const input = document.getElementById('password'); const button = document.getElementById('toggle-password'); if (!input) return; input.type = input.type === 'password' ? 'text' : 'password'; button.textContent = input.type === 'password' ? 'Mostrar' : 'Ocultar'; }

// Realiza login no Supabase (ou Mock)
async function realizarLogin(e) {
  e.preventDefault();

  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const perfil = document.getElementById('login-perfil')?.value || 'aluno';
  if (!email) return feedback('login-feedback', 'Informe seu e-mail ou matrícula.');
  if (!password) return feedback('login-feedback', 'Digite sua senha.');
  const button = document.getElementById('btn-login');
  setBusy(button, true, 'Entrar');

  try {
    const { data, error } = await window.supabaseClient.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      throw error;
    } else {
      const userPerfil = data.user?.user_metadata?.perfil || (email === 'admin@escola.com' ? 'gestor' : 'aluno');
      if (perfil === 'gestor' && userPerfil !== 'gestor') throw new Error('Esta conta não possui acesso administrativo.');
      if (perfil === 'aluno' && userPerfil === 'gestor') throw new Error('Use a entrada da área administrativa.');
      window.location.href = userPerfil === 'gestor' ? 'dashboard.html' : 'aluno-dashboard.html';
    }
  } catch (err) {
    console.error(err);
    feedback('login-feedback', err.message?.includes('administrativo') || err.message?.includes('área') ? err.message : 'E-mail, matrícula ou senha incorretos.');
    setBusy(button, false, 'Entrar');
  }
}

async function realizarCadastro(event) {
  event.preventDefault();
  const ids = ['nome', 'apelido', 'matricula', 'email', 'turma'];
  const values = Object.fromEntries(ids.map(id => [id, document.getElementById(`cadastro-${id}`).value.trim()]));
  const senha = document.getElementById('cadastro-senha').value;
  const confirmacao = document.getElementById('cadastro-confirmacao').value;
  if (Object.values(values).some(value => !value) || !document.getElementById('cadastro-termos').checked) return feedback('cadastro-feedback', 'Preencha todos os campos e aceite os termos de uso.');
  if (!/^\S+@\S+\.\S+$/.test(values.email)) return feedback('cadastro-feedback', 'Digite um e-mail válido.');
  if (!/(?=.*[A-Za-z])(?=.*\d).{8,}/.test(senha)) return feedback('cadastro-feedback', 'A senha deve ter pelo menos 8 caracteres, com letra e número.');
  if (senha !== confirmacao) return feedback('cadastro-feedback', 'As senhas não são iguais.');
  const button = document.getElementById('btn-cadastro'); setBusy(button, true, 'Criar minha conta');
  try { const { data, error } = await window.supabaseClient.auth.signUp({ email: values.email, password: senha, options: { data: { ...values, perfil: 'aluno' } } }); if (error) throw error; feedback('cadastro-feedback', 'Conta criada com sucesso!', 'success'); setTimeout(() => { window.location.href = data.session ? 'aluno-dashboard.html' : 'login.html'; }, 900); } catch (error) { feedback('cadastro-feedback', error.message?.includes('matrícula') ? 'Essa matrícula já está cadastrada.' : error.message?.includes('already') ? 'Este e-mail já está cadastrado.' : 'Não foi possível criar sua conta. Tente novamente.'); setBusy(button, false, 'Criar minha conta'); }
}

async function solicitarRecuperacao(event) { event.preventDefault(); const email = document.getElementById('recuperacao-email').value.trim(); if (!/^\S+@\S+\.\S+$/.test(email)) return feedback('recuperacao-feedback', 'Digite um e-mail válido.'); const button = document.getElementById('btn-recuperacao'); setBusy(button, true, 'Enviar instruções'); try { await window.supabaseClient.auth.resetPasswordForEmail(email, {}); } catch (error) { console.warn(error); } feedback('recuperacao-feedback', 'Se houver uma conta com esse e-mail, as instruções foram enviadas.', 'success'); setBusy(button, false, 'Enviar instruções'); }
async function redefinirSenha(event) { event.preventDefault(); const senha = document.getElementById('nova-senha').value; const confirmacao = document.getElementById('nova-senha-confirmacao').value; if (!/(?=.*[A-Za-z])(?=.*\d).{8,}/.test(senha)) return feedback('redefinir-feedback', 'A senha deve ter pelo menos 8 caracteres, com letra e número.'); if (senha !== confirmacao) return feedback('redefinir-feedback', 'As senhas não são iguais.'); try { const { error } = await window.supabaseClient.auth.updateUser({ password: senha }); if (error) throw error; feedback('redefinir-feedback', 'Senha atualizada com sucesso!', 'success'); setTimeout(() => window.location.href = 'login.html', 1000); } catch (error) { feedback('redefinir-feedback', 'O link expirou ou não é válido. Solicite uma nova recuperação.'); } }

// Verifica se o usuário está autenticado. Caso contrário, envia para a tela de login.
async function verificarAutenticacao(opcoes = {}) {
  try {
    const { data: { session } } = await window.supabaseClient.auth.getSession();
    
    if (!session) {
      console.warn("Acesso negado. Redirecionando para login.");
      window.location.href = `login.html?redirect=${encodeURIComponent(opcoes.destino || window.location.pathname.split('/').pop())}`;
      return null;
    }
    
    const perfil = session.user?.user_metadata?.perfil || (session.user?.id === 'u-gestor' ? 'gestor' : 'aluno');
    if (opcoes.perfil && perfil !== opcoes.perfil) { window.location.href = perfil === 'gestor' ? 'dashboard.html' : 'aluno-dashboard.html'; return null; }
    // Atualiza o nome do usuário na tela se o elemento existir
    const userDisplay = document.getElementById('user-display-name');
    if (userDisplay && session.user && session.user.user_metadata) {
      userDisplay.innerText = session.user.user_metadata.nome || session.user.email;
    }
    
    return session;
  } catch (err) {
    console.error(err);
    window.location.href = 'login.html';
    return null;
  }
}

// Desconecta o usuário do sistema
async function realizarLogout() {
  try {
    await window.supabaseClient.auth.signOut();
    window.location.href = 'login.html';
  } catch (err) {
    console.error(err);
    window.location.href = 'login.html';
  }
}

// Torna as funções disponíveis globalmente para outras telas
window.verificarAutenticacao = verificarAutenticacao;
window.realizarLogout = realizarLogout;
