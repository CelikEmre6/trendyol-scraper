import { NoteContent, NoteInfo, Search, SearchResult, Settings } from './models'

export type GetNotes = () => Promise<NoteInfo[]>
export type ReadNote = (title: NoteInfo['title']) => Promise<NoteContent>
export type WriteNote = (title: NoteInfo['title'], content: NoteContent) => Promise<void>
export type CreateNote = () => Promise<NoteInfo['title'] | false>
export type DeleteNote = (title: NoteInfo['title']) => Promise<boolean>
export type SearchResults = (url: string) => Promise<SearchResult[]>
export type GetSettingsJson = () => Promise<Settings>
export type SetSettingsJson = (settings: Settings) => Promise<Settings>

// Aramayı kaydetme işlemi için güncellenmiş tip
export type SaveSearch = (search: Search) => Promise<void>

// Tüm aramaları alma işlemi için güncellenmiş tip
export type GetSearch = () => Promise<Search[]>
export type DeleteSearch = (date: string) => Promise<boolean>
export type loadStockLinksFromExcel = (path: string, overWrite: boolean) => Promise<string[]>
