export type SearchResult = {
  groupId: string
  url: string
  details: string[]
}

export type Search = {
  description?: string
  date: number // Unix timestamp olarak zorunlu hale getirildi
  results: SearchResult[] // 'search' yerine 'results' olarak adlandırıldı
}

export type SearchSummary = {
  description?: string
  date: number // Unix timestamp
}

export type NoteInfo = {
  title: string
  lastEditTime: number
}
export type NoteContent = string

export type Settings = {
  macAddress: string
  licanceKey?: string
  productNumber: number
  variant: boolean
  comment: boolean
  commentNumber: number
  telegramApiKey?: string
  telegramChatId?: string
  telegramStock: boolean
  telegramPrice: boolean
}
export type TelegramSettings = {
  apiKey: string
  chatId: string
}

export type MessagePayload = {
  message: string
}
