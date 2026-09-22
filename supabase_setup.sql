-- BANCO DE DADOS SUPABASE — PLATAFORMA PAZ NA ESCOLA
-- Copie e execute este script no Editor SQL (SQL Editor) do seu projeto Supabase.

-- =========================================================================
-- 1. CRIAÇÃO DAS TABELAS
-- =========================================================================

-- Tabela: usuarios (Gestores / Administradores da Escola)
CREATE TABLE IF NOT EXISTS public.usuarios (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  nome TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  perfil TEXT NOT NULL CHECK (perfil IN ('Gestor', 'Administrador')),
  escola TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela: denuncias
CREATE TABLE IF NOT EXISTS public.denuncias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(10) UNIQUE NOT NULL, -- Ex: PE-123456
  tipo TEXT NOT NULL CHECK (tipo IN ('Bullying', 'Cyberbullying', 'Ameaça', 'Agressão física', 'Discriminação', 'Violência verbal', 'Outro')),
  descricao TEXT NOT NULL,
  local TEXT,
  data_ocorrencia DATE NOT NULL,
  prioridade TEXT NOT NULL CHECK (prioridade IN ('Alta', 'Média', 'Baixa')),
  status TEXT NOT NULL DEFAULT 'Aberta' CHECK (status IN ('Aberta', 'Em análise', 'Resolvida')),
  anonima BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.denuncias
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Tabela: conteudos (Trilhas de Cultura de Paz)
CREATE TABLE IF NOT EXISTS public.conteudos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  categoria TEXT NOT NULL, -- Ex: 'Empatia', 'CNV', 'Resolução de Conflitos'
  descricao TEXT NOT NULL,
  conteudo JSONB NOT NULL, -- Contém os cards e quizzes da trilha
  ordem INT NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela: checkins (Registros de sentimentos)
CREATE TABLE IF NOT EXISTS public.checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES auth.users ON DELETE SET NULL, -- Caso queira vincular perfil administrativo
  sentimento TEXT NOT NULL CHECK (sentimento IN ('Bem', 'Tranquilo(a)', 'Normal', 'Preocupado(a)', 'Triste', 'Com raiva')),
  descricao TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================================
-- 2. HABILITAR ROW LEVEL SECURITY (RLS) - SEGURANÇA E LGPD
-- =========================================================================

ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.denuncias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conteudos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkins ENABLE ROW LEVEL SECURITY;

-- =========================================================================
-- 3. POLÍTICAS DE ACESSO (RLS POLICIES)
-- =========================================================================

-- Remove políticas anteriores para permitir reaplicar este script com segurança.
DROP POLICY IF EXISTS "Gestores podem ver perfis cadastrados" ON public.usuarios;
DROP POLICY IF EXISTS "Apenas admin ou o próprio usuário pode gerenciar seu cadastro" ON public.usuarios;
DROP POLICY IF EXISTS "Alunos e público podem inserir denúncias" ON public.denuncias;
DROP POLICY IF EXISTS "Apenas gestores da escola podem visualizar denúncias" ON public.denuncias;
DROP POLICY IF EXISTS "Apenas gestores da escola podem atualizar denúncias (Status/Prioridade)" ON public.denuncias;
DROP POLICY IF EXISTS "Público geral pode ler conteúdos educativos" ON public.conteudos;
DROP POLICY IF EXISTS "Apenas gestores autorizados podem cadastrar/alterar conteúdos" ON public.conteudos;
DROP POLICY IF EXISTS "Qualquer aluno ou visitante pode fazer check-in emocional" ON public.checkins;
DROP POLICY IF EXISTS "Apenas gestores autenticados podem ver os sentimentos consolidados" ON public.checkins;

CREATE OR REPLACE FUNCTION public.is_gestor()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.usuarios
    WHERE id = auth.uid()
      AND perfil IN ('Gestor', 'Administrador')
  );
$$;

-- POLÍTICAS: usuarios
CREATE POLICY "Gestores podem ver perfis cadastrados" 
  ON public.usuarios FOR SELECT 
  TO authenticated 
  USING (auth.uid() = id OR public.is_gestor());

CREATE POLICY "Apenas admin ou o próprio usuário pode gerenciar seu cadastro" 
  ON public.usuarios FOR ALL 
  TO authenticated 
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- POLÍTICAS: denuncias
CREATE POLICY "Alunos e público podem inserir denúncias" 
  ON public.denuncias FOR INSERT 
  WITH CHECK (true); -- Permitido inserir anonimamente sem autenticação

CREATE POLICY "Apenas gestores da escola podem visualizar denúncias" 
  ON public.denuncias FOR SELECT 
  TO authenticated 
  USING (public.is_gestor());

CREATE POLICY "Apenas gestores da escola podem atualizar denúncias (Status/Prioridade)" 
  ON public.denuncias FOR UPDATE 
  TO authenticated 
  USING (public.is_gestor())
  WITH CHECK (public.is_gestor());

-- POLÍTICAS: conteudos
CREATE POLICY "Público geral pode ler conteúdos educativos" 
  ON public.conteudos FOR SELECT 
  USING (ativo = true);

CREATE POLICY "Apenas gestores autorizados podem cadastrar/alterar conteúdos" 
  ON public.conteudos FOR ALL 
  TO authenticated 
  USING (public.is_gestor())
  WITH CHECK (public.is_gestor());

-- POLÍTICAS: checkins
CREATE POLICY "Qualquer aluno ou visitante pode fazer check-in emocional" 
  ON public.checkins FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Apenas gestores autenticados podem ver os sentimentos consolidados" 
  ON public.checkins FOR SELECT 
  TO authenticated 
  USING (public.is_gestor());

-- =========================================================================
-- 4. CARGA INICIAL DE CONTEÚDOS (Trilhas de Cultura de Paz)
-- =========================================================================

INSERT INTO public.conteudos (titulo, categoria, descricao, ordem, conteudo, ativo)
VALUES 
(
  'O que é Empatia?', 
  'Empatia', 
  'Compreender o sentimento do outro.', 
  1, 
  '{
    "passos": [
      {
        "texto": "Empatia é tentar compreender o que outra pessoa está sentindo, se colocando no lugar dela para entender seus motivos e reações.",
        "pergunta": "Você consegue pensar em como seu colega pode estar se sentindo quando é excluído de um grupo?",
        "opcoes": ["Sim", "Quero aprender mais"]
      },
      {
        "texto": "Ouvir ativamente e sem julgamentos precipitados é o primeiro passo para praticar a empatia nas relações cotidianas.",
        "pergunta": "Você costuma prestar atenção total e escutar com atenção quando um amigo desabafa?",
        "opcoes": ["Sempre", "Às vezes", "Vou tentar melhorar"]
      }
    ]
  }'::jsonb, 
  true
),
(
  'Comunicação Não Violenta', 
  'CNV', 
  'Como expressar sentimentos sem agredir.', 
  2, 
  '{
    "passos": [
      {
        "texto": "A Comunicação Não Violenta (CNV) nos ajuda a expressar nossas necessidades humanas sem atacar ou culpar os outros.",
        "pergunta": "Em um momento de raiva com algum colega, o que você acha mais produtivo fazer?",
        "opcoes": ["Respirar fundo e falar depois", "Falar tudo o que vier à mente na hora"]
      },
      {
        "texto": "Ao invés de julgar rotulando (\'Você é egoísta\'), descreva o fato concreto e seu sentimento (\'Fiquei triste quando você não compartilhou o material\').",
        "pergunta": "Falar sobre os seus sentimentos em vez de acusar o outro parece seguro para você?",
        "opcoes": ["Sim", "Depende da pessoa", "Tenho dificuldades"]
      }
    ]
  }'::jsonb, 
  true
),
(
  'Resolução de Conflitos', 
  'Resolução de Conflitos', 
  'Aprenda a solucionar desentendimentos de forma pacífica.', 
  3, 
  '{
    "passos": [
      {
        "texto": "Conflitos fazem parte da vida. A forma como lidamos com eles é que define a qualidade das nossas relações escolares.",
        "pergunta": "Diante de um conflito entre colegas, o primeiro passo deve ser:",
        "opcoes": ["Ouvir as duas partes", "Tomar partido imediatamente", "Ignorar o problema"]
      },
      {
        "texto": "Buscar soluções onde ambos ganham (ganha-ganha) envolve ceder de forma consciente em prol da boa convivência diária.",
        "pergunta": "Você se sente preparado para conversar de forma calma para resolver um desentendimento?",
        "opcoes": ["Sim", "Preciso de ajuda de um adulto responsável"]
      }
    ]
  }'::jsonb, 
  true
);

-- =========================================================================
-- 5. TRIGGER DE VÍNCULO DE USUÁRIOS
-- Cria perfil automaticamente na tabela 'public.usuarios' após cadastro no Auth
-- =========================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.usuarios (id, nome, email, perfil, escola)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'nome', 'Gestor Escolar'), 
    new.email, 
    'Gestor', 
    COALESCE(new.raw_user_meta_data->>'escola', 'Escola Geral')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.touch_denuncia_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS denuncias_updated_at ON public.denuncias;
CREATE TRIGGER denuncias_updated_at
  BEFORE UPDATE ON public.denuncias
  FOR EACH ROW EXECUTE FUNCTION public.touch_denuncia_updated_at();

CREATE OR REPLACE FUNCTION public.consultar_denuncia_publica(p_codigo VARCHAR)
RETURNS TABLE (codigo VARCHAR, tipo TEXT, status TEXT, created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT d.codigo, d.tipo, d.status, d.created_at, d.updated_at
  FROM public.denuncias AS d
  WHERE d.codigo = upper(p_codigo)
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.consultar_denuncia_publica(VARCHAR) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.consultar_denuncia_publica(VARCHAR) TO anon, authenticated;
