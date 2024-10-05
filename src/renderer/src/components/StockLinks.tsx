import { saveSearchResultsAtom } from '@renderer/store'
import { Button, Input } from 'antd'
import { useSetAtom } from 'jotai'
import { useEffect, useState } from 'react'

export const StockLinksComponent = () => {
  const setSearchResults = useSetAtom(saveSearchResultsAtom)
  const [linkCounter, setLinkCounter] = useState([
    {
      id: '1',
      link: ''
    }
  ])

  useEffect(() => {
    const loadLinks = async () => {
      try {
        const loadedLinks = await window.context.loadStockLinks()

        setLinkCounter(
          loadedLinks.map((link, index) => ({
            id: String(index + 1),
            link
          }))
        )
      } catch (error) {
        console.error('Error:', error)
      }
    }

    loadLinks()
  }, [])

  const handleChange = (arr) => {
    const newLinks = arr.map((item) => item.link)
    return newLinks
  }

  const handleSaveAsJson = async () => {
    const data = handleChange(linkCounter)
    const jsonData = JSON.stringify(data)
    try {
      const result = window.context.saveStockLinks(jsonData)
      console.log('Result:', result)
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const handleDataFetch = async () => {
    try {
      const data = await window.context.getSearchResults2(
        linkCounter.map((item) => item.link).join('\n')
      )

      const newSearch = {
        results: data.map((item) => ({
          ...item
        })),
        date: new Date().getTime(),
        description: 'Tekli Ürün Çekme'
      }

      await setSearchResults(newSearch)
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <div className="flex flex-col space-y-3 w-full h-full p-3">
      <div className="flex items-center justify-end space-x-3">
        <Button type="primary" onClick={handleSaveAsJson}>
          Kaydet
        </Button>
        <Button type="primary" onClick={handleDataFetch}>
          Veri Al
        </Button>
      </div>

      <h1 className="text-lg font-bold">Ürün Linkleri</h1>

      {/* Scrollable section */}
      <div className="flex flex-col space-y-3" style={{ maxHeight: '500px', overflowY: 'auto' }}>
        <div className="flex flex-col space-y-2">
          {linkCounter.map((link, _) => (
            <div className="flex items-center space-x-3" key={link.id}>
              <Input
                value={link.link}
                onChange={(e) => {
                  const newLink = linkCounter.map((item) => {
                    if (item.id === link.id) {
                      item.link = e.target.value
                    }
                    return item
                  })

                  setLinkCounter(newLink)
                }}
              />
              <Button
                danger
                onClick={() => setLinkCounter(linkCounter.filter((item) => item.id !== link.id))}
              >
                Sil
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Ekle button outside the scrollable section */}
      <div className="flex justify-start pt-3">
        <Button
          onClick={() => {
            if (linkCounter.length < 1000) {
              setLinkCounter([...linkCounter, { id: String(linkCounter.length + 1), link: '' }])
            } else {
              alert('En fazla 1000 link ekleyebilirsiniz!')
            }
          }}
        >
          Ekle
        </Button>
      </div>
    </div>
  )
}
