# Sécurité et permissions Tauri

- `core:default` : fonctionnement minimal de la fenêtre principale.
- `opener:allow-open-url` : limité à `github.com/codescooper/socialbrand-studio/issues/new*` pour le signalement volontaire d’un bug.
- aucun accès global au système de fichiers, shell, presse-papiers, caméra, microphone ou réseau natif ;
- aucune commande Rust personnalisée exposée ;
- CSP active : scripts locaux, images locales/blob/data, aucune frame ni objet ;
- imports vérifiés côté frontend avant décodage ; sauvegardes considérées non fiables et validées avant transaction.

Le journal de diagnostic frontend conserve au maximum 100 codes d’événements et compteurs non personnels. Il n’enregistre ni contenu, ni téléphone, ni chemin, ni nom de fichier. Le plugin Rust écrit uniquement en développement.
