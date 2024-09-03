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
      dataIndex: 'imageUrl',
      key: 'imagUrl',
      render: (text: string) => <img src={text} alt="resim" width={50} height={50} />,
      width: 60
    },
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      width: 250
    },
    {
      title: 'Fiyat',
      dataIndex: 'price',
      key: 'price',
      width: 100
    },
    {
      title: 'İl',
      dataIndex: 'il',
      key: 'il',
      width: 100
    },
    {
      title: 'ilce',
      dataIndex: 'ilce',
      key: 'ilce',
      width: 100
    },
    {
      title: 'Konum',
      dataIndex: 'location',
      key: 'location',
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
