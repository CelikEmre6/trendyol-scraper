import { settingsAtom } from '@/store'
import { Settings } from '@shared/models'
import { message } from 'antd'
import { useAtom } from 'jotai'

export const useSettings = () => {
  const [settings, setSettings] = useAtom(settingsAtom)

  const handleUpdateSettings = async (newSettings: Settings) => {
    // save on disk
    message.loading({
      content: 'Ayarlar kaydediliyor',
      key: 'UpdateSettings'
    })
    try {
      await window.context.setSettingsJson(newSettings)
      setSettings(newSettings)
      message.success({
        content: 'Ayarlar kaydedildi',
        key: 'UpdateSettings'
      })
    } catch (err) {
      console.error(err)
      message.error({
        content: 'Ayarlar kaydedilemedi. API Anahtarını Kontrol Ediniz',
        key: 'UpdateSettings'
      })
    }

    // update atom state
  }

  return {
    settings,
    handleUpdateSettings
  }
}
