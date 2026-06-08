const ytdl = require('@distube/ytdl-core');

module.exports = async (req, res) => {
    // 1. Gérer la sécurité CORS pour que ton site GitHub Pages puisse interroger l'API
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Répondre aux requêtes de vérification du navigateur (Preflight)
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // 2. Vérifier que la requête contient bien l'URL et le format requis
    const { url, format } = req.query;

    if (!url || !format) {
        return res.status(400).json({ error: "Paramètres 'url' et 'format' manquants." });
    }

    try {
        // 3. Vérifier que l'URL est valide pour l'extraction
        if (!ytdl.validateURL(url)) {
            return res.status(400).json({ error: "L'URL fournie n'est pas valide ou non supportée." });
        }

        // 4. Récupérer les informations du média (titre, etc.)
        const info = await ytdl.getInfo(url);
        const title = info.videoDetails.title.replace(/[^\w\s]/gi, '').jpeg || 'media';
        
        // 5. Configurer les options de téléchargement selon le format choisi
        let options = {};
        if (format === 'mp3' || format === 'wav') {
            options = { filter: 'audioonly', quality: 'highestaudio' };
            res.setHeader('Content-Type', 'audio/mpeg');
            res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(title)}.${format}"`);
        } else {
            options = { filter: 'audioandvideo', quality: 'highestvideo' };
            res.setHeader('Content-Type', 'video/mp4');
            res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(title)}.${format}"`);
        }

        // 6. Envoyer le flux de données en temps réel vers le navigateur de l'utilisateur
        ytdl(url, options).pipe(res);

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Une erreur est survenue lors de la conversion." });
    }
};
