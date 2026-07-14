# Vérification manuelle — Lots 1 à 4

## Lot 4 — validation bêta Windows

1. Installer les paquets NSIS et MSI sur Windows 11 x64, lancer depuis le menu Démarrer, fermer et relancer.
2. Vérifier l’onboarding au premier lancement, Ignorer, puis le relancer depuis Aide et Paramètres.
3. Tester le clavier et le focus sur onboarding, Brand Kit, éditeur, lots, projets, historique et restauration.
4. Vérifier la checklist avec zéro puis un projet/export/lot réel.
5. Tester les fenêtres 1280 × 720, 1366 × 768, 1440 × 900 et 1920 × 1080 sans débordement bloquant.
6. Modifier les paramètres PNG/JPG, qualité et concurrence, relancer puis confirmer leur persistance.
7. Couper Internet : ouvrir l’aide, un projet, éditer et exporter.
8. Utiliser Signaler un problème et confirmer qu’aucune donnée locale n’est préremplie.
9. Importer images/logo/JSON/ZIP invalides et vérifier les erreurs récupérables.
10. Installer la version par-dessus la précédente et confirmer Brand Kits, projets et historique.
11. Sauvegarder avant désinstallation ; documenter séparément Windows 10, Windows 11 et SmartScreen.

## Lot 3 — persistance et historique

1. Créer deux Brand Kits, fermer puis rouvrir l’application et confirmer leur présence.
2. Importer une image, ajuster le cadrage, enregistrer un projet puis le rouvrir.
3. Mettre à jour, dupliquer et supprimer un projet après confirmation.
4. Exporter un PNG et un JPG puis vérifier Exports et Historique.
5. Exécuter puis annuler un traitement par lot et vérifier les deux états.
6. Télécharger une sauvegarde complète depuis Stockage.
7. Restaurer en fusion puis en remplacement après les confirmations.
8. Importer un ZIP invalide et confirmer qu’aucune donnée n’est supprimée.
9. Couper le réseau, redémarrer, ouvrir un projet et exporter un visuel.
10. Vérifier l’estimation d’espace et nettoyer une ressource orpheline.
11. Naviguer au clavier dans les listes, filtres, actions et confirmations.

Le rendu Canvas individuel et par lot utilise le même moteur. Les calculs sont testés automatiquement ; la fidélité visuelle finale reste à vérifier dans WebView2.

## 1. Brand Kits

1. Créer une marque avec un contact ivoirien, un logo et trois couleurs, puis sauvegarder.
2. Recharger l’application et vérifier la persistance du Brand Kit.
3. Exporter son JSON puis le réimporter : une copie doit être créée sans écrasement.
4. Importer un JSON invalide et vérifier qu’une erreur récupérable s’affiche.
5. Annuler puis confirmer la suppression d’un Brand Kit.
6. Corrompre `sbs-brand-kits` dans `localStorage`, recharger et vérifier la réparation avec avertissement.

## 2. Parcours individuel

1. Importer une image PNG/JPG/WEBP/AVIF inférieure à 25 Mo.
2. Vérifier le refus d’un GIF, d’un fichier supérieur à 25 Mo et d’une image corrompue.
3. Changer de format social et vérifier que le cadre adopte le bon ratio.
4. Déplacer et zoomer l’image, puis régler logo, textes et bandeau.
5. Exporter en PNG puis en JPG à 90 %.
6. Comparer cadrage, bandeau, logo, textes et couleurs entre aperçu et exports.
7. Double-cliquer rapidement sur Exporter et vérifier qu’un seul téléchargement est produit.

## 3. Sélection d’un lot

1. Ajouter une image, puis plusieurs images en plusieurs sélections.
2. Ajouter deux fichiers ayant le même nom, la même taille et la même date : le second doit être marqué comme doublon.
3. Ajouter un GIF, une image corrompue et un fichier supérieur à 25 Mo : chacun doit être rejeté avec une raison précise.
4. Ajouter plus de 50 images et vérifier le rejet des fichiers excédentaires.
5. Dépasser 200 Mo et vérifier que le fichier provoquant le dépassement est identifié.
6. Retirer un fichier individuellement puis utiliser **Tout retirer**.

## 4. Traitement par lot

1. Choisir un Brand Kit, un format social et PNG ou JPG.
2. Traiter un mélange de fichiers valides et invalides : une erreur ne doit pas arrêter le lot.
3. Vérifier que deux fichiers au maximum affichent le statut **Traitement**.
4. Vérifier la progression réelle, les compteurs et les statuts textuels.
5. Annuler pendant le traitement : aucun nouveau rendu ne doit commencer, les réussites restent disponibles et les autres fichiers deviennent **Annulé**.
6. Vérifier que les paramètres sont verrouillés pendant le traitement et qu’un second lancement est impossible.

## 5. Archive ZIP

1. Télécharger le ZIP après plusieurs réussites.
2. Vérifier qu’il contient uniquement les visuels réussis et `rapport-traitement.json`.
3. Vérifier que deux sources de même nom reçoivent des suffixes numériques uniques.
4. Vérifier le rapport : marque, format, dimensions, type, qualité, réussites, rejets, erreurs et annulations.
5. Vérifier qu’aucun ZIP vide n’est produit lorsque toutes les images échouent.

## 6. Accessibilité

1. Parcourir la navigation, les Brand Kits, les zones de dépôt et les actions au clavier.
2. Vérifier que le focus reste visible.
3. Vérifier que les notifications, progressions et statuts sont annoncés textuellement.

Les tests de la file utilisent un moteur de rendu simulé pour vérifier la concurrence, la poursuite après erreur et l’annulation sans dépendre d’un Canvas réel.
