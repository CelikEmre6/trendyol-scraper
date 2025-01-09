import { useSettings } from '@renderer/hooks/useSettings'
import { TelegramSettings } from '@shared/models'
import { Button, Checkbox, Input, Modal, Slider } from 'antd'
import { useState } from 'react'
export const Settings = () => {
  const { settings, handleUpdateSettings } = useSettings()
  const [telegramValues, setTelegramValues] = useState<Partial<TelegramSettings> | null>({
    apiKey: settings?.telegramSettings?.apiKey || '',
    chatId: settings?.telegramSettings?.chatId || '',
    stock: settings?.telegramSettings?.stock || false,
    price: settings?.telegramSettings?.price || false
  })

  const [telegramVisible, setTelegramVisible] = useState(false)
  const handleSaveTelegramSettings = async () => {
    handleUpdateSettings({
      ...settings!,
      telegramSettings: {
        apiKey: telegramValues?.apiKey || '',
        chatId: telegramValues?.chatId || '',
        stock: telegramValues?.stock || false,
        price: telegramValues?.price || false
      }
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
          <label htmlFor="scraper-timeout">Ürün Adedi : {settings?.productNumber}</label>
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
            // tipFormatter={(value) => <span style={{ color: 'black' }}>{value}</span>}
            tipFormatter={null}
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
            Varyantlar Kontrol Edilsin mi ?
          </Checkbox>
        </div>

        <div className="flex flex-col space-y-2 min-w-[600px]">
          <Checkbox
            checked={settings?.comment}
            onChange={(e) =>
              handleUpdateSettings({
                ...settings!,
                comment: e.target.checked
              })
            }
          >
            Yorumlar Çekilsin mi ?
          </Checkbox>
        </div>

        <div className="flex flex-col space-y-2 min-w-[600px]">
          <label htmlFor="scraper-timeout">Yorum Sayısı : {settings?.commentNumber}</label>
          <Slider
            id="scraper-timeout"
            min={50}
            max={1000}
            step={50}
            defaultValue={settings?.commentNumber}
            onChange={(value) =>
              handleUpdateSettings({
                ...settings!,
                commentNumber: value
              })
            }
            // tipFormatter={(value) => <span style={{ color: 'black' }}>{value}</span>}
            tipFormatter={null}
          />
        </div>
        <div className="flex flex-col space-y-1">
          <Button type="primary" onClick={() => setTelegramVisible(true)}>
            Telegram API Ayarları
          </Button>
          <Modal
            title="Telegram API Ayarları"
            open={telegramVisible}
            onOk={() => {
              handleSaveTelegramSettings()
              setTelegramVisible(false)
            }}
            onCancel={() => {
              setTelegramVisible(false)
            }}
          >
            <div className="flex flex-col space-y-3">
              <Input
                placeholder="Telegram API Key"
                value={telegramValues?.apiKey}
                onChange={(e) => {
                  setTelegramValues({ ...telegramValues, apiKey: e.target.value })
                }}
              />
              <Input
                placeholder="Telegram Chat ID"
                value={telegramValues?.chatId}
                onChange={(e) => {
                  setTelegramValues({ ...telegramValues, chatId: e.target.value })
                }}
              />
              <Checkbox
                checked={telegramValues?.stock}
                onChange={(e) => setTelegramValues({ ...telegramValues, stock: e.target.checked })}
              >
                Stock
              </Checkbox>
              <Checkbox
                checked={telegramValues?.price}
                onChange={(e) => setTelegramValues({ ...telegramValues, price: e.target.checked })}
              >
                Price
              </Checkbox>
            </div>
          </Modal>
        </div>
      </div>
    </div>
  )
}
