# Confidentialité

SocialBrand Studio 0.4.0 traite les créations localement. Aucun compte utilisateur n’est requis pour les fonctions locales. IndexedDB conserve les données structurées et les ressources nécessaires aux projets dans le profil du navigateur.

Lorsque l’utilisateur active volontairement le cloud, Supabase Auth traite son adresse e-mail et sa session, et PostgreSQL conserve les espaces business, adhésions et liens de Brand Kits. Les images et projets locaux ne sont pas envoyés automatiquement. Les politiques RLS isolent chaque espace business.

L’utilisateur peut enregistrer localement le nom public, l’identifiant, l’URL et des notes concernant ses profils Facebook, Instagram, TikTok et LinkedIn. Cette version n’effectue aucune connexion à ces plateformes et ne récupère aucune statistique automatiquement. Aucun mot de passe, jeton d’accès, secret d’application, cookie de session ou clé API ne doit être fourni. Les futurs credentials sociaux seront chiffrés côté serveur et ne seront jamais inclus dans IndexedDB, les sauvegardes locales ou le bundle frontend.

L’utilisateur peut télécharger une sauvegarde, nettoyer les ressources orphelines et supprimer projets/historique depuis l’interface. Le navigateur peut supprimer les données si l’utilisateur efface le stockage du site, change de profil ou utilise une navigation privée. Une sauvegarde régulière reste recommandée.

L’action **Signaler un problème** ouvre GitHub et informe l’utilisateur qu’il quitte l’application. Elle n’attache automatiquement ni image, ni sauvegarde, ni chemin local, ni donnée personnelle.
