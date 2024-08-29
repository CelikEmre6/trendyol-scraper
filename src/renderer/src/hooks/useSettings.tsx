import { settingsAtom } from '@/store'
import { Settings } from '@shared/models'
import { useAtom } from 'jotai'

export const useSettings = () => {
  const [settings, setSettings] = useAtom(settingsAtom)

  const handleUpdateSettings = async (newSettings: Settings) => {
    // save on disk
    await window.context.setSettingsJson(newSettings)
    // update atom state
    setSettings(newSettings)
  }

  return {
    settings,
    handleUpdateSettings
  }
}
