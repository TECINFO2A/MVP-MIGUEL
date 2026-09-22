# 🕊️ Paz na Escola — Plataforma de Convivência e Segurança (MVP)

O **Paz na Escola** é uma aplicação web responsiva projetada para facilitar a comunicação de situações de violência escolar (como bullying, cyberbullying e agressões) de forma segura e anônima, promovendo simultaneamente a cultura de paz por meio de trilhas de aprendizagem e monitoramento do clima emocional escolar.

O projeto evolui o MVP com ambientes separados para alunos e gestores, acompanhamento privado, linha do tempo de ocorrências, áudio, trilhas com progresso, conquistas discretas, central de ajuda, modo escuro e indicadores administrativos.

## Arquitetura

Aplicação estática em HTML, CSS e JavaScript modular. `js/supabase.js` usa Supabase quando as credenciais estão configuradas e um adaptador LocalStorage para demonstração offline. O frontend nunca deve conter service keys ou senhas.

- Aluno: dashboard, denúncias, acompanhamento, trilhas, perfil, conquistas e central de ajuda.
- Gestor: dashboard administrativo e detalhes das denúncias.
- Serviços: autenticação em `js/auth.js`, dados em `js/supabase.js`, áudio em `js/audio-service.js`, sincronização e tema em `js/app.js`.

---

## 🚀 Como Executar o Projeto Localmente

O MVP foi desenvolvido utilizando tecnologias web nativas (**HTML5, CSS3, JavaScript Vanilla**). Não há dependências de build ou servidores complexos (como Node.js ou Express).

### Método Rápido (Qualquer Navegador)
Basta abrir o arquivo [index.html](file:///g:/Meu%20Drive/MVP-MIGUEL/index.html) diretamente em qualquer navegador moderno.

### Usando um Servidor Local Simples (Recomendado)
Para testar recursos como rotas completas e simular a rede adequadamente, inicie um servidor HTTP estático na raiz do projeto:

**Usando Python:**
Abra o terminal na pasta do projeto e execute:
```bash
python -m http.server 8080
```
Depois acesse: `http://localhost:8080` no seu navegador.

**Usando Node.js (Servidor Estático Global):**
```bash
npx serve .
```

---

## 🛠️ Conexão e Configuração do Supabase

O projeto possui suporte a **dois modos de execução**:

1. **Modo de Simulação / Offline (Padrão)**: Se você abrir a aplicação diretamente, ela funcionará imediatamente salvando dados de forma simulada no `LocalStorage` do navegador. Permite testar todo o fluxo do aluno, check-ins, trilhas e painel de gestão sem configurar nada!
2. **Modo Supabase Conectado**: Para conectar a uma instância de banco de dados ativa no Supabase, configure as credenciais.

### Como Conectar com seu Banco Supabase Real:
Você pode configurar as chaves do seu Supabase de duas formas:
- **Opção A (Via Console do Navegador - Recomendado para Testes rápidos)**:
  Abra o console de desenvolvedor (F12) na página do aplicativo e execute:
  ```javascript
  localStorage.setItem('SUPABASE_URL', 'https://seu-projeto.supabase.co');
  localStorage.setItem('SUPABASE_KEY', 'sua-chave-publica-anonima-key');
  ```
  Depois recarregue a página (F5). O sistema detectará as chaves automaticamente e se conectará à nuvem.
- **Opção B (Via Código)**:
  Substitua as variáveis globais diretamente no início do arquivo [js/supabase.js](file:///g:/Meu%20Drive/MVP-MIGUEL/js/supabase.js):
  ```javascript
  window.SUPABASE_URL = 'https://seu-projeto.supabase.co';
  window.SUPABASE_KEY = 'sua-chave-publica-anonima-key';
  ```

---

## 🗄️ Estrutura do Banco de Dados (Supabase SQL)

Para rodar no Supabase conectado, execute o script SQL contido no arquivo [supabase_setup.sql](file:///g:/Meu%20Drive/MVP-MIGUEL/supabase_setup.sql) no console de consultas (**SQL Editor**) do painel do Supabase. O script incremental cria ou atualiza escolas, perfis, denúncias, linha do tempo, trilhas, check-ins, progresso, conquistas e avaliações, além de índices e políticas RLS.
- **`usuarios`**: Cadastro dos gestores escolares da plataforma.
- **`denuncias`**: Contém relatos cadastrados de forma anônima ou identificada.
- **`conteudos`**: Guarda o conteúdo interativo das Trilhas de Cultura de Paz.
- **`checkins`**: Diário emocional escolar consolidado.

### Configuração de Segurança RLS (Row Level Security):
As políticas de segurança inclusas garantem a conformidade básica com a **LGPD** e com as diretrizes do projeto:
- **Denúncias**: Qualquer pessoa pode realizar uma inserção (`INSERT`) de denúncia de forma anônima sem autenticação. Apenas gestores autenticados da escola têm permissão de leitura (`SELECT`) e atualização de status (`UPDATE`).
- **Check-ins**: Qualquer pessoa pode realizar o check-in emocional (`INSERT`). Nenhuma informação de identificação nominal é salva. Apenas gestores autenticados conseguem visualizar as estatísticas consolidadas (`SELECT`).
- **Trilhas**: Apenas leitura pública (`SELECT`) é liberada para visitantes; alterações e novas criações exigem perfil administrador.

---

## 👤 Credenciais de Teste do Painel Gestor

Para testar a **Área do Gestor** no Modo de Simulação / Offline:
- **Link de Acesso**: Clique em "Área do Gestor" no rodapé da página inicial, ou abra [login.html](file:///g:/Meu%20Drive/MVP-MIGUEL/login.html).
- **E-mail**: `admin@escola.com`
- **Senha**: `paz123`

*Para acesso conectado no Supabase real, utilize a aba de autenticação (Auth) no painel do Supabase para criar um usuário gestor ou utilize a trigger automática incluída no script SQL ao registrar novas contas.*

---

## 🛜 Modo Offline Integrado

- **Trilhas Educativas**: Os dados das trilhas de cultura de paz são armazenados em cache local quando a página carrega, permitindo que o estudante continue visualizando e interagindo com os passos e mini-quizzes mesmo sem internet.
- **Check-in Emocional**: Caso o aluno tente enviar seu check-in diário sem conexão com a internet, o aplicativo salva o sentimento localmente em cache temporário. Assim que a conexão retornar, o script de segundo plano (`js/app.js`) realiza a sincronização automática com o banco de dados do Supabase.
- **Segurança de Denúncias**: Para preservar dados altamente confidenciais e seguir a LGPD, o aplicativo **não armazena denúncias completas no cache offline do dispositivo**, bloqueando e orientando o usuário a reenviar quando possuir conexão estável, limpando rascunhos de memória temporários imediatamente após o envio.
- **Sincronização parcial**: cada check-in é removido da fila somente após confirmação individual. Se parte falhar, os itens restantes permanecem pendentes e o sistema anuncia quantos foram sincronizados e quantos aguardam conexão.

## 🎓 Ambiente do aluno

O aluno pode criar conta pelo Supabase Auth, registrar e acompanhar apenas denúncias próprias, consultar linha do tempo, fazer check-ins, continuar trilhas, acompanhar progresso e visualizar conquistas. A consulta por protocolo exige sessão e confere o `aluno_id`.

## 📊 Ambiente do gestor

O gestor acessa estatísticas reais da escola, filtros combináveis, notificações de registros não visualizados, linha do tempo, atualizações, índice experimental de paz e exportação CSV sem dados pessoais. O índice é uma referência operacional, não um diagnóstico científico.

## Configuração para produção

- Aplicar o SQL atualizado e associar cada usuário a uma `escola_id`.
- Configurar confirmação de e-mail e redirect URLs do Supabase Auth.
- Criar o bucket privado `denuncia-audios` e manter URLs assinadas com expiração curta.
- Servir por HTTPS para microfone, áudio e autenticação.

---

## 🎙️ Botão de Voz Experimental

Na tela de denúncia ([denuncia.html](file:///g:/Meu%20Drive/MVP-MIGUEL/denuncia.html)), o botão com emoji de microfone (`🎤`) utiliza a **Web Speech Recognition API** integrada no próprio navegador (compatível com Google Chrome, Microsoft Edge e Safari).
- Permite transcrever relatos longos falados diretamente no campo "O que aconteceu?".
- Em navegadores sem compatibilidade (como Firefox ou alguns navegadores mobile antigos), o sistema desativa o recurso exibindo um aviso educativo informando que o aluno pode digitar livremente.

---

## ♿ Diretrizes de Acessibilidade (WCAG 2.1)

O MVP implementa práticas sólidas de acessibilidade para garantir que todos os alunos possam navegar de forma autônoma:
1. **Navegação por Teclado**: Todo fluxo é navegável por meio da tecla `Tab`, possuindo indicador visual de foco com alta visibilidade (`outline` contrastante de `3px`).
2. **Leitor de Tela**: Utiliza contêineres dinâmicos `aria-live="assertive"` para anunciar status importantes (como gravação de voz ativada, formulário incorreto ou conexão restabelecida) a usuários com deficiência visual.
3. **Contraste**: A paleta de cores (variáveis no arquivo CSS) segue critérios rígidos de contraste mínimo de cor para textos e botões importantes.
4. **Semântica**: Divisões estruturadas em tags HTML5 apropriadas (`<header>`, `<main>`, `<section>`, `<article>`, `role="banner/main/contentinfo"`).

---

## ☁️ Deploy na Vercel

Por ser uma aplicação web baseada em arquivos estáticos simples, o deploy na Vercel é extremamente rápido e gratuito.

1. Instale a CLI do Vercel (`npm install -g vercel`) ou conecte o seu repositório no GitHub diretamente na [Vercel Dashboard](https://vercel.com).
2. Execute o comando na raiz do projeto:
   ```bash
   vercel
   ```
3. A Vercel detectará o arquivo `index.html` na raiz e gerará um link público seguro HTTPS instantaneamente.
