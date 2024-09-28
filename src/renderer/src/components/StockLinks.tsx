import { useStockLinks } from '@/hooks/useStockLinks'
import { saveSearchResultsAtom } from '@renderer/store'
import { Button, Input } from 'antd'
import { useSetAtom } from 'jotai'
import { useEffect, useState } from 'react'

export const StockLinksComponent = () => {
  const { stockLinks, handleUpdateStockLinks } = useStockLinks()
  const [links, setLinks] = useState('')
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

        setLinks(loadedLinks.join('\n')) // Write array on separate lines
        handleUpdateStockLinks(loadedLinks) // Update stock links
      } catch (error) {
        console.error('Error:', error)
      }
    }

    loadLinks() // Load the links.json file when the component mounts
  }, [])

  const handleChange = (arr) => {
    const newLinks = arr.map((item) => item.link)
    handleUpdateStockLinks(newLinks)
  }

  const handleSaveAsJson = async () => {
    const jsonData = JSON.stringify(handleChange(linkCounter))
    try {
      const result = window.context.saveStockLinks(jsonData)
      console.log('Result:', result)
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const handleDataFetch = async () => {
    try {
      const data = await window.context.getSearchResults2(links)

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
      <div className="flex flex-col space-y-3">
        <div className="flex flex-col space-y-2">
          {linkCounter.map((link, index) => (
            <Input
              key={link.id}
              value={link.link}
              onChange={(e) =>
                // setLinkCounter((prev) => {
                //   prev[index].link = e.target.value
                //   return prev
                // })
                {
                  const newLink = linkCounter.map((item) => {
                    if (item.id === link.id) {
                      item.link = e.target.value
                    }
                    return item
                  })

                  setLinkCounter(newLink)
                }
              }
            ></Input>
          ))}
          <Button
            onClick={() =>
              setLinkCounter([...linkCounter, { id: String(linkCounter.length), link: '' }])
            }
          >
            Ekle{' '}
          </Button>
          {/* <Input.TextArea
            id="stock-links"
            rows={5}
            placeholder="Linkleri alt alta yazın"
            value={links}
            onChange={handleChange}
            style={{ width: '800px', height: '400px' }}
          /> */}
        </div>
      </div>
    </div>
  )
}
