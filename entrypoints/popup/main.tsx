import { ThemeProvider } from "next-themes"
import React from "react"
import ReactDOM from "react-dom/client"
import { App } from "./app.tsx"
import "./style.css"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

const queryClient = new QueryClient()

// biome-ignore lint/style/noNonNullAssertion: #root is guaranteed to exist by the HTML file
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class">
        <App />
      </ThemeProvider>
    </QueryClientProvider>
  </React.StrictMode>,
)
