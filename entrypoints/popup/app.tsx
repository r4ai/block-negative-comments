import { Accordion, AccordionItem } from "@heroui/react"
import { AppearanceSettings } from "./components/apperance-settings"
import { Header } from "./components/header"
import { ModelSettings } from "./components/model-settings"

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
