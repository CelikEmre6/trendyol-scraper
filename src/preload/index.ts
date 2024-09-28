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
    const progressBar = document.getElementById('progressBar')
    if (progressBar) {
      progressBar.style.width = `${progress}%`
      progressBar.innerText = `${progress}%`
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

    saveStockLinks: (jsondata: string) => ipcRenderer.invoke('saveStockLinks', jsondata),

    loadStockLinks: () => ipcRenderer.invoke('loadStockLinks'),

    deleteSearch: (date: Parameters<DeleteSearch>[0]) => ipcRenderer.invoke('deleteSearch', date),

    createExcelFile: (search: Parameters<SaveSearch>[0]) =>
      ipcRenderer.invoke('createExcelFile', search)
  })
} catch (error) {
  console.error('Failed to expose preload functions:', error)
}
