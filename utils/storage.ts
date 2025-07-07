import { storage } from "#imports"

export const enabled = storage.defineItem<boolean>("local:enabled", {
  fallback: true,
})
