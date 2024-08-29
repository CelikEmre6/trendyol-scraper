import { searchsAtom, selectedSearchIndexAtom } from '@/store'
import { useAtom, useAtomValue } from 'jotai'

export const useSearchResults = ({ onSelect }: { onSelect?: () => void }) => {
  const searchResults = useAtomValue(searchsAtom)

  const [selectedSearchIndex, setSelectedSearchIndex] = useAtom(selectedSearchIndexAtom)

  const handleSearchSelect = (index: number) => () => {
    setSelectedSearchIndex(index)

    if (onSelect) {
      onSelect()
    }
  }

  return {
    searchResults,
    selectedSearchIndex,
    handleSearchSelect
  }
}
