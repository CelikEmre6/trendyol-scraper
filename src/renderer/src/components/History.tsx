import { useSearchResultsTable } from '@renderer/hooks/useSearchResultsTable'
import { deleteSearchResultAtom, saveSearchResultsAtom } from '@renderer/store'
import { Button, Table } from 'antd'
import { useSetAtom } from 'jotai'

export const History = () => {
  const { selectedSearch } = useSearchResultsTable()
  const deleteSearch = useSetAtom(deleteSearchResultAtom)
  const setSearchResults = useSetAtom(saveSearchResultsAtom)

  const handleDelete = async () => {
    await deleteSearch()
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
    }
  ]

  if (!selectedSearch) {
    return null
  }

  return (
    <div className="w-full h-full overflow-scroll max-w-[80vw] flex flex-col p-3">
      <div className="flex items-center justify-between space-x-3">
        <Button type="primary" danger onClick={handleDelete}>
          Sil
        </Button>
        <div className="flex items-center space-x-3">
          <Button
            type="primary"
            onClick={() => {
              window.context.createExcelFile(selectedSearch)
            }}
          >
            Excele Aktar
          </Button>
        </div>
      </div>
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
    </div>
  )
}
