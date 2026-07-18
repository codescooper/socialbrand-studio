import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { AppAccessGate } from "./features/cloud/AppAccessGate";
import { AuthProvider } from "./features/cloud/AuthProvider";
import { registerPwa } from "./pwa";
import "./styles.css";

registerPwa();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <AppAccessGate>
          <App />
        </AppAccessGate>
      </AuthProvider>
    </ErrorBoundary>
  </StrictMode>,
);
