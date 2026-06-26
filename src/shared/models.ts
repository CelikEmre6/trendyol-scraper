export type SearchResult = {
  groupId: string
  url: string
  details: string[]
}

export type Search = {
  description?: string
  date: number // Unix timestamp olarak zorunlu hale getirildi
  results: SearchResult[]
  status?: 'completed' | 'interrupted'
  platform?: 'trendyol' | 'hepsiburada' | 'n11'
  searchUrl?: string
  options?: any
  lastPageScraped?: number
  totalPages?: number
  pendingLinks?: string[]
}

export type SearchSummary = {
  description?: string
  date: number // Unix timestamp
}


export type Settings = {
  macAddress: string
  licanceKey?: string
  licanceType?: string
  licancePlan?: string
  productNumber: number
  variant: boolean
  combineIsim?: boolean
  attributes?: string[]
}

export type MessagePayload = {
  message: string
}
