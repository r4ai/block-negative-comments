import { Select, SelectItem } from "@heroui/select"
import { useTheme } from "next-themes"

export const SelectColorSchema = () => {
  const { theme, setTheme } = useTheme()

  return (
    <Select
      label="Color Scheme"
      labelPlacement="outside"
      selectedKeys={[theme ?? "light"]}
      onChange={(e) => {
        setTheme(e.target.value)
      }}
    >
      <SelectItem key="light">Light</SelectItem>
      <SelectItem key="dark">Dark</SelectItem>
      <SelectItem key="system">System Default</SelectItem>
    </Select>
  )
}
