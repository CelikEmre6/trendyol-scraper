import { useSettings } from '@renderer/hooks/useSettings'
import { Checkbox, Slider } from 'antd'

export const Settings = () => {
  const { settings, handleUpdateSettings } = useSettings()

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
            disabled={settings?.licanceType === 'trial'}
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
            checked={settings?.combineIsim ?? false}
            onChange={(e) =>
              handleUpdateSettings({
                ...settings!,
                combineIsim: e.target.checked
              })
            }
          >
            Ürün İsmi + Özellikler Birleştirilsin mi ? 
          </Checkbox>
        </div>
      </div>
    </div>
  )
}
