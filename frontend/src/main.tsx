import { createRoot } from "react-dom/client";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import "./i18n";
import App from "./App.tsx";
import "./index.css";

const convexUrl = import.meta.env.CONVEX_URL as string;

const convex = new ConvexReactClient(convexUrl);

createRoot(document.getElementById("root")!).render(
  <ConvexProvider client={convex}>
    <App />
  </ConvexProvider>
);
