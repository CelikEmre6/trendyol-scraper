export type SearchResult = {
  il: string
  ilce: string
  location: string
  title: string
  link: string
  date: string
  imageUrl?: string
  price: string
  telefonNo?: string
  isim?: string
  sirket?: string
  detaylar: string[]
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
  autoResolver: boolean
  scraperTimeout: number[]
  captchaTimeout: number[]
  fingerprints: boolean
  headless: boolean
  proxy?: {
    host: string
    port: number
    username: string
    password: string
  }
}
