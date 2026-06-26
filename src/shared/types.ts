import { Search, SearchResult, Settings } from './models';

export type SearchOptions = { minPage?: number; maxPage?: number; fastScan?: boolean };
export type GetSettingsJson = () => Promise<Settings>
export type SetSettingsJson = (settings: Settings) => Promise<Settings>

// Aramayı kaydetme işlemi için güncellenmiş tip
export type SaveSearch = (search: Search) => Promise<void>

export type ScraperResponse = {
    results: SearchResult[]
    status: 'completed' | 'interrupted'
    platform?: 'trendyol' | 'hepsiburada' | 'n11'
    searchUrl?: string
    options?: any
    lastPageScraped?: number
    totalPages?: number
    pendingLinks?: string[]
}

export type SearchResults = (url: string, options?: SearchOptions) => Promise<ScraperResponse | SearchResult[]>

// Tüm aramaları alma işlemi için güncellenmiş tip
export type GetSearch = () => Promise<Search[]>
export type DeleteSearch = (date: string) => Promise<boolean>
export type loadStockLinksFromExcel = (path: string, overWrite: boolean) => Promise<string[]>
export type CleanEmptySearches = () => Promise<number | false>
