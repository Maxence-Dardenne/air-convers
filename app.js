// --- CONFIGURATION DE L'API ---
// ⚠️ REMPLACE CETTE URL PAR LA TIENNE SANS LE "/" À LA FIN
const API_BASE_URL = "https://air-convers.vercel.app"; 

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
                <span style="font-weight: 600; word-break: break-all;">${item.name}</span>
            </div>
            <a href="${item.url}" class="download-btn" target="_blank">⬇️ Récupérer</a>
        </div>
    `).join('') || '<p style="text-align:center; opacity:0.6;">Aucune conversion récente.</p>';
}

function addToHistory(name, format, url) {
    history.unshift({ name, format, url });
    if(history.length > 5) history.pop(); // Garder les 5 derniers
    localStorage.setItem('airconvers_history', JSON.stringify(history));
    renderHistory();
}

// --- LOGIQUE DE TÉLÉCHARGEMENT & PROGRESSION ---
const form = document.getElementById('convert-form');
const statusContainer = document.getElementById('status-container');
const progressFill = document.getElementById('progress-fill');
const statusText = document.getElementById('status-text');
const statusPercent = document.getElementById('status-percent');
const submitBtn = document.getElementById('submit-btn');

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const urlMedia = document.getElementById('url-input').value;
    const formatMedia = document.getElementById('format-select').value;
    
    if (!urlMedia) return;

    // Verrouiller l'UI et afficher la barre de progression
    submitBtn.disabled = true;
    submitBtn.style.opacity = '0.5';
    statusContainer.style.display = 'block';
    progressFill.style.width = '0%';
    statusPercent.innerText = '0%';
    statusText.innerText = 'Connexion au serveur de conversion...';

    // Animation de fausse progression fluide pendant que le serveur travaille
    let progress = 0;
    const progressInterval = setInterval(() => {
        if (progress < 90) {
            progress += Math.floor(Math.random() * 5) + 1;
            progressFill.style.width = `${progress}%`;
            statusPercent.innerText = `${progress}%`;
            
            if (progress > 30 && progress < 70) statusText.innerText = 'Extraction du flux média...';
            if (progress >= 70) statusText.innerText = 'Finalisation du fichier de sortie...';
        }
    }, 300);

    // Construire l'URL de téléchargement direct de notre API Vercel
    const downloadUrl = `${API_BASE_URL}/api/convert?url=${encodeURIComponent(urlMedia)}&format=${formatMedia}`;

    try {
        // On teste rapidement si le serveur répond correctement
        const response = await fetch(downloadUrl, { method: 'HEAD' });
        
        clearInterval(progressInterval);

        if (response.ok) {
            // Succès ! On remplit à 100%
            progressFill.style.width = '100%';
            statusPercent.innerText = '100%';
            statusText.innerText = 'Fichier prêt !';
            
            showNotification('Conversion réussie ! Le téléchargement démarre.');

            // Extraire un nom de fichier propre pour l'historique
            const domain = new URL(urlMedia).hostname.replace('www.', '');
            const fileName = `AirConvers_${domain}_${Math.floor(Math.random() * 1000)}.${formatMedia}`;

            // Ajouter à l'historique et lancer le téléchargement
            addToHistory(fileName, formatMedia, downloadUrl);
            window.location.href = downloadUrl;
        } else {
            throw new Error('Le serveur a renvoyé une erreur.');
        }

    } catch (error) {
        clearInterval(progressInterval);
        showNotification('Erreur lors de la conversion. Vérifie ton lien.', 'error');
        statusText.innerText = 'Échec de la conversion.';
        console.error(error);
    } finally {
        // Réinitialiser le bouton principal
        submitBtn.disabled = false;
        submitBtn.style.opacity = '1';
        document.getElementById('url-input').value = '';
    }
});

// Initialisation au chargement
renderHistory();
