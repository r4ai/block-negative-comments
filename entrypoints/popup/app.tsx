import { Accordion, AccordionItem } from "@heroui/accordion"
import { Select, SelectItem } from "@heroui/select"
import { Slider } from "@heroui/slider"
import { Switch } from "@heroui/switch"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useTheme } from "next-themes"
import * as storage from "@/utils/storage"

const EnabledSwitch = () => {
  const queryClient = useQueryClient()
  const enabled = useQuery({
    queryKey: [storage.enabled.key],
    queryFn: storage.enabled.getValue,
    refetchOnMount: true,
  })
  const enabledMutation = useMutation({
    mutationFn: (enabled: boolean) => storage.enabled.setValue(enabled),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [storage.enabled.key] })
    },
  })

  return (
    <Switch
      size="md"
      disabled={enabled.isLoading}
      isSelected={enabled.data}
      onValueChange={(enabled) => {
        enabledMutation.mutate(enabled)
      }}
    >
      <span className="text-sm text-foreground-700">Enable Blocking</span>
    </Switch>
  )
}

const Header = () => {
  return (
    <div className="flex flex-col items-center px-4">
      <h1 className="text-lg font-semibold">Block Negative Comments</h1>
      <p className="text-sm text-foreground-500 text-center">
        A browser extension to block negative comments on YouTube Live Chat.
      </p>
      <div className="flex items-center mt-4">
        <EnabledSwitch />
      </div>
    </div>
  )
}

const SelectColorSchema = () => {
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

const ModelSelect = () => {
  const [model, setModel] = useState("phi-3.5-mini-instruct")

  return (
    <Select
      label="Model"
      labelPlacement="outside"
      selectedKeys={[model]}
      selectionMode="single"
      onChange={(e) => {
        setModel(e.target.value)
      }}
    >
      <SelectItem key="phi-3.5-mini-instruct">Phi 3.5 Mini Instruct</SelectItem>
    </Select>
  )
}

const ConfidenceThresholdSlider = () => {
  const queryClient = useQueryClient()
  const threshold = useQuery({
    queryKey: [storage.confidenceThreshold.key],
    queryFn: storage.confidenceThreshold.getValue,
    refetchOnMount: true,
  })
  const thresholdMutation = useMutation({
    mutationFn: (value: number) => storage.confidenceThreshold.setValue(value),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [storage.confidenceThreshold.key],
      })
    },
  })

  return (
    <Slider
      label="Confidence Threshold"
      value={threshold.data}
      minValue={0}
      maxValue={1}
      step={0.01}
      onChange={(value) =>
        thresholdMutation.mutate(Array.isArray(value) ? value[0] : value)
      }
    />
  )
}

const AppearanceSettings = () => {
  return (
    <div className="flex flex-col pb-2 gap-4">
      <SelectColorSchema />
    </div>
  )
}

const BlockSettings = () => {
  return (
    <div className="flex flex-col pb-2 gap-4">
      <ModelSelect />
      <ConfidenceThresholdSlider />
    </div>
  )
}

export const App = () => {
  return (
    <div className="w-80 py-4 flex flex-col gap-6">
      <Header />
      <Accordion variant="splitted" selectionMode="multiple">
        <AccordionItem key="appearance" title="Appearance">
          <AppearanceSettings />
        </AccordionItem>
        <AccordionItem key="block-settings" title="Block Settings">
          <BlockSettings />
        </AccordionItem>
      </Accordion>
    </div>
  )
}
