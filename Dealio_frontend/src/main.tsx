import { createRoot } from "react-dom/client";
import { GoogleOAuthProvider } from "@react-oauth/google";
import App from "./App.tsx";
import "./index.css";
import "leaflet/dist/leaflet.css";

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

createRoot(document.getElementById("root")!).render(
  <GoogleOAuthProvider clientId={googleClientId ?? ""}>
    <App />
  </GoogleOAuthProvider>
);

