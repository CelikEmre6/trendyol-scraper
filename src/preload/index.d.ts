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
