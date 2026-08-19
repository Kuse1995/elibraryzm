import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./games/games.css";

createRoot(document.getElementById("root")!).render(<App />);

// PWA: installable + offline app shell. Production only (dev on localhost
// would fight the service worker cache). Registration failing must never
// take the site down with it.
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      /* PWA is an enhancement - ignore registration errors */
    });
  });
}
