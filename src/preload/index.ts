import {
  DeleteNote,
  DeleteSearch,
  ReadNote,
  SaveSearch,
  SearchResults,
  SetSettingsJson,
  WriteNote
} from '@shared/types'
import { contextBridge, ipcRenderer } from 'electron'

if (!process.contextIsolated) {
  throw new Error('The contextIsolation option must be enabled in the preload script.')
}

try {
  ipcRenderer.on('progress-update', (_, progress) => {
    // Keep backward compatibility for the hidden div (just in case)
    const progressBar = document.getElementById('progressBar')
    if (progressBar) {
      if (typeof progress === 'object') {
        progressBar.innerText = progress.percent ? `${progress.percent}%` : progress.message || ''
      } else {
        progressBar.innerText = `${progress}`
      }
    }
  })

  contextBridge.exposeInMainWorld('context', {
    locale: navigator.language,

    getNotes: () => ipcRenderer.invoke('getNotes'),

    readNote: (title: Parameters<ReadNote>[0]) => ipcRenderer.invoke('readNote', title),

    writeNote: (title: Parameters<WriteNote>[0], content: Parameters<WriteNote>[1]) =>
      ipcRenderer.invoke('writeNote', title, content),

    createNote: () => ipcRenderer.invoke('createNote'),

    deleteNote: (title: Parameters<DeleteNote>[0]) => ipcRenderer.invoke('deleteNote', title),

    getSearchResults: (url: Parameters<SearchResults>[0]) =>
      ipcRenderer.invoke('getSearchResults', url),
    getSearchResults2: (urls: Parameters<SearchResults>[0]) =>
      ipcRenderer.invoke('getSearchResults2', urls),

    solveCaptcha: () => ipcRenderer.invoke('solveCaptcha'),

    getSettingsJson: () => ipcRenderer.invoke('getSettingsJson'),

    setSettingsJson: (settings: Parameters<SetSettingsJson>[0]) =>
      ipcRenderer.invoke('setSettingsJson', settings),

    saveSearch: (search: Parameters<SaveSearch>[0]) => ipcRenderer.invoke('saveSearch', search),

    getSearch: () => ipcRenderer.invoke('getSearch'),

    getSearchAttributes: () => ipcRenderer.invoke('getSearchAttributes'),

    saveStockLinks: (jsondata: string) => ipcRenderer.invoke('saveStockLinks', jsondata),

    loadStockLinks: () => ipcRenderer.invoke('loadStockLinks'),

    loadStockLinksFromExcel: (path: string, overWrite: boolean) =>
      ipcRenderer.invoke('loadStockLinksFromExcel', path, overWrite),

    deleteSearch: (date: Parameters<DeleteSearch>[0]) => ipcRenderer.invoke('deleteSearch', date),
    cleanEmptySearches: () => ipcRenderer.invoke('cleanEmptySearches'),

    createExcelFile: (search: Parameters<SaveSearch>[0]) =>
      ipcRenderer.invoke('createExcelFile', search),

    // Auto-updater
    onUpdateAvailable: (callback: (info: { version: string; releaseNotes?: string }) => void) => {
      ipcRenderer.on('update-available', (_, info) => callback(info))
    },
    onDownloadProgress: (callback: (progress: { percent: number; transferred: number; total: number; bytesPerSecond: number }) => void) => {
      ipcRenderer.on('download-progress', (_, progress) => callback(progress))
    },
    onUpdateDownloaded: (callback: (info: { version: string }) => void) => {
      ipcRenderer.on('update-downloaded', (_, info) => callback(info))
    },
    startDownloadUpdate: () => ipcRenderer.invoke('start-download-update'),
    installUpdate: () => ipcRenderer.invoke('install-update'),
    
    // Search progress
    onSearchProgress: (callback: (progress: any) => void) => {
      // Create a specific listener instance to avoid duplicate listeners when re-rendered
      const listener = (_: any, progress: any) => callback(progress)
      ipcRenderer.on('progress-update', listener)
      return () => { ipcRenderer.removeListener('progress-update', listener) } // return cleanup fn
    },
    cancelSearch: () => ipcRenderer.invoke('cancelSearch')
  })
} catch (error) {
  console.error('Failed to expose preload functions:', error)
}
