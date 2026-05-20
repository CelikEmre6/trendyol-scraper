import { Modal, Progress, Button, Typography, Space } from 'antd'
import { useEffect, useState } from 'react'

const { Text, Title } = Typography

type UpdateState = 'idle' | 'available' | 'downloading' | 'downloaded'

interface UpdateInfo {
  version: string
  releaseNotes?: string
}

interface DownloadProgress {
  percent: number
  transferred: number
  total: number
  bytesPerSecond: number
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

export function UpdateNotification(): JSX.Element | null {
  const [state, setState] = useState<UpdateState>('idle')
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null)
  const [progress, setProgress] = useState<DownloadProgress | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    window.context.onUpdateAvailable((info) => {
      setUpdateInfo(info)
      setState('available')
    })

    window.context.onDownloadProgress((prog) => {
      setProgress(prog)
      setState('downloading')
    })

    window.context.onUpdateDownloaded((info) => {
      setUpdateInfo(info)
      setState('downloaded')
    })
  }, [])

  const handleDownload = (): void => {
    window.context.startDownloadUpdate()
    setState('downloading')
    setProgress({ percent: 0, transferred: 0, total: 0, bytesPerSecond: 0 })
  }

  const handleInstall = (): void => {
    window.context.installUpdate()
  }

  const handleDismiss = (): void => {
    setDismissed(true)
  }

  if (state === 'idle' || dismissed) return null

  return (
    <>
      {/* Güncelleme mevcut */}
      <Modal
        open={state === 'available'}
        title={null}
        footer={null}
        closable={false}
        centered
        styles={{
          body: { padding: '32px 24px' },
          content: {
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
            borderRadius: 16,
            border: '1px solid rgba(255,255,255,0.1)'
          }
        }}
      >
        <Space direction="vertical" size="large" style={{ width: '100%', textAlign: 'center' }}>
          <div style={{ fontSize: 48 }}>🚀</div>
          <Title level={4} style={{ color: '#fff', margin: 0 }}>
            Yeni Sürüm Mevcut!
          </Title>
          <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 16 }}>
            <strong style={{ color: '#4facfe' }}>v{updateInfo?.version}</strong> sürümü yayınlandı.
            Güncellemek ister misiniz?
          </Text>
          <Space size="middle" style={{ marginTop: 8 }}>
            <Button
              type="primary"
              size="large"
              onClick={handleDownload}
              style={{
                background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                border: 'none',
                borderRadius: 8,
                fontWeight: 600,
                height: 44,
                paddingInline: 32
              }}
            >
              Güncelle
            </Button>
            <Button
              size="large"
              onClick={handleDismiss}
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: 'rgba(255,255,255,0.7)',
                borderRadius: 8,
                height: 44,
                paddingInline: 24
              }}
            >
              Şimdi Değil
            </Button>
          </Space>
        </Space>
      </Modal>

      {/* İndirme ilerlemesi */}
      <Modal
        open={state === 'downloading'}
        title={null}
        footer={null}
        closable={false}
        centered
        styles={{
          body: { padding: '32px 24px' },
          content: {
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
            borderRadius: 16,
            border: '1px solid rgba(255,255,255,0.1)'
          }
        }}
      >
        <Space direction="vertical" size="large" style={{ width: '100%', textAlign: 'center' }}>
          <div style={{ fontSize: 48 }}>⬇️</div>
          <Title level={4} style={{ color: '#fff', margin: 0 }}>
            Güncelleme İndiriliyor...
          </Title>
          <Progress
            percent={progress?.percent ?? 0}
            strokeColor={{
              '0%': '#4facfe',
              '100%': '#00f2fe'
            }}
            trailColor="rgba(255,255,255,0.1)"
            style={{ width: '100%' }}
          />
          {progress && progress.total > 0 && (
            <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>
              {formatBytes(progress.transferred)} / {formatBytes(progress.total)} •{' '}
              {formatBytes(progress.bytesPerSecond)}/s
            </Text>
          )}
        </Space>
      </Modal>

      {/* İndirme tamamlandı */}
      <Modal
        open={state === 'downloaded'}
        title={null}
        footer={null}
        closable={false}
        centered
        styles={{
          body: { padding: '32px 24px' },
          content: {
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
            borderRadius: 16,
            border: '1px solid rgba(255,255,255,0.1)'
          }
        }}
      >
        <Space direction="vertical" size="large" style={{ width: '100%', textAlign: 'center' }}>
          <div style={{ fontSize: 48 }}>✅</div>
          <Title level={4} style={{ color: '#fff', margin: 0 }}>
            Güncelleme Hazır!
          </Title>
          <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 16 }}>
            <strong style={{ color: '#4facfe' }}>v{updateInfo?.version}</strong> indirildi.
            Uygulamayı yeniden başlatmak ister misiniz?
          </Text>
          <Space size="middle" style={{ marginTop: 8 }}>
            <Button
              type="primary"
              size="large"
              onClick={handleInstall}
              style={{
                background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                border: 'none',
                borderRadius: 8,
                fontWeight: 600,
                height: 44,
                paddingInline: 32,
                color: '#1a1a2e'
              }}
            >
              Yeniden Başlat
            </Button>
            <Button
              size="large"
              onClick={handleDismiss}
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: 'rgba(255,255,255,0.7)',
                borderRadius: 8,
                height: 44,
                paddingInline: 24
              }}
            >
              Sonra
            </Button>
          </Space>
        </Space>
      </Modal>
    </>
  )
}
