import { updateAvailableAtom, updateStateAtom, downloadProgressAtom, saveSearchResultsAtom } from '@renderer/store'
import { appVersion } from '@shared/constants'
import { Button, message, Progress, Tooltip } from 'antd'
import { useAtom, useSetAtom } from 'jotai'
import { useEffect, useState } from 'react'

export const Search = () => {
  const [url, setUrl] = useState('')
  const [selectedUrl, setSelectedUrl] = useState(null)
  const [progress, setProgress] = useState(0) // Yüzdeyi tutacak state
  const [progressStats, setProgressStats] = useState({ percent: 0, total: 0, success: 0, failed: 0 })
  const [searchDescription, setSearchDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [dots, setDots] = useState('')
  const setSearchResults = useSetAtom(saveSearchResultsAtom)

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (loading) {
      interval = setInterval(() => {
        setDots((prev) => (prev.length >= 3 ? '' : prev + '.'))
      }, 400)
    } else {
      setDots('')
    }
    return () => clearInterval(interval)
  }, [loading])

  // Auto-updater global state
  const [updateState] = useAtom(updateStateAtom)
  const [updateInfo] = useAtom(updateAvailableAtom)
  const [downloadProgress] = useAtom(downloadProgressAtom)

  const handleUrlChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(event.target.value)
  }

  useEffect(() => {
    const cleanup = window.context.onSearchProgress((data) => {
      if (data && typeof data === 'object') {
        if (data.percent !== undefined) {
          const percentVal = parseFloat(data.percent)
          setProgressStats({
            percent: percentVal,
            total: data.total || 0,
            success: data.success || 0,
            failed: data.failed || 0
          })
          setProgress(percentVal)
        } else if (data.message) {
          // You can handle string messages here if you want to show them
        }
      } else {
        const val = parseFloat(String(data).replace('%', ''))
        setProgress(val)
      }
    })

    return () => {
      if (cleanup) cleanup()
    }
  }, [])

  // Eski message.destroy hook'u kaldırıldı

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
      <div className="flex items-center gap-2 w-[60%] max-w-2xl">
        <input
          type="text"
          placeholder="Trendyol / Hepsiburada Linki Giriniz"
          value={url}
          onChange={handleUrlChange}
          className="flex-1 h-14 px-5 text-white bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-300 placeholder-white/30 backdrop-blur-md"
        ></input>
        <Tooltip title="Panodan Yapıştır" placement="top">
          <button
            onClick={async () => {
              try {
                const text = await navigator.clipboard.readText()
                if (text) setUrl(text.trim())
              } catch {
                message.error('Pano okunamadı')
              }
            }}
            style={{
              height: '56px',
              width: '56px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '12px',
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.05)',
              cursor: 'pointer',
              fontSize: '24px',
              color: '#aaa',
              transition: 'all 0.3s ease',
              flexShrink: 0,
              backdropFilter: 'blur(10px)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(79, 172, 254, 0.2)'
              e.currentTarget.style.color = '#4facfe'
              e.currentTarget.style.borderColor = 'rgba(79, 172, 254, 0.4)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
              e.currentTarget.style.color = '#aaa'
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
            }}
          >
            📋
          </button>
        </Tooltip>
      </div>
      <Tooltip
        title={
          !url.includes('trendyol.com') || url.includes('hepsiburada.com/')
            ? 'Lütfen geçerli bir Trendyol veya Hepsiburada linki giriniz.'
            : ''
        }
        placement="bottom"
        color="blue"
      >
        <button
          className="w-[60%] max-w-2xl h-14 mt-4 bg-gradient-to-r from-primary to-accent text-white font-bold text-lg rounded-xl shadow-[0_0_20px_rgba(79,172,254,0.3)] hover:shadow-[0_0_30px_rgba(79,172,254,0.6)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
          onClick={async () => {
            setLoading(true)
            setProgress(0)
            setProgressStats({ percent: 0, total: 0, success: 0, failed: 0 })
            try {
              const data = await window.context.getSearchResults(url!)
              const newSearch = {
                results: data.map((item) => ({ ...item })),
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
          disabled={(!url.includes('trendyol.com') && !url.includes('hepsiburada.com')) || loading}
        >
          {loading ? (progress > 0 ? `Ürün Verileri Çekiliyor${dots}` : `Ürün Linkleri Çekiliyor${dots}`) : 'Verileri Al'}
        </button>
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
        <div className="mt-8 flex items-center gap-6 p-6 rounded-2xl bg-surface border border-white/10 backdrop-blur-md">
          <Progress
            type="dashboard"
            percent={progress}
            format={(percent) => <span className="text-white font-bold">{percent?.toFixed(1)}%</span>}
            size={100}
            strokeColor={{ '0%': '#4facfe', '100%': '#00f2fe' }}
            trailColor="rgba(255,255,255,0.1)"
          />
          <div className="flex flex-row gap-4 text-center items-center">
            <div className="bg-white/5 p-4 rounded-xl border border-white/10 min-w-[100px]">
              <span className="text-white/50 text-xs block mb-1">Toplam</span>
              <strong className="text-white text-xl">{progressStats.total}</strong>
            </div>
            <div className="bg-green-500/10 p-4 rounded-xl border border-green-500/20 min-w-[100px]">
              <span className="text-green-400/70 text-xs block mb-1">Başarılı</span>
              <strong className="text-green-400 text-xl">{progressStats.success}</strong>
            </div>
            <div className="bg-red-500/10 p-4 rounded-xl border border-red-500/20 min-w-[100px]">
              <span className="text-red-400/70 text-xs block mb-1">Başarısız</span>
              <strong className="text-red-400 text-xl">{progressStats.failed}</strong>
            </div>
            
            <button
              onClick={() => window.context.cancelSearch()}
              className="ml-4 h-12 px-6 rounded-xl border border-red-500/50 text-red-400 hover:bg-red-500/10 transition-colors font-medium"
            >
              İptal Et
            </button>
          </div>
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

