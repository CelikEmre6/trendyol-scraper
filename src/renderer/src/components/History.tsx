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
      title: 'm2',
      dataIndex: 'm2',
      key: 'm2',
      width: 100
    },
    {
      title: 'Fiyat',
      dataIndex: 'price',
      key: 'price',
      width: 100
    },
    {
      title: 'm2 Fiyat',
      dataIndex: 'pricePerM2',
      key: 'pricePerM2',
      width: 100
    },
    {
      title: 'Konum',
      dataIndex: 'location',
      key: 'location',
      width: 100
    },
    {
      title: 'Ada No',
      dataIndex: 'adaNo',
      key: 'adaNo',
      width: 100
    },
    {
      title: 'Parsel No',
      dataIndex: 'parselNo',
      key: 'parselNo',
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

          <Button
            type="primary"
            onClick={async () => {
              const data = await window.context.importFromExcel(
                selectedSearch.date.toString(),
                selectedSearch.description
              )

              console.log(data)

              window.location.reload()

              // await setSearchResults({
              //   date: new Date().getTime(),
              //   description: selectedSearch.description,
              //   results: data
              // })
            }}
          >
            Excelden İçe Aktar
          </Button>

          <Button
            type="primary"
            onClick={() => {
              window.context.setTapuData(selectedSearch.results)
            }}
          >
            Tapuda Göster
          </Button>
        </div>
      </div>
      <Table dataSource={selectedSearch?.results} columns={columns} />
    </div>
  )
}
