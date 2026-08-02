import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./games/games.css";

createRoot(document.getElementById("root")!).render(<App />);
