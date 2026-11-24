// js/supabase.js
// Configuração do Supabase e Fallback de Simulação (Mock) para demonstração offline

const DB_PREFIX = 'paz_na_escola_';

// Função para obter chaves do localStorage ou usar padrão
function getSupabaseConfig() {
  return {
    url: localStorage.getItem('SUPABASE_URL') || window.SUPABASE_URL || '',
    key: localStorage.getItem('SUPABASE_KEY') || window.SUPABASE_KEY || ''
  };
}

class MockSupabaseClient {
  constructor() {
    console.warn("⚠️ Utilizando Banco de Dados Simulado (Offline/Mock). Os dados serão salvos no LocalStorage.");
    this.initMockData();
  }

  initMockData() {
    // Inicializa trilhas de cultura de paz se não existirem
    if (!localStorage.getItem(DB_PREFIX + 'conteudos')) {
      const defaultConteudos = [
        {
          id: '1',
          titulo: 'O que é Empatia?',
          categoria: 'Empatia',
          descricao: 'Compreender o sentimento do outro.',
          ordem: 1,
          ativo: true,
          conteudo: {
            passos: [
              {
                texto: "Empatia é tentar compreender o que outra pessoa está sentindo, colocando-se no lugar dela.",
                pergunta: "Você consegue pensar em como seu colega pode estar se sentindo quando é excluído?",
                opcoes: ["Sim", "Quero aprender mais"]
              },
              {
                texto: "Ouvir ativamente e sem julgamentos é o primeiro passo para praticar a empatia no dia a dia.",
                pergunta: "Você costuma prestar atenção total quando um amigo desabafa?",
                opcoes: ["Sempre", "Às vezes", "Vou tentar melhorar"]
              }
            ]
          }
        },
        {
          id: '2',
          titulo: 'Comunicação Não Violenta',
          categoria: 'CNV',
          descricao: 'Como expressar sentimentos sem agredir.',
          ordem: 2,
          ativo: true,
          conteudo: {
            passos: [
              {
                texto: "A Comunicação Não Violenta (CNV) nos ajuda a expressar nossas necessidades sem atacar os outros.",
                pergunta: "Em um momento de raiva, o que você acha melhor fazer?",
                opcoes: ["Respirar fundo e falar depois", "Falar o que vier à mente"]
              },
              {
                texto: "Ao invés de julgar ('Você é egoísta'), descreva o fato e o seu sentimento ('Fiquei triste quando você não compartilhou').",
                pergunta: "Falar sobre os próprios sentimentos parece seguro para você?",
                opcoes: ["Sim", "Depende da pessoa", "Tenho dificuldades"]
              }
            ]
          }
        },
        {
          id: '3',
          titulo: 'Resolução de Conflitos',
          categoria: 'Resolução de Conflitos',
          descricao: 'Aprenda a solucionar desentendimentos de forma pacífica.',
          ordem: 3,
          ativo: true,
          conteudo: {
            passos: [
              {
                texto: "Conflitos são normais, mas a forma como lidamos com eles faz toda a diferença.",
                pergunta: "Diante de um conflito escolar, o primeiro passo deve ser:",
                opcoes: ["Ouvir as duas partes", "Tomar partido imediatamente", "Ignorar o problema"]
              },
              {
                texto: "Buscar soluções ganha-ganha, onde ambos cedem um pouco em prol de uma convivência harmoniosa.",
                pergunta: "Você se sente preparado para mediar uma conversa pacífica?",
                opcoes: ["Sim", "Preciso de ajuda de um adulto"]
              }
            ]
          }
        }
      ];
      localStorage.setItem(DB_PREFIX + 'conteudos', JSON.stringify(defaultConteudos));
    }

    // Inicializa denúncias mock se não existirem
    if (!localStorage.getItem(DB_PREFIX + 'denuncias')) {
      const defaultDenuncias = [
        {
          id: 'd1',
          codigo: 'PE-482910',
          tipo: 'Bullying',
          descricao: 'Um aluno do 9º ano está fazendo piadas agressivas recorrentes com outro colega no recreio.',
          local: 'Pátio',
          data_ocorrencia: '2026-08-18',
          prioridade: 'Alta',
          status: 'Aberta',
          anonima: true,
          created_at: new Date(Date.now() - 3600000 * 2).toISOString()
        },
        {
          id: 'd2',
          codigo: 'PE-910283',
          tipo: 'Cyberbullying',
          descricao: 'Criaram uma página em rede social para difamar fotos de alunas da escola.',
          local: 'Internet',
          data_ocorrencia: '2026-08-18',
          prioridade: 'Média',
          status: 'Em análise',
          anonima: true,
          created_at: new Date(Date.now() - 3600000 * 5).toISOString()
        },
        {
          id: 'd3',
          codigo: 'PE-110293',
          tipo: 'Discriminação',
          descricao: 'Comentários preconceituosos de cunho racista proferidos contra aluno novo.',
          local: 'Sala de aula',
          data_ocorrencia: '2026-08-17',
          prioridade: 'Baixa',
          status: 'Resolvida',
          anonima: true,
          created_at: new Date(Date.now() - 3600000 * 24).toISOString()
        }
      ];
      localStorage.setItem(DB_PREFIX + 'denuncias', JSON.stringify(defaultDenuncias));
    }

    // Inicializa checkins mock se não existirem
    if (!localStorage.getItem(DB_PREFIX + 'checkins')) {
      const defaultCheckins = [
        { id: 'c1', sentimento: 'Bem', descricao: '', created_at: new Date().toISOString() },
        { id: 'c2', sentimento: 'Tranquilo(a)', descricao: '', created_at: new Date().toISOString() },
        { id: 'c3', sentimento: 'Normal', descricao: '', created_at: new Date().toISOString() },
        { id: 'c4', sentimento: 'Preocupado(a)', descricao: 'Tenho prova amanhã', created_at: new Date().toISOString() },
        { id: 'c5', sentimento: 'Triste', descricao: 'Briguei com meu amigo', created_at: new Date().toISOString() },
        { id: 'c6', sentimento: 'Bem', descricao: '', created_at: new Date().toISOString() },
        { id: 'c7', sentimento: 'Com raiva', descricao: 'Alguém escondeu meu estojo', created_at: new Date().toISOString() }
      ];
      localStorage.setItem(DB_PREFIX + 'checkins', JSON.stringify(defaultCheckins));
    }
  }

  // Métodos simulando consultas do Supabase
  from(table) {
    const self = this;
    let data = JSON.parse(localStorage.getItem(DB_PREFIX + table) || '[]');
    let currentQuery = {
      data: data,
      error: null,
      filters: [],

      select(fields = '*') {
        // Para o MVP, select simplificado retorna os dados diretamente
        return this;
      },

      insert(records) {
        const arr = Array.isArray(records) ? records : [records];
        arr.forEach(r => {
          if (!r.id) r.id = Math.random().toString(36).substr(2, 9);
          if (!r.created_at) r.created_at = new Date().toISOString();
          this.data.push(r);
        });
        localStorage.setItem(DB_PREFIX + table, JSON.stringify(this.data));
        return Promise.resolve({ data: arr, error: null });
      },

      update(updates) {
        this.updatePayload = updates;
        return this;
      },

      eq(field, value) {
        this.filters.push({ field, value });
        this.data = this.data.filter(item => item[field] === value);
        return this;
      },

      order(field, { ascending = true } = {}) {
        this.data.sort((a, b) => {
          if (a[field] < b[field]) return ascending ? -1 : 1;
          if (a[field] > b[field]) return ascending ? 1 : -1;
          return 0;
        });
        return this;
      },

      // Executa o update pendente se houver
      then(resolve) {
        if (this.updatePayload) {
          let updatedCount = 0;
          let allData = JSON.parse(localStorage.getItem(DB_PREFIX + table) || '[]');
          
          // Aplica filtros no conjunto global para atualizar
          allData = allData.map(item => {
            let matches = true;
            this.filters.forEach(f => {
              if (item[f.field] !== f.value) matches = false;
            });
            if (matches) {
              updatedCount++;
              return { ...item, ...this.updatePayload };
            }
            return item;
          });

          localStorage.setItem(DB_PREFIX + table, JSON.stringify(allData));
          resolve({ data: this.updatePayload, error: null });
        } else {
          resolve({ data: this.data, error: null });
        }
      }
    };
    return currentQuery;
  }

  rpc(functionName, params) {
    if (functionName !== 'consultar_denuncia_publica') {
      return Promise.resolve({ data: null, error: { message: 'Função RPC não disponível no modo simulado.' } });
    }
    const denuncias = JSON.parse(localStorage.getItem(DB_PREFIX + 'denuncias') || '[]');
    const denuncia = denuncias.find(item => item.codigo === params.p_codigo);
    const data = denuncia ? [{ codigo: denuncia.codigo, tipo: denuncia.tipo, status: denuncia.status, created_at: denuncia.created_at, updated_at: denuncia.updated_at || denuncia.created_at }] : [];
    return Promise.resolve({ data, error: null });
  }

  // Auth simulação
  get auth() {
    const self = this;
    return {
      signInWithPassword({ email, password }) {
        if (email === 'admin@escola.com' && password === 'paz123') {
          const session = {
            user: { id: 'u-gestor', email: 'admin@escola.com', user_metadata: { nome: 'Diretor Geral', perfil: 'gestor' } },
            access_token: 'mock-token'
          };
          localStorage.setItem(DB_PREFIX + 'session', JSON.stringify(session));
          // Dispara evento mock se registrado
          if (self.authListener) self.authListener('SIGNED_IN', session);
          return Promise.resolve({ data: { user: session.user, session }, error: null });
        }
        const users = JSON.parse(localStorage.getItem(DB_PREFIX + 'usuarios') || '[]');
        const user = users.find(item =>
          item.senha === password &&
          (item.email.toLowerCase() === email.toLowerCase() || item.matricula === email)
        );
        if (user) {
          const session = {
            user: { id: user.id, email: user.email, user_metadata: { ...user, perfil: 'aluno', senha: undefined } },
            access_token: 'mock-token'
          };
          localStorage.setItem(DB_PREFIX + 'session', JSON.stringify(session));
          if (self.authListener) self.authListener('SIGNED_IN', session);
          return Promise.resolve({ data: { user: session.user, session }, error: null });
        }
        return Promise.resolve({ data: null, error: { message: 'Credenciais inválidas de simulação (Use: admin@escola.com / paz123)' } });
      },

      signUp({ email, password, options }) {
        const users = JSON.parse(localStorage.getItem(DB_PREFIX + 'usuarios') || '[]');
        const metadata = options?.data || {};
        const matricula = String(metadata.matricula || '').trim();
        if (users.some(item => item.email.toLowerCase() === email.toLowerCase())) {
          return Promise.resolve({ data: null, error: { message: 'Este e-mail já está cadastrado.' } });
        }
        if (matricula && users.some(item => item.matricula === matricula)) {
          return Promise.resolve({ data: null, error: { message: 'Essa matrícula já está cadastrada.' } });
        }
        const user = { id: 'u-aluno-' + Date.now(), email, senha: password, ...metadata };
        users.push(user);
        localStorage.setItem(DB_PREFIX + 'usuarios', JSON.stringify(users));
        const session = {
          user: { id: user.id, email: user.email, user_metadata: { ...metadata, perfil: 'aluno' } },
          access_token: 'mock-token'
        };
        localStorage.setItem(DB_PREFIX + 'session', JSON.stringify(session));
        if (self.authListener) self.authListener('SIGNED_IN', session);
        return Promise.resolve({ data: { user: session.user, session }, error: null });
      },

      signOut() {
        localStorage.removeItem(DB_PREFIX + 'session');
        if (self.authListener) self.authListener('SIGNED_OUT', null);
        return Promise.resolve({ error: null });
      },

      getSession() {
        const session = JSON.parse(localStorage.getItem(DB_PREFIX + 'session') || 'null');
        return Promise.resolve({ data: { session }, error: null });
      },

      onAuthStateChange(callback) {
        self.authListener = callback;
        const session = JSON.parse(localStorage.getItem(DB_PREFIX + 'session') || 'null');
        callback(session ? 'SIGNED_IN' : 'SIGNED_OUT', session);
        return { data: { subscription: { unsubscribe: () => { self.authListener = null; } } } };
      }
    };
  }
}

// Inicializa o cliente real ou mock
let supabaseClient;
const config = getSupabaseConfig();

if (config.url && config.key && typeof supabase !== 'undefined') {
  try {
    supabaseClient = supabase.createClient(config.url, config.key);
    console.log("⚡ Supabase conectado com sucesso!");
  } catch (err) {
    console.error("Falha ao inicializar cliente real do Supabase. Usando Mock.", err);
    supabaseClient = new MockSupabaseClient();
  }
} else {
  supabaseClient = new MockSupabaseClient();
}

window.supabaseClient = supabaseClient;
