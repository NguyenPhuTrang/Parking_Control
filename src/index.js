import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import App from "./App";
import "./index.css";

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>

    <Toaster
      position="top-right"
      toastOptions={{
        duration: 2500,
        className: "toast-slide-left",
        style: {
          borderRadius: "12px",
          fontWeight: "600",
        },
      }}
    />
  </React.StrictMode>
);
