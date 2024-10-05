import { useSettings } from '@renderer/hooks/useSettings'
import { Button, Checkbox, Input, Slider } from 'antd'
import { useState } from 'react'

export const Settings = () => {
  const { settings, handleUpdateSettings } = useSettings()
  const [showTelegramFields, setShowTelegramFields] = useState(false)
  const [telegramApiKey, setTelegramApiKey] = useState(settings?.telegramApiKey || '')
  const [telegramChatId, setTelegramChatId] = useState(settings?.telegramChatId || '')

  const handleSaveTelegramSettings = () => {
    handleUpdateSettings({
      ...settings!,
      telegramApiKey,
      telegramChatId
    })
  }

  return (
    <div className="flex flex-col space-y-3">
      <h1 className="text-lg font-bold">Ayarlar</h1>
      <div className="flex flex-col space-y-3">
        {/* Existing fields */}
        <div className="flex flex-col space-y-1">
          <label htmlFor="editor-font-size">Mac Adresi</label>
          <p>{settings?.macAddress}</p>
        </div>
        <div className="flex flex-col space-y-1">
          <label htmlFor="editor-font-size">Lisans Anahtarı</label>
          <p>{settings?.licanceKey}</p>
        </div>
        <div className="flex flex-col space-y-2 min-w-[600px]">
          <label htmlFor="scraper-timeout">Sayfa Sayısı</label>
          <Slider
            id="scraper-timeout"
            min={10}
            max={250}
            step={5}
            defaultValue={settings?.pageCount}
            onChange={(value) =>
              handleUpdateSettings({
                ...settings!,
                pageCount: value
              })
            }
            tipFormatter={(value) => <span style={{ color: 'black' }}>{value}</span>}
          />
        </div>
        <div className="flex flex-col space-y-2 min-w-[600px]">
          <label htmlFor="scraper-timeout">Ürün Adedi</label>
          <Slider
            id="scraper-timeout"
            min={100}
            max={5000}
            step={100}
            defaultValue={settings?.productNumber}
            onChange={(value) =>
              handleUpdateSettings({
                ...settings!,
                productNumber: value
              })
            }
            tipFormatter={(value) => <span style={{ color: 'black' }}>{value}</span>}
          />
        </div>
        <div className="flex flex-col space-y-2 min-w-[600px]">
          <Checkbox
            checked={settings?.variant}
            onChange={(e) =>
              handleUpdateSettings({
                ...settings!,
                variant: e.target.checked
              })
            }
          >
            Varyantlar Kontrol Edilsin mi
          </Checkbox>
        </div>

        {/* Toggle button for Telegram fields */}
        <Button onClick={() => setShowTelegramFields(!showTelegramFields)}>
          {showTelegramFields ? 'Telegram Ayarlarını Gizle' : 'Telegram Ayarları Ekle'}
        </Button>

        {/* Telegram API Key and Chat ID fields */}
        {showTelegramFields && (
          <div className="flex flex-col space-y-3">
            <div className="flex flex-col space-y-1">
              <label htmlFor="telegram-api-key">Telegram API Anahtarı</label>
              <Input
                id="telegram-api-key"
                value={telegramApiKey}
                onChange={(e) => setTelegramApiKey(e.target.value)}
              />
            </div>
            <div className="flex flex-col space-y-1">
              <label htmlFor="telegram-chat-id">Telegram Chat ID</label>
              <Input
                id="telegram-chat-id"
                value={telegramChatId}
                onChange={(e) => setTelegramChatId(e.target.value)}
              />
            </div>
            <Button type="primary" onClick={handleSaveTelegramSettings}>
              Telegram Ayarlarını Kaydet
            </Button>
          </div>
        )}

        {/* Display saved Telegram settings if they exist */}
        {settings?.telegramApiKey && settings?.telegramChatId && (
          <div className="flex flex-col space-y-1">
            <p>
              <strong>Telegram API Anahtarı:</strong> {settings.telegramApiKey}
            </p>
            <p>
              <strong>Telegram Chat ID:</strong> {settings.telegramChatId}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
