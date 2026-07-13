# Lot 2 — vérification manuelle

## Capacités et validation

1. Ajouter une image valide, puis plusieurs images valides.
2. Ajouter deux fichiers ayant le même nom, la même taille et la même date : le second doit être marqué comme doublon.
3. Ajouter un fichier GIF, une image corrompue et un fichier supérieur à 25 Mo : chacun doit être rejeté avec une raison précise.
4. Ajouter plus de 50 images et vérifier que les fichiers excédentaires sont rejetés.
5. Dépasser 200 Mo au total et vérifier que le fichier provoquant le dépassement est identifié.
6. Ajouter des fichiers en plusieurs sélections, retirer un fichier puis utiliser **Tout retirer**.

## Traitement

1. Choisir un Brand Kit et un format social.
2. Traiter une image en PNG puis en JPG à 90 %.
3. Traiter un mélange de fichiers valides et invalides : les fichiers valides doivent continuer après une erreur.
4. Lancer plusieurs images et vérifier que deux fichiers au maximum affichent le statut **Traitement**.
5. Annuler pendant le traitement : aucun nouveau rendu ne doit commencer, les réussites doivent rester disponibles et les autres fichiers doivent devenir **Annulé**.
6. Vérifier que les paramètres sont désactivés pendant le traitement et qu’un second lancement est impossible.

## Archive ZIP

1. Télécharger le ZIP après plusieurs réussites.
2. Vérifier qu’il contient uniquement les visuels réussis et `rapport-traitement.json`.
3. Vérifier que deux sources portant le même nom produisent des noms uniques avec suffixe numérique.
4. Vérifier le rapport : marque, format social, dimensions, PNG/JPG, qualité, réussites, rejets, erreurs et annulations.
5. Vérifier qu’aucun ZIP vide ne peut être généré lorsque toutes les images échouent.

Les tests unitaires utilisent un moteur de rendu simulé pour vérifier la concurrence, la poursuite après erreur et l’annulation sans dépendre d’un Canvas réel.
