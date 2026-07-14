import { Download, WifiOff, X } from "lucide-react";
import { useEffect, useState } from "react";

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PwaStatus() {
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [online, setOnline] = useState(() => typeof navigator === "undefined" || navigator.onLine);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const onInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };
    const onInstalled = () => setInstallPrompt(null);
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener("beforeinstallprompt", onInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("beforeinstallprompt", onInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  if (online && (!installPrompt || dismissed)) return null;

  const install = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === "accepted") setInstallPrompt(null);
  };

  return (
    <aside className={`pwa-status ${online ? "installable" : "offline"}`} aria-live="polite">
      {online ? <Download size={19} /> : <WifiOff size={19} />}
      <div>
        <strong>{online ? "Installer SocialBrand Studio" : "Mode hors connexion"}</strong>
        <span>{online ? "Ajoutez la PWA à votre appareil pour l’ouvrir comme une application." : "Vos outils et données locales restent disponibles."}</span>
      </div>
      {online && installPrompt && (
        <button className="pwa-install" onClick={() => void install()}>
          Installer
        </button>
      )}
      {online && (
        <button className="pwa-dismiss" aria-label="Masquer la proposition d’installation" onClick={() => setDismissed(true)}>
          <X size={16} />
        </button>
      )}
    </aside>
  );
}
