import { autoUpdater } from 'electron-updater'
import { BrowserWindow } from 'electron'

autoUpdater.autoDownload = false
autoUpdater.autoInstallOnAppQuit = true

export function initAutoUpdater(mainWindow: BrowserWindow): void {
  // Güncelleme mevcut
  autoUpdater.on('update-available', (info) => {
    console.log('Güncelleme mevcut:', info.version)
    mainWindow.webContents.send('update-available', {
      version: info.version,
      releaseNotes: info.releaseNotes
    })
  })

  // Güncelleme yok
  autoUpdater.on('update-not-available', () => {
    console.log('Uygulama güncel.')
  })

  // İndirme ilerlemesi
  autoUpdater.on('download-progress', (progress) => {
    console.log(`İndirme: ${Math.round(progress.percent)}%`)
    mainWindow.webContents.send('download-progress', {
      percent: Math.round(progress.percent),
      transferred: progress.transferred,
      total: progress.total,
      bytesPerSecond: progress.bytesPerSecond
    })
  })

  // İndirme tamamlandı
  autoUpdater.on('update-downloaded', (info) => {
    console.log('Güncelleme indirildi:', info.version)
    mainWindow.webContents.send('update-downloaded', {
      version: info.version
    })
  })

  // Hata
  autoUpdater.on('error', (error) => {
    console.error('Güncelleme hatası:', error)
  })

  // Uygulama başladığında güncelleme kontrolü yap
  autoUpdater.checkForUpdates().catch((err) => {
    console.error('Güncelleme kontrolü başarısız:', err)
  })
}

export function downloadUpdate(): void {
  autoUpdater.downloadUpdate()
}

export function installUpdate(): void {
  autoUpdater.quitAndInstall()
}
