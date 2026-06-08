// --- NAVIGATION ET THEME ---
const html = document.documentElement;
document.getElementById('theme-toggle').addEventListener('click', () => {
    html.setAttribute('data-theme', html.getAttribute('data-theme') === 'light' ? 'dark' : 'light');
});

function switchTab(tabId) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(`${tabId}-view`).classList.add('active');
    document.getElementById(`btn-${tabId}`).classList.add('active');
}

document.getElementById('btn-home').addEventListener('click', () => switchTab('home'));
document.getElementById('btn-about').addEventListener('click', () => switchTab('about'));
document.getElementById('logo-link').addEventListener('click', () => switchTab('home'));

// --- NOTIFICATIONS ---
function showNotification(message, type = 'success') {
    const area = document.getElementById('notification-area');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span>${type === 'success' ? '✅' : '⚠️'}</span> <span>${message}</span>`;
    area.appendChild(toast);
    setTimeout(() => { toast.remove(); }, 4000);
}

// --- HISTORIQUE LOCAL ---
let history = JSON.parse(localStorage.getItem('airconvers_history')) || [];

function renderHistory() {
    const list = document.getElementById('history-list');
    list.innerHTML = history.map(item => `
        <div class="history-item">
            <div class="history-info">
                <span class="badge">${item.format.toUpperCase()}</span>
                <span style="font-weight: 600;">${item.name}</span>
            </div>
            <a href="${item.url}" class="download-btn" download>⬇️ Télécharger</a>
        </div>
    `).join('') || '<p style="text-align:center; opacity:0.6;">Aucune conversion récente.</p>';
}

function addToHistory(name, format, url) {
    history.unshift({ name, format, url });
    if(history.length > 5) history.pop(); // Garder les 5 derniers
    localStorage.setItem('airconvers_history', JSON.stringify(history));
    renderHistory();
}

// Initialisation au chargement
renderHistory();
