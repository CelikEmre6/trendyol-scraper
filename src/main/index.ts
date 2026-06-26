import {
  cleanEmptySearches,
  createExcelFile,
  deleteSearch,
  getSearch,
  getSearchAttributes,
  getSearchResults,
  getSearchResults2,
  getSettingsJson,
  loadStockLinks,
  loadStockLinksFromExcel,
  resumeSearch,
  saveSearch,
  saveStockLinks,
  writeSettingsJson
} from '@/lib'
import { electronApp, is, optimizer } from '@electron-toolkit/utils'
import {
  DeleteSearch,
  GetSearch,
  SaveSearch,
  SetSettingsJson
} from '@shared/types'
import { app, BrowserWindow, ipcMain, shell } from 'electron'
import { join } from 'path'
import icon from '../../resources/icon.png?asset'
import { incrementSearchId, setSearchCancelled } from './cancelState'
import { downloadUpdate, initAutoUpdater, installUpdate } from './updater'

function createWindow(): BrowserWindow {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 900,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    center: true,
    title: 'Trendyol Veri Çekme',
    frame: true,
    vibrancy: 'under-window',
    trafficLightPosition: {
      x: 15,
      y: 10
    },
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: true,
      contextIsolation: true,
      webSecurity: false
    },
    icon: 'icon.ico'
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return mainWindow
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  ipcMain.handle('cancelSearch', () => {
    setSearchCancelled(true)
  })

  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test

  ipcMain.handle('getSettingsJson', () => getSettingsJson())
  ipcMain.handle('setSettingsJson', (_, ...args: Parameters<SetSettingsJson>) =>
    writeSettingsJson(...args)
  )
  ipcMain.handle('saveSearch', (_, ...args: Parameters<SaveSearch>) => saveSearch(...args))
  ipcMain.handle('getSearch', (_, ...args: Parameters<GetSearch>) => getSearch(...args))
  ipcMain.handle('deleteSearch', (_, ...args: Parameters<DeleteSearch>) => deleteSearch(...args))
  ipcMain.handle('cleanEmptySearches', () => cleanEmptySearches())
  ipcMain.handle('getSearchAttributes', () => getSearchAttributes())
  ipcMain.handle('createExcelFile', (_, ...args: Parameters<SaveSearch>) =>
    createExcelFile(...args)
  )
  ipcMain.handle('saveStockLinks', async (_, jsonData) => {
    saveStockLinks(jsonData)
  })

  ipcMain.handle('loadStockLinksFromExcel', async (_, path, overWrite) => {
    loadStockLinksFromExcel(path, overWrite)
  })
  ipcMain.handle('loadStockLinks', () => loadStockLinks())

  ipcMain.handle('getSearchResults', async (event, url: string, options?: any) => {
    setSearchCancelled(false)
    incrementSearchId()
    return new Promise((resolve, reject) => {
      getSearchResults(url, options, (progress) => {
        event.sender.send('progress-update', progress) // İlerleme yüzdesini frontend'e gönderiyoruz
      })
        .then((data) => resolve(data)) // İşlem tamamlandığında veriyi frontend'e geri döndürür
        .catch((error) => reject(error)) // Hata olursa bunu yakalar
    })
  })
  ipcMain.handle('resumeSearch', async (event, searchData: any) => {
    setSearchCancelled(false)
    incrementSearchId()
    return new Promise((resolve, reject) => {
      resumeSearch(searchData, (progress: any) => {
        event.sender.send('progress-update', progress)
      })
        .then((data: any) => resolve(data))
        .catch((error: any) => reject(error))
    })
  })
  ipcMain.handle('getSearchResults2', async (_, urls) => {
    setSearchCancelled(false)
    incrementSearchId()
    return new Promise((resolve, reject) => {
      getSearchResults2(urls)
        .then((data) => resolve(data))
        .catch((error) => reject(error))
    })
  })

  const mainWindow = createWindow()

  // Auto-updater başlat (sadece production'da)
  if (!is.dev) {
    initAutoUpdater(mainWindow)
  }

  // Updater IPC handler'ları
  ipcMain.handle('start-download-update', () => {
    downloadUpdate()
  })

  ipcMain.handle('install-update', () => {
    installUpdate()
  })

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })

  app.commandLine.appendSwitch('disable-web-security')
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
