import { Select, SelectItem } from "@heroui/select"

export const ModelSelect = ({
  modelName,
  onChange,
}: {
  modelName?: Model["name"]
  onChange: (value: Model["name"]) => void
}) => {
  return (
    <Select
      label="Model"
      labelPlacement="outside"
      selectedKeys={modelName ? [modelName] : []}
      selectionMode="single"
      onChange={(e) => {
        if (Object.values(MODELS).some((m) => m.name === e.target.value)) {
          onChange(e.target.value as Model["name"])
        } else {
          console.warn(`Model ${e.target.value} not found`)
        }
      }}
    >
      {Object.values(MODELS).map((model) => (
        <SelectItem key={model.name}>{model.name}</SelectItem>
      ))}
    </Select>
  )
}
