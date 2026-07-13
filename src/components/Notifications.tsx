import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import type { AppNotification } from "../types/notification";

export function Notifications({ notification, onDismiss }: { notification: AppNotification | null; onDismiss: () => void }) {
  if (!notification) return null;
  const Icon = notification.level === "success" ? CheckCircle2 : notification.level === "warning" ? AlertTriangle : XCircle;
  return <div className={`toast toast-${notification.level}`} role={notification.level === "error" ? "alert" : "status"} aria-live={notification.level === "error" ? "assertive" : "polite"}><Icon size={18}/><span>{notification.message}</span>{notification.persistent && <button aria-label="Fermer la notification" onClick={onDismiss}>×</button>}</div>;
}
