import { useSearchResultsTable } from '@renderer/hooks/useSearchResultsTable'
import { deleteSearchResultAtom, saveSearchResultsAtom } from '@renderer/store'
import { Button, message, Table } from 'antd'
import { useSetAtom } from 'jotai'
import { useState } from 'react'
import { AttrModal } from './attrModal'
import AttributeModal from './attributesModal'

export const History = () => {
  const { selectedSearch } = useSearchResultsTable()
  const deleteSearch = useSetAtom(deleteSearchResultAtom)
  const setSearchResults = useSetAtom(saveSearchResultsAtom)
  const [isAttrModalOpen, setIsAttrModalOpen] = useState(false)
  const [openAttributes, setOpenAttributes] = useState<any | null>(null)

  const handleDelete = async () => {
    await deleteSearch()
  }
  const handleOpenAttributes = (record: any) => {
    console.log('record', record.details.attributes)
    setOpenAttributes(record.details.attributes)
  }
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  const handleCloseAttributes = () => {
    setOpenAttributes(null)
  }

  const columns = [
    {
      title: 'Resim',
      key: 'image',
      render: (record) => {
        const imageUrl = record.details?.images?.[0] || 'placeholder-image-url'
        return <img src={imageUrl} alt="resim" width={50} height={50} />
      },
      width: 60
    },
    {
      title: 'İsim',
      dataIndex: ['details', 'isim'],
      key: 'details.isim',
      render: (text: string) => {
        const shortText = text?.length > 20 ? `${text.slice(0, 20)}...` : text // 20 karakter ile sınırlandırıyoruz
        return <span>{shortText}</span> // Kısaltılmış ismi gösteriyoruz
      },
      width: 100,
      sorter: (a, b) => a.details.isim.localeCompare(b.details.isim) // Sıralama işlevi
    },
    {
      title: 'Link',
      dataIndex: 'url',
      key: 'url',
      render: (text: string) => {
        const shortText = text?.length > 30 ? `${text.slice(0, 20)}...` : text // Linki 30 karakter ile sınırlandırıyoruz
        return (
          <a href={text} target="_blank" rel="noopener noreferrer">
            {shortText}
          </a>
        )
      },
      width: 100
    },
    {
      title: 'Grup ID',
      dataIndex: 'groupId',
      key: 'groupId',
      width: 100,
      sorter: (a, b) => a.groupId - b.groupId,
      defaultSortOrder: 'ascend'
    },
    {
      title: 'Fiyat',
      dataIndex: ['details', 'indirimliFiyati'],
      key: 'indirimliFiyati',
      width: 100,
      sorter: (a, b) => a.details.indirimliFiyati - b.details.indirimliFiyati
    },
    {
      title: 'Marka',
      dataIndex: ['details', 'marka'],
      key: 'Marka',
      width: 100,
      sorter: (a, b) => a.details.isim.localeCompare(b.details.isim)
    },
    {
      title: 'Kategori',
      dataIndex: ['details', 'Kategori'],
      key: 'Kategori',
      width: 100,
      sorter: (a, b) => a.details.Kategori.localeCompare(b.details.Kategori)
    },
    {
      title: 'Renk',
      dataIndex: ['details', 'attributes', 'Renk'],
      key: 'Renk',
      width: 100,
      sorter: (a, b) => {
        const renkA = a.details?.attributes?.Renk || '' // Fallback to an empty string if undefined
        const renkB = b.details?.attributes?.Renk || ''
        return renkA.localeCompare(renkB)
      }
    },
    {
      title: 'Özellikler',
      key: 'attributesButton',
      dataIndex: 'attributes',
      width: 70,
      render: (_: any, record: any) => {
        return (
          <Button type="primary" onClick={() => handleOpenAttributes(record)}>
            Özellikler
          </Button>
        )
      }
    }
  ]

  if (!selectedSearch) {
    return null
  }

  return (
    <div className="w-full h-full overflow-scroll max-w-[80vw] flex flex-col p-6 z-10">
      <div className="flex items-center justify-between mb-6 p-4 rounded-2xl bg-surface border border-white/10 backdrop-blur-md shadow-lg">
        <button 
          className="h-10 px-6 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 hover:border-red-500/50 hover:shadow-[0_0_15px_rgba(239,68,68,0.3)] transition-all duration-300 font-medium"
          onClick={handleDelete}
        >
          Sil
        </button>
        <div className="flex items-center space-x-4">
          <button
            className="h-10 px-6 rounded-lg bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 hover:text-white transition-all duration-300 font-medium"
            onClick={() => {
              setIsAttrModalOpen(true)
            }}
          >
            Özellikler
          </button>
          <button
            className="h-10 px-6 rounded-lg bg-gradient-to-r from-green-500 to-emerald-400 text-white font-semibold hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all duration-300 border border-transparent"
            onClick={() => {
              window.context.createExcelFile(selectedSearch)
              message.success('Excel dosyası oluşturuldu.')
            }}
          >
            Excele Aktar
          </button>
        </div>
      </div>
      <AttrModal
        open={isAttrModalOpen}
        onClose={() => setIsAttrModalOpen(false)}
        onSave={(selected) => {
          console.log('Selected attributes:', selected)
        }}
      />
      <Table
        rowKey={(record) => record.url}
        dataSource={selectedSearch?.results}
        columns={columns as unknown as any}
        expandable={{
          expandedRowRender: (record) => (
            <Table
              rowKey={(size: any) => size.itemNumber}
              dataSource={(record.details as any)?.sizes}
              columns={[
                {
                  title: 'itemNumber',
                  dataIndex: 'itemNumber',
                  key: 'itemNumber'
                },
                {
                  title: 'Beden',
                  dataIndex: 'beden',
                  key: 'beden'
                },
                {
                  title: 'Stok Durumu',
                  dataIndex: 'inStock',
                  key: 'inStock'
                }
              ]}
              pagination={false} // Disable pagination for the nested table
            />
          ),
          rowExpandable: (record: any) => record.name !== 'Not Expandable'
        }}
        style={{ userSelect: 'text' }}
      />
      <AttributeModal
        open={!!openAttributes}
        onClose={handleCloseAttributes}
        attributes={openAttributes || []}
      />
    </div>
  )
}
