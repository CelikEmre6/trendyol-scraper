import { useSettings } from '@renderer/hooks/useSettings'

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
        {/* <div className="flex flex-col space-y-2 min-w-[600px]">
          <label htmlFor="scraper-timeout">Scraper Timeout</label>
          <Slider
            range
            id="scraper-timeout"
            min={200}
            max={5000}
            step={100}
            defaultValue={settings?.scraperTimeout}
          />
        </div> */}
      </div>
    </div>
  )
}
