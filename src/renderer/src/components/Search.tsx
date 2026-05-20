import { updateAvailableAtom, updateStateAtom, downloadProgressAtom, saveSearchResultsAtom } from '@renderer/store'
import { appVersion } from '@shared/constants'
import { Button, message, Progress, Tooltip } from 'antd'
import { useAtom, useSetAtom } from 'jotai'
import { useEffect, useState } from 'react'

export const Search = () => {
  const [url, setUrl] = useState('')
  const [selectedUrl, setSelectedUrl] = useState(null)
  const [progress, setProgress] = useState(0) // Yüzdeyi tutacak state
  const [searchDescription, setSearchDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const setSearchResults = useSetAtom(saveSearchResultsAtom)

  // Auto-updater global state
  const [updateState] = useAtom(updateStateAtom)
  const [updateInfo] = useAtom(updateAvailableAtom)
  const [downloadProgress] = useAtom(downloadProgressAtom)

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

  const handleUpdateClick = () => {
    if (updateState === 'available') {
      window.context.startDownloadUpdate()
    } else if (updateState === 'downloaded') {
      window.context.installUpdate()
    }
  }

  const getUpdateBadge = () => {
    if (updateState === 'idle') return null

    if (updateState === 'available') {
      return (
        <Tooltip title={`v${updateInfo?.version} mevcut — tıklayarak güncelle`} placement="topRight">
          <button
            onClick={handleUpdateClick}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              border: 'none',
              borderRadius: 12,
              padding: '4px 12px',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 600,
              color: '#fff',
              animation: 'pulse 2s infinite'
            }}
          >
            <span style={{ fontSize: 14 }}>🔄</span>
            v{updateInfo?.version} güncelle
          </button>
        </Tooltip>
      )
    }

    if (updateState === 'downloading') {
      return (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'rgba(79, 172, 254, 0.15)',
            border: '1px solid rgba(79, 172, 254, 0.3)',
            borderRadius: 12,
            padding: '4px 12px',
            fontSize: 12,
            color: '#4facfe'
          }}
        >
          <span style={{ fontSize: 14 }}>⬇️</span>
          İndiriliyor %{downloadProgress?.percent ?? 0}
        </div>
      )
    }

    if (updateState === 'downloaded') {
      return (
        <Tooltip title="Güncelleme hazır — tıklayarak yeniden başlat" placement="topRight">
          <button
            onClick={handleUpdateClick}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
              border: 'none',
              borderRadius: 12,
              padding: '4px 12px',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 600,
              color: '#1a1a2e',
              animation: 'pulse 2s infinite'
            }}
          >
            <span style={{ fontSize: 14 }}>✅</span>
            Yeniden Başlat
          </button>
        </Tooltip>
      )
    }

    return null
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center space-y-3 relative">
      <input
        type="text"
        placeholder="Trendyol / Hepsiburada Linki Giriniz"
        value={url}
        onChange={handleUrlChange}
        className="w-96 text-blue-500"
        style={{
          height: '40px',
          width: '60%',
          padding: '10px',
          borderRadius: '5px',
          border: '1px solid #ccc'
        }}
      ></input>
      <Tooltip
        title={
          !url.includes('trendyol.com') || url.includes('hepsiburada.com/')
            ? 'Lütfen geçerli bir Trendyol veya Hepsiburada linki giriniz.'
            : ''
        }
        placement="bottom"
        color="blue"
      >
        <Button
          className="w-96"
          onClick={async () => {
            setLoading(true)
            try {
              // Progress sıfırken loading mesajını sürekli göster
              message.loading('Ürün Linkleri Toplanıyor', 3) // Süresiz bir loading mesajı
              const data = await window.context.getSearchResults(url!)
              const newSearch = {
                results: data.map((item) => ({
                  ...item
                })),
                date: new Date().getTime(),
                description: url.includes('trendyol.com/')
                  ? url.slice(url.indexOf('trendyol.com/') + 13)
                  : url.slice(url.indexOf('hepsiburada.com/') + 16)
              }
              await setSearchResults(newSearch)
              refresh()
              message.success('Veriler Alındı')
            } catch (error: any) {
              console.error(error)
              const errorMessage = error?.message?.replace(/Error invoking remote method '.*': Error: /, '') || 'Veriler Alınamadı'
              message.error(errorMessage)
            } finally {
              setLoading(false)
            }
          }}
          type="primary"
          disabled={(!url.includes('trendyol.com') && !url.includes('hepsiburada.com')) || loading}
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

      {/* Versiyon ve güncelleme badge'i - sağ alt köşe */}
      <div
        style={{
          position: 'absolute',
          bottom: 16,
          right: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 10
        }}
      >
        {getUpdateBadge()}
        <span
          style={{
            fontSize: 12,
            color: 'rgba(255, 255, 255, 0.35)',
            fontFamily: 'monospace',
            userSelect: 'none'
          }}
        >
          v{appVersion}
        </span>
      </div>

      {/* Pulse animasyonu */}
      <style>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.7; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  )
}

