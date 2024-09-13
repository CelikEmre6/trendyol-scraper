import { useSearchResultsTable } from '@renderer/hooks/useSearchResultsTable'
import { deleteSearchResultAtom, saveSearchResultsAtom } from '@renderer/store'
import { Button, Table } from 'antd'
import { useSetAtom } from 'jotai'

export const StockUpdate = () => {
  const { selectedSearch } = useSearchResultsTable()
  const deleteSearch = useSetAtom(deleteSearchResultAtom)
  const setSearchResults = useSetAtom(saveSearchResultsAtom)

  const handleDelete = async () => {
    await deleteSearch()
  }

  const columns = [
    {
      title: 'Resim',
      dataIndex: 'details',
      key: 'image',
      render: (details: { images: string[] }) => (
        <img src={details.images[0]} alt="resim" width={50} height={50} />
      ),
      width: 60
    },
    {
      title: 'Ürün Adı',
      dataIndex: 'details',
      key: 'name',
      render: (details: { isim: string }) => details.isim,
      width: 250
    },
    {
      title: 'URL',
      dataIndex: 'link',
      key: 'link',
      render: (text: string) => (
        <a href={text} target="_blank" rel="noopener noreferrer">
          {text}
        </a>
      ),
      width: 100
    },
    {
      title: 'Fiyat',
      dataIndex: 'details',
      key: 'indirimliFiyati',
      render: (details: { indirimliFiyati: number }) => details.indirimliFiyati,
      width: 100,
      sorter: (
        a: { details: { indirimliFiyati: number } },
        b: { details: { indirimliFiyati: number } }
      ) => a.details.indirimliFiyati - b.details.indirimliFiyati
    },
    {
      title: 'Marka',
      dataIndex: 'details',
      key: 'marka',
      render: (details: { marka: string }) => details.marka,
      width: 100
    },
    {
      title: 'Ürün Grubu',
      dataIndex: 'gId',
      key: 'gId',
      width: 100
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
      <Table dataSource={selectedSearch?.results} columns={columns} />
    </div>
  )
}
