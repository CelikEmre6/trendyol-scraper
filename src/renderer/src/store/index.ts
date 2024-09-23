import { NoteContent, NoteInfo, Search, Settings } from '@shared/models'
import { atom } from 'jotai'
import { unwrap } from 'jotai/utils'

const loadNotes = async () => {
  const notes = await window.context.getNotes()

  return notes.sort((a, b) => b.lastEditTime - a.lastEditTime)
}

const notesAtomAsync = atom<NoteInfo[] | Promise<NoteInfo[]>>(loadNotes())
export const notesAtom = unwrap(notesAtomAsync, (prev) => prev)

export const selectedNoteIndexAtom = atom<number | null>(null)

const selectedNoteAtomAsync = atom(async (get) => {
  const notes = get(notesAtom)
  const selectedNoteIndex = get(selectedNoteIndexAtom)

  if (selectedNoteIndex === null || !notes) return null

  const selectedNote = notes[selectedNoteIndex]

  const noteContent = await window.context.readNote(selectedNote.title)

  return {
    ...selectedNote,
    content: noteContent
  }
})

export const selectedNoteAtom = unwrap(
  selectedNoteAtomAsync,
  (prev) =>
    prev ?? {
      title: '',
      lastEditTime: Date.now(),
      content: ''
    }
)

export const saveNoteAtom = atom(null, async (get, set, newContent: NoteContent) => {
  const notes = get(notesAtom)
  const selectedNote = get(selectedNoteAtom)

  if (!selectedNote || !notes) return

  // save on disk
  await window.context.writeNote(selectedNote.title, newContent)

  // update the saved note's last edit time
  set(
    notesAtom,
    notes.map((note) => {
      // this is the note that we want to update
      if (note.title === selectedNote.title) {
        return {
          ...note,
          lastEditTime: Date.now()
        }
      }

      return note
    })
  )
})

export const createEmptyNoteAtom = atom(null, async (get, set) => {
  const notes = get(notesAtom)

  if (!notes) return

  const title = await window.context.createNote()

  if (!title) return

  const newNote: NoteInfo = {
    title,
    lastEditTime: Date.now()
  }

  set(notesAtom, [newNote, ...notes.filter((note) => note.title !== newNote.title)])

  set(selectedNoteIndexAtom, 0)
})

export const deleteNoteAtom = atom(null, async (get, set) => {
  const notes = get(notesAtom)
  const selectedNote = get(selectedNoteAtom)

  if (!selectedNote || !notes) return

  const isDeleted = await window.context.deleteNote(selectedNote.title)

  if (!isDeleted) return

  set(
    notesAtom,
    notes.filter((note) => note.title !== selectedNote.title)
  )

  set(selectedNoteIndexAtom, null)
})

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

  set(selectedNoteIndexAtom, null)
})

export const stockLinksAtom = atom<string[]>([]) // Başlangıçta boş bir dizi
