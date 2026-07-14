export function registerPwa() {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator) || import.meta.env.DEV) return;

  window.addEventListener("load", () => {
    void navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`, { scope: import.meta.env.BASE_URL }).then((registration) => {
      registration.update().catch(() => undefined);
    });
  });
}
