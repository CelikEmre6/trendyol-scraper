import { NoteContent, NoteInfo, Search, SearchResult, Settings } from './models'

export type GetNotes = () => Promise<NoteInfo[]>
export type ReadNote = (title: NoteInfo['title']) => Promise<NoteContent>
export type WriteNote = (title: NoteInfo['title'], content: NoteContent) => Promise<void>
export type CreateNote = () => Promise<NoteInfo['title'] | false>
export type DeleteNote = (title: NoteInfo['title']) => Promise<boolean>
export type SearchResults = (
  city: string,
  town: string,
  quarters: string[]
) => Promise<SearchResult[]>
export type GetSettingsJson = () => Promise<Settings>
export type SetSettingsJson = (settings: Settings) => Promise<Settings>

// Aramayı kaydetme işlemi için güncellenmiş tip
export type SaveSearch = (search: Search) => Promise<void>

// Tüm aramaları alma işlemi için güncellenmiş tip
export type GetSearch = () => Promise<Search[]>
export type DeleteSearch = (date: string) => Promise<boolean>
export type SetTapuData = (data: SearchResult[]) => void

export type ImportFromExcel = (filePath: string, desc?: string) => Promise<SearchResult[]>
