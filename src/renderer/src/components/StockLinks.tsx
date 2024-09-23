import { useStockLinks } from '@/hooks/useStockLinks'
import { Button, Input } from 'antd'
import { useEffect, useState } from 'react'

export const StockLinksComponent = () => {
  const { stockLinks, handleUpdateStockLinks } = useStockLinks()
  const [links, setLinks] = useState('')

  useEffect(() => {
    const loadLinks = async () => {
      try {
        const loadedLinks = await window.context.loadStockLinks()

        setLinks(loadedLinks.join('\n')) // Diziyi alt alta yaz
        handleUpdateStockLinks(loadedLinks) // Stock links'i güncelle
      } catch (error) {
        console.error('Hata:', error)
      }
    }

    loadLinks() // Bileşen yüklendiğinde links.json dosyasını yükle
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
      console.log('Sonuç:', result)
    } catch (error) {
      console.error('Hata:', error)
    }
  }

  const handleGetSearchResults = () => {
    window.context.getSearchResults2() // Bu fonksiyonun uygulamanızda tanımlı olduğunu varsayıyorum
  }

  return (
    <div className="flex flex-col space-y-3 w-full h-full max-w-[80vw] p-3">
      <div className="flex items-center justify-end space-x-3">
        <Button type="primary" onClick={handleSaveAsJson}>
          Kaydet
        </Button>
        <Button type="primary" onClick={handleGetSearchResults}>
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
