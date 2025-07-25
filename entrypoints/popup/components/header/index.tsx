import { EnabledSwitch } from "./enabled-switch"

export const Header = () => {
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
