// js/app.js
// Utilitários Globais: Conexão Offline, Notificações e Acessibilidade

document.addEventListener('DOMContentLoaded', () => {
  setupOfflineBanner();
  checkConnectionStatus();
  setupAccessibilityAnnouncer();
  initThemeToggle();
});

function initThemeToggle() {
  try {
    const savedTheme = localStorage.getItem('paz-na-escola-theme') || 'light';
    applyTheme(savedTheme);
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'light');
  }

  let toggleButton = document.getElementById('theme-toggle');
  if (!toggleButton && document.body) {
    toggleButton = document.createElement('button');
    toggleButton.id = 'theme-toggle';
    toggleButton.type = 'button';
    toggleButton.className = 'theme-toggle';
    toggleButton.setAttribute('aria-label', 'Ativar modo noturno');
    toggleButton.setAttribute('aria-pressed', 'false');
    document.body.appendChild(toggleButton);
  }

  if (!toggleButton) return;

  toggleButton.onclick = () => {
    const nextTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    applyTheme(nextTheme);
  };

  updateThemeButton(toggleButton);
}

function applyTheme(theme) {
  const selectedTheme = theme === 'dark' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', selectedTheme);

  try {
    localStorage.setItem('paz-na-escola-theme', selectedTheme);
  } catch (e) {}

  const toggleButton = document.getElementById('theme-toggle');
  if (toggleButton) updateThemeButton(toggleButton);
}

function updateThemeButton(button) {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  button.innerHTML = isDark ? '☀️' : '🌙';
  button.setAttribute('aria-label', isDark ? 'Ativar modo claro' : 'Ativar modo noturno');
  button.setAttribute('aria-pressed', String(isDark));
  button.title = isDark ? 'Alternar para modo claro' : 'Alternar para modo noturno';
}

// Exibe ou oculta banner de rede offline
function setupOfflineBanner() {
  let banner = document.getElementById('offline-banner');
  if (!banner) {
    banner = document.createElement('div');
    banner.id = 'offline-banner';
    banner.className = 'offline-banner';
    banner.innerText = '⚠️ Sem conexão com a internet. O aplicativo está rodando em modo offline.';
    document.body.prepend(banner);
  }
}

function checkConnectionStatus() {
  const banner = document.getElementById('offline-banner');
  if (banner) {
    if (navigator.onLine) {
      banner.style.display = 'none';
      // Tenta sincronizar dados salvos localmente
      syncPendingData();
    } else {
      banner.style.display = 'block';
    }
  }
}

// Escuta mudanças de conectividade
window.addEventListener('online', () => {
  checkConnectionStatus();
  announceAccessibility("Você está online novamente. Sincronizando dados pendentes.");
});

window.addEventListener('offline', () => {
  checkConnectionStatus();
  announceAccessibility("Conexão de rede perdida. Entrando em modo offline.");
});

// Acessibilidade: Anunciador dinâmico para leitores de tela
function setupAccessibilityAnnouncer() {
  let announcer = document.getElementById('accessibility-announcer');
  if (!announcer) {
    announcer = document.createElement('div');
    announcer.id = 'accessibility-announcer';
    announcer.setAttribute('aria-live', 'assertive');
    announcer.setAttribute('aria-atomic', 'true');
    announcer.style.position = 'absolute';
    announcer.style.width = '1px';
    announcer.style.height = '1px';
    announcer.style.padding = '0';
    announcer.style.margin = '-1px';
    announcer.style.overflow = 'hidden';
    announcer.style.clip = 'rect(0, 0, 0, 0)';
    announcer.style.border = '0';
    document.body.appendChild(announcer);
  }
}

function announceAccessibility(message) {
  const announcer = document.getElementById('accessibility-announcer');
  if (announcer) {
    announcer.textContent = '';
    setTimeout(() => {
      announcer.textContent = message;
    }, 100);
  }
}

// Sincronização automática de check-ins pendentes
async function syncPendingData() {
  if (!navigator.onLine) return;

  // Sincroniza Check-ins pendentes
  const pendingCheckins = JSON.parse(localStorage.getItem('paz_na_escola_checkin_pendente') || '[]');
  if (pendingCheckins.length > 0) {
    announceAccessibility(`Sincronizando ${pendingCheckins.length} check-ins pendentes.`);
    console.log(`Sincronizando ${pendingCheckins.length} check-ins pendentes...`);
    const remainingCheckins = [];

    for (const checkin of pendingCheckins) {
      try {
        const { error } = await window.supabaseClient.from('checkins').insert({
          sentimento: checkin.sentimento,
          descricao: checkin.descricao,
          created_at: checkin.created_at,
          usuario_id: checkin.usuario_id || null
        });
        if (error) remainingCheckins.push(checkin);
      } catch (err) {
        console.error("Erro ao sincronizar item:", err);
        remainingCheckins.push(checkin);
      }
    }

    if (remainingCheckins.length === 0) {
      localStorage.removeItem('paz_na_escola_checkin_pendente');
      announceAccessibility(`Sincronização concluída. ${pendingCheckins.length} registros sincronizados.`);
      console.log("Todos os check-ins pendentes foram sincronizados!");
    } else {
      localStorage.setItem('paz_na_escola_checkin_pendente', JSON.stringify(remainingCheckins));
      console.warn(`${remainingCheckins.length} check-in(s) permanecem pendentes para nova tentativa.`);
      announceAccessibility(`${pendingCheckins.length - remainingCheckins.length} registros sincronizados. ${remainingCheckins.length} aguardando conexão.`);
    }
  }
}

function escapeHTML(value) {
  return String(value ?? '').replace(/[&<>'"]/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  })[character]);
}

// Gera código de acompanhamento no formato PNE-2026-XXXXXX
function generateComplaintCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `PNE-2026-${result}`;
}

function formatDate(value) {
  if (!value) return 'Data não informada';
  const date = String(value).includes('T') ? new Date(value) : new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? 'Data não informada' : date.toLocaleDateString('pt-BR');
}

function statusClass(status) {
  return String(status || 'Em análise').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-');
}

// Torna funções globais disponíveis
window.announceAccessibility = announceAccessibility;
window.generateComplaintCode = generateComplaintCode;
window.formatDate = formatDate;
window.statusClass = statusClass;
window.syncPendingData = syncPendingData;
window.escapeHTML = escapeHTML;
window.applyTheme = applyTheme;
window.initThemeToggle = initThemeToggle;
