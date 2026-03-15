import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { onOpenUrl } from "@tauri-apps/plugin-deep-link";

onOpenUrl((urls) => {
  console.log("Received deep link:", urls);
  // Handle the URL, e.g., extract the hash fragment
  if (urls.length > 0) {
    const url = urls[0];
    // If the URL contains the auth code/hash, we might need to handle it
    // Supabase usually handles the redirect automatically if the session is stored,
    // but since we use a custom protocol, we might need to manually trigger the flow.
    
    // For now, we just log it. If the app doesn't log in automatically,
    // we might need to manually check window.location.hash in App.tsx
    if (url.includes("access_token") || url.includes("code")) {
        console.log("Auth data found in deep link");
    }
  }
});

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
