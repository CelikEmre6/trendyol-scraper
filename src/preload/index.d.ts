import {
  CreateNote,
  DeleteNote,
  DeleteSearch,
  GetNotes,
  GetSearch,
  GetSettingsJson,
  ReadNote,
  SaveSearch,
  SearchResults,
  SetSettingsJson,
  WriteNote
} from '@shared/types'

declare global {
  interface Window {
    context: {
      getSearchResults2(): SearchResults
      loadStockLinks(): string[]
      getSearchResultsStok(): unknown
      saveStockLinks(jsonData: string): unknown
      setStockLinksJson(newStockLinks: string[]): unknown
      locale: string
      getNotes: GetNotes
      readNote: ReadNote
      writeNote: WriteNote
      createNote: CreateNote
      deleteNote: DeleteNote
      solveCaptcha: () => Promise<void>
      getSearchResults: SearchResults
      getSettingsJson: GetSettingsJson
      setSettingsJson: SetSettingsJson
      saveSearch: SaveSearch
      getSearch: GetSearch
      deleteSearch: DeleteSearch
      createExcelFile: SaveSearch
    }
  }
}
