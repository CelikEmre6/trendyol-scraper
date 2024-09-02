import {
  DeleteNote,
  DeleteSearch,
  ImportFromExcel,
  ReadNote,
  SaveSearch,
  SearchResults,
  SetSettingsJson,
  SetTapuData,
  WriteNote
} from '@shared/types'
import { contextBridge, ipcRenderer } from 'electron'

if (!process.contextIsolated) {
  throw new Error('The contextIsolation option must be enabled in the preload script.')
}

try {
  contextBridge.exposeInMainWorld('context', {
    locale: navigator.language,

    getNotes: () => ipcRenderer.invoke('getNotes'),

    readNote: (title: Parameters<ReadNote>[0]) => ipcRenderer.invoke('readNote', title),

    writeNote: (title: Parameters<WriteNote>[0], content: Parameters<WriteNote>[1]) =>
      ipcRenderer.invoke('writeNote', title, content),

    createNote: () => ipcRenderer.invoke('createNote'),

    deleteNote: (title: Parameters<DeleteNote>[0]) => ipcRenderer.invoke('deleteNote', title),

    getSearchResults: (
      city: Parameters<SearchResults>[0],
      town: Parameters<SearchResults>[1],
      quarters: Parameters<SearchResults>[2],
      zonings: Parameters<SearchResults>[3]
    ) => ipcRenderer.invoke('getSearchResults', city, town, quarters, zonings),

    setTapuData: (data: Parameters<SetTapuData>[0]) => ipcRenderer.invoke('setTapuData', data),

    solveCaptcha: () => ipcRenderer.invoke('solveCaptcha'),

    getSettingsJson: () => ipcRenderer.invoke('getSettingsJson'),

    setSettingsJson: (settings: Parameters<SetSettingsJson>[0]) =>
      ipcRenderer.invoke('setSettingsJson', settings),

    saveSearch: (search: Parameters<SaveSearch>[0]) => ipcRenderer.invoke('saveSearch', search),

    getSearch: () => ipcRenderer.invoke('getSearch'),

    deleteSearch: (date: Parameters<DeleteSearch>[0]) => ipcRenderer.invoke('deleteSearch', date),

    createExcelFile: (search: Parameters<SaveSearch>[0]) =>
      ipcRenderer.invoke('createExcelFile', search),

    importFromExcel: (
      filePath: Parameters<ImportFromExcel>[0],
      desc?: Parameters<ImportFromExcel>[1]
    ) => ipcRenderer.invoke('importFromExcel', filePath, desc)
  })
} catch (error) {
  console.error('Failed to expose preload functions:', error)
}
