// ==========================================
// 1. CONFIGURATION DE L'API
// ==========================================
// ⚠️ REMPLACE CETTE URL PAR LA TIENNE (fournie par ton tableau de bord Vercel)
// Ne mets pas de "/" à la fin de l'URL.
const API_BASE_URL = "https://air-convers.vercel.app"; 

// ==========================================
// 2. GESTION DU THÈME (CLAIR / SOMBRE)
// ==========================================
const html = document.documentElement;
const themeToggleBtn = document.getElementById('theme-toggle');

themeToggleBtn.addEventListener('click', () => {
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    html.setAttribute('data-theme', newTheme);
});

// ==========================================
// 3. NAVIGATION (ONGLETS / VUES)
// ==========================================
function switchTab(tabId) {
    // Masquer toutes les vues et désactiver les boutons
    document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    
    // Activer la vue et le bouton correspondants
    document.getElementById(`${tabId}-view`).classList.add('active');
    document.getElementById(`btn-${tabId}`).classList.add('active');
}

// Événements de navigation
document.getElementById('btn-home').addEventListener('click', () => switchTab('home'));
document.getElementById('btn-about').addEventListener('click', () => switchTab('about'));
document.getElementById('logo-link').addEventListener('click', () => switchTab('home'));

// ==========================================
// 4. SYSTÈME DE NOTIFICATIONS (TOASTS)
// ==========================================
function showNotification(message, type = 'success') {
    const area = document.getElementById('notification-area');
    const toast = document.createElement('div');
    toast.className = 'toast';
    
    // Icone selon le type
    const icon = type === 'success' ? '✅' : '⚠️';
    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    
    area.appendChild(toast);
    
    // Auto-destruction du toast après 4 secondes avec effet de transition
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// ==========================================
// 5. GESTION DE L'HISTORIQUE LOCAL
// ==========================================
let history = JSON.parse(localStorage.getItem('airconvers_history')) || [];

function renderHistory() {
    const list = document.getElementById('history-list');
    
    if (history.length === 0) {
        list.innerHTML = '<p style="text-align:center; opacity:0.6; padding: 1rem;">Aucune conversion récente.</p>';
        return;
    }

    list.innerHTML = history.map(item => `
        <div class="history-item">
            <div class="history-info">
                <span class="badge">${item.format.toUpperCase()}</span>
                <span style="font-weight: 600; word-break: break-all;">${item.name}</span>
            </div>
            <a href="${item.url}" class="download-btn" target="_blank" rel="noopener noreferrer">⬇️ Récupérer</a>
        </div>
    `).join('');
}

function addToHistory(name, format, url) {
    // Ajouter au début du tableau
    history.unshift({ name, format, url });
    
    // Ne garder que les 5 éléments les plus récents
    if (history.length > 5) history.pop(); 
    
    // Sauvegarder dans le navigateur
    localStorage.setItem('airconvers_history', JSON.stringify(history));
    
    // Rafraîchir l'affichage
    renderHistory();
}

// ==========================================
// 6. LOGIQUE DE TÉLÉCHARGEMENT & PROGRESSION
// ==========================================
const form = document.getElementById('convert-form');
const statusContainer = document.getElementById('status-container');
const progressFill = document.getElementById('progress-fill');
const statusText = document.getElementById('status-text');
const statusPercent = document.getElementById('status-percent');
const submitBtn = document.getElementById('submit-btn');

form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const urlMedia = document.getElementById('url-input').value.trim();
    const formatMedia = document.getElementById('format-select').value;
    
    if (!urlMedia) return;

    // 1. Verrouiller l'interface utilisateur
    submitBtn.disabled = true;
    submitBtn.style.opacity = '0.5';
    statusContainer.style.display = 'block';
    progressFill.style.width = '0%';
    statusPercent.innerText = '0%';
    statusText.innerText = 'Connexion au serveur de conversion...';

    // 2. Lancer l'animation de la barre de progression
    let progress = 0;
    const progressInterval = setInterval(() => {
        if (progress < 95) {
            progress += Math.floor(Math.random() * 8) + 2;
            if (progress > 95) progress = 95; // Bloque à 95% en attendant le stream
            
            progressFill.style.width = `${progress}%`;
            statusPercent.innerText = `${progress}%`;
            
            if (progress > 25 && progress < 65) statusText.innerText = 'Extraction du flux média...';
            if (progress >= 65) statusText.innerText = 'Génération de votre fichier de sortie...';
        }
    }, 250);

    // 3. Construire l'URL de l'API Vercel
    const downloadUrl = `${API_BASE_URL}/api/convert?url=${encodeURIComponent(urlMedia)}&format=${formatMedia}`;

    // 4. Générer un faux nom de fichier lisible pour l'historique de l'interface
    let domain = "media";
    try {
        domain = new URL(urlMedia).hostname.replace('www.', '');
    } catch(err) {}
    const fileName = `AirConvers_${domain}_${Math.floor(Math.random() * 1000)}.${formatMedia}`;

    // 5. Déclencher le téléchargement via le navigateur
    try {
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // 6. Finaliser l'interface après simulation du délai de réponse initial
        setTimeout(() => {
            clearInterval(progressInterval);
            progressFill.style.width = '100%';
            statusPercent.innerText = '100%';
            statusText.innerText = 'Téléchargement démarré !';
            
            showNotification('Conversion réussie ! Récupération du fichier.');
            addToHistory(fileName, formatMedia, downloadUrl);

            // Déverrouiller le formulaire
            submitBtn.disabled = false;
            submitBtn.style.opacity = '1';
            document.getElementById('url-input').value = '';
        }, 2500);

    } catch (error) {
        clearInterval(progressInterval);
        showNotification('Erreur lors du traitement du lien.', 'error');
        statusText.innerText = 'Échec de la conversion.';
        submitBtn.disabled = false;
        submitBtn.style.opacity = '1';
        console.error(error);
    }
});

// ==========================================
// 7. INITIALISATION AU CHARGEMENT DE LA PAGE
// ==========================================
renderHistory();
