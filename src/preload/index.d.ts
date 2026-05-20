import {
  CreateNote,
  DeleteNote,
  DeleteSearch,
  CleanEmptySearches,
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
      loadStockLinks(): string[]
      loadStockLinksFromExcel(path: string, overWrite: boolean): string[]
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
      getSearchResults2: SearchResults
      getSettingsJson: GetSettingsJson
      setSettingsJson: SetSettingsJson
      saveSearch: SaveSearch
      getSearch: GetSearch
      deleteSearch: DeleteSearch
      cleanEmptySearches: CleanEmptySearches
      getSearchAttributes: () => string[]
      createExcelFile: SaveSearch
    }
  }
}
