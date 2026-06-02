import { useSearchResultsTable } from '@renderer/hooks/useSearchResultsTable'
import { deleteSearchResultAtom, saveSearchResultsAtom } from '@renderer/store'
import { Button, message, Table } from 'antd'
import { useSetAtom } from 'jotai'
import { useState } from 'react'
import { AttrModal } from './attrModal'
import AttributeModal from './attributesModal'
import StockModal from './stockModal'

export const History = () => {
  const { selectedSearch } = useSearchResultsTable()
  const deleteSearch = useSetAtom(deleteSearchResultAtom)
  const setSearchResults = useSetAtom(saveSearchResultsAtom)
  const [isAttrModalOpen, setIsAttrModalOpen] = useState(false)
  const [openAttributes, setOpenAttributes] = useState<any | null>(null)
  const [openStockData, setOpenStockData] = useState<any[] | null>(null)

  const handleOpenStock = (record: any) => {
    setOpenStockData(record.details?.sizes || [])
  }
  const handleCloseStock = () => {
    setOpenStockData(null)
  }

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
        return (
          <a
            href={text}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center h-8 px-4 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/20 hover:border-indigo-500/50 hover:shadow-[0_0_15px_rgba(99,102,241,0.3)] transition-all duration-300 font-medium text-xs whitespace-nowrap"
          >
            Ürüne Git
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
      title: 'Özellikler',
      key: 'attributesButton',
      dataIndex: 'attributes',
      width: 70,
      render: (_: any, record: any) => {
        return (
          <button
            className="h-8 px-4 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400 hover:bg-blue-500/20 hover:border-blue-500/50 hover:shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all duration-300 font-medium text-xs"
            onClick={() => handleOpenAttributes(record)}
          >
            Özellikler
          </button>
        )
      }
    },
    {
      title: 'Stok Durumu',
      key: 'stockButton',
      width: 100,
      render: (_: any, record: any) => {
        const sizes = record.details?.sizes || []
        const hasStock = sizes.some((size: any) => size.inStock === true || size.inStock === 'Stokta var')
        
        if (hasStock) {
          return (
            <button
              className="h-8 px-4 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500/20 hover:border-green-500/50 hover:shadow-[0_0_15px_rgba(34,197,94,0.3)] transition-all duration-300 font-medium text-xs whitespace-nowrap"
              onClick={() => handleOpenStock(record)}
            >
              Stok Var
            </button>
          )
        } else {
          return (
            <button
              className="h-8 px-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 hover:border-red-500/50 hover:shadow-[0_0_15px_rgba(239,68,68,0.3)] transition-all duration-300 font-medium text-xs whitespace-nowrap"
              onClick={() => handleOpenStock(record)}
            >
              Stok Yok
            </button>
          )
        }
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
        style={{ userSelect: 'text' }}
      />
      <AttributeModal
        open={!!openAttributes}
        onClose={handleCloseAttributes}
        attributes={openAttributes || []}
      />
      <StockModal
        open={!!openStockData}
        onClose={handleCloseStock}
        sizes={openStockData || []}
      />
    </div>
  )
}
