import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "./global.css"
import { App } from "./app.tsx"

// biome-ignore lint/style/noNonNullAssertion: #root is guaranteed to exist by the HTML template
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
