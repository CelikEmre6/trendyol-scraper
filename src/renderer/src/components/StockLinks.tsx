import { useStockLinks } from '@/hooks/useStockLinks'
import { saveSearchResultsAtom } from '@renderer/store'
import { Button, Input } from 'antd'
import { useSetAtom } from 'jotai'
import { useEffect, useState } from 'react'

export const StockLinksComponent = () => {
  const { stockLinks, handleUpdateStockLinks } = useStockLinks()
  const [links, setLinks] = useState('')
  const setSearchResults = useSetAtom(saveSearchResultsAtom)

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

  const handleChange = (e) => {
    const newLinks = e.target.value.split('\n')
    setLinks(e.target.value)
    handleUpdateStockLinks(newLinks)
  }

  const handleSaveAsJson = async () => {
    const jsonData = JSON.stringify(links.split('\n').filter((link) => link.trim() !== ''))
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
        description: 'Stok Takip'
      }

      await setSearchResults(newSearch)
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <div className="flex flex-col space-y-3 w-full h-full max-w-[80vw] p-3">
      <div className="flex items-center justify-end space-x-3">
        <Button type="primary" onClick={handleSaveAsJson}>
          Kaydet
        </Button>
        <Button type="primary" onClick={handleDataFetch}>
          Veri Al
        </Button>
      </div>

      <h1 className="text-lg font-bold">Stok Linkleri</h1>
      <div className="flex flex-col space-y-3">
        <div className="flex flex-col space-y-2">
          <Input.TextArea
            id="stock-links"
            rows={5}
            placeholder="Linkleri alt alta yazın"
            value={links}
            onChange={handleChange}
            style={{ width: '800px', height: '400px' }}
          />
        </div>
      </div>
    </div>
  )
}
