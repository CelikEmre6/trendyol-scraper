import { saveSearchResultsAtom } from '@renderer/store'
import { Button, message, Progress, Tooltip } from 'antd'
import { useSetAtom } from 'jotai'
import { useEffect, useState } from 'react'

export const Search = () => {
  const [url, setUrl] = useState('')
  const [selectedUrl, setSelectedUrl] = useState(null)
  const [progress, setProgress] = useState(0) // Yüzdeyi tutacak state
  const [searchDescription, setSearchDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const setSearchResults = useSetAtom(saveSearchResultsAtom)

  const handleUrlChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(event.target.value)
  }

  useEffect(() => {
    const interval = setInterval(() => {
      const progressBar = document.getElementById('progressBar')
      if (progressBar) {
        const text = progressBar.textContent || '0%'
        const value = parseFloat(text.replace('%', ''))
        setProgress(value)
      }
    }, 500)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    // Eğer progress > 0 olduğunda loading mesajını kapat
    if (progress > 0) {
      message.destroy() // Antd loading mesajını temizler
    }
  }, [progress])

  const refresh = () => {
    setSearchDescription('')
    setUrl('')
    setSelectedUrl(null)
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center space-y-3 relative">
      <input
        type="text"
        placeholder="Trendyol Linki Giriniz"
        value={url}
        onChange={handleUrlChange}
        className="w-96 text-blue-500"
      ></input>
      <Tooltip
        title={!url.includes('trendyol.com') ? 'Lütfen geçerli bir Trendyol linki giriniz.' : ''}
        placement="bottom"
        color="blue"
      >
        <Button
          className="w-96"
          onClick={async () => {
            setLoading(true)
            try {
              // Progress sıfırken loading mesajını sürekli göster
              message.loading('Ürün Linkleri Toplanıyor', 0) // Süresiz bir loading mesajı
              const data = await window.context.getSearchResults(url!)
              const newSearch = {
                results: data.map((item) => ({
                  ...item
                })),
                date: new Date().getTime(),
                description: url.slice(url.indexOf('trendyol.com/') + 13)
              }
              await setSearchResults(newSearch)
              refresh()
              message.success('Veriler Alındı')
            } catch (error) {
              console.error(error)
              message.error('Veriler Alınamadı')
            } finally {
              setLoading(false)
            }
          }}
          type="primary"
          disabled={!url.includes('trendyol.com') || loading}
        >
          Verileri Al
        </Button>
      </Tooltip>
      <div className="width: 100%; background-color: #ddd;">
        <div
          id="progressBar"
          className="width: 0%; height: 30px; background-color: #4CAF50;"
          style={{
            display: 'none'
          }}
        ></div>
      </div>
      {loading && (
        <div style={{ marginTop: '10px' }}>
          <Progress
            type="circle"
            percent={progress}
            format={(percent) => `${percent?.toFixed(2)}%`}
          />
        </div>
      )}
    </div>
  )
}
