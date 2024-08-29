import { useSettings } from '@renderer/hooks/useSettings'
import { Checkbox, Slider } from 'antd'

export const Settings = () => {
  const { settings, handleUpdateSettings } = useSettings()
  return (
    <div className="flex flex-col space-y-3">
      <h1 className="text-lg font-bold">Ayarlar</h1>
      <div className="flex flex-col space-y-3">
        <div className="flex flex-col space-y-1">
          <label htmlFor="editor-font-size">Mac Adresi</label>
          <p>{settings?.macAddress}</p>
        </div>
        <div className="flex flex-col space-y-1">
          <label htmlFor="editor-font-size">Lisans Anahtarı</label>
          <p>{settings?.licanceKey}</p>
        </div>
        <div className="flex space-x-2">
          <label htmlFor="headless-search" className="cursor-not-allowed">
            Headless Search (only linux)
          </label>
          <Checkbox
            id="headless-search"
            checked={settings?.headless}
            disabled
            onChange={(e) =>
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              handleUpdateSettings({ ...settings, headless: e.target.checked } as any)
            }
          />
        </div>
        <div className="flex space-x-2">
          <label htmlFor="fingerprints" className="cursor-pointer">
            Hide Fingerprints
          </label>
          <Checkbox
            id="fingerprints"
            checked={settings?.fingerprints}
            onChange={(e) =>
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              handleUpdateSettings({ ...settings, fingerprints: e.target.checked } as any)
            }
          />
        </div>
        <div className="flex space-x-2">
          <label htmlFor="auto-resolver" className="cursor-pointer">
            Auto Resolve Captcha
          </label>
          <Checkbox
            id="auto-resolver"
            checked={settings?.autoResolver}
            onChange={(e) =>
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              handleUpdateSettings({ ...settings, autoResolver: e.target.checked } as any)
            }
          />
        </div>
        <div className="flex flex-col space-y-2 min-w-[600px]">
          <label htmlFor="captcha-timeout">Captcha Resolver Timeout</label>
          <Slider
            range
            id="captcha-timeout"
            min={200}
            max={5000}
            step={100}
            defaultValue={settings?.captchaTimeout}
          />
        </div>
        <div className="flex flex-col space-y-2 min-w-[600px]">
          <label htmlFor="scraper-timeout">Scraper Timeout</label>
          <Slider
            range
            id="scraper-timeout"
            min={200}
            max={5000}
            step={100}
            defaultValue={settings?.scraperTimeout}
          />
        </div>
      </div>
    </div>
  )
}
