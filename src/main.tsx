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

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
