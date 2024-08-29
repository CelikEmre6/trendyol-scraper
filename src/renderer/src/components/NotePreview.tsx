import { cn, formatDateFromMs } from '@renderer/utils'
import { Search, SearchResult } from '@shared/models'
import { ComponentProps } from 'react'

export type NotePreviewProps = Search & {
  isActive?: boolean
  results: SearchResult[]
} & ComponentProps<'div'>

export const NotePreview = ({
  description,
  content,
  date,
  isActive = false,
  className,
  ...props
}: NotePreviewProps) => {
  const dateTime = formatDateFromMs(date)

  return (
    <div
      className={cn(
        'cursor-pointer px-2.5 py-3 rounded-md transition-colors duration-75 relative',
        {
          'bg-zinc-400/75': isActive,
          'hover:bg-zinc-500/75': !isActive
        }
      )}
      {...props}
    >
      <h3 className="mb-1 font-bold truncate">{description}</h3>
      <span className="inline-blocks w-full mb-2 text-xs font-light text-left">{dateTime}</span>
    </div>
  )
}
