import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
// fonts ship with the site, no Google Fonts dependency
import "@fontsource/onest/400.css";
import "@fontsource/onest/500.css";
import "@fontsource/onest/600.css";
import "@fontsource/onest/700.css";
import "@fontsource/rubik-glitch/400.css";
import "@fontsource/press-start-2p/400.css";
import "./index.css";

// Load every script of the fonts up front. Otherwise the Cyrillic files arrive only when someone
// switches to Russian, and for a moment the text shows in a fallback font with different widths.
if (document.fonts?.load) {
  const sample = "Aa Жж Oʻʼ 0";
  for (const w of [400, 500, 600, 700]) document.fonts.load(`${w} 16px Onest`, sample).catch(() => {});
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
