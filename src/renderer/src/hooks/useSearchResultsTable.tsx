import { selectedSearchAtom, setSearchResultsAtom } from '@renderer/store'
import { autoSavingTime } from '@shared/constants'
import { Search } from '@shared/models'
import { useAtomValue, useSetAtom } from 'jotai'
import { throttle } from 'lodash'
import { useRef } from 'react'

export const useSearchResultsTable = () => {
  const selectedSearch = useAtomValue(selectedSearchAtom)
  const saveSearchResults = useSetAtom(setSearchResultsAtom)
  const tableRef = useRef<HTMLTableElement>(null)

  const handleAutoSaving = throttle(
    async (searchResults: Search) => {
      if (!selectedSearch) return

      console.log('Auto saving search results...', selectedSearch.date)

      await saveSearchResults(searchResults)
    },
    autoSavingTime,
    {
      leading: false,
      trailing: true
    }
  )

  const handleBlur = async () => {
    if (!selectedSearch) return

    handleAutoSaving.cancel()

    // Burada tablo içerisindeki veriyi alıyoruz
    const searchResults = tableRef.current?.dataset.results // table elementinin veri setinden sonuçları alıyoruz

    if (searchResults != null) {
      const parsedResults: Search = JSON.parse(searchResults) // Veriyi JSON olarak parse ediyoruz
      await saveSearchResults(parsedResults)
    }
  }

  return {
    tableRef,
    selectedSearch,
    handleAutoSaving,
    handleBlur
  }
}
