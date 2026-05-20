import { cleanEmptySearchesAtom, refreshSearchesAtom } from '@renderer/store'
import { ReloadOutlined } from '@ant-design/icons'
import { Button, message } from 'antd'
import { useSetAtom } from 'jotai'
import { isEmpty } from 'lodash'
import { ComponentProps, useCallback, useState } from 'react'
import { twMerge } from 'tailwind-merge'
import { useSearchResults } from '@renderer/hooks/useSearchList'
import { NotePreview } from './NotePreview'

type NotePreviewListProps = ComponentProps<'ul'> & {
  onSelect?: () => void
}

export const NotePreviewList = ({ className, onSelect, ...props }: NotePreviewListProps) => {
  const { searchResults, selectedSearchIndex, handleSearchSelect } = useSearchResults({ onSelect })
  const cleanEmpty = useSetAtom(cleanEmptySearchesAtom)
  const refreshSearches = useSetAtom(refreshSearchesAtom)
  const [refreshing, setRefreshing] = useState(false)

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      await refreshSearches()
      message.success('Arama listesi güncellendi.')
    } catch {
      message.error('Güncelleme sırasında hata oluştu.')
    } finally {
      setRefreshing(false)
    }
  }, [refreshSearches])

  if (!searchResults) return null

  return (
    <div className="flex flex-col h-full">
      <div className="p-2 border-b border-zinc-700 flex gap-2">
        <Button
          type="primary"
          danger
          className="flex-1 text-xs"
          onClick={async () => {
            const result = await cleanEmpty()
            if (result !== false) {
              message.success(`${result} adet boş arama silindi.`)
            }
          }}
        >
          Boş Aramaları Temizle
        </Button>
        <Button
          type="default"
          icon={<ReloadOutlined spin={refreshing} />}
          loading={refreshing}
          onClick={handleRefresh}
          title="Listeyi Güncelle"
        />
      </div>
      {isEmpty(searchResults) ? (
        <ul className={twMerge('text-center pt-4', className)}>
          <span>Kayıt Bulunamadı!</span>
        </ul>
      ) : (
        <ul {...props} className={twMerge('flex-1 overflow-auto', className)}>
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
      )}
    </div>
  )
}
