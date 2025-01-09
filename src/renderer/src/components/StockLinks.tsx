import { saveSearchResultsAtom } from '@renderer/store'
import { Button, Input, message, Modal } from 'antd'
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
  const [loading, setLoading] = useState(false) // Add loading state
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [filePath, setFilePath] = useState<string | null>(null)
  const [overwrite, setOverwrite] = useState<boolean>(false)

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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target?.files?.[0]
      if (!file) return

      console.log('Seçilen dosya:', (file as any).path)
      setFilePath((file as any).path)

      // Modalı aç
      setIsModalVisible(true)
    } catch (error) {
      console.error(error)
    }
  }

  const handleModalConfirm = async (overwrite: boolean) => {
    try {
      if (!filePath) return
      setLoading(true)

      // Kullanıcının seçimine göre overwrite (true/false)
      const data = await window.context.loadStockLinksFromExcel(filePath, overwrite)
      console.log('Dosya işlendi:', data)
      window.location.reload()
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
      setIsModalVisible(false)
    }
  }

  const handleModalCancel = () => {
    setIsModalVisible(false)
    setFilePath(null)
  }

  const handleChange = (arr) => {
    const newLinks = arr.map((item) => item.link)
    return newLinks
  }

  const handleSaveAsJson = async () => {
    const data = handleChange(linkCounter)
    const jsonData = JSON.stringify(data)
    try {
      const result = window.context.saveStockLinks(jsonData)
      message.success('Linkler Kaydedildi')
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const handleDataFetch = async () => {
    setLoading(true) // Start loading
    message.loading({
      content: 'Veriler Alınıyor',
      key: 'TekilUrun'
    })

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
      message.success({
        content: 'Veriler Alındı',
        key: 'TekilUrun'
      })
    } catch (error) {
      console.error(error)
      message.error({
        content: 'Veriler Alınamadı',
        key: 'TekilUrun'
      })
    } finally {
      setLoading(false) // Stop loading
    }
  }

  return (
    <div className="flex flex-col space-y-3 w-full h-full p-3">
      <div className="flex items-center justify-end space-x-3">
        <input
          type="file"
          id="fileInput"
          accept=".xlsx, .xls"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />

        <Button
          disabled={loading}
          onClick={() => {
            document.getElementById('fileInput')?.click()
          }}
          type="primary"
        >
          Excelden Aktar
        </Button>

        {/* Overwrite Modal */}
        <Modal
          title="Veri Üzerine Yazma Onayı"
          visible={isModalVisible}
          onCancel={handleModalCancel}
          footer={[
            <Button
              key="no"
              onClick={() => handleModalConfirm(false)} // Overwrite false
            >
              Hayır
            </Button>,
            <Button
              key="yes"
              type="primary"
              onClick={() => handleModalConfirm(true)} // Overwrite true
            >
              Evet
            </Button>
          ]}
        >
          <p>
            Kayıtlı olan linklerin üzerine yazılsın mı? Hayır işaretlerseniz sadece Exceldeki
            linkler kaydedilecek
          </p>
        </Modal>

        <Button type="primary" onClick={handleSaveAsJson} disabled={loading}>
          Kaydet
        </Button>
        <Button type="primary" onClick={handleDataFetch} disabled={loading}>
          {' '}
          {/* Disable when loading */}
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
                disabled={loading}
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
          disabled={loading}
        >
          Ekle
        </Button>
      </div>
    </div>
  )
}
