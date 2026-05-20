import { Search, Settings } from '@shared/models'
import { atom } from 'jotai'
import { unwrap } from 'jotai/utils'

// Settings
const getSettings = async () => {
  return await window.context.getSettingsJson()
}
const settingsAtomAsync = atom<Settings | Promise<Settings>>(getSettings())
export const settingsAtom = unwrap(settingsAtomAsync, (prev) => prev)

// Search Functionality
const getSearch = async (): Promise<Search[]> => {
  return (await window.context.getSearch()).sort((a, b) => b.date - a.date)
}

const searchsAtomAsync = atom<Search[] | Promise<Search[]>>(getSearch())
export const searchsAtom = unwrap(searchsAtomAsync, (prev) => prev)

export const selectedSearchIndexAtom = atom<number | null>(null)

const selectedSearchAtomAsync = atom(async (get) => {
  const searchs = get(searchsAtom)
  const selectedSearchIndex = get(selectedSearchIndexAtom)

  if (selectedSearchIndex === null || !searchs) return null

  return searchs[selectedSearchIndex]
})

export const selectedSearchAtom = unwrap(selectedSearchAtomAsync, (prev) => prev ?? null)

export const setSearchResultsAtom = atom(null, async (get, set, updatedSearch: Search) => {
  const searchs = get(searchsAtom)
  const selectedSearchIndex = get(selectedSearchIndexAtom)

  if (!searchs) return

  if (selectedSearchIndex !== null) {
    // Seçili aramayı güncelle
    searchs[selectedSearchIndex] = updatedSearch
  } else {
    // Yeni bir arama ekle
    searchs.unshift(updatedSearch)
  }

  // Veritabanına ya da dosyaya kaydet
  await window.context.saveSearch(updatedSearch)

  // Atom'u güncelle
  set(searchsAtom, [...searchs])
})

export const saveSearchResultsAtom = atom(null, async (get, set, newSearch: Search) => {
  // Arama sonuçlarını diske kaydet
  await window.context.saveSearch(newSearch)

  // Mevcut arama sonuçlarını al
  const searchs = get(searchsAtom) || []

  console.log(searchs)

  set(searchsAtom, [newSearch, ...searchs])
})

export const deleteSearchResultAtom = atom(null, async (get, set) => {
  const searchs = get(searchsAtom)
  const selectedSearch = get(selectedSearchAtom)

  if (!selectedSearch || !searchs) return

  const isDeleted = await window.context.deleteSearch(selectedSearch.date.toString())

  if (!isDeleted) return

  set(
    searchsAtom,
    searchs.filter((searchs) => searchs.date !== selectedSearch.date)
  )

  set(selectedSearchIndexAtom, null)
})

export const cleanEmptySearchesAtom = atom(null, async (get, set) => {
  const deletedCount = await window.context.cleanEmptySearches()
  if (deletedCount === false || deletedCount === 0) return deletedCount

  const searchs = get(searchsAtom)
  if (searchs) {
    set(
      searchsAtom,
      searchs.filter((search) => search.results && search.results.length > 0)
    )
    set(selectedSearchIndexAtom, null)
  }
  return deletedCount
})

export const refreshSearchesAtom = atom(null, async (_get, set) => {
  const freshSearches = await getSearch()
  set(searchsAtom, freshSearches)
  set(selectedSearchIndexAtom, null)
})

export const stockLinksAtom = atom<string[]>([]) // Başlangıçta boş bir dizi

// Auto-updater state
export const updateAvailableAtom = atom<{ version: string; releaseNotes?: string } | null>(null)
export const updateStateAtom = atom<'idle' | 'available' | 'downloading' | 'downloaded'>('idle')
export const downloadProgressAtom = atom<{ percent: number; transferred: number; total: number; bytesPerSecond: number } | null>(null)
