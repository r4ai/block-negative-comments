import { Accordion, AccordionItem } from "@heroui/accordion"
import { Select, SelectItem } from "@heroui/select"
import { Slider } from "@heroui/slider"
import { Switch } from "@heroui/switch"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useTheme } from "next-themes"
import { MODELS, type Model } from "@/utils/messaging"
import { generalSettings, modelSettings } from "@/utils/storage"

const EnabledSwitch = () => {
  const queryClient = useQueryClient()
  const enabled = useQuery({
    queryKey: [generalSettings.enabled.key],
    queryFn: generalSettings.enabled.getValue,
    refetchOnMount: true,
  })
  const enabledMutation = useMutation({
    mutationFn: (enabled: boolean) => generalSettings.enabled.setValue(enabled),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [generalSettings.enabled.key] })
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

const useModel = () => {
  const queryClient = useQueryClient()
  const modelQueryKey = [generalSettings.selectedModel.key]
  const query = useQuery({
    queryKey: modelQueryKey,
    queryFn: generalSettings.selectedModel.getValue,
    refetchOnMount: true,
  })
  const mutation = useMutation({
    mutationFn: async (modelName: Model["name"]) => {
      const model = Object.values(MODELS).find((m) => m.name === modelName)
      if (!model) {
        throw new Error(`Model ${modelName} not found`)
      }
      await generalSettings.selectedModel.setValue(model)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: modelQueryKey,
      })
    },
  })

  return { query, mutation }
}

const ModelSelect = ({
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

const ConfidenceThresholdSlider = () => {
  const queryClient = useQueryClient()
  const thresholdQueryKey = [
    modelSettings["onnx-community/Phi-3.5-mini-instruct-onnx-web"].key,
    "confidenceThreshold",
  ]
  const threshold = useQuery({
    queryKey: thresholdQueryKey,
    queryFn: () =>
      modelSettings["onnx-community/Phi-3.5-mini-instruct-onnx-web"]
        .getValue()
        .then((data) => data.confidenceThreshold),
    refetchOnMount: true,
  })
  const thresholdMutation = useMutation({
    mutationFn: async (value: number) => {
      const currentSettings =
        await modelSettings[
          "onnx-community/Phi-3.5-mini-instruct-onnx-web"
        ].getValue()
      return modelSettings[
        "onnx-community/Phi-3.5-mini-instruct-onnx-web"
      ].setValue({
        ...currentSettings,
        confidenceThreshold: value,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: thresholdQueryKey,
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

const ModelSettings = () => {
  const model = useModel()

  return (
    <div className="flex flex-col pb-2 gap-4">
      <ModelSelect
        modelName={model.query.data?.name}
        onChange={(value) => model.mutation.mutate(value)}
      />
      {model.query.data?.name ===
        "onnx-community/Phi-3.5-mini-instruct-onnx-web" && (
        <ConfidenceThresholdSlider />
      )}
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
          <ModelSettings />
        </AccordionItem>
      </Accordion>
    </div>
  )
}
