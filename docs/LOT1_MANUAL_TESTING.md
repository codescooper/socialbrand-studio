# Lot 1 — vérification manuelle

Le rendu Canvas partage ses coordonnées normalisées avec l’aperçu. Les calculs de cadrage sont testés automatiquement ; la fidélité visuelle finale reste à vérifier manuellement dans WebView2.

## Parcours principal

1. Ouvrir **Brand Kit**, créer une marque et renseigner un contact ivoirien.
2. Importer un logo valide, modifier les trois couleurs puis sauvegarder.
3. Recharger l’application et vérifier que le Brand Kit est toujours présent.
4. Exporter son JSON, le réimporter et vérifier qu’une copie est créée sans écrasement.
5. Essayer un JSON arbitraire et vérifier qu’une erreur récupérable s’affiche.
6. Ouvrir **Produits** et importer une image PNG/JPG/WEBP/AVIF inférieure à 25 Mo.
7. Vérifier le refus d’un GIF, d’un fichier supérieur à 25 Mo et d’une image corrompue.
8. Sélectionner plusieurs formats sociaux et vérifier que le cadre change de ratio.
9. Déplacer et zoomer l’image, puis régler les éléments de marque.
10. Exporter en PNG puis en JPG à 90 %.
11. Comparer cadrage, bandeau, logo, textes et couleurs entre aperçu et fichiers exportés.
12. Double-cliquer rapidement sur Exporter et vérifier qu’un seul téléchargement est produit.
13. Tenter de supprimer un Brand Kit, annuler, puis confirmer la suppression.
14. Vérifier au clavier l’import, la sélection d’un Brand Kit et les boutons de l’éditeur.

## Données corrompues

Dans les outils de développement, remplacer `sbs-brand-kits` dans `localStorage` par un JSON invalide puis recharger. L’application doit restaurer un Brand Kit par défaut et afficher un avertissement persistant.
