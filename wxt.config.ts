import { defineConfig } from "wxt"

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  manifest: {
    permissions: [
      "activeTab",
      "scripting",
      "contextMenus",
      "storage",
      "unlimitedStorage",
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
