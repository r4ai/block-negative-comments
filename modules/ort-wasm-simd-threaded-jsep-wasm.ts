import { resolve } from "node:path"
import { defineWxtModule } from "wxt/modules"

export default defineWxtModule((wxt) => {
  wxt.hook("build:publicAssets", (_, assets) => {
    assets.push({
      absoluteSrc: resolve(
        "node_modules/@huggingface/transformers/dist/ort-wasm-simd-threaded.jsep.wasm",
      ),
      relativeDest: "ort-wasm-simd-threaded.jsep.wasm",
    })
  })
})
