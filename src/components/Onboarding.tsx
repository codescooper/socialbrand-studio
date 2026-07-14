import { useEffect, useRef, useState } from "react";
import { Box, Download, Image, Palette, X } from "lucide-react";
const STEPS = [
  { icon: Palette, title: "Créez votre Brand Kit", text: "Ajoutez votre logo, vos couleurs et vos contacts une seule fois." },
  { icon: Image, title: "Importez une photo produit", text: "PNG, JPG, WEBP ou AVIF, jusqu’à 25 Mo par image." },
  { icon: Box, title: "Ajustez le visuel", text: "Choisissez le réseau social, le format, le zoom et la position." },
  { icon: Download, title: "Exportez", text: "Téléchargez un PNG/JPG ou traitez plusieurs images dans un ZIP." },
];
export function Onboarding({ onClose }: { onClose: (completed: boolean) => void }) {
  const [step, setStep] = useState(0);
  const closeRef = useRef<HTMLButtonElement>(null);
  const current = STEPS[step];
  const Icon = current.icon;
  useEffect(() => {
    closeRef.current?.focus();
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);
  return (
    <div className="modal-backdrop" role="presentation">
      <section className="onboarding-dialog" role="dialog" aria-modal="true" aria-labelledby="onboarding-title">
        <button ref={closeRef} className="dialog-close" aria-label="Ignorer l’onboarding" onClick={() => onClose(false)}>
          <X />
        </button>
        <span className="step-count">
          Étape {step + 1} sur {STEPS.length}
        </span>
        <div className="onboarding-icon">
          <Icon />
        </div>
        <h1 id="onboarding-title">{current.title}</h1>
        <p>{current.text}</p>
        <div className="step-dots" aria-label={`Étape ${step + 1} sur ${STEPS.length}`}>
          {STEPS.map((item, index) => (
            <i className={index === step ? "active" : ""} key={item.title} />
          ))}
        </div>
        <div className="dialog-actions">
          {step > 0 && (
            <button className="outline" onClick={() => setStep((value) => value - 1)}>
              Précédent
            </button>
          )}
          <button className="primary" onClick={() => (step === STEPS.length - 1 ? onClose(true) : setStep((value) => value + 1))}>
            {step === STEPS.length - 1 ? "Commencer" : "Suivant"}
          </button>
        </div>
      </section>
    </div>
  );
}
