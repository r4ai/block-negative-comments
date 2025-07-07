import { storage } from "#imports"

export const enabled = storage.defineItem<boolean>("local:enabled", {
  fallback: true,
})

export const confidenceThreshold = storage.defineItem<number>(
  "local:confidenceThreshold",
  {
    fallback: 0.5,
  }
)