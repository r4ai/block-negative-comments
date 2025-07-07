import React from "react"
import ReactDOM from "react-dom/client"
import { App } from "./app.tsx"
import "./style.css"

// biome-ignore lint/style/noNonNullAssertion: #root is guaranteed to exist by the HTML file
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
