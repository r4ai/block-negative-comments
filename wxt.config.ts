import tailwindcss from "@tailwindcss/vite"
import { defineConfig, type WxtViteConfig } from "wxt"

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  vite: () =>
    // See https://github.com/wxt-dev/wxt/issues/1460#issuecomment-2841437586
    ({
      plugins: [tailwindcss()],
    }) as WxtViteConfig,
  manifest: {
    permissions: [
      "activeTab",
      "scripting",
      "contextMenus",
      "storage",
      "unlimitedStorage",
      "downloads",
    ],
    host_permissions: ["https://*.youtube.com/*"],
    content_security_policy: {
      extension_pages: "script-src 'self' 'wasm-unsafe-eval'",
    },
    web_accessible_resources: [
      {
        matches: ["<all_urls>"],
        resources: ["**/*.wasm"],
      },
    ],
  },
})
