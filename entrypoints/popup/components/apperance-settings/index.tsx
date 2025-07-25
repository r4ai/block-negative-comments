import { SelectColorSchema } from "./select-color-schema"

export const AppearanceSettings = () => {
  return (
    <div className="flex flex-col pb-2 gap-4">
      <SelectColorSchema />
    </div>
  )
}
