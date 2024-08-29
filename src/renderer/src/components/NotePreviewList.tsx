import { useSearchResults } from '@renderer/hooks/useSearchList'
import { isEmpty } from 'lodash'
import { ComponentProps } from 'react'
import { twMerge } from 'tailwind-merge'
import { NotePreview } from './NotePreview'

type NotePreviewListProps = ComponentProps<'ul'> & {
  onSelect?: () => void
}

export const NotePreviewList = ({ className, onSelect, ...props }: NotePreviewListProps) => {
  const { searchResults, selectedSearchIndex, handleSearchSelect } = useSearchResults({ onSelect })

  if (!searchResults) return null

  if (isEmpty(searchResults)) {
    return (
      <ul className={twMerge('text-center pt-4', className)}>
        <span>No Notes Yet!</span>
      </ul>
    )
  }

  return (
    <ul {...props}>
      {searchResults.map((searchResult, index) => (
        <NotePreview
          key={searchResult.date}
          isActive={selectedSearchIndex === index}
          onClick={handleSearchSelect(index)}
          description={searchResult.description}
          date={searchResult.date}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          results={searchResult.results as any}
        />
      ))}
    </ul>
  )
}
