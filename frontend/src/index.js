import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App-demo";

console.log("Starting React app...");

// Ensure DOM is ready before mounting React
const mountApp = () => {
  console.log("Attempting to mount React app...");
  const rootElement = document.getElementById("root");
  console.log("Root element:", rootElement);
  
  if (rootElement) {
    console.log("Root element found, creating React root...");
    const root = ReactDOM.createRoot(rootElement);
    console.log("React root created, rendering app...");
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    console.log("React app rendered!");
  } else {
    console.error("Root element not found!");
  }
};

// Check if DOM is already loaded, otherwise wait for it
console.log("Document ready state:", document.readyState);
if (document.readyState === 'loading') {
  console.log("DOM still loading, adding event listener...");
  document.addEventListener('DOMContentLoaded', mountApp);
} else {
  console.log("DOM already loaded, mounting immediately...");
  mountApp();
}
