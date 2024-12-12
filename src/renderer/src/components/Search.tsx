/* eslint-disable @typescript-eslint/no-explicit-any */
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
        // Div içeriğini al ve sayıya dönüştür
        const text = progressBar.textContent || '0%'
        const value = parseInt(text.replace('%', ''), 10) // "%" karakterini temizle ve sayıya dönüştür
        setProgress(value) // State'i güncelle
      }
    }, 500) // Her 500ms'de bir kontrol et

    return () => clearInterval(interval) // Component unmount olduğunda temizle
  }, [])

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
            setLoading(true) // Disable the button
            try {
              message.loading('Ürün Linkleri Toplanıyor')
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
              setLoading(false) // Re-enable the button
            }
          }}
          type="primary"
          disabled={!url.includes('trendyol.com') || loading} // Disable button if url is empty
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
          <Progress type="circle" percent={progress} />
        </div>
      )}
    </div>
  )
}
