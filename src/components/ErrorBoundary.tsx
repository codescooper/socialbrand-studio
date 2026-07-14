import { Component, type ErrorInfo, type ReactNode } from "react";
export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Erreur d’affichage récupérable", { name: error.name, component: info.componentStack?.split("\n")[1]?.trim() });
  }
  render() {
    if (this.state.failed)
      return (
        <main className="fatal-error" role="alert">
          <h1>Impossible d’afficher cet écran</h1>
          <p>Vos données locales sont conservées. Rechargez l’application pour revenir à la vue d’ensemble.</p>
          <button className="primary" onClick={() => window.location.reload()}>
            Recharger l’application
          </button>
        </main>
      );
    return this.props.children;
  }
}
