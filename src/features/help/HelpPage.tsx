import { CircleHelp, ExternalLink, RotateCcw } from "lucide-react";
import { APP_VERSION } from "../../services/appSettings";
const guides = [
  ["Démarrage rapide", "Créez un Brand Kit, importez une image, choisissez un format puis exportez."],
  ["Brand Kit", "Renseignez logo, couleurs et contacts. Sauvegardez avant de quitter l’écran."],
  ["Ajuster une image", "Glissez l’image, zoomez et positionnez logo, nom et contacts dans l’éditeur."],
  ["PNG ou JPG", "PNG préserve la qualité. JPG produit un fichier plus léger avec une qualité réglable."],
  ["Traitement par lot", "Ajoutez jusqu’à 50 images et 200 Mo, lancez le traitement puis téléchargez le ZIP."],
  ["Reprendre un projet", "Enregistrez le visuel comme projet. L’image source et le cadrage restent locaux."],
  ["Sauvegarde", "Dans Paramètres, téléchargez une sauvegarde ZIP. Restaurez-la en fusion ou remplacement."],
  ["Stockage local", "Les données restent dans IndexedDB sur cet appareil. Nettoyez seulement les ressources orphelines."],
];
const faq = [
  ["Où sont stockées mes données ?", "Dans le stockage local de l’application sur cet appareil."],
  ["L’application fonctionne-t-elle sans Internet ?", "Oui, l’édition, les projets, l’aide et les exports sont locaux."],
  ["Pourquoi une image est-elle refusée ?", "Format non pris en charge, fichier illisible ou limite de 25 Mo dépassée."],
  ["Pourquoi un logo n’apparaît-il pas ?", "Vérifiez son format, sa taille et l’option Afficher le logo du Brand Kit."],
  ["Comment récupérer mes données ?", "Restaurez un ZIP créé avec Sauvegarder mes données."],
  ["Puis-je changer d’ordinateur ?", "Oui, exportez une sauvegarde puis restaurez-la sur l’autre ordinateur."],
  [
    "Que fait la désinstallation ?",
    "Elle retire l’application de l’appareil, mais le navigateur peut conserver les données du site. Téléchargez une sauvegarde avant tout nettoyage.",
  ],
  ["Quelles limites pour les lots ?", "50 images, 25 Mo chacune et 200 Mo au total."],
];
export function HelpPage({ onRestartOnboarding, onReportIssue }: { onRestartOnboarding: () => void; onReportIssue: () => void }) {
  return (
    <section className="help-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow dark-label">
            <CircleHelp size={14} /> AIDE LOCALE
          </span>
          <h1>Aide & ressources</h1>
          <p>Les réponses essentielles, disponibles même sans connexion.</p>
        </div>
        <button className="outline" onClick={onRestartOnboarding}>
          <RotateCcw size={16} />
          Relancer l’onboarding
        </button>
      </div>
      <h2>Guides</h2>
      <div className="help-grid">
        {guides.map(([title, text]) => (
          <article key={title}>
            <h3>{title}</h3>
            <p>{text}</p>
          </article>
        ))}
      </div>
      <h2>Questions fréquentes</h2>
      <div className="faq-list">
        {faq.map(([question, answer]) => (
          <details key={question}>
            <summary>{question}</summary>
            <p>{answer}</p>
          </details>
        ))}
      </div>
      <div className="support-card">
        <div>
          <b>Un problème avec la bêta ?</b>
          <span>Aucune image ni donnée locale ne sera jointe automatiquement.</span>
        </div>
        <button className="primary" onClick={onReportIssue}>
          <ExternalLink size={16} />
          Signaler un problème
        </button>
      </div>
      <small>SocialBrand Studio {APP_VERSION} — PWA</small>
    </section>
  );
}
