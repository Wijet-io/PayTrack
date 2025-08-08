import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App-basic";

// Ensure DOM is ready before mounting React
const mountApp = () => {
  const rootElement = document.getElementById("root");
  if (rootElement) {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  } else {
    console.error("Root element not found!");
  }
};

// Check if DOM is already loaded, otherwise wait for it
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountApp);
} else {
  mountApp();
}
