import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

import App from "./App";

console.log('Starting React app...');

const container = document.getElementById("root");
if (!container) {
  console.error('Root element not found!');
} else {
  console.log('Root element found, creating React root...');
  const root = createRoot(container);
  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  );
  console.log('React app rendered');
}